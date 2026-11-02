"use client";

import { useState, useSyncExternalStore, type RefObject } from "react";
import { ShareIcon } from "@/components/icons";

const button =
  "cursor-pointer whitespace-nowrap rounded-[35px] px-5 py-3 text-base font-bold sm:px-6 sm:py-3.5 sm:text-lg transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70";

/** Renders the dream card to a PNG file at 3× for sharp posts. */
async function cardToFile(card: HTMLElement, fileName: string) {
  // Loaded on click only, so the result page stays light.
  const { domToBlob } = await import("modern-screenshot");
  // The card's decorations are lazy images; load them now, or the capture waits for its timeout.
  const images = [...card.querySelectorAll("img")];
  for (const img of images) img.loading = "eager";
  await Promise.all([document.fonts.ready, ...images.map((img) => img.decode().catch(() => {}))]);
  const blob = await domToBlob(card, { scale: 3, type: "image/png", timeout: 8000 });
  return new File([blob], fileName, { type: "image/png" });
}

// Whether the browser can share image files; false while rendering on the server.
const noSubscribe = () => () => {};
const canShareFiles = () => Boolean(navigator.canShare?.({ files: [new File([""], "card.png", { type: "image/png" })] }));
const notOnServer = () => false;

/**
 * Download and share buttons for the dream card. Share appears only where the browser can
 * share image files (the system share sheet: LINE, Instagram, Photos, …).
 */
export function CardActions({ cardRef, fileName }: { cardRef: RefObject<HTMLElement | null>; fileName: string }) {
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [error, setError] = useState(false);
  const canShare = useSyncExternalStore(noSubscribe, canShareFiles, notOnServer);

  async function run(action: "download" | "share") {
    const card = cardRef.current;
    if (!card) return;
    setBusy(action);
    setError(false);
    try {
      const file = await cardToFile(card, fileName);
      if (action === "share") {
        try {
          await navigator.share({ files: [file], title: "การ์ดความฝันของฉัน — Click your dream" });
        } catch (e) {
          // Closing the share sheet is not an error.
          if (!(e instanceof DOMException && e.name === "AbortError")) throw e;
        }
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      console.error(`Could not ${action} the dream card`, e);
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => run("download")}
          disabled={busy !== null}
          className={`${button} bg-[#f6a0ce] text-white hover:bg-blush-deep`}
        >
          {busy === "download" ? "กำลังสร้างรูป…" : "↓  ดาวน์โหลดรูป"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => run("share")}
            disabled={busy !== null}
            className={`${button} inline-flex items-center gap-2 border-2 border-[#f6a0ce] bg-white text-[#c75d97] hover:bg-[#fff6fb]`}
          >
            {busy === "share" ? (
              "กำลังสร้างรูป…"
            ) : (
              <>
                <ShareIcon className="size-5" strokeWidth={2.2} />
                แชร์การ์ด
              </>
            )}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-center text-[13px] text-[#b04b82]">
          สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง หรือแคปหน้าจอการ์ดแทน
        </p>
      ) : (
        <p className="mt-2 text-center text-[13px] text-muted">เก็บการ์ดไว้เป็นแรงบันดาลใจ หรือแชร์ให้เพื่อนดู</p>
      )}
    </>
  );
}
