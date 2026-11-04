// Shape of the TCAS files in public/tcas/<year>/, written by scripts/build-tcas.ts from
// the official myTCAS data. Subject codes (tgat, tpat3, a_lv_61, gpax, …) are keys of
// subjects.json.

/** public/tcas/<year>/index.json */
export type TcasIndex = {
  year: string;
  /** ISO time the myTCAS data was fetched */
  fetchedAt: string;
  source: string;
  universities: { id: string; name: string; programs: number }[];
};

/** public/tcas/<year>/<university id>.json */
export type TcasUniversity = {
  id: string;
  name: string;
  faculties: { name: string; programs: TcasProgram[] }[];
};

export type TcasProgram = {
  id: string;
  /** e.g. "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมศาสตร์" */
  name: string;
  field: string;
  /** e.g. "ภาษาไทย ปกติ", "นานาชาติ" */
  type: string;
  campus: string;
  /** Tuition as the university wrote it */
  cost?: string;
  /** myTCAS program page */
  url: string;
  /** Seats per round ("1".."4"), only rounds published this year */
  seats: Partial<Record<"1" | "2" | "3" | "4", number>>;
  /** Round 1 (Portfolio) and 2 (Quota) projects */
  projects: TcasProject[];
  /** Round 3 (Admission) options; a program can offer several (รูปแบบที่ 1, 2, …) */
  admission: TcasAdmission[];
};

export type TcasProject = { round: 1 | 2; name: string; seats: number; link?: string };

export type TcasAdmission = {
  /** Option name when the program has more than one, e.g. "… (รูปแบบที่ 2)" */
  name?: string;
  seats: number;
  /**
   * Score weights in %, e.g. [{ codes: ["tgat"], weight: 20 }, { codes: ["tpat3"], weight: 30 }].
   * Several codes are alternatives sharing one weight (Math1 or Math2); "percentile" when the
   * program converts that score to a percentile rank.
   */
  weights: { codes: string[]; weight: number; unit?: "percentile" }[];
  /**
   * A share of the score taken from a group of subjects (myTCAS cal_type). Show it as
   * "80% ใช้คะแนนจากกลุ่มวิชา คณิต 1, ฟิสิกส์, เคมี, ชีวะ": myTCAS does not say whether one
   * subject is picked or the best one counts.
   */
  group?: { codes: string[]; weight: number };
  minGpax?: number;
  minTotal?: number;
  /** Minimum score per subject; unit "tscore" / "percentile" when not a raw score */
  minimums: { codes: string[]; value: number; unit: "score" | "tscore" | "percentile" }[];
  /**
   * Subject-list rules from myTCAS score_condition. "any": at least one subject reaches its own
   * minimum (e.g. IELTS 5 or TOEIC 500). "shared": one minimum for the whole list, whose exact
   * meaning only the university's criteria spell out.
   */
  subjectRules: { kind: "any" | "shared"; items: { code: string; unit: "score" | "tscore" | "percentile"; min?: number }[]; min?: number }[];
  /** Minimum credits in subject groups (e.g. gpa22 + gpa23) */
  minCredits?: { codes: string[]; value: number };
  interview?: { date?: string; time?: string; location?: string };
  link?: string;
  /** University's own condition text, shortened */
  note?: string;
};

export type TcasSubject = {
  name: string;
  short: string;
  group: string;
  exam?: { date: string; time: string };
};
