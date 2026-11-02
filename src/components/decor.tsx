import Image from "next/image";
import type { CSSProperties } from "react";

/** Twinkling pearl sparkle from the Figma "FX / Pearl sparkle" component. */
export function Sparkle({ size, className, style, delay = 0 }: { size: number; className?: string; style?: CSSProperties; delay?: number }) {
  return (
    <Image
      unoptimized
      src="/decor/sparkle.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`twinkle pointer-events-none absolute drop-shadow-[0_0_5px_rgba(255,244,190,0.9)] ${className ?? ""}`}
      style={{ ...style, animationDelay: `${-delay}s` }}
    />
  );
}

/** Dotted dream trail behind the top of content pages (1780×1030, centred on a 1536 design). */
export function DreamTrail() {
  return (
    <Image
      unoptimized
      loading="eager"
      src="/decor/dream-trail.svg"
      alt=""
      aria-hidden
      width={1780}
      height={1030}
      className="pointer-events-none absolute left-1/2 top-0 -ml-[908px] h-[1030px] w-[1780px] max-w-none"
    />
  );
}
