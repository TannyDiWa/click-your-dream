import data from "./subjects.json";
import type { TcasSubject } from "./types";

export const TCAS_YEAR = "2570";

const SUBJECTS: Record<string, TcasSubject> = data.subjects;

/** Subject for a myTCAS code; unknown codes fall back to the code itself. */
export function subject(code: string): TcasSubject {
  return SUBJECTS[code] ?? { name: code.toUpperCase(), short: code.toUpperCase(), group: "Other" };
}

/** Short Thai name for lists: "คณิต 1", "TGAT", "GPAX" */
export const label = (code: string) => subject(code).label ?? subject(code).short;

/** How a student gets this score, which decides where it is registered. */
export type Sitting = "TGAT/TPAT" | "TPAT1" | "A-Level" | "GPA" | "Other";

export function sittingOf(code: string): Sitting {
  const g = subject(code).group;
  if (g === "TGAT" || g === "TPAT") return "TGAT/TPAT";
  if (g === "TPAT1" || g === "A-Level" || g === "GPA") return g;
  return "Other";
}

export const REGISTRATION = data.registration;

/** "2027-01-30" → "30 ม.ค. 2570" */
export function thaiDate(iso: string, opts: { year?: boolean; weekday?: boolean } = {}) {
  return new Date(`${iso}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    ...(opts.year === false ? {} : { year: "numeric" }),
    ...(opts.weekday ? { weekday: "short" } : {}),
  });
}

/** "2026-11-04", "2026-11-10" → "4–10 พ.ย. 2569" (or "29 พ.ค. – 15 มิ.ย. 2570" across months). */
export function thaiRange(from: string, to: string) {
  const [a, b] = [new Date(`${from}T00:00:00+07:00`), new Date(`${to}T00:00:00+07:00`)];
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()}–${thaiDate(to)}`;
  }
  return `${thaiDate(from, { year: a.getFullYear() !== b.getFullYear() })} – ${thaiDate(to)}`;
}
