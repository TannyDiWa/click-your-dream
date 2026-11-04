/**
 * Builds the TCAS data for /explore from the official myTCAS data (course.mytcas.com):
 * every program's seats per round, round 1–2 projects, and round 3 (Admission) score
 * weights and minimums, so a student can see which exams a program needs.
 *
 *   npm run tcas            # writes public/tcas/<year>/index.json and one file per university
 *
 * Re-run when myTCAS updates (round 3 criteria arrive in October, round 4 later).
 * Prints subject codes that src/lib/tcas/subjects.json does not name yet.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { TcasAdmission, TcasIndex, TcasProgram, TcasProject, TcasUniversity } from "../src/lib/tcas/types";

const DATA = "https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas";
const PROGRAM_PAGE = "https://course.mytcas.com/programs/";
const TCAS_YEAR = "2570";
const OUT = new URL(`../public/tcas/${TCAS_YEAR}/`, import.meta.url);
const SUBJECTS = new URL("../src/lib/tcas/subjects.json", import.meta.url);
const CONCURRENCY = 16;
const NOTE_LENGTH = 400;

type Course = {
  university_id: string;
  university_name_th: string;
  campus_name_th: string;
  faculty_name_th: string;
  field_name_th: string;
  program_name_th: string;
  program_type_name_th: string;
  program_id: string;
  cost?: string;
};

type Round = {
  type: string;
  project_name_th?: string;
  receive_student_number: number;
  link?: string;
  description?: string;
  condition?: string;
  interview_date?: string;
  interview_time?: string;
  interview_location?: string;
  min_gpax?: number | string;
  min_total_score?: number | string;
  scores?: Record<string, number | string>;
  score_conditions?: Record<string, number | string>;
  [key: string]: unknown;
};

async function fetchJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404 || res.status === 403) return null;
      if (res.ok) return (await res.json()) as T;
    } catch {
      // Network hiccup: try again.
    }
  }
  throw new Error(`Could not load ${url}`);
}

/** Runs fn over items with at most `limit` in flight. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const num = (v: unknown) => (v === undefined || v === null || v === "" ? NaN : Number(v));
const text = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const shorten = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const hasInfo = (s: string) => s !== "" && !s.includes("ไม่มี");

/**
 * One myTCAS key → subject codes: "a_lv_61|a_lv_62" are alternatives, "gpa22_23_28" means
 * gpa22, gpa23 and gpa28 together.
 */
function expandCodes(key: string): string[] {
  return key.split("|").flatMap((code) => {
    const m = /^gpa(\d\d(?:_\d\d)+)$/.exec(code);
    return m ? m[1].split("_").map((n) => `gpa${n}`) : [code];
  });
}

function admission(r: Round, named: boolean): TcasAdmission {
  const scores = r.scores ?? {};
  const conditions = r.score_conditions ?? {};
  const weights = Object.entries(scores)
    .filter(([code]) => !code.startsWith("cal_"))
    .map(([key, weight]) => {
      const percentile = key.endsWith("_pr");
      return { codes: expandCodes(percentile ? key.slice(0, -3) : key), weight: num(weight), ...(percentile ? { unit: "percentile" as const } : {}) };
    })
    .filter((w) => w.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const groupCodes = text(scores.cal_subject_name).split(" ").filter(Boolean).flatMap(expandCodes);
  const group = groupCodes.length && num(scores.cal_score_sum) > 0 ? { codes: groupCodes, weight: num(scores.cal_score_sum) } : undefined;

  const minimums: TcasAdmission["minimums"] = [];
  let minGpax = num(r.min_gpax);
  for (const [key, raw] of Object.entries(conditions)) {
    if (!key.startsWith("min_")) continue;
    const value = num(raw);
    if (!(value > 0)) continue;
    if (key === "min_gpax") {
      minGpax = value;
      continue;
    }
    const m = /^min_(.+?)(_tscore|_pr)?$/.exec(key)!;
    minimums.push({ codes: expandCodes(m[1]), value, unit: m[2] === "_tscore" ? "tscore" : m[2] === "_pr" ? "percentile" : "score" });
  }

  // "score_condition" + "subject_names" + "score_minimum": 1 = at least one subject reaches its own
  // minimum, 2 = one minimum for the whole list.
  const subjectRules: TcasAdmission["subjectRules"] = [];
  const names = text(conditions.subject_names).split(" ").filter(Boolean);
  if (names.length) {
    const mins = text(String(conditions.score_minimum ?? "")).split(" ").map(Number);
    const items = names.flatMap((name, i) => {
      const m = /^min_(.+?)(_tscore|_pr)?$/.exec(name);
      const unit = m?.[2] === "_tscore" ? ("tscore" as const) : m?.[2] === "_pr" ? ("percentile" as const) : ("score" as const);
      return expandCodes(m?.[1] ?? name).map((code) => ({ code, unit, ...(mins.length === names.length && mins[i] > 0 ? { min: mins[i] } : {}) }));
    });
    const shared = num(conditions.score_condition) === 2 || mins.length !== names.length;
    subjectRules.push(shared ? { kind: "shared", items, ...(mins[0] > 0 ? { min: mins[0] } : {}) } : { kind: "any", items });
  }

  const creditKey = Object.keys(r).find((k) => k.startsWith("min_credit_"));
  const minCredits = creditKey && num(r[creditKey]) > 0 ? { codes: expandCodes(creditKey.slice("min_credit_".length)), value: num(r[creditKey]) } : undefined;

  const interview = {
    date: text(r.interview_date),
    time: text(r.interview_time),
    location: text(r.interview_location),
  };
  const note = text(r.condition) || text(r.description);
  const minTotal = num(r.min_total_score);

  return {
    ...(named && text(r.project_name_th) ? { name: text(r.project_name_th) } : {}),
    seats: num(r.receive_student_number) || 0,
    weights,
    ...(group ? { group } : {}),
    ...(minGpax > 0 ? { minGpax } : {}),
    ...(minTotal > 0 ? { minTotal } : {}),
    minimums,
    subjectRules,
    ...(minCredits ? { minCredits } : {}),
    ...(hasInfo(interview.date) || hasInfo(interview.location)
      ? {
          interview: Object.fromEntries(
            Object.entries(interview).filter(([, v]) => hasInfo(v)).map(([k, v]) => [k, shorten(v, 200)]),
          ),
        }
      : {}),
    ...(text(r.link) ? { link: text(r.link) } : {}),
    ...(note ? { note: shorten(note, NOTE_LENGTH) } : {}),
  };
}

function program(c: Course, rounds: Round[]): TcasProgram {
  const thisYear = rounds.filter((r) => r.type.endsWith(`_${TCAS_YEAR}`));
  const seats: TcasProgram["seats"] = {};
  for (const r of thisYear) {
    const round = r.type.split("_")[0] as keyof TcasProgram["seats"];
    seats[round] = (seats[round] ?? 0) + (num(r.receive_student_number) || 0);
  }
  const projects: TcasProject[] = thisYear
    .filter((r) => r.type.startsWith("1_") || r.type.startsWith("2_"))
    .map((r) => ({
      round: r.type.startsWith("1_") ? 1 : 2,
      name: text(r.project_name_th) || "ไม่ระบุชื่อโครงการ",
      seats: num(r.receive_student_number) || 0,
      ...(text(r.link) ? { link: text(r.link) } : {}),
    }));
  const round3 = thisYear.filter((r) => r.type.startsWith("3_"));
  const cost = text(c.cost);
  return {
    id: c.program_id,
    name: text(c.program_name_th),
    field: text(c.field_name_th),
    type: text(c.program_type_name_th),
    campus: text(c.campus_name_th),
    ...(cost ? { cost: shorten(cost, 300) } : {}),
    url: `${PROGRAM_PAGE}${c.program_id}`,
    seats,
    projects,
    admission: round3.map((r) => admission(r, round3.length > 1)),
  };
}

/** Every subject code a program refers to, to check subjects.json covers them. */
function codesOf(p: TcasProgram): string[] {
  return p.admission.flatMap((a) => [
    ...a.weights.flatMap((w) => w.codes),
    ...(a.group?.codes ?? []),
    ...a.minimums.flatMap((m) => m.codes),
    ...a.subjectRules.flatMap((r) => r.items.map((i) => i.code)),
    ...(a.minCredits?.codes ?? []),
  ]);
}

async function main() {
  const courses = (await fetchJson<Course[]>(`${DATA}/courses.json`)) ?? [];
  if (!courses.length) throw new Error("Could not load myTCAS courses.json");
  // One entry per program (courses.json repeats a program for each major).
  const unique = [...new Map(courses.map((c) => [c.program_id, c])).values()];

  let done = 0;
  const programs = await pool(unique, CONCURRENCY, async (c) => {
    const rounds = (await fetchJson<Round[]>(`${DATA}/rounds/${c.program_id}.json`)) ?? [];
    if (++done % 500 === 0) console.log(`  ${done}/${unique.length} programs`);
    return { course: c, program: program(c, rounds) };
  });

  const byUniversity = new Map<string, { name: string; faculties: Map<string, TcasProgram[]> }>();
  for (const { course, program: p } of programs) {
    const u = byUniversity.get(course.university_id) ?? { name: text(course.university_name_th), faculties: new Map() };
    byUniversity.set(course.university_id, u);
    const faculty = text(course.faculty_name_th) || "ไม่ระบุคณะ";
    u.faculties.set(faculty, [...(u.faculties.get(faculty) ?? []), p]);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const th = (a: string, b: string) => a.localeCompare(b, "th");
  const index: TcasIndex = { year: TCAS_YEAR, fetchedAt: new Date().toISOString(), source: "https://course.mytcas.com", universities: [] };
  for (const [id, u] of byUniversity) {
    const file: TcasUniversity = {
      id,
      name: u.name,
      faculties: [...u.faculties]
        .sort(([a], [b]) => th(a, b))
        .map(([name, list]) => ({ name, programs: list.sort((a, b) => th(a.name, b.name) || th(a.type, b.type)) })),
    };
    writeFileSync(new URL(`${id}.json`, OUT), JSON.stringify(file));
    index.universities.push({ id, name: u.name, programs: file.faculties.reduce((n, f) => n + f.programs.length, 0) });
  }
  index.universities.sort((a, b) => th(a.name, b.name));
  writeFileSync(new URL("index.json", OUT), JSON.stringify(index, null, 2) + "\n");

  const all = programs.map((x) => x.program);
  const withAdmission = all.filter((p) => p.admission.length);
  const withWeights = withAdmission.filter((p) => p.admission.some((a) => a.weights.length || a.group));
  console.log(
    `Wrote ${index.universities.length} universities, ${all.length} programs: ` +
      `${withAdmission.length} with round 3, ${withWeights.length} of them with score weights.`,
  );

  const known = new Set(Object.keys(JSON.parse(readFileSync(SUBJECTS, "utf8")).subjects));
  const unknown = new Map<string, number>();
  for (const code of all.flatMap(codesOf)) if (!known.has(code)) unknown.set(code, (unknown.get(code) ?? 0) + 1);
  if (unknown.size) console.log("Subject codes missing from subjects.json:", Object.fromEntries(unknown));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
