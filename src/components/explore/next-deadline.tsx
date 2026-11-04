"use client";

import { useSyncExternalStore } from "react";
import { MILESTONES } from "@/lib/tcas/calendar";
import { thaiRange } from "@/lib/tcas/subjects";

// Today in Thailand as "YYYY-MM-DD"; null while prerendering, so the banner never shows a stale date.
const noSubscribe = () => () => {};
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
const notOnServer = () => null;

/** The next (or current) TCAS70 milestone, from today's date. */
export function NextDeadline() {
  const now = useSyncExternalStore(noSubscribe, today, notOnServer);
  const next = now ? MILESTONES.find((m) => m.to >= now) : MILESTONES[0];
  const current = Boolean(now && next && next.from <= now);

  return (
    <div className="mt-7 flex flex-col gap-3 rounded-[28px] border border-white bg-[#fff4d8] px-6 py-4 shadow-[0_10px_30px_rgba(123,135,184,0.1)] sm:flex-row sm:items-center sm:gap-8">
      {next ? (
        <>
          <div className="sm:w-[290px] sm:shrink-0">
            <p className="text-[13px] font-bold text-[#c0790f]">{current ? "กำลังเปิดอยู่ตอนนี้" : "กำหนดการถัดไป"}</p>
            <p className="text-[21px] font-bold leading-normal sm:text-[23px]">{thaiRange(next.from, next.to)}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-normal sm:text-xl">{next.title}</p>
            <p className="text-[15px] leading-normal">{next.detail}</p>
          </div>
          {next.link && (
            <a
              href={next.link.href}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[17px] font-bold text-violet underline underline-offset-4 hover:text-navy"
            >
              {next.link.label}&nbsp;↗
            </a>
          )}
        </>
      ) : (
        <p className="text-lg font-bold">กำหนดการ TCAS70 ส่วนกลางผ่านไปครบแล้ว • ติดตามปฏิทิน TCAS ปีถัดไปที่ myTCAS</p>
      )}
    </div>
  );
}
