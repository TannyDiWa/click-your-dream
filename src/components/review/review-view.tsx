"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ResultDetails } from "@/components/result/result-view";
import type { QuizResult, ResultExplanation, ResultProfile } from "@/lib/riasec/api-types";
import { DIMENSION_LABELS } from "@/lib/riasec/profiles";
import { LETTER_TO_TYPE, RIASEC_ORDER, USER_GROUPS, type RiasecLetter, type RiasecType, type UserGroup } from "@/lib/riasec/types";

export type ReviewItem = { code: string; group: UserGroup; explanation: ResultExplanation };

const LETTERS = [..."RIASEC"] as RiasecLetter[];
const STORAGE_KEY = "click-your-dream:reviewed";
// Sample scores for review: the code's letters first, the rest in RIASEC order.
const SAMPLE_SCORES = [86, 74, 62, 41, 33, 25];
const SAMPLE_DATE = "2026-11-02T00:00:00.000Z";

function sampleResult(code: string, group: UserGroup): QuizResult {
  const top3 = [...code].map((l) => LETTER_TO_TYPE[l as RiasecLetter]);
  const ranking: RiasecType[] = [...top3, ...RIASEC_ORDER.filter((t) => !top3.includes(t))];
  const scores = Object.fromEntries(ranking.map((t, i) => [t, SAMPLE_SCORES[i]])) as Record<RiasecType, number>;
  return { scores, ranking, hollandCode: code, topType: ranking[0], userGroup: group, completedAt: SAMPLE_DATE };
}
const panel = "rounded-[30px] border-2 border-white bg-paper shadow-[0_10px_15px_rgba(121,130,184,0.1)]";

const idOf = (item: ReviewItem) => `${item.code}-${item.group}`;
const groupTitle = (g: UserGroup) => USER_GROUPS.find((x) => x.value === g)!.title;

function loadChecked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

/** One explanation at a time, laid out like /result, with a local "checked" list that becomes SQL. */
export function ReviewView({ items }: { items: ReviewItem[] }) {
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [copied, setCopied] = useState(false);
  // result_profiles content by top type, loaded once per type from the real API.
  const [profiles, setProfiles] = useState<Partial<Record<RiasecType, ResultProfile>>>({});
  const [profileError, setProfileError] = useState<string | null>(null);

  // Restore the position from the URL hash (#ERA-university) and the checked list from this browser.
  useEffect(() => {
    const fromHash = items.findIndex((it) => idOf(it) === decodeURIComponent(location.hash.slice(1)));
    // Reading browser-only state after hydration keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromHash >= 0) setIndex(fromHash);
    setChecked(loadChecked());
  }, [items]);

  const item = items[index];
  const go = useCallback(
    (i: number) => {
      const next = (i + items.length) % items.length;
      setIndex(next);
      history.replaceState(null, "", `#${idOf(items[next])}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [items],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, summary, button")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Private mode: keep the list for this visit only.
      }
      return next;
    });
  };

  const letter = item.code[0] as RiasecLetter;
  const codesForLetter = useMemo(() => [...new Set(items.filter((it) => it.code[0] === letter).map((it) => it.code))], [items, letter]);
  const indexOf = (code: string, group: UserGroup) => items.findIndex((it) => it.code === code && it.group === group);
  const result = useMemo(() => sampleResult(item.code, item.group), [item.code, item.group]);
  const profile = profiles[result.topType];
  const isChecked = checked.has(idOf(item));

  useEffect(() => {
    if (profiles[result.topType]) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profiles/${result.topType}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? res.statusText);
        if (!cancelled) setProfiles((p) => ({ ...p, [result.topType]: body }));
      } catch (e) {
        if (!cancelled) setProfileError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profiles, result.topType]);

  const sql = useMemo(() => {
    const pairs = items.filter((it) => checked.has(idOf(it))).map((it) => `('${it.code}', '${it.group}')`);
    if (!pairs.length) return "";
    return `update public.result_explanations set reviewed = true\nwhere (holland_code, user_group) in (\n  ${pairs.join(",\n  ")}\n);`;
  }, [items, checked]);

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-bold text-violet">REVIEW • ตรวจคำอธิบายผลลัพธ์</p>
        <h1 className="mt-1 text-[28px] font-bold leading-normal sm:text-[36px]">ตรวจคำอธิบายทั้ง {items.length} แบบ</h1>
        <p className="mt-0.5 text-base leading-normal sm:text-lg">
          หน้าผลลัพธ์จริงพร้อมคะแนนตัวอย่าง • ตรวจแล้ว <b className="text-violet">{checked.size}</b>/{items.length}
        </p>
      </div>

      {/* Navigator */}
      <section aria-label="เลือกคำอธิบาย" className={`${panel} mt-6 p-4 sm:p-5`}>
        <div className="flex flex-wrap gap-2">
          {LETTERS.map((l) => {
            const done = items.filter((it) => it.code[0] === l && checked.has(idOf(it))).length;
            const total = items.filter((it) => it.code[0] === l).length;
            return (
              <button
                key={l}
                type="button"
                onClick={() => go(items.findIndex((it) => it.code[0] === l))}
                aria-pressed={l === letter}
                className={`cursor-pointer rounded-[16px] px-3.5 py-2 text-sm font-bold transition ${
                  l === letter ? "bg-violet text-white" : "bg-[#e9eeff] text-violet hover:bg-[#dfe5ff]"
                }`}
              >
                {l} {DIMENSION_LABELS[LETTER_TO_TYPE[l]].short}
                <span className="ml-1.5 font-normal opacity-80">
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {codesForLetter.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => go(indexOf(code, item.group))}
                aria-current={code === item.code ? "true" : undefined}
                className={`flex w-full cursor-pointer flex-col items-center gap-1 rounded-[14px] border px-2 py-1.5 text-sm font-bold transition ${
                  code === item.code ? "border-[#f6a0ce] bg-white text-navy" : "border-[#e6e3f5] bg-white/60 text-violet hover:bg-white"
                }`}
              >
                {code}
                <span className="flex gap-1" aria-label={`ตรวจแล้ว ${USER_GROUPS.filter((g) => checked.has(`${code}-${g.value}`)).length} จาก 3 กลุ่ม`}>
                  {USER_GROUPS.map((g) => (
                    <span key={g.value} className={`size-1.5 rounded-full ${checked.has(`${code}-${g.value}`) ? "bg-[#ec7cb5]" : "bg-[#dcd7f2]"}`} />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {USER_GROUPS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => go(indexOf(item.code, g.value))}
              aria-pressed={g.value === item.group}
              className={`cursor-pointer rounded-[16px] px-3.5 py-2 text-sm font-bold transition ${
                g.value === item.group ? "bg-[#f6a0ce] text-white" : "bg-white text-violet hover:bg-[#f7f4ff]"
              }`}
            >
              {checked.has(`${item.code}-${g.value}`) ? "✓ " : ""}
              {g.title}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => go(index - 1)} className="cursor-pointer rounded-[16px] bg-white px-3.5 py-2 text-sm font-bold text-violet hover:bg-[#f7f4ff]">
              ← ก่อนหน้า
            </button>
            <span className="text-sm text-muted">
              {index + 1}/{items.length}
            </span>
            <button type="button" onClick={() => go(index + 1)} className="cursor-pointer rounded-[16px] bg-white px-3.5 py-2 text-sm font-bold text-violet hover:bg-[#f7f4ff]">
              ถัดไป →
            </button>
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-[#e6e3f5] pt-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-[18px] bg-[#e9eeff] px-4 py-2.5 text-[15px] font-bold">
            <input type="checkbox" checked={isChecked} onChange={() => toggle(idOf(item))} className="size-5 cursor-pointer accent-[#ec7cb5]" />
            {item.code} • {groupTitle(item.group)} อ่านแล้ว ใช้ได้
          </label>
          <button
            type="button"
            onClick={() => {
              if (!isChecked) toggle(idOf(item));
              go(index + 1);
            }}
            className="cursor-pointer rounded-[30px] bg-[#f6a0ce] px-6 py-2.5 font-bold text-white hover:bg-blush-deep"
          >
            ผ่าน แล้วไปแบบถัดไป →
          </button>
        </div>
        <p className="mt-2 text-[13px] text-muted">
          คะแนนในกราฟและการ์ดเป็นตัวอย่าง (เรียงตามรหัส) • ใช้ปุ่มลูกศร ← → บนคีย์บอร์ดเพื่อเปลี่ยนแบบได้
        </p>
      </section>

      {profile ? (
        <ResultDetails key={idOf(item)} result={result} profile={profile} explanation={item.explanation} />
      ) : (
        <div className="grid h-[400px] place-items-center text-muted" aria-busy={!profileError}>
          {profileError ? `โหลดข้อมูลโปรไฟล์ไม่สำเร็จ: ${profileError}` : "กำลังโหลด…"}
        </div>
      )}

      <section aria-labelledby="sql-title" className={`${panel} mt-10 p-5 sm:p-6`}>
        <h2 id="sql-title" className="text-xl font-bold leading-normal sm:text-[23px]">
          SQL สำหรับเปิดแสดงแบบที่ตรวจแล้ว ({checked.size})
        </h2>
        {sql ? (
          <>
            <pre className="mt-3 max-h-64 overflow-auto rounded-[18px] bg-[#f4f2fb] p-4 text-[13px] leading-relaxed text-navy">{sql}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(sql);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="cursor-pointer rounded-[30px] bg-violet px-5 py-2.5 text-sm font-bold text-white"
              >
                {copied ? "คัดลอกแล้ว ✓" : "คัดลอก SQL"}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">ยังไม่มีแบบที่ติ๊กว่าใช้ได้</p>
        )}
      </section>
    </>
  );
}
