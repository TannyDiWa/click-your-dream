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

const SEEDS = { wide: 3, tall: 7, small: 11 };

type CloudProps = {
  shape?: keyof typeof SHAPES;
  className?: string;
  style?: CSSProperties;
};

function Puffs({ puffs, scale = 1, lift = 0, base = false }: { puffs: Puff[]; scale?: number; lift?: number; base?: boolean }) {
  const left = Math.min(...puffs.map(([cx, , r]) => cx - r));
  const right = Math.max(...puffs.map(([cx, , r]) => cx + r));
  return (
    <>
      {puffs.map(([cx, cy, r]) => (
        <circle key={cx} cx={cx} cy={cy - r * lift} r={r * scale} />
      ))}
      {/* a wide, flat ellipse evens out the underside so it fades instead of ending in bumps */}
      {base && <ellipse cx={(left + right) / 2} cy={82} rx={(right - left) / 2 - 6} ry={11} />}
    </>
  );
}

/**
 * A soft, slightly realistic cloud: noise-roughened edges, a light blur,
 * bright tops and a lavender underside.
 */
export function Cloud({ shape = "wide", className, style }: CloudProps) {
  const id = useId();
  const puffs = SHAPES[shape];
  return (
    <svg
      viewBox="0 0 200 100"
      aria-hidden
      overflow="visible"
      className={`pointer-events-none ${className ?? ""}`}
      style={style}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.3" stopColor="#ffffff" />
          <stop offset="0.75" stopColor="#eef0fb" />
          <stop offset="1" stopColor="#d9ddf5" />
        </linearGradient>
        <filter id={`${id}-fluff`} x="-15%" y="-25%" width="130%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={SEEDS[shape]} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feGaussianBlur in="rough" stdDeviation="1.4" />
        </filter>
        <filter id={`${id}-soft`} x="-25%" y="-40%" width="150%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* soft shadow under the cloud */}
      <g fill="#c3cbee" opacity="0.5" filter={`url(#${id}-soft)`} transform="translate(0 5)">
        <Puffs puffs={puffs} base />
      </g>
      {/* body */}
      <g fill={`url(#${id}-body)`} filter={`url(#${id}-fluff)`}>
        <Puffs puffs={puffs} base />
      </g>
      {/* sunlit tops */}
      <g fill="#ffffff" opacity="0.85" filter={`url(#${id}-soft)`}>
        <Puffs puffs={puffs} scale={0.62} lift={0.3} />
      </g>
    </svg>
  );
}

type DriftingCloudProps = CloudProps & {
  /** Seconds to cross the screen once. */
  duration: number;
  /** Seconds into the loop to start at, so clouds begin spread out. */
  offset: number;
};

/** A cloud that drifts left to right across its (overflow-hidden) parent, looping forever. */
export function DriftingCloud({ shape, className, style, duration, offset }: DriftingCloudProps) {
  return (
    <div
      aria-hidden
      className={`drift pointer-events-none absolute left-0 ${className ?? ""}`}
      style={{ ...style, animationDuration: `${duration}s`, animationDelay: `${-offset}s` }}
    >
      <Cloud shape={shape} className="block h-auto w-full" />
    </div>
  );
}
