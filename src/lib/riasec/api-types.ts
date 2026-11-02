import type { RiasecType, UserGroup } from "./types";

/** GET /api/questions */
export type QuizQuestion = {
  id: number;
  text: string;
  sortOrder: number;
  labels: [string, string, string, string]; // answer 1 (lowest) … 4 (highest)
};

/** Answer per question id: 1 (lowest) … 4 (highest), like `quiz_answers.value`. */
export type AnswerValue = 1 | 2 | 3 | 4;
export type Answers = Record<number, AnswerValue>;

/** GET /api/quiz: the unfinished quiz (null when none) */
export type QuizProgress = { userGroup: UserGroup; step: number; answers: Answers };
export type QuizState = { progress: QuizProgress | null; hasResult: boolean };

/** POST /api/quiz/submit */
export type QuizScore = {
  scores: Record<RiasecType, number>; // 0–100
  ranking: RiasecType[]; // highest first
  hollandCode: string;
  topType: RiasecType;
};

/** GET /api/result: the latest result (null when none) */
export type QuizResult = QuizScore & { userGroup: UserGroup; completedAt: string };

/** GET /api/profiles/[type] */
export type University = { code: string; name: string; faculty: string; program: string; url: string };

export type ResultProfile = {
  title: string;
  cardTitle: [string, string];
  tagline: string;
  traits: string[];
  cardTraits: string;
  motto: string;
  strengths: { title: string; detail: string }[];
  nextSteps: string;
  activities: string[];
  field: string;
  summaryGradient: string;
  cardGradient: string;
  universities: University[];
};

/** GET /api/explanations/[code]?group=: pre-generated, reviewed content (null when none) */
export type ResultExplanation = {
  title: string;
  summary: string;
  strengths: { title: string; detail: string }[];
  /** 6 careers; `tag` is the 1–2 RIASEC dimensions it uses, e.g. "ค้นคว้า • ลงมือทำ" (shown as positions for working) */
  careers: { title: string; reason: string; tag: string }[];
  /** 3 items. high_school: fields (tag = faculty), university and working: skills (tag = how to practise) */
  guidance: { title: string; tag: string; detail: string }[];
  tryThisWeek: string[];
};
