import { useId, type CSSProperties } from "react";

type Puff = [cx: number, cy: number, r: number];

// Puff layouts drawn in a 200×100 box; the flat bottom sits at y≈92.
const SHAPES: Record<"wide" | "tall" | "small", Puff[]> = {
  wide: [
    [38, 70, 22], [68, 52, 30], [104, 44, 34], [140, 56, 28], [168, 70, 20],
    [86, 74, 20], [124, 74, 20],
  ],
  tall: [
    [46, 70, 22], [78, 46, 32], [116, 36, 34], [150, 58, 28], [100, 72, 22],
  ],
  small: [
    [62, 72, 18], [90, 56, 24], [122, 60, 22], [146, 74, 16], [104, 76, 16],
  ],
};

type CloudProps = {
  shape?: keyof typeof SHAPES;
  className?: string;
  style?: CSSProperties;
};

/** A puffy cartoon cloud: white on top, fading to soft lavender underneath. */
export function Cloud({ shape = "wide", className, style }: CloudProps) {
  const id = useId();
  const puffs = SHAPES[shape];
  return (
    <svg
      viewBox="0 0 200 100"
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={style}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7e8fb" />
        </linearGradient>
        <clipPath id={`${id}-base`}>
          <rect width="200" height="92" />
        </clipPath>
      </defs>
      {/* soft shadow layer */}
      <g fill="#cfd6f3" opacity="0.45" clipPath={`url(#${id}-base)`} transform="translate(0 3)">
        {puffs.map(([cx, cy, r]) => (
          <circle key={`s${cx}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g fill={`url(#${id}-fill)`} clipPath={`url(#${id}-base)`}>
        {puffs.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  );
}
