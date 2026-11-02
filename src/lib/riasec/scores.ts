import type { QuizScore } from "./api-types";
import { LETTER_TO_TYPE, RIASEC_ORDER, isRiasecLetter, type RiasecType } from "./types";

/**
 * Builds the API score from 0–100 scores keyed by RIASEC letter. Ranks
 * highest first with ties in R-I-A-S-E-C order, the same as `score_quiz`.
 */
export function toQuizScore(byLetter: Record<string, number>): QuizScore {
  const scores = Object.fromEntries(
    Object.entries(byLetter)
      .filter(([l]) => isRiasecLetter(l))
      .map(([l, v]) => [LETTER_TO_TYPE[l as keyof typeof LETTER_TO_TYPE], v]),
  ) as Record<RiasecType, number>;
  const ranking = [...RIASEC_ORDER].sort((a, b) => scores[b] - scores[a]);
  const letter = (t: RiasecType) => Object.entries(LETTER_TO_TYPE).find(([, v]) => v === t)![0];
  return { scores, ranking, hollandCode: ranking.slice(0, 3).map(letter).join(""), topType: ranking[0] };
}
