"use client";

import { useState } from "react";
import { Combobox } from "@/components/explore/combobox";
import { label, REGISTRATION, sittingOf, subject, thaiDate, thaiRange, type Sitting } from "@/lib/tcas/subjects";
import type { TcasAdmission, TcasProgram } from "@/lib/tcas/types";

const card = "rounded-[28px] border border-white bg-paper shadow-[0_10px_30px_rgba(123,135,184,0.1)]";
const link = "font-bold text-violet underline underline-offset-4 hover:text-navy";

const BAR: Record<Sitting, string> = {
  "TGAT/TPAT": "#8e8bdd",
  TPAT1: "#e9aed4",
  "A-Level": "#6fc0c0",
  GPA: "#e8c67d",
  Other: "#c9b8ec",
};

// Where each kind of score comes from, in the order a student meets them.
const SITTINGS: { key: Sitting; title: string; how: string }[] = [
  {
    key: "TGAT/TPAT",
    title: "สมัครสอบ TGAT/TPAT",
    how: `สมัคร ${thaiRange(REGISTRATION["TGAT/TPAT"].from, REGISTRATION["TGAT/TPAT"].to)} ที่ student.mytcas.com`,
  },
  { key: "TPAT1", title: "สมัครสอบ TPAT1 (กสพท)", how: REGISTRATION.TPAT1.note },
  {
    key: "A-Level",
    title: "สมัครสอบ A-Level",
    how: `สมัคร ${thaiRange(REGISTRATION["A-Level"].from, REGISTRATION["A-Level"].to)} ที่ student.mytcas.com`,
  },
  { key: "Other", title: "คะแนนสอบอื่น ๆ", how: "ผลสอบภาษาหรือข้อสอบเฉพาะ ดูกำหนดการและเกณฑ์ที่มหาวิทยาลัย" },
  { key: "GPA", title: "เกรดจากโรงเรียน", how: "ใช้ผลการเรียน ไม่ต้องสมัครสอบ" },
];

// myTCAS interview fields often hold other text (the program name, post-result steps);
// only show them when they name an actual date.
const THAI_DATE = /\d{1,2}\s*(ม\.ค|ก\.พ|มี\.ค|เม\.ย|พ\.ค|มิ\.ย|ก\.ค|ส\.ค|ก\.ย|ต\.ค|พ\.ย|ธ\.ค|มกรา|กุมภา|มีนา|เมษา|พฤษภา|มิถุนา|กรกฎา|สิงหา|กันยา|ตุลา|พฤศจิกา|ธันวา)/;

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));
const unitText = (unit: "score" | "tscore" | "percentile", codes: string[]) =>
  unit === "tscore" ? " (T-score)" : unit === "percentile" ? " (เปอร์เซ็นไทล์)" : codes.every((c) => sittingOf(c) === "GPA") ? "" : " คะแนน";

/** Every subject an option scores or sets a minimum on. */
function codesOf(a: TcasAdmission) {
  return [
    ...new Set([
      ...a.weights.flatMap((w) => w.codes),
      ...(a.group?.codes ?? []),
      ...a.minimums.flatMap((m) => m.codes),
      ...a.subjectRules.flatMap((r) => r.items.map((i) => i.code)),
    ]),
  ];
}

function WeightRow({ codes, weight, note }: { codes: string[]; weight: number; note?: string }) {
  const sitting = sittingOf(codes[0]);
  const title = codes.length > 1 ? `ใช้คะแนนจากกลุ่มวิชา ${codes.map(label).join(", ")}` : label(codes[0]);
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
      <span className="min-w-0">
        <span className="block text-base font-bold leading-snug">{title}</span>
        <span className="block text-[13px] leading-snug text-muted">
          {codes.length > 1 ? note : subject(codes[0]).name}
        </span>
      </span>
      <span className="text-xl font-bold text-violet">{fmt(weight)}%</span>
      <span className="col-span-2 h-2.5 rounded-full bg-[#ebedf7]">
        <span className="block h-2.5 rounded-full" style={{ width: `${Math.min(weight, 100)}%`, backgroundColor: BAR[sitting] }} />
      </span>
    </li>
  );
}

function Option({ a, program }: { a: TcasAdmission; program: TcasProgram }) {
  const codes = codesOf(a);
  const hasWeights = a.weights.length > 0 || a.group;
  const bySitting = SITTINGS.map((s) => ({ ...s, codes: codes.filter((c) => sittingOf(c) === s.key) })).filter((s) => s.codes.length);

  // Exam days for the subjects this option uses, in date order.
  const days = new Map<string, string[]>();
  for (const c of codes) {
    const exam = subject(c).exam;
    if (exam) days.set(exam.date, [...(days.get(exam.date) ?? []), `${label(c)} ${exam.time} น.`]);
  }
  // Times start with "HH.MM", so sorting the text puts each day's sittings in order.
  const timeline = [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => [date, items.sort((x, y) => x.slice(x.indexOf(" ") + 1).localeCompare(y.slice(y.indexOf(" ") + 1)))] as const);

  const minimums = [
    ...(a.minGpax ? [`GPAX ขั้นต่ำ ${fmt(a.minGpax)}`] : []),
    ...(a.minTotal ? [`คะแนนรวมขั้นต่ำ ${fmt(a.minTotal)}`] : []),
    ...a.minimums.map((m) => `${m.codes.map(label).join(" + ")} ขั้นต่ำ ${fmt(m.value)}${unitText(m.unit, m.codes)}`),
    ...a.subjectRules.map((r) =>
      r.kind === "any"
        ? `ต้องมีอย่างน้อย 1 วิชาจาก: ${r.items.map((i) => `${label(i.code)}${i.min ? ` ≥ ${fmt(i.min)}` : ""}`).join(", ")}`
        : `เกณฑ์ขั้นต่ำ ${r.min ? fmt(r.min) : ""}${unitText(r.items[0]?.unit ?? "score", r.items.map((i) => i.code))} สำหรับวิชา ${r.items.map((i) => label(i.code)).join(", ")} (ดูรายละเอียดที่มหาวิทยาลัย)`,
    ),
    ...(a.minCredits ? [`หน่วยกิตกลุ่มสาระ ${a.minCredits.codes.map(label).join(" + ")} รวมไม่น้อยกว่า ${fmt(a.minCredits.value)} หน่วยกิต`] : []),
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <div className={`${card} p-5 sm:p-6`}>
        <h4 className="text-xl font-bold leading-normal">สัดส่วนคะแนนรอบ 3 Admission</h4>
        <p className="text-sm text-muted">รับ {a.seats.toLocaleString("th-TH")} คน • คะแนนเต็มคิดเป็น 100%</p>
        {hasWeights ? (
          <ul className="mt-4 space-y-4">
            {a.weights.map((w) => (
              <WeightRow key={w.codes.join("|")} codes={w.codes} weight={w.weight} />
            ))}
            {a.group && (
              <WeightRow codes={a.group.codes} weight={a.group.weight} note="วิธีเลือกวิชาในกลุ่ม ดูที่ประกาศของมหาวิทยาลัย" />
            )}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl bg-[#f7f5ff] px-4 py-3 text-[15px] leading-relaxed">
            มหาวิทยาลัยยังไม่ได้ระบุสัดส่วนคะแนนในระบบ myTCAS ดูเกณฑ์จากประกาศของมหาวิทยาลัยก่อนสมัคร
          </p>
        )}

        {minimums.length > 0 && (
          <>
            <h5 className="mt-6 font-bold">เกณฑ์ขั้นต่ำ</h5>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
              {minimums.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )}
        {a.interview?.date && THAI_DATE.test(a.interview.date) && (
          <p className="mt-4 text-[15px] leading-relaxed">
            <b>สอบสัมภาษณ์:</b> {[a.interview.date, a.interview.time, a.interview.location].filter(Boolean).join(" • ")}
          </p>
        )}
        {a.note && <p className="mt-4 rounded-2xl bg-[#f7f5ff] px-4 py-3 text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">{a.note}</p>}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          {a.link && (
            <a href={a.link} target="_blank" rel="noreferrer" className={link}>
              ประกาศของมหาวิทยาลัย&nbsp;↗
            </a>
          )}
          <a href={program.url} target="_blank" rel="noreferrer" className={link}>
            หลักสูตรนี้บน myTCAS&nbsp;↗
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {bySitting.length > 0 && (
          <div className={`${card} p-5 sm:p-6`}>
            <h4 className="text-xl font-bold leading-normal">ต้องเตรียมอะไรบ้าง</h4>
            <ol className="mt-3 space-y-4">
              {bySitting.map((s, i) => (
                <li key={s.key} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-badge text-sm font-bold text-violet">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-snug">{s.title}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {s.codes.map((c) => (
                        <span key={c} className="rounded-full bg-chip px-2.5 py-0.5 text-[13px] font-bold text-violet" title={subject(c).name}>
                          {label(c)}
                        </span>
                      ))}
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted">{s.how}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {timeline.length > 0 && (
          <div className={`${card} p-5 sm:p-6`}>
            <h4 className="text-xl font-bold leading-normal">วันสอบของหลักสูตรนี้</h4>
            <ul className="mt-3 space-y-3">
              {timeline.map(([date, items]) => (
                <li key={date} className="grid grid-cols-[112px_1fr] gap-3">
                  <span className="rounded-2xl bg-[#e8e7ff] px-3 py-1.5 text-center text-sm font-bold leading-snug">
                    {thaiDate(date, { weekday: true })}
                  </span>
                  <span className="flex flex-col justify-center text-[15px] leading-snug">
                    {items.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Up to this many round-3 options show as buttons; more get a searchable list (some programs have 30).
const MAX_OPTION_BUTTONS = 3;

/** "TPAT5 30% • ฟิสิกส์ 30% • กลุ่มวิชา 40%" — the weights at a glance, to tell options apart. */
function weightSummary(a: TcasAdmission) {
  const parts = [
    ...a.weights.map((w) => `${w.codes.map(label).join("/")} ${fmt(w.weight)}%`),
    ...(a.group ? [`กลุ่มวิชา ${fmt(a.group.weight)}%`] : []),
  ];
  return parts.length ? parts.join(" • ") : "ไม่ระบุสัดส่วนคะแนน";
}

/** One program: seats per round, round 3 scoring, what to register for and when, round 1–2 projects. */
export function ProgramCard({ program, university, faculty }: { program: TcasProgram; university: string; faculty: string }) {
  const [optionIndex, setOptionIndex] = useState(0);
  const options = program.admission;
  const option = options[Math.min(optionIndex, options.length - 1)];
  const rounds = (["1", "2", "3", "4"] as const).filter((r) => program.seats[r]);

  return (
    <section aria-labelledby="program-title" className="mt-6">
      <div className={`${card} p-5 sm:p-7`}>
        <p className="text-sm font-bold text-violet">
          {university} • {faculty}
        </p>
        <h3 id="program-title" className="mt-1 text-[22px] font-bold leading-normal sm:text-[26px]">
          {program.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2 text-[13px] font-bold">
          <span className="rounded-full bg-chip px-3 py-1 text-violet">{program.type}</span>
          {program.campus && <span className="rounded-full bg-[#e6f4ff] px-3 py-1 text-navy">{program.campus}</span>}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["1", "2", "3", "4"] as const).map((r) => (
            <li key={r} className={`rounded-2xl px-4 py-3 ${program.seats[r] ? "bg-[#f7f5ff]" : "bg-[#f4f5fa] text-muted"}`}>
              <span className="block text-[13px] text-muted">รอบ {r} {["Portfolio", "Quota", "Admission", "Direct Admission"][Number(r) - 1]}</span>
              <span className="block text-lg font-bold">{program.seats[r] ? `${program.seats[r]!.toLocaleString("th-TH")} คน` : "ยังไม่เปิดรับ"}</span>
            </li>
          ))}
        </ul>
        {program.cost && <p className="mt-4 text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">ค่าใช้จ่าย: {program.cost}</p>}
        {!rounds.length && <p className="mt-4 text-[15px]">ยังไม่มีข้อมูลการรับสมัคร TCAS70 ของหลักสูตรนี้</p>}
      </div>

      {option ? (
        <div className="mt-6">
          {options.length > MAX_OPTION_BUTTONS ? (
            <div className="mb-4 max-w-[640px]">
              <Combobox
                label={`รอบ 3 มี ${options.length} รูปแบบ — เลือกรูปแบบหรือวิชาเอกที่สนใจ`}
                placeholder="พิมพ์ค้นหา เช่น ชื่อวิชาเอกหรือวิชาที่เลือกสอบ"
                unit="รูปแบบ"
                options={options.map((o, i) => ({
                  value: String(i),
                  label: o.name ?? `รูปแบบที่ ${i + 1}`,
                  meta: `รับ ${o.seats} คน • ${weightSummary(o)}`,
                }))}
                value={String(options.indexOf(option))}
                onChange={(v) => setOptionIndex(Number(v))}
              />
              {/* The field truncates long names on phones; spell out the chosen one. */}
              <p className="mt-2 text-sm leading-snug text-muted">
                กำลังดู: <b className="text-navy">{option.name ?? `รูปแบบที่ ${options.indexOf(option) + 1}`}</b> • รับ {option.seats} คน
              </p>
            </div>
          ) : (
            options.length > 1 && (
              <>
                <div role="tablist" aria-label="รูปแบบการยื่นคะแนนรอบ 3" className="mb-4 flex flex-wrap gap-2">
                  {options.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={o === option}
                      onClick={() => setOptionIndex(i)}
                      className={`cursor-pointer rounded-full border-2 px-4 py-2 text-[15px] font-bold transition ${
                        o === option ? "border-[#f6a0ce] bg-[#fff6fb] text-[#c75d97]" : "border-white bg-paper text-navy hover:border-[#dbe3f5]"
                      }`}
                    >
                      รูปแบบที่ {i + 1} • {o.seats} คน
                    </button>
                  ))}
                </div>
                {option.name && <p className="mb-3 text-[15px] text-muted">{option.name}</p>}
              </>
            )
          )}
          <Option a={option} program={program} />
        </div>
      ) : (
        program.seats["3"] === undefined &&
        rounds.length > 0 && (
          <p className={`${card} mt-6 px-5 py-4 text-[15px] leading-relaxed sm:px-7`}>
            หลักสูตรนี้ไม่ได้เปิดรับรอบ 3 Admission ใน TCAS70 จึงไม่มีสัดส่วนวิชาสอบกลาง ดูเกณฑ์ของโครงการรอบ 1–2 ด้านล่าง
          </p>
        )
      )}

      {program.projects.length > 0 && (
        <details className={`${card} group mt-6 px-5 py-4 sm:px-7`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
            <span>โครงการรอบ 1 Portfolio และรอบ 2 Quota ({program.projects.length} โครงการ)</span>
            <span aria-hidden className="text-violet transition group-open:rotate-180">⌄</span>
          </summary>
          <ul className="mt-3 divide-y divide-[#ebedf7]">
            {program.projects.map((p, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-[15px]">
                <span className="min-w-0">
                  <span className="mr-2 rounded-full bg-chip px-2 py-0.5 text-xs font-bold text-violet">รอบ {p.round}</span>
                  {p.name}
                </span>
                <span className="flex shrink-0 items-baseline gap-4">
                  <span className="font-bold">{p.seats} คน</span>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className={`${link} text-sm`}>
                      ประกาศ&nbsp;↗
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-muted">เกณฑ์และเอกสารของแต่ละโครงการ ดูจากประกาศของมหาวิทยาลัย</p>
        </details>
      )}
    </section>
  );
}
