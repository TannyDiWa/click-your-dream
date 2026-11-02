"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Sparkle } from "@/components/decor";
import { CardActions } from "@/components/result/card-actions";
import { FieldUniversities, GroupRecommendations, ScoreDots, TryThisWeek } from "@/components/result/recommendations";
import type { QuizResult, ResultExplanation, ResultProfile } from "@/lib/riasec/api-types";
import { DIMENSION_LABELS } from "@/lib/riasec/profiles";
import { CHARACTERS, USER_GROUPS } from "@/lib/riasec/types";

// Bar colors by rank, from the Figma analysis chart (sixth added for the extra dimension).
const BAR_COLORS = ["#8e8bdd", "#97afe9", "#9ed2d2", "#e9aed4", "#e8c67d", "#c9b8ec"];

const chip = "inline-block rounded-[20px] bg-[#e9eeff] px-[13px] py-1.5 text-sm font-bold text-violet";
const panel = "rounded-[30px] border-2 border-white bg-paper shadow-[0_10px_15px_rgba(121,130,184,0.1)]";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

function EmptyState() {
  return (
    <div className="relative mx-auto mt-8 max-w-[880px]">
      <div
        className="rounded-[32px] border-2 border-white px-5 py-8 text-center shadow-[0_12px_16px_rgba(121,130,184,0.11)] sm:px-10"
        style={{ backgroundImage: "linear-gradient(127deg, #ffffff 0%, #fffcf7 38%, #f8f3ff 77%)" }}
      >
        <Image unoptimized src="/decor/empty-report.svg" alt="" aria-hidden width={180} height={160} className="mx-auto" />
        <h2 className="mt-3 text-[26px] font-bold leading-normal sm:text-[32px]">ยังไม่มีผลลัพธ์ของคุณ</h2>
        <p className="mt-2 text-base leading-normal sm:text-lg">
          การค้นพบตัวเองเริ่มต้นได้ด้วยคำถามเล็ก ๆ
          <br />
          ทำแบบทดสอบ แล้วกลับมาดูแนวทางที่เหมาะกับคุณได้ที่นี่
        </p>
        <Link
          href="/quiz"
          className="mt-5 inline-block rounded-[40px] bg-[#f6a0ce] px-[27px] py-[15px] text-lg font-bold text-white shadow-[0_5px_12px_rgba(230,154,197,0.25)] transition hover:bg-blush-deep"
        >
          เริ่มทำแบบทดสอบ&nbsp;&nbsp;→
        </Link>
        <p className="mt-3 text-sm text-muted">ไม่มีคำตอบถูกหรือผิด แค่ตอบในแบบที่เป็นคุณ</p>
        <ol className="mt-4 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 text-muted">
          <li className={chip}>1&nbsp;&nbsp;ทำแบบทดสอบ</li>
          <li aria-hidden>→</li>
          <li className={chip}>2&nbsp;&nbsp;รู้จักตัวเอง</li>
          <li aria-hidden>→</li>
          <li className={chip}>3&nbsp;&nbsp;สำรวจเส้นทาง</li>
        </ol>
        <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-2 hover:text-dream">
          กลับหน้าแรก
        </Link>
      </div>
      <p className="mt-8 text-center text-[15px]">ไม่ต้องรู้คำตอบทั้งหมดในวันนี้ แค่เริ่มรู้จักตัวเองทีละนิดก็พอ ♡</p>
    </div>
  );
}

/** The full result page body; also used by /review with sample scores. */
export function ResultDetails({
  result,
  profile,
  explanation,
}: {
  result: QuizResult;
  profile: ResultProfile;
  explanation: ResultExplanation | null;
}) {
  const type = result.topType;
  const character = CHARACTERS[type];
  const group = USER_GROUPS.find((g) => g.value === result.userGroup);
  const top3 = result.ranking.slice(0, 3);
  const cardRef = useRef<HTMLElement>(null);

  return (
    <>
      {/* Summary */}
      <section
        aria-labelledby="result-title"
        className="relative mt-8 grid gap-6 rounded-[32px] border-2 border-white p-5 shadow-[0_12px_16px_rgba(121,130,184,0.11)] sm:p-7 lg:grid-cols-[218px_1fr_306px] lg:items-center lg:gap-10"
        style={{ backgroundImage: profile.summaryGradient }}
      >
        <div className="relative mx-auto w-[180px] sm:w-[218px]">
          <Image unoptimized src="/decor/summary-accent.svg" alt="" aria-hidden width={255} height={226} className="absolute left-1/2 top-1/2 w-[117%] max-w-none -translate-x-1/2 -translate-y-1/2" />
          <Image
            src={character.src}
            alt={`${character.nameTh} (${character.letter})`}
            width={character.width}
            height={character.height}
            sizes="218px"
            loading="eager"
            className="relative h-auto w-full object-contain"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-[20px] bg-[#e5f4ee] px-[13px] py-1.5 text-sm font-bold text-violet">✓&nbsp;&nbsp;ทำแบบทดสอบแล้ว</span>
            <span className="text-[13px] text-muted">
              {group?.title} • {formatDate(result.completedAt)}
            </span>
          </div>
          <h2 id="result-title" className="mt-2 text-[26px] font-bold leading-normal sm:text-[30px]">
            คุณคือ...{" "}
            {/* Keep each Thai word whole so names like "นักสำรวจ" never split */}
            {profile.title.split(" ").map((word, i) => (
              <span key={word} className="whitespace-nowrap">
                {i > 0 && " "}
                {word}
              </span>
            ))}
          </h2>
          <p className="mt-1 text-base leading-normal sm:text-lg lg:whitespace-pre-line">{profile.tagline}</p>
          <ul className="mt-3 flex flex-wrap gap-2.5">
            {profile.traits.map((t) => (
              <li key={t} className={chip}>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">{profile.motto}</p>
          {explanation && (
            <p className="mt-4 rounded-[20px] bg-white/70 px-4 py-3 text-[15px] leading-relaxed">
              <b className="text-violet">
                {result.hollandCode} • {explanation.title}
              </b>
              <br />
              {explanation.summary}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-[22px] font-bold leading-normal">จุดเด่นที่ค้นพบ</h3>
          <ol className="mt-3 space-y-3.5">
            {(explanation?.strengths ?? profile.strengths).map((s, i) => (
              <li key={s.title} className="flex items-center gap-3">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-xl bg-[#e5eafe] text-sm font-bold text-violet">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[15px] font-bold leading-normal">{s.title}</span>
                  <span className="block text-[13px] leading-normal text-muted">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_496px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Score chart */}
          <section aria-labelledby="chart-title" className={`${panel} p-5 sm:p-[26px]`}>
            <h2 id="chart-title" className="text-[22px] font-bold leading-normal sm:text-[26px]">
              ภาพรวมการวิเคราะห์ของคุณ
            </h2>
            <p className="mt-1 text-sm text-muted">
              คะแนนจาก 100 • แต่ละด้านประเมินแยกกัน • Holland Code ของคุณคือ <b className="text-violet">{result.hollandCode}</b>
            </p>
            <ul className="mt-6 space-y-[17px]">
              {result.ranking.map((t, i) => (
                <li key={t} className="grid grid-cols-[1fr_44px] items-center gap-x-4 gap-y-1 sm:grid-cols-[190px_1fr_44px]">
                  <span className="col-span-2 text-base font-bold sm:col-span-1">{DIMENSION_LABELS[t].long}</span>
                  <span
                    role="meter"
                    aria-label={DIMENSION_LABELS[t].long}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={result.scores[t]}
                    className="h-3.5 rounded-[9px] bg-[#ebedf7]"
                  >
                    <span
                      className="block h-3.5 rounded-[9px]"
                      style={{ width: `${result.scores[t]}%`, backgroundColor: BAR_COLORS[i] }}
                    />
                  </span>
                  <span className="text-[17px] font-bold text-violet">{result.scores[t]}</span>
                </li>
              ))}
            </ul>
            <div aria-hidden className="mt-3 hidden justify-between text-xs text-muted sm:ml-[206px] sm:mr-[60px] sm:flex">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <p className="mt-4 text-xs text-muted">คำนวณจากคำตอบ 42 ข้อ (ด้านละ 7 ข้อ ถ่วงน้ำหนักตามข้อ) • ใช้เป็นแนวทางสำรวจตัวเอง ไม่ใช่การตัดสิน</p>
          </section>

          {explanation ? (
            <TryThisWeek tasks={explanation.tryThisWeek} />
          ) : (
            // Next steps for the top type (no reviewed explanation yet)
            <section aria-labelledby="next-title" className={`${panel} p-5 sm:p-6`}>
              <h2 id="next-title" className="text-xl font-bold leading-normal sm:text-[23px]">
                จุดเด่นของคุณ ต่อยอดเป็นอะไรได้บ้าง?
              </h2>
              <p className="mt-2 text-base leading-normal xl:whitespace-pre-line">{profile.nextSteps}</p>
              <ul className="mt-3 flex flex-wrap gap-2.5">
                {profile.activities.map((a) => (
                  <li key={a} className={chip}>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Dream card */}
        <div className="flex flex-col items-center">
          <article
            ref={cardRef}
            aria-label={`การ์ดความฝัน: ${profile.title}`}
            className="relative w-full max-w-[496px] overflow-hidden rounded-[32px] border-[3px] border-white px-[27px] pb-5 pt-[19px]"
            style={{ backgroundImage: profile.cardGradient }}
          >
            <Image unoptimized src="/decor/card-accent-top.svg" alt="" aria-hidden width={265} height={269} className="absolute left-[54%] top-[98px] max-w-none" />
            <Image unoptimized src="/decor/card-accent-bottom.svg" alt="" aria-hidden width={420} height={256} className="absolute -left-[93px] top-[436px] max-w-none" />
            <Sparkle size={29} className="right-[38px] top-[41px]" delay={0} />
            <Sparkle size={28} className="right-[28px] top-[346px]" delay={1.2} />

            <div className="relative">
              <p className="font-hand text-[28px] leading-normal">Click your dream</p>
              <p className="text-[13px] font-bold text-violet">MY DREAM CARD</p>
              <div className="mt-3 grid grid-cols-[1fr_44%] items-start gap-2">
                <div>
                  <p className="text-[30px] font-bold leading-normal sm:text-[39.5px]">
                    {profile.cardTitle[0]}
                    <br />
                    {profile.cardTitle[1]}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-[15px] leading-normal sm:text-base">{profile.cardTraits}</p>
                  <p
                    aria-label={`Holland code ${result.hollandCode}`}
                    className="mt-4 inline-block rounded-[16px] bg-white/80 py-2 pl-4 pr-[calc(1rem-0.16em)] text-[28px] font-bold leading-none tracking-[0.16em] sm:text-[32px]"
                  >
                    {result.hollandCode}
                  </p>
                </div>
                <Image
                  src={character.src}
                  alt=""
                  width={character.width}
                  height={character.height}
                  sizes="184px"
                  loading="eager"
                  className="mt-4 h-auto w-full max-w-[184px] justify-self-end object-contain"
                />
              </div>
              <div className="mt-5 h-px bg-[#c7c2e8]" />
              <div className="mt-5 flex max-w-[300px] flex-col gap-1.5 rounded-[18px] bg-white px-4 py-3">
                {top3.map((t) => (
                  <ScoreDots key={t} label={DIMENSION_LABELS[t].short} score={result.scores[t]} />
                ))}
              </div>
              <p className="mt-4 text-sm">{profile.motto}</p>
              <p className="mt-6 text-[11px] text-muted">
                {formatDate(result.completedAt)} • Click your dream
              </p>
            </div>
          </article>
          <CardActions cardRef={cardRef} fileName={`click-your-dream-${result.hollandCode}.png`} />
        </div>
      </div>

      {explanation && (
        <GroupRecommendations className="mt-10" group={result.userGroup} top3={top3} explanation={explanation} />
      )}

      {/* Universities: for high school students choosing where to apply. With an explanation:
          one card per recommended field; otherwise the top type's sample universities. */}
      {result.userGroup === "high_school" && explanation?.guidance.some((g) => g.programs?.length) ? (
        <FieldUniversities fields={explanation.guidance} />
      ) : result.userGroup === "high_school" && (
        <section aria-labelledby="uni-title" className="mt-12">
          <h2 id="uni-title" className="text-2xl font-bold leading-normal sm:text-[28px]">
            มหาวิทยาลัยที่เปิดสาขาที่คุณสนใจ
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            สาขาตัวอย่าง: {profile.field}&nbsp;&nbsp;•&nbsp;&nbsp;เปิดดูรายละเอียดจากเว็บไซต์มหาวิทยาลัยโดยตรง
          </p>
          <ul className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profile.universities.map((u) => (
              <li key={u.url}>
                <a
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full flex-col gap-[9px] rounded-[26px] border-2 border-white bg-paper px-6 py-[23px] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(121,130,184,0.15)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7eafb] text-[13px] font-bold text-violet">
                      {u.code}
                    </span>
                    <span className="text-[17px] font-bold leading-normal">{u.name}</span>
                  </span>
                  <span className="text-[13px] font-bold text-violet">{u.faculty}</span>
                  <span className="text-sm">{u.program}</span>
                  <span className="mt-auto pt-2 text-base font-bold underline underline-offset-2">ดูหลักสูตรและรายละเอียด&nbsp;&nbsp;↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-muted">
            สำรวจหลักสูตรและเกณฑ์รับสมัครล่าสุดจากแต่ละมหาวิทยาลัย • รายการนี้เป็นตัวอย่างในสาขา{profile.field}
          </p>
        </section>
      )}

      <div className="mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-[15px]">ผลลัพธ์คือจุดเริ่มต้น เส้นทางของคุณยังเติบโตและเปลี่ยนแปลงได้เสมอ ♡</p>
        <Link
          href="/quiz"
          className="whitespace-nowrap rounded-[35px] border border-[#d6cae8] bg-white px-[26px] py-4 text-lg font-bold text-violet transition hover:bg-[#f7f4ff]"
        >
          ทำแบบทดสอบอีกครั้ง&nbsp;&nbsp;↻
        </Link>
      </div>
    </>
  );
}

/**
 * Fetches the result content for the top type and the pre-generated explanation
 * for the Holland code and group, then shows the result. Without a reviewed
 * explanation (or if it fails to load) the page falls back to the top type only.
 */
function ProfileLoader({ result }: { result: QuizResult }) {
  const key = `${result.topType}|${result.hollandCode}|${result.userGroup}`;
  const [state, setState] = useState<{
    key: string;
    profile?: ResultProfile;
    explanation?: ResultExplanation | null;
    error?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadExplanation = async () => {
      try {
        const res = await fetch(`/api/explanations/${result.hollandCode}?group=${result.userGroup}`);
        if (!res.ok) return null;
        return ((await res.json()).explanation ?? null) as ResultExplanation | null;
      } catch {
        return null;
      }
    };
    (async () => {
      try {
        const [res, explanation] = await Promise.all([fetch(`/api/profiles/${result.topType}`), loadExplanation()]);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? res.statusText);
        if (!cancelled) setState({ key, profile: body, explanation });
      } catch (e) {
        if (!cancelled) setState({ key, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, result.topType, result.hollandCode, result.userGroup, attempt]);

  if (state?.key === key && state.profile) {
    return <ResultDetails result={result} profile={state.profile} explanation={state.explanation ?? null} />;
  }
  if (state?.key === key && state.error) {
    return (
      <div role="alert" className="mx-auto mt-8 max-w-[880px] rounded-[32px] border-2 border-white bg-paper p-8 text-center">
        <p className="text-xl font-bold">โหลดผลลัพธ์ไม่สำเร็จ</p>
        <p className="mt-2 text-sm text-muted">{state.error}</p>
        <button
          type="button"
          onClick={() => {
            setState(null);
            setAttempt((a) => a + 1);
          }}
          className="mt-5 cursor-pointer rounded-[30px] bg-[#f6a0ce] px-6 py-3 font-bold text-white hover:bg-blush-deep"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }
  return (
    <div className="grid h-[600px] place-items-center text-muted" aria-busy="true">
      กำลังโหลดผลลัพธ์…
    </div>
  );
}

export function ResultView() {
  // undefined = still loading, null = no result yet
  const [result, setResult] = useState<QuizResult | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/result");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? res.statusText);
        if (!cancelled) setResult(body.result);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const hasResult = Boolean(result);

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-bold text-violet">{hasResult ? "YOUR DREAM RESULTS" : "MY DREAM PROFILE"}</p>
        <h1 className="mt-1 text-[28px] font-bold leading-normal sm:text-[36px]">
          {hasResult ? "นี่คือผลการค้นพบตัวเองของคุณ" : "ผลลัพธ์ของฉัน"}
        </h1>
        <p className="mt-0.5 text-base leading-normal sm:text-lg">
          {hasResult
            ? "รู้จักจุดเด่น เก็บการ์ดความฝัน แล้วสำรวจสาขาและมหาวิทยาลัยที่สนใจ"
            : "พื้นที่เล็ก ๆ สำหรับเก็บการค้นพบตัวเอง และเส้นทางความฝันของคุณ"}
        </p>
      </div>
      {loadError ? (
        <div role="alert" className="mx-auto mt-8 max-w-[880px] rounded-[32px] border-2 border-white bg-paper p-8 text-center">
          <p className="text-xl font-bold">โหลดผลลัพธ์ไม่สำเร็จ</p>
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
      ) : result === undefined ? (
        <div className="h-[600px]" aria-busy="true" />
      ) : result ? (
        <ProfileLoader result={result} />
      ) : (
        <EmptyState />
      )}
    </>
  );
}
