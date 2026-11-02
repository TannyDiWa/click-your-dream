"use client";

import { useId, useRef, useState } from "react";

/** Deletes everything stored for this browser's guest id (DELETE /api/my-data), after a confirmation. */
export function DeleteMyData() {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "deleting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setStatus("deleting");
    setError(null);
    try {
      const res = await fetch("/api/my-data", { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText);
      setStatus("done");
      dialogRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="mt-4 rounded-2xl bg-[#eaf6ee] px-4 py-3 text-[15px] font-bold text-[#3c7a52]">
        ลบข้อมูลของคุณบนเบราว์เซอร์นี้เรียบร้อยแล้ว
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-4 cursor-pointer rounded-[30px] border border-[#f1b8d6] bg-white px-6 py-3 font-bold text-[#b04b82] hover:bg-[#fff6fb]"
      >
        ลบข้อมูลของฉัน
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,460px)] rounded-[32px] border-[3px] border-white bg-paper p-0 text-navy shadow-[0_20px_50px_rgba(52,90,158,0.25)] backdrop:bg-[#2f3d7c]/30 backdrop:backdrop-blur-[2px]"
      >
        <div className="px-7 pb-7 pt-8 text-center">
          <h2 id={titleId} className="text-2xl font-bold leading-normal">
            ลบข้อมูลทั้งหมดของคุณ?
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            คำตอบ ความคืบหน้า และผลลัพธ์ที่ทำบนเบราว์เซอร์นี้จะถูกลบถาวร และถือเป็นการถอนความยินยอม กู้คืนไม่ได้
          </p>
          {error && (
            <p role="alert" className="mt-3 rounded-2xl bg-[#fdeef5] px-4 py-2 text-sm text-[#b04b82]">
              ลบข้อมูลไม่สำเร็จ: {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-[30px] border border-[#d6cae8] bg-white px-6 py-3 font-bold text-violet hover:bg-[#f7f4ff]"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={status === "deleting"}
              className="cursor-pointer rounded-[30px] bg-[#e0679f] px-6 py-3 font-bold text-white hover:bg-[#c9518a] disabled:cursor-wait disabled:opacity-70"
            >
              {status === "deleting" ? "กำลังลบ…" : "ลบข้อมูล"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
