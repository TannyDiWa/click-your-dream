"use client";

import type { ReactNode } from "react";

/** Button that scrolls the page back to the top (instantly when the user prefers reduced motion). */
export function ScrollToTopButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      {children}
    </button>
  );
}
