import type { ReactNode } from "react";
import type { FieldProgram, ResultExplanation } from "@/lib/riasec/api-types";
import { DIMENSION_LABELS } from "@/lib/riasec/profiles";
import type { RiasecType, UserGroup } from "@/lib/riasec/types";

// Building blocks for the group-specific part of the result page (Figma: Results / List row,
// Accordion row, Skill step, Try-this-week item, Score dots). All of them fill their parent's
// width and wrap text, so they work from 320px up.

const panel = "rounded-[30px] border-2 border-white bg-paper shadow-[0_10px_15px_rgba(121,130,184,0.1)]";
const tag = "inline-block rounded-xl bg-[#e9eeff] px-2.5 py-0.5 text-xs font-bold leading-normal text-violet";

export function Panel({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${panel} min-w-0 px-4 py-5 sm:px-6 sm:py-6`}>
      <h2 id={id} className="text-xl font-bold leading-normal sm:text-[23px]">
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-[13px] leading-normal text-muted sm:text-sm">{subtitle}</p>}
      {children}
    </section>
  );
}

/** Careers or positions as one numbered list. */
export function CareerList({ items }: { items: ResultExplanation["careers"] }) {
  return (
    <ol className="mt-1">
      {items.map((c, i) => (
        <li key={c.title} className="flex gap-3.5 border-b border-[#e6e3f5] py-3.5 last:border-0 last:pb-0">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-xl bg-[#e9eeff] text-sm font-bold text-violet">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-bold leading-normal">{c.title}</span>
            <span className="block text-sm leading-normal text-muted">{c.reason}</span>
            {c.tag && <span className={`${tag} mt-1`}>{c.tag}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Faculties/fields that open to show why they fit; the first one starts open. */
export function FieldAccordion({ items }: { items: ResultExplanation["guidance"] }) {
  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      {items.map((f, i) => (
        <details
          key={f.title}
          open={i === 0}
          className="group rounded-[20px] border border-[#e6e3f5] bg-white open:border-[1.5px] open:border-[#f6a0ce]"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3.5 pl-[18px] pr-3.5 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              {f.tag && <span className={tag}>{f.tag}</span>}
              <span className="mt-1 block text-[17px] font-bold leading-normal">{f.title}</span>
            </span>
            <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 transition group-open:rotate-180">
              <path d="m6 9 6 6 6-6" stroke="#7667B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="px-[18px] pb-3.5 text-sm leading-normal text-muted">{f.detail}</p>
        </details>
      ))}
    </div>
  );
}

/** Skills as a short numbered path, easiest first. */
export function SkillSteps({ items }: { items: ResultExplanation["guidance"] }) {
  return (
    <ol className="mt-3.5">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-3.5">
          <span aria-hidden className="flex flex-col items-center gap-1">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f6a0ce] text-sm font-bold text-white">{i + 1}</span>
            {i < items.length - 1 && <span className="w-0.5 flex-1 rounded bg-[#d6cae8]" />}
          </span>
          <span className={`min-w-0 flex-1 ${i < items.length - 1 ? "pb-5" : ""}`}>
            <span className="block text-[17px] font-bold leading-normal">{s.title}</span>
            <span className="block text-sm leading-normal text-muted">
              <b className="text-violet">วิธีเริ่ม</b>&nbsp; {s.detail}
            </span>
            {s.tag && <span className={`${tag} mt-1`}>{s.tag}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Small tasks for this week; ticking them is just for the visitor (not saved). */
export function TryThisWeek({ tasks }: { tasks: string[] }) {
  return (
    <Panel id="try-title" title="ลองทำในสัปดาห์นี้" subtitle="ก้าวเล็ก ๆ ที่เริ่มได้ทันที ไม่ต้องรอให้พร้อมทั้งหมด">
      <ul className="mt-3 flex flex-col gap-2.5">
        {tasks.map((t) => (
          <li key={t}>
            <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-[#e9eeff] px-3.5 py-2.5 text-[15px] leading-normal">
              <input type="checkbox" className="peer mt-[3px] size-5 shrink-0 cursor-pointer accent-[#ec7cb5]" />
              <span className="peer-checked:text-muted peer-checked:line-through">{t}</span>
            </label>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** A 0–100 score as 5 dots: each dot is 2 of 10 points, a half dot is 1 point. */
export function ScoreDots({ label, score }: { label: string; score: number }) {
  const points = Math.round(score / 10);
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-1 text-[15px] font-bold text-violet">{label}</span>
      <span role="img" aria-label={`${label} ${points} จาก 10`} className="flex gap-[5px]">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = points >= (i + 1) * 2 ? "full" : points === i * 2 + 1 ? "half" : "empty";
          return (
            <span
              key={i}
              className="size-3.5 rounded-full"
              style={{
                background:
                  fill === "full" ? "#7667b8" : fill === "half" ? "linear-gradient(90deg, #7667b8 50%, #dcd7f2 50%)" : "#dcd7f2",
              }}
            />
          );
        })}
      </span>
    </div>
  );
}

/**
 * Placement of card i of n: 2 a row on tablets (4-column grid), 3 a row on desktops (6-column
 * grid). Every card keeps the same width; a short last row is centered (5 cards → 3 + 2).
 */
function cardSpan(i: number, n: number) {
  const classes = ["md:col-span-2", "lg:col-span-2"];
  const centerOnTablet = n % 2 === 1 && i === n - 1;
  if (centerOnTablet) classes.push("md:col-start-2");
  const lastRow = n % 3;
  if (lastRow && i === n - lastRow) classes.push(lastRow === 2 ? "lg:col-start-2" : "lg:col-start-3");
  else if (centerOnTablet) classes.push("lg:col-start-auto");
  return classes.join(" ");
}

/** High school: one card per recommended field, listing universities that run it in TCAS this year. */
export function FieldUniversities({ fields }: { fields: ResultExplanation["guidance"] }) {
  return (
    <section aria-labelledby="uni-title" className="mt-12">
      <h2 id="uni-title" className="text-2xl font-bold leading-normal sm:text-[28px]">
        มหาวิทยาลัยที่เปิดคณะที่น่าสนใจ
      </h2>
      <p className="mt-1 text-[15px] text-muted">แยกตามสาขาที่แนะนำ • แตะชื่อหลักสูตรเพื่อดูรายละเอียดและจำนวนรับบน myTCAS</p>
      <ul className="mt-5 grid gap-6 md:grid-cols-4 lg:grid-cols-6">
        {fields.map((f, i) => (
          <li key={f.title} className={`${panel} px-5 py-5 sm:px-6 ${cardSpan(i, fields.length)}`}>
            {f.tag && <span className={tag}>{f.tag}</span>}
            <h3 className="mt-1 text-lg font-bold leading-normal">{f.title}</h3>
            {f.programs?.length ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {f.programs.map((p) => (
                  <li key={p.url}>
                    <ProgramLink program={p} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">ยังไม่พบหลักสูตรที่เปิดรับใน TCAS ปีนี้</p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-muted">
        ข้อมูลหลักสูตรและรอบรับสมัครจาก myTCAS ปีการศึกษา 2570 • ตรวจสอบเกณฑ์และคุณสมบัติล่าสุดก่อนสมัครทุกครั้ง
      </p>
    </section>
  );
}

function ProgramLink({ program: p }: { program: FieldProgram }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[18px] border border-[#e6e3f5] bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#f6a0ce] hover:shadow-[0_8px_16px_rgba(121,130,184,0.12)]"
    >
      <span className="block text-[15px] font-bold leading-normal">{p.university}</span>
      <span className="block text-[13px] font-bold leading-normal text-violet">{p.faculty}</span>
      <span className="block text-[13px] leading-normal text-muted">{p.program}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {p.rounds.length > 0 && <span className={tag}>TCAS • {p.rounds.join(", ")}</span>}
        <span className="ml-auto text-[13px] font-bold underline underline-offset-2">ดูหลักสูตร ↗</span>
      </span>
    </a>
  );
}

// What each group sees below the main cards (Figma: Results / แยกตามกลุ่มผู้ใช้).
type GroupSection = { kind: "careers" | "fields" | "skills"; title: string; subtitle: (top3: RiasecType[]) => string };
const usesAll = (top3: RiasecType[]) => {
  const [a, b, c] = top3.map((t) => DIMENSION_LABELS[t].long);
  return `ใช้ทั้ง${a} ${b} และ${c}`;
};
const GROUP_SECTIONS: Record<UserGroup, [GroupSection, GroupSection]> = {
  high_school: [
    { kind: "careers", title: "อาชีพที่เหมาะกับคุณ", subtitle: usesAll },
    { kind: "fields", title: "คณะและสาขาที่น่าสนใจ", subtitle: () => "แตะเพื่อดูว่าทำไมสาขานี้เข้ากับคุณ" },
  ],
  university: [
    { kind: "careers", title: "อาชีพแนะนำ", subtitle: usesAll },
    { kind: "skills", title: "สกิลที่น่าฝึกเพิ่ม", subtitle: () => "เรียงจากเริ่มง่ายไปต่อยอด ฝึกได้ระหว่างเรียน" },
  ],
  working: [
    { kind: "skills", title: "สกิลที่น่าฝึกเพิ่ม", subtitle: () => "ฝึกควบคู่กับงานได้ เรียงจากเริ่มง่ายไปต่อยอด" },
    { kind: "careers", title: "ตำแหน่งงานที่น่าสนใจ", subtitle: () => "ตำแหน่งที่ใช้จุดเด่นของคุณ • บางตำแหน่งอาจต้องเรียนเพิ่ม" },
  ],
};

/** The two group-specific panels: careers + fields, careers + skills, or skills + positions. */
export function GroupRecommendations({
  group,
  top3,
  explanation,
  className = "",
}: {
  group: UserGroup;
  top3: RiasecType[];
  explanation: ResultExplanation;
  className?: string;
}) {
  return (
    <div className={`grid items-start gap-6 lg:grid-cols-2 ${className}`}>
      {GROUP_SECTIONS[group].map((sec) => (
        <Panel key={sec.kind} id={`${sec.kind}-title`} title={sec.title} subtitle={sec.subtitle(top3)}>
          {sec.kind === "careers" ? (
            <CareerList items={explanation.careers} />
          ) : sec.kind === "fields" ? (
            <FieldAccordion items={explanation.guidance} />
          ) : (
            <SkillSteps items={explanation.guidance} />
          )}
        </Panel>
      ))}
    </div>
  );
}
