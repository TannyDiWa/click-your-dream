import { useMemo, useSyncExternalStore } from "react";
import type { QuizScore } from "./riasec/api-types";
import type { UserGroup } from "./riasec/types";

/*
 * Guests keep their quiz in localStorage (see Google Doc "บันทึกการตัดสินใจ").
 * Only the latest result is kept; a new submission replaces it.
 * Every access is wrapped because storage can be blocked (private mode, disabled cookies).
 */

// v3: one question at a time, answers 1–4 per question id (like quiz_answers.value)
const DRAFT_KEY = "cyd:quiz-draft-v3";
const RESULT_KEY = "cyd:quiz-result";

/** Answer per question id: 1 (lowest) … 4 (highest), like `quiz_answers.value`. */
export type Answers = Record<number, 1 | 2 | 3 | 4>;

export type QuizDraft = { userGroup: UserGroup | null; answers: Answers; step: number };

export type SavedResult = QuizScore & {
  userGroup: UserGroup;
  answers: Answers;
  completedAt: string; // ISO date
};

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the quiz still works for this visit.
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

export const saveDraft = (draft: QuizDraft) => write(DRAFT_KEY, draft);
export const clearDraft = () => remove(DRAFT_KEY);
export const saveResult = (result: SavedResult) => write(RESULT_KEY, result);

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function rawItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reads a stored value on the client. Returns undefined while server-rendering
 * (storage isn't known yet) and null when nothing is stored.
 */
function useStored<T>(key: string): T | null | undefined {
  const raw = useSyncExternalStore(
    subscribe,
    () => rawItem(key),
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return undefined;
    return raw === null ? null : read<T>(key);
    // `raw` is the change signal; `read` parses the same item.
  }, [raw, key]);
}

export const useDraft = () => useStored<QuizDraft>(DRAFT_KEY);
export const useSavedResult = () => useStored<SavedResult>(RESULT_KEY);
