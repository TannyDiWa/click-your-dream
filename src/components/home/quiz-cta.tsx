"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon, StarIcon } from "@/components/icons";
import type { QuizState } from "@/lib/riasec/api-types";

/** Home page quiz button: "continue" when the visitor has an unfinished quiz, with a link to start over. */
export function QuizCta() {
  const router = useRouter();
  const [inProgress, setInProgress] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/quiz");
        if (!res.ok) return;
        const state: QuizState = await res.json();
        if (!cancelled) setInProgress(state.progress !== null);
      } catch {
        // Keep the plain "start" button.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function startOver() {
    setResetting(true);
    try {
      await fetch("/api/quiz", { method: "DELETE" });
    } finally {
      router.push("/quiz");
    }
  }

  return (
    <>
      <Link
        href="/quiz"
        className="group mt-7 inline-flex items-center gap-3 whitespace-nowrap rounded-full border-2 border-dream/70 bg-blush px-6 py-3 text-lg font-semibold text-white shadow-[0_6px_0_#d36aa3] transition hover:-translate-y-0.5 hover:bg-blush-deep active:translate-y-1 active:shadow-[0_2px_0_#d36aa3] sm:gap-4 sm:px-8 sm:py-3.5 sm:text-2xl"
      >
        <StarIcon className="size-5 fill-sun stroke-white sm:size-6" strokeWidth={1.5} />
        {inProgress ? "ทำแบบทดสอบต่อ" : "เริ่มทำแบบทดสอบ"}
        <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1 sm:size-6" />
      </Link>
      {inProgress && (
        <button
          type="button"
          onClick={startOver}
          disabled={resetting}
          className="mt-4 cursor-pointer text-sm underline underline-offset-4 transition-colors hover:text-dream disabled:cursor-wait disabled:opacity-60 sm:text-base"
        >
          ต้องการเริ่มแบบทดสอบใหม่? (กดที่นี่)
        </button>
      )}
    </>
  );
}
