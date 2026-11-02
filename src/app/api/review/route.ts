import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";

// Review progress for /review, shared through git: one file per reviewer in supabase/review/
// ({ "ERA-university": "2026-11-02T…", … }) so two people never edit the same file.
// Development only, like the /review page.

const DIR = path.join(process.cwd(), "supabase", "review");
const ID = /^[RIASEC]{3}-(high_school|university|working)$/;
// Thai letters, latin letters, digits, - and _; becomes the file name.
const REVIEWER = /^[\p{L}\p{M}\d_-]{1,40}$/u;

const enabled = () => process.env.NODE_ENV !== "production" || Boolean(process.env.ENABLE_REVIEW_PAGE);
const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

async function readReviewer(name: string): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(path.join(DIR, `${name}.json`), "utf8"));
  } catch {
    return {};
  }
}

/** { reviewed: { "ERA-university": { by, at } } } merged over all reviewers (earliest tick wins). */
export async function GET() {
  if (!enabled()) return notFound();
  await connection();
  const reviewed: Record<string, { by: string; at: string }> = {};
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    // No reviews yet.
  }
  for (const file of files) {
    const by = file.slice(0, -".json".length);
    for (const [id, at] of Object.entries(await readReviewer(by))) {
      if (!reviewed[id] || at < reviewed[id].at) reviewed[id] = { by, at };
    }
  }
  return Response.json({ reviewed });
}

/** Body { reviewer, id, checked }: ticks or unticks one explanation in that reviewer's file. */
export async function POST(req: Request) {
  if (!enabled()) return notFound();
  const { reviewer, id, checked } = await req.json();
  if (typeof reviewer !== "string" || !REVIEWER.test(reviewer)) {
    return Response.json({ error: "ใส่ชื่อผู้ตรวจเป็นตัวอักษรหรือตัวเลข (ไม่มีเว้นวรรค)" }, { status: 400 });
  }
  if (typeof id !== "string" || !ID.test(id)) return Response.json({ error: "Unknown explanation" }, { status: 400 });

  const mine = await readReviewer(reviewer);
  if (checked) mine[id] ??= new Date().toISOString();
  else delete mine[id];
  const sorted = Object.fromEntries(Object.entries(mine).sort(([a], [b]) => a.localeCompare(b)));
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${reviewer}.json`), JSON.stringify(sorted, null, 2) + "\n");
  return Response.json({ ok: true });
}
