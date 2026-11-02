import type { RiasecType } from "./types";

/** GET /api/questions */
export type QuizQuestion = {
  id: number;
  text: string;
  sortOrder: number;
  labels: [string, string, string, string]; // answer 1 (lowest) … 4 (highest)
};

/** POST /api/score */
export type QuizScore = {
  scores: Record<RiasecType, number>; // 0–100
  ranking: RiasecType[]; // highest first
  hollandCode: string;
  topType: RiasecType;
};

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
