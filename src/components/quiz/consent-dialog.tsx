"use client";

import Link from "next/link";
import { useId, useState, type RefObject } from "react";
import type { UserGroup } from "@/lib/riasec/types";

const checkbox = "mt-1 size-[18px] shrink-0 cursor-pointer accent-[#f6a0ce]";

/**
 * PDPA consent, shown before the quiz stores anything (POST /api/quiz/start).
 * Students (high school, and first-year university students who may be 18–19)
 * also confirm they are 20 or older or that a guardian agreed.
 */
export function ConsentDialog({
  ref,
  userGroup,
  onAccept,
  onDecline,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  userGroup: UserGroup | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const titleId = useId();
  const [agreed, setAgreed] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const minor = userGroup === "high_school" || userGroup === "university";
  const canAccept = agreed && (!minor || guardian);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="m-auto max-h-[92dvh] w-[min(92vw,540px)] overflow-y-auto rounded-[32px] border-[3px] border-white bg-paper p-0 text-navy shadow-[0_20px_50px_rgba(52,90,158,0.25)] backdrop:bg-[#2f3d7c]/30 backdrop:backdrop-blur-[2px]"
    >
      <div className="px-6 pb-7 pt-8 sm:px-8">
        <p className="text-center text-4xl" aria-hidden>
          🎒
        </p>
        <h2 id={titleId} className="mt-2 text-center text-2xl font-bold leading-normal">
          ก่อนเริ่มออกเดินทาง
        </h2>
        <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-muted">
          <p>
            Click your dream จะเก็บกลุ่มที่คุณเลือก คำตอบทั้ง 42 ข้อ และผลคะแนนความสนใจของคุณ
            เพื่อบันทึกความคืบหน้า แสดงผลลัพธ์ และแนะนำอาชีพกับสาขาที่เหมาะกับคุณ
          </p>
          <p>
            คุณไม่ต้องสมัครสมาชิก เราไม่ขอชื่อ อีเมล หรือเบอร์โทร ระบบจะจำคุณผ่านคุกกี้ในเบราว์เซอร์เท่านั้น
            ผลบนเว็บไม่ได้ตัดสินแทนคุณ ใช้เป็นแนวทางสำรวจตัวเองเท่านั้น
          </p>
          <p>
            คุณขอลบข้อมูลหรือถอนความยินยอมได้ทุกเมื่อ อ่านรายละเอียดใน{" "}
            <Link href="/privacy" target="_blank" className="font-bold text-violet underline underline-offset-2 hover:text-navy">
              ประกาศความเป็นส่วนตัว
            </Link>
          </p>
        </div>

        {minor && (
          <p className="mt-4 rounded-2xl bg-[#fff6fb] px-4 py-3 text-[15px] leading-relaxed text-[#9a4f78]">
            ถ้าคุณอายุต่ำกว่า 20 ปี ชวนผู้ปกครองอ่านข้อความนี้ด้วยกันก่อนกดยินยอม
            แบบทดสอบนี้เก็บเฉพาะคำตอบและผล ไม่เก็บชื่อหรือช่องทางติดต่อใด ๆ
          </p>
        )}

        <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
          <label className="flex cursor-pointer gap-3">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className={checkbox} />
            <span>ฉันอ่านและยินยอมให้ Click your dream เก็บและใช้คำตอบและผลแบบทดสอบของฉันตามประกาศความเป็นส่วนตัว (จำเป็น)</span>
          </label>
          {minor && (
            <label className="flex cursor-pointer gap-3">
              <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} className={checkbox} />
              <span>ฉันอายุ 20 ปีขึ้นไป หรือผู้ปกครองของฉันได้อ่านและยินยอมตามประกาศความเป็นส่วนตัวแล้ว (จำเป็น)</span>
            </label>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onDecline}
            className="cursor-pointer rounded-[30px] border border-[#d6cae8] bg-white px-6 py-3 font-bold text-violet hover:bg-[#f7f4ff]"
          >
            ไว้ทีหลัง
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!canAccept}
            className="cursor-pointer rounded-[30px] bg-[#f6a0ce] px-6 py-3 font-bold text-white hover:bg-blush-deep disabled:cursor-not-allowed disabled:bg-[#f5d5e9] disabled:text-[#ad8da6]"
          >
            ยินยอมและเริ่มเลย  →
          </button>
        </div>
      </div>
    </dialog>
  );
}
