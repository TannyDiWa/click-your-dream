/**
 * Pre-generates the result explanations: one per Holland code (120 ordered
 * 3-letter codes from RIASEC) × user group (3) = 360, written to a SQL seed
 * that you run in the Supabase SQL Editor. Rows land with reviewed = false.
 *
 *   npm run explanations -- --sample 3   # a few combos without the batch, prints tokens and projected cost
 *   npm run explanations -- --submit     # submits the 360-request Message Batch (Batch pricing)
 *   npm run explanations -- --submit --only ESA-university,RIA-working   # resubmit some combos
 *   npm run explanations -- --collect    # waits for the last batch, merges results, writes the seed
 *
 * Needs ANTHROPIC_API_KEY (read from the environment or .env.local; never NEXT_PUBLIC_).
 * Outputs: supabase/explanations.json (all results so far, keyed by custom_id)
 * and supabase/explanations.sql. --sample writes explanations.sample.{json,sql}.
 */
import Anthropic from "@anthropic-ai/sdk";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const MODEL = "claude-opus-5-5";
const EFFORT = "medium";
const MAX_TOKENS = 16000;
// Message Batches price per million tokens (half of the standard $4 / $20).
const BATCH_PRICE = { input: 2, output: 10 };
const STANDARD_PRICE = { input: 4, output: 20 };

const OUT_DIR = new URL("../supabase/", import.meta.url);
const BATCH_ID_FILE = new URL(".explanations-batch", OUT_DIR);

type Letter = "R" | "I" | "A" | "S" | "E" | "C";
type UserGroup = "high_school" | "university" | "working";

const LETTERS: Letter[] = ["R", "I", "A", "S", "E", "C"];
const GROUPS: UserGroup[] = ["high_school", "university", "working"];

const LETTER_INFO: Record<Letter, string> = {
  R: "Realistic (นักลงมือทำ) — ชอบใช้มือ เครื่องมือ เครื่องจักร งานกลางแจ้ง เห็นผลเป็นรูปธรรม",
  I: "Investigative (นักค้นคว้า) — ชอบคิดวิเคราะห์ ตั้งคำถาม ทดลอง หาเหตุผลเบื้องหลัง",
  A: "Artistic (นักสร้างสรรค์) — ชอบออกแบบ เล่าเรื่อง แสดงออก งานที่มีอิสระทางความคิด",
  S: "Social (นักช่วยเหลือ) — ชอบสอน ดูแล รับฟัง ทำงานกับผู้คนและช่วยให้คนอื่นเติบโต",
  E: "Enterprising (นักบริหาร) — ชอบริเริ่ม โน้มน้าว นำทีม ตัดสินใจ และขับเคลื่อนเป้าหมาย",
  C: "Conventional (นักจัดระบบ) — ชอบความเป็นระเบียบ ข้อมูล ตัวเลข ขั้นตอนที่ชัดเจนและแม่นยำ",
};

const GROUP_INFO: Record<UserGroup, { who: string; guidance: string }> = {
  high_school: {
    who: "นักเรียน ม.ปลาย ที่กำลังเลือกคณะและสาขาเพื่อเข้ามหาวิทยาลัย",
    guidance:
      "คณะหรือสาขาวิชาที่น่าลองดู (เป็นประเภทสาขา เช่น “วิศวกรรมคอมพิวเตอร์” หรือ “นิเทศศาสตร์ สาขาภาพยนตร์” ห้ามระบุชื่อมหาวิทยาลัย) พร้อมเหตุผลว่าทำไมเข้ากับรหัสนี้",
  },
  university: {
    who: "นักศึกษามหาวิทยาลัยที่อยากรู้ว่าเส้นทางอาชีพไหนเหมาะกับตัวเอง",
    guidance:
      "ทักษะที่ควรสะสม และประเภทงานฝึกงานหรือกิจกรรมที่ควรลอง (ระบุเป็นประเภท เช่น “ฝึกงานฝ่าย UX research” ห้ามระบุชื่อบริษัทหรือมหาวิทยาลัย)",
  },
  working: {
    who: "คนวัยทำงานที่อยากสำรวจงานใหม่ เปลี่ยนสายงาน หรือเรียนต่อ",
    guidance:
      "เส้นทางอาชีพใกล้เคียงที่ขยับไปได้โดยใช้ประสบการณ์เดิม และประเภทคอร์สหรือการเรียนต่อที่ช่วยได้ (ระบุเป็นประเภท ห้ามระบุชื่อสถาบันหรือแพลตฟอร์ม)",
  },
};

const SYSTEM_PROMPT = `คุณเป็นนักแนะแนวอาชีพที่เข้าใจทฤษฎี Holland (RIASEC) และบริบทการศึกษาและตลาดงานในประเทศไทย
คุณกำลังเขียนคำอธิบายผลลัพธ์สำหรับเว็บแบบทดสอบ "Click your dream" ซึ่งผู้ใช้จะเห็นหลังทำแบบทดสอบ 42 ข้อ

หลักการเขียน:
- เขียนภาษาไทยทั้งหมด น้ำเสียงอบอุ่น ให้กำลังใจ เป็นกันเอง แต่ไม่เว่อร์ ใช้ "คุณ" เรียกผู้อ่าน ไม่ใช้อีโมจิ
- อธิบายรหัส 3 ตัวอักษรเป็น "การผสมกัน" ไม่ใช่สามบุคลิกแยกกัน ตัวอักษรแรกเด่นที่สุด ตัวที่สองและสามช่วยขยายและแต่งสีสัน
- อาชีพต้องสมจริงในประเทศไทย ผสมทั้งอาชีพที่คุ้นเคยและอาชีพใหม่ที่กำลังเติบโต และต้องสะท้อนทั้งสามตัวอักษร ไม่ใช่แค่ตัวแรก
- ห้ามระบุชื่อมหาวิทยาลัย สถาบัน บริษัท หรือแพลตฟอร์มใด ๆ ให้ระบุเป็นประเภทเท่านั้น
- ผลนี้เป็นแนวทางสำรวจตัวเอง ไม่ใช่คำตัดสิน หลีกเลี่ยงคำว่า "ต้อง" หรือ "ไม่เหมาะ"
- ข้อความแต่ละรายการกระชับ อ่านบนมือถือได้สบาย: title ไม่เกินราว 6 คำ, detail/reason หนึ่งประโยค`;

/** JSON schema for output_config.format; counts are asked for in the prompt and checked in validate(). */
const ITEM = {
  type: "object",
  properties: { title: { type: "string" }, detail: { type: "string" } },
  required: ["title", "detail"],
  additionalProperties: false,
};
const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "ชื่อสั้น ๆ ของการผสมนี้ 2–5 คำ เช่น “นักคิดผู้สร้างสรรค์”" },
    summary: { type: "string", description: "2–3 ประโยค อธิบายภาพรวมของการผสมสามตัวอักษร" },
    strengths: { type: "array", items: ITEM, description: "3–4 จุดเด่นที่เกิดจากการผสมนี้" },
    careers: {
      type: "array",
      description: "6–8 อาชีพที่เหมาะ",
      items: {
        type: "object",
        properties: { title: { type: "string" }, reason: { type: "string" } },
        required: ["title", "reason"],
        additionalProperties: false,
      },
    },
    guidance: { type: "array", items: ITEM, description: "3–5 คำแนะนำเฉพาะกลุ่มผู้ใช้" },
    try_this_week: { type: "array", items: { type: "string" }, description: "3 สิ่งเล็ก ๆ ที่ลองทำได้ในสัปดาห์นี้" },
  },
  required: ["title", "summary", "strengths", "careers", "guidance", "try_this_week"],
  additionalProperties: false,
};

type Item = { title: string; detail: string };
type Explanation = {
  title: string;
  summary: string;
  strengths: Item[];
  careers: { title: string; reason: string }[];
  guidance: Item[];
  try_this_week: string[];
};
type Stored = { code: string; group: UserGroup; model: string; content: Explanation };

/** All 120 ordered codes of three different letters, in RIASEC order. */
function allCodes() {
  const codes: string[] = [];
  for (const a of LETTERS) for (const b of LETTERS) for (const c of LETTERS) {
    if (a !== b && a !== c && b !== c) codes.push(a + b + c);
  }
  return codes;
}

const customId = (code: string, group: UserGroup) => `${code}-${group}`;

function parseCustomId(id: string): { code: string; group: UserGroup } {
  const [code, group] = id.split("-") as [string, UserGroup];
  if (!/^[RIASEC]{3}$/.test(code) || !GROUPS.includes(group)) throw new Error(`Bad custom_id: ${id}`);
  return { code, group };
}

function userPrompt(code: string, group: UserGroup) {
  const letters = [...code] as Letter[];
  const g = GROUP_INFO[group];
  return `Holland Code: ${code}
${letters.map((l, i) => `${i + 1}. ${LETTER_INFO[l]}`).join("\n")}

ผู้อ่าน: ${g.who}

เขียนคำอธิบายสำหรับรหัส ${code} และผู้อ่านกลุ่มนี้:
- title: ชื่อสั้น ๆ ของการผสมนี้
- summary: 2–3 ประโยค ว่าคนที่มีรหัสนี้มักเป็นอย่างไร และสามด้านเสริมกันอย่างไร
- strengths: 3–4 จุดเด่นที่เกิดจากการผสมนี้
- careers: 6–8 อาชีพที่เหมาะ แต่ละอาชีพมีเหตุผลหนึ่งประโยคที่โยงกับรหัส
- guidance: 3–5 รายการ — ${g.guidance}
- try_this_week: 3 สิ่งเล็ก ๆ ที่ลงมือได้จริงภายในสัปดาห์นี้ เหมาะกับผู้อ่านกลุ่มนี้`;
}

function requestParams(code: string, group: UserGroup): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Thinking is always on for this model; effort controls its depth and cost.
    output_config: { effort: EFFORT, format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(code, group) }],
  };
}

/** Problems with a result, to fix by hand or resubmit with --only. */
function validate(e: Explanation) {
  const problems: string[] = [];
  const count = (name: string, n: number, min: number, max: number) => {
    if (n < min || n > max) problems.push(`${name}: ${n} (want ${min}–${max})`);
  };
  count("strengths", e.strengths.length, 3, 4);
  count("careers", e.careers.length, 6, 8);
  count("guidance", e.guidance.length, 3, 5);
  count("try_this_week", e.try_this_week.length, 3, 3);
  if (/จุฬา|ธรรมศาสตร์|มหิดล|เกษตรศาสตร์|ศิลปากร|ลาดกระบัง|มหาวิทยาลัยเชียงใหม่|มหาวิทยาลัยขอนแก่น/.test(JSON.stringify(e))) {
    problems.push("guidance may name a university");
  }
  return problems;
}

function parseMessage(message: Anthropic.Message): Explanation {
  if (message.stop_reason === "refusal") throw new Error(`refused (${message.stop_details?.category ?? "no category"})`);
  if (message.stop_reason === "max_tokens") throw new Error("hit max_tokens");
  const text = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!text) throw new Error("no text block");
  return JSON.parse(text.text) as Explanation;
}

// ─── Files ───────────────────────────────────────────────────────────────────

const sqlString = (s: string) => `'${s.replaceAll("'", "''")}'`;

function writeOutputs(name: string, rows: Record<string, Stored>) {
  const ids = Object.keys(rows).sort();
  writeFileSync(new URL(`${name}.json`, OUT_DIR), JSON.stringify(rows, null, 2) + "\n");

  const values = ids.map((id) => {
    const r = rows[id];
    return `  (${sqlString(r.code)}, ${sqlString(r.group)}, ${sqlString(JSON.stringify(r.content))}::jsonb, ${sqlString(r.model)}, false, now())`;
  });
  const sql = `-- Generated by scripts/generate-explanations.ts (${ids.length} rows). Run in the Supabase SQL Editor.
-- Rows stay hidden until reviewed; after reading them, publish with e.g.
--   update public.result_explanations set reviewed = true where holland_code = 'ESA';
-- Re-running this file replaces the content and sets reviewed back to false.
insert into public.result_explanations (holland_code, user_group, content, model, reviewed, generated_at)
values
${values.join(",\n")}
on conflict (holland_code, user_group) do update
set content = excluded.content,
    model = excluded.model,
    reviewed = false,
    generated_at = excluded.generated_at;
`;
  writeFileSync(new URL(`${name}.sql`, OUT_DIR), sql);
  console.log(`Wrote supabase/${name}.json and supabase/${name}.sql (${ids.length} rows)`);
}

function readRows(name: string): Record<string, Stored> {
  const file = new URL(`${name}.json`, OUT_DIR);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
}

// ─── Modes ───────────────────────────────────────────────────────────────────

const usd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;

/** A few combos through the regular Messages API, spread over codes and groups. */
async function sample(client: Anthropic, n: number) {
  const codes = allCodes();
  const picks = Array.from({ length: n }, (_, i) => ({
    code: codes[Math.floor((i * codes.length) / n + 7) % codes.length],
    group: GROUPS[i % GROUPS.length],
  }));

  const rows: Record<string, Stored> = {};
  let input = 0;
  let output = 0;
  const results = await Promise.allSettled(
    picks.map(async ({ code, group }) => {
      const id = customId(code, group);
      const message = await client.messages.create(requestParams(code, group));
      input += message.usage.input_tokens;
      output += message.usage.output_tokens;
      console.log(`${id}: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out (${message.stop_reason})`);
      const content = parseMessage(message);
      const problems = validate(content);
      if (problems.length) console.warn(`  ${id}: ${problems.join("; ")}`);
      rows[id] = { code, group, model: message.model, content };
    }),
  );
  for (const [i, r] of results.entries()) {
    if (r.status === "rejected") console.error(`${customId(picks[i].code, picks[i].group)} failed:`, r.reason);
  }

  const done = Object.keys(rows).length;
  if (!done) return;
  const total = codes.length * GROUPS.length;
  const avgIn = input / done;
  const avgOut = output / done;
  const cost = (p: { input: number; output: number }, inTok: number, outTok: number) =>
    (inTok * p.input + outTok * p.output) / 1e6;
  console.log(`
Sample: ${input} input + ${output} output tokens for ${done} requests = ${usd(cost(STANDARD_PRICE, input, output))} (standard pricing)
Average per request: ${Math.round(avgIn)} in / ${Math.round(avgOut)} out (output includes thinking)
Projected full batch (${total} requests at Batch pricing $${BATCH_PRICE.input}/$${BATCH_PRICE.output} per MTok): ${usd(cost(BATCH_PRICE, avgIn * total, avgOut * total))}`);
  writeOutputs("explanations.sample", rows);
}

async function submit(client: Anthropic, only: string[] | null) {
  const ids = only ?? allCodes().flatMap((code) => GROUPS.map((g) => customId(code, g)));
  const batch = await client.messages.batches.create({
    requests: ids.map((id) => {
      const { code, group } = parseCustomId(id);
      return { custom_id: id, params: requestParams(code, group) };
    }),
  });
  writeFileSync(BATCH_ID_FILE, batch.id + "\n");
  console.log(`Submitted batch ${batch.id} with ${ids.length} requests (${batch.processing_status}).`);
  console.log("Run with --collect when it ends (usually within an hour).");
}

async function collect(client: Anthropic, batchId: string) {
  let batch = await client.messages.batches.retrieve(batchId);
  while (batch.processing_status !== "ended") {
    const c = batch.request_counts;
    console.log(`${batch.processing_status}: ${c.processing} processing, ${c.succeeded} succeeded, ${c.errored} errored`);
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    batch = await client.messages.batches.retrieve(batchId);
  }

  const rows = readRows("explanations");
  const failed: string[] = [];
  const flagged: string[] = [];
  let input = 0;
  let output = 0;
  // Results come back in any order: key everything by custom_id.
  for await (const result of await client.messages.batches.results(batchId)) {
    const id = result.custom_id;
    if (result.result.type !== "succeeded") {
      console.error(`${id}: ${result.result.type}`);
      failed.push(id);
      continue;
    }
    const message = result.result.message;
    input += message.usage.input_tokens;
    output += message.usage.output_tokens;
    try {
      const content = parseMessage(message);
      const problems = validate(content);
      if (problems.length) {
        console.warn(`${id}: ${problems.join("; ")}`);
        flagged.push(id);
      }
      const { code, group } = parseCustomId(id);
      rows[id] = { code, group, model: message.model, content };
    } catch (e) {
      console.error(`${id}: ${e instanceof Error ? e.message : e}`);
      failed.push(id);
    }
  }

  console.log(`\nBatch ${batchId}: ${input} input + ${output} output tokens ≈ ${usd((input * BATCH_PRICE.input + output * BATCH_PRICE.output) / 1e6)}`);
  writeOutputs("explanations", rows);
  if (flagged.length) console.log(`Check by hand: ${flagged.join(",")}`);
  if (failed.length) console.log(`Resubmit with: npm run explanations -- --submit --only ${failed.join(",")}`);
}

async function main() {
  const args = process.argv.slice(2);
  const value = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (in your shell or .env.local) first.");
    process.exit(1);
  }
  const client = new Anthropic();

  if (args.includes("--sample")) {
    const n = Number(value("--sample") ?? 3);
    if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error("--sample takes 1–20");
    await sample(client, n);
  } else if (args.includes("--submit")) {
    const only = value("--only")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
    only?.forEach(parseCustomId);
    await submit(client, only);
  } else if (args.includes("--collect")) {
    const id = value("--collect") ?? (existsSync(BATCH_ID_FILE) ? readFileSync(BATCH_ID_FILE, "utf8").trim() : "");
    if (!id) throw new Error("No batch id: pass --collect <id> or run --submit first");
    await collect(client, id);
  } else {
    console.log("Usage: npm run explanations -- --sample 3 | --submit [--only ESA-university,...] | --collect [batch id]");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
