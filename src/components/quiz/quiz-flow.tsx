"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ConsentDialog } from "@/components/quiz/consent-dialog";
import { PRIVACY } from "@/lib/privacy";
import type { AnswerValue, Answers, QuizProgress, QuizQuestion, QuizState } from "@/lib/riasec/api-types";
import { USER_GROUPS, type UserGroup } from "@/lib/riasec/types";

// Step 0 = choose user group, steps 1..N = one question each.
type Step = number;

const JOURNEY = ["① ตัวตนของคุณ", "② ความสนใจ", "③ เส้นทางที่ใช่"];

const optionBase =
  "flex cursor-pointer items-center gap-3 rounded-[22px] border-[1.5px] px-[18px] py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#5397e9]";
const optionChecked = "border-[#f6a0ce] bg-[#fff6fb] shadow-[0_6px_16px_rgba(230,154,197,0.18)]";
const optionIdle = "border-[#dbe3f5] bg-[#f4f7ff] hover:border-[#c4d0ee] hover:bg-white";

function badgeClass(checked: boolean) {
  return `grid size-10 shrink-0 place-items-center rounded-2xl text-lg font-bold sm:size-[46px] sm:text-xl ${
    checked ? "bg-[#ffe1f0] text-[#c75d97]" : "bg-[#dfeaff] text-navy"
  }`;
}

function RadioMark({ checked }: { checked: boolean }) {
  return checked ? (
    <span aria-hidden className="grid size-[21px] shrink-0 place-items-center rounded-full border-2 border-[#f6a0ce] bg-white">
      <span className="size-[11px] rounded-full bg-[#f6a0ce]" />
    </span>
  ) : (
    <Image unoptimized src="/decor/radio-unselected.svg" alt="" aria-hidden width={21} height={21} className="shrink-0" />
  );
}

function Journey({ active }: { active: 0 | 1 }) {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-5" aria-label="ขั้นตอนแบบทดสอบ">
      {JOURNEY.map((label, i) => (
        <li key={label} className="flex items-center gap-3 sm:gap-5">
          {i > 0 && (
            <Image unoptimized src="/decor/journey-connector.svg" alt="" aria-hidden width={38} height={16} className="hidden sm:block" />
          )}
          <span
            aria-current={i === active ? "step" : undefined}
            className={`whitespace-nowrap rounded-[30px] px-3.5 py-[7px] text-sm sm:text-base ${
              i === active ? "bg-white font-bold text-navy" : "bg-[#e6ecfb] text-[#7d89af]"
            }`}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Step 0: pick one user group. */
function GroupChoice({ value, onChange, labelledBy }: { value: UserGroup | null; onChange: (g: UserGroup) => void; labelledBy: string }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="mx-auto grid max-w-[560px] gap-3.5">
      {USER_GROUPS.map((g, i) => {
        const checked = value === g.value;
        return (
          <label key={g.value} className={`${optionBase} min-h-[88px] sm:gap-3.5 ${checked ? optionChecked : optionIdle}`}>
            <input type="radio" name="user-group" value={g.value} checked={checked} onChange={() => onChange(g.value)} className="sr-only" />
            <span aria-hidden className={badgeClass(checked)}>
              {"ABC"[i]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-normal text-navy sm:text-[17px]">{g.title}</span>
              <span className="block text-[13px] leading-normal text-[#7d89af]">{g.description}</span>
            </span>
            <RadioMark checked={checked} />
          </label>
        );
      })}
    </div>
  );
}

/** Steps 1..N: rate one statement from 1 (lowest) to 4 (highest). */
function ScaleChoice({ question, value, onChange, labelledBy }: { question: QuizQuestion; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void; labelledBy: string }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {question.labels.map((label, i) => {
        const v = (i + 1) as AnswerValue;
        const checked = value === v;
        return (
          <label
            key={v}
            className={`${optionBase} min-h-[118px] flex-col justify-center text-center ${checked ? optionChecked : optionIdle}`}
          >
            <input type="radio" name={`q${question.id}`} value={v} checked={checked} onChange={() => onChange(v)} className="sr-only" />
            <span aria-hidden className={badgeClass(checked)}>
              {v}
            </span>
            <span className="text-[15px] font-bold leading-snug text-navy sm:text-base">{label}</span>
          </label>
        );
      })}
    </div>
  );
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body;
}

/** Loads the questions and the visitor's unfinished quiz from the API, then starts the quiz. */
export function QuizFlow() {
  const [data, setData] = useState<{ questions: QuizQuestion[]; state: QuizState } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ questions }, state] = await Promise.all([
          getJson<{ questions: QuizQuestion[] }>("/api/questions"),
          getJson<QuizState>("/api/quiz"),
        ]);
        if (!cancelled) {
          setData({ questions, state });
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loadError) {
    return (
      <>
        <QuizHeading step={0} />
        <div role="alert" className="mx-auto mt-6 max-w-[880px] rounded-[32px] border-2 border-white bg-paper p-8 text-center">
          <p className="text-xl font-bold">โหลดแบบทดสอบไม่สำเร็จ</p>
          <p className="mt-2 text-sm text-muted">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoadError(null);
              setAttempt((a) => a + 1);
            }}
            className="mt-5 cursor-pointer rounded-[30px] bg-[#f6a0ce] px-6 py-3 font-bold text-white hover:bg-blush-deep"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </>
    );
  }
  if (data === null) return <QuizHeading step={0} placeholder />;
  return (
    <QuizSteps
      questions={data.questions}
      initialProgress={data.state.progress}
      hasPreviousResult={data.state.hasResult}
      consented={data.state.consentVersion === PRIVACY.version}
    />
  );
}

function QuizHeading({ step, placeholder = false }: { step: Step; placeholder?: boolean }) {
  return (
    <>
      <div className="text-center">
        <p className="text-sm font-bold text-violet">YOUR DREAM JOURNEY</p>
        <h1 className="mt-1 text-[28px] font-bold leading-normal sm:text-[38px]">อีกหนึ่งคลิก ใกล้ความฝันอีกนิด</h1>
        <p className="mt-0.5 text-base leading-normal sm:text-lg">
          มารู้จักตัวเองผ่านสิ่งเล็ก ๆ ที่คุณชอบ แล้วค่อย ๆ ค้นพบเส้นทางที่ใช่
        </p>
        <div className="mt-4">
          <Journey active={step === 0 ? 0 : 1} />
        </div>
      </div>
      {placeholder && (
        <div className="mx-auto mt-6 grid h-[480px] max-w-[880px] place-items-center text-muted" aria-busy="true">
          กำลังโหลดแบบทดสอบ…
        </div>
      )}
    </>
  );
}

function QuizSteps({
  questions,
  initialProgress,
  hasPreviousResult,
  consented: initialConsented,
}: {
  questions: QuizQuestion[];
  initialProgress: QuizProgress | null;
  hasPreviousResult: boolean;
  consented: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const consentRef = useRef<HTMLDialogElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const total = questions.length;

  // Without consent to the current notice, a resumed quiz goes back to the group step to ask for it.
  const [consented, setConsented] = useState(initialConsented);
  const [step, setStep] = useState<Step>(() => (initialConsented ? Math.min(Math.max(initialProgress?.step ?? 0, 0), total) : 0));
  const [userGroup, setUserGroup] = useState<UserGroup | null>(initialProgress?.userGroup ?? null);
  const [answers, setAnswers] = useState<Answers>(initialProgress?.answers ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Progress is saved in the database so the visitor can leave and continue
  // later. Saves run one after another so they reach the server in order; a
  // failed save only affects resuming, since submit sends every answer again.
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  function save(url: string, method: string, body: unknown) {
    saveQueue.current = saveQueue.current.then(() =>
      fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then((res) => {
          if (!res.ok) console.warn(`Saving quiz progress failed (${res.status})`);
        })
        .catch((e) => console.warn("Saving quiz progress failed", e)),
    );
  }

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  // Leaving /quiz only hides this page (Cache Components keep it in <Activity>), so an open
  // modal dialog would stay in the top layer and make the next page inert. Close them on hide.
  useEffect(() => {
    const dialogs = [dialogRef.current, consentRef.current];
    return () => dialogs.forEach((d) => d?.close());
  }, []);

  const question = step > 0 ? questions[step - 1] : null;
  const isLast = step === total;
  const answered = questions.filter((q) => answers[q.id]).length;
  const allAnswered = answered === total;
  const canGoNext = question ? Boolean(answers[question.id]) : Boolean(userGroup);

  function goTo(next: Step) {
    window.clearTimeout(advanceTimer.current);
    if (step === 0 && userGroup) {
      // Nothing is stored until the visitor agrees to the privacy notice.
      if (!consented) {
        consentRef.current?.showModal();
        return;
      }
      save("/api/quiz/start", "POST", { userGroup });
    } else {
      save("/api/quiz/progress", "PATCH", { step: next });
    }
    setStep(next);
  }

  function acceptConsent() {
    if (!userGroup) return;
    consentRef.current?.close();
    setConsented(true);
    save("/api/quiz/start", "POST", { userGroup, consentVersion: PRIVACY.version });
    setStep(1);
  }

  function choose(v: AnswerValue) {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: v }));
    save("/api/quiz/progress", "PATCH", { step: isLast ? step : step + 1, answer: { questionId: question.id, value: v } });
    // Move on by itself after a short pause, except on the last question.
    if (!isLast) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => setStep((s) => s + 1), 350);
    }
  }

  function handleNext() {
    if (!canGoNext) return;
    if (isLast) {
      setSubmitError(null);
      dialogRef.current?.showModal();
    } else {
      goTo(step + 1);
    }
  }

  async function submit() {
    if (!userGroup || !allAnswered) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await saveQueue.current;
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGroup, answers }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      dialogRef.current?.close();
      router.push("/result");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  const firstUnanswered = questions.findIndex((q) => !answers[q.id]);

  return (
    <>
      <QuizHeading step={step} />

      <section
        aria-labelledby={titleId}
        className="relative mx-auto mt-6 w-full max-w-[880px] overflow-hidden rounded-[36px] border-[3px] border-white px-5 pb-6 pt-6 shadow-[0_14px_38px_rgba(107,123,188,0.12)] sm:px-[38px] sm:pb-[26px] sm:pt-7"
        style={{
          backgroundImage:
            "linear-gradient(137deg, #ffffff 0%, #fff8f0 16%, #fffdfa 37%, #f7f5ff 56%, #fff4fa 71%)",
        }}
      >
        <Image
          unoptimized
          src="/decor/card-reflections.svg"
          alt=""
          aria-hidden
          width={880}
          height={610}
          className="pointer-events-none absolute inset-0 h-full w-full max-w-none"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <p className="whitespace-nowrap text-base font-bold">{question ? `ข้อ ${step} จาก ${total}` : "ก่อนเริ่มแบบทดสอบ"}</p>
            <p className="ml-auto text-right text-sm text-[#7d89af]">
              {question ? `ตอบแล้ว ${answered} ข้อ` : <span className="hidden sm:inline">ทั้งหมด {total} ข้อ ใช้เวลาประมาณ 5–7 นาที</span>}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="ความคืบหน้า"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answered}
            className="mt-1 h-2 rounded-lg bg-[#e9ebf7]"
          >
            <div
              className="h-2 rounded-lg bg-[#f6a4cd] transition-[width] duration-300"
              style={{ width: `${Math.max(answered / total, 0.02) * 100}%` }}
            />
          </div>

          {question ? (
            <>
              <p className="mt-6 text-center text-sm font-bold text-violet">ข้อความนี้ตรงกับคุณแค่ไหน?</p>
              <h2 id={titleId} className="mx-auto mt-1 min-h-[84px] max-w-[640px] text-balance text-center text-[24px] font-bold leading-normal sm:text-[30px]">
                {question.text}
              </h2>
              <div className="mt-5">
                <ScaleChoice key={question.id} question={question} value={answers[question.id]} onChange={choose} labelledBy={titleId} />
              </div>
              <p aria-hidden className="mt-2 flex justify-between px-1 text-xs text-[#7d89af]">
                <span>← น้อยที่สุด</span>
                <span>มากที่สุด →</span>
              </p>
            </>
          ) : (
            <>
              <h2 id={titleId} className="mt-5 text-balance text-center text-[22px] font-bold leading-normal sm:whitespace-pre-line sm:text-[28px]">
                {"ก่อนเริ่ม บอกเราหน่อย\nตอนนี้คุณอยู่ในช่วงไหนของเส้นทาง?"}
              </h2>
              <p className="mt-1 text-center text-[15px] text-[#7d89af]">เลือก 1 ข้อ เพื่อให้คำแนะนำตรงกับคุณมากขึ้น</p>
              <div className="mt-[18px]">
                <GroupChoice value={userGroup} onChange={setUserGroup} labelledBy={titleId} />
              </div>
            </>
          )}

          <div className="mt-[22px] flex items-center gap-3">
            {step === 0 ? (
              <Link href="/" className="py-3 text-base hover:text-dream">
                ←&nbsp;&nbsp;กลับหน้าแรก
              </Link>
            ) : (
              <button type="button" onClick={() => goTo(step - 1)} className="cursor-pointer py-3 text-base hover:text-dream">
                ←&nbsp;&nbsp;{step === 1 ? "ย้อนกลับ" : "ข้อก่อนหน้า"}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="ml-auto cursor-pointer whitespace-nowrap rounded-[30px] bg-[#f6a0ce] px-7 py-[13px] text-lg font-bold text-white transition hover:bg-blush-deep disabled:cursor-not-allowed disabled:bg-[#f5d5e9] disabled:text-[#ad8da6]"
            >
              {isLast ? "ส่งคำตอบ  ✓" : "ถัดไป  →"}
            </button>
          </div>
          <p className="mt-1 text-center text-[13px] text-[#7d89af]">ไม่มีคำตอบถูกหรือผิด แค่ตอบในแบบที่เป็นคุณ ♡</p>
        </div>
      </section>

      <ConsentDialog
        ref={consentRef}
        userGroup={userGroup}
        onAccept={acceptConsent}
        onDecline={() => {
          consentRef.current?.close();
          router.push("/");
        }}
      />

      <dialog
        ref={dialogRef}
        aria-labelledby={`${titleId}-confirm`}
        className="m-auto w-[min(92vw,480px)] rounded-[32px] border-[3px] border-white bg-paper p-0 text-navy shadow-[0_20px_50px_rgba(52,90,158,0.25)] backdrop:bg-[#2f3d7c]/30 backdrop:backdrop-blur-[2px]"
      >
        <div className="px-7 pb-7 pt-8 text-center">
          <p className="text-4xl" aria-hidden>
            {allAnswered ? "✨" : "📝"}
          </p>
          <h2 id={`${titleId}-confirm`} className="mt-2 text-2xl font-bold leading-normal">
            {allAnswered ? "พร้อมส่งคำตอบแล้วใช่ไหม?" : "ยังตอบไม่ครบ"}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            {allAnswered ? (
              <>
                คุณตอบครบ {total} ข้อแล้ว ส่งแล้วเราจะคำนวณผลลัพธ์ให้ทันที
                {hasPreviousResult && (
                  <>
                    <br />
                    ผลลัพธ์ครั้งก่อนจะถูกแทนที่ด้วยผลลัพธ์ใหม่
                  </>
                )}
              </>
            ) : (
              <>ยังเหลืออีก {total - answered} ข้อ กลับไปตอบให้ครบก่อนส่งนะ</>
            )}
          </p>
          {submitError && (
            <p role="alert" className="mt-3 rounded-2xl bg-[#fdeef5] px-4 py-2 text-sm text-[#b04b82]">
              ส่งคำตอบไม่สำเร็จ: {submitError}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            {allAnswered ? (
              <>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="cursor-pointer rounded-[30px] border border-[#d6cae8] bg-white px-6 py-3 font-bold text-violet hover:bg-[#f7f4ff]"
                >
                  ตรวจทานคำตอบ
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="cursor-pointer rounded-[30px] bg-[#f6a0ce] px-6 py-3 font-bold text-white hover:bg-blush-deep disabled:cursor-wait disabled:opacity-70"
                >
                  {submitting ? "กำลังคำนวณผล…" : "ส่งและดูผลลัพธ์  →"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  dialogRef.current?.close();
                  if (firstUnanswered >= 0) goTo(firstUnanswered + 1);
                }}
                className="cursor-pointer rounded-[30px] bg-[#f6a0ce] px-6 py-3 font-bold text-white hover:bg-blush-deep"
              >
                ไปข้อที่ยังไม่ได้ตอบ
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
