import type { CSSProperties } from "react";
import Image from "next/image";
import { Cloud, DriftingCloud } from "@/components/clouds";
import { QuizCta } from "@/components/home/quiz-cta";
import { StarIcon } from "@/components/icons";
import { CHARACTERS, type RiasecType } from "@/lib/riasec/types";

type Placement = {
  type: RiasecType;
  className: string; // position inside the side column (xl layout)
  width: number;
  label?: { text: [string, string]; className: string };
  delay: string;
};

const LEFT: Placement[] = [
  {
    type: "conventional",
    className: "left-0 top-0",
    width: 140,
    label: { text: ["Your", "Interest"], className: "left-[150px] top-[40px]" },
    delay: "0s",
  },
  { type: "social", className: "left-[170px] top-[150px]", width: 130, delay: "-1.3s" },
  {
    type: "realistic",
    className: "left-[30px] top-[290px]",
    width: 135,
    label: { text: ["Your", "Ability"], className: "left-0 top-[215px]" },
    delay: "-2.6s",
  },
];

const RIGHT: Placement[] = [
  {
    type: "investigative",
    className: "right-[100px] top-0",
    width: 145,
    label: { text: ["Your", "Passion"], className: "right-0 top-[40px]" },
    delay: "-0.7s",
  },
  { type: "artistic", className: "right-0 top-[175px]", width: 115, delay: "-2s" },
  {
    type: "enterprising",
    className: "right-[150px] top-[255px]",
    width: 140,
    label: { text: ["Your", "Future"], className: "right-[300px] top-[270px]" },
    delay: "-3.2s",
  },
];

function Mascot({
  type,
  sizes,
  className,
  style,
}: {
  type: RiasecType;
  sizes: string;
  className: string;
  style?: CSSProperties;
}) {
  const c = CHARACTERS[type];
  return (
    <Image
      src={c.src}
      alt={`${c.nameTh} (${c.letter})`}
      width={c.width}
      height={c.height}
      sizes={sizes}
      loading="eager"
      className={`bob h-auto drop-shadow-[0_6px_10px_#2f3d7c22] ${className}`}
      style={style}
    />
  );
}

/** Desktop (xl+): the free-floating composition from the Figma design. */
function SideColumnWide({ items }: { items: Placement[] }) {
  return (
    <div className="relative hidden h-[480px] xl:block">
      {items.map((p) => (
        <div key={p.type}>
          <div className={`absolute ${p.className}`}>
            <Mascot
              type={p.type}
              sizes="150px"
              className=""
              style={{ width: p.width, animationDelay: p.delay }}
            />
          </div>
          {p.label && (
            <p className={`absolute text-sm leading-snug ${p.label.className}`}>
              {p.label.text[0]}
              <br />
              {p.label.text[1]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Tablet / small laptop (md–xl): three mascots stacked in a zigzag beside the title. */
function SideColumnCompact({ items, side }: { items: Placement[]; side: "left" | "right" }) {
  const zig = side === "left" ? ["-translate-x-3", "translate-x-6", "-translate-x-1"] : ["translate-x-3", "-translate-x-6", "translate-x-1"];
  return (
    <div className="hidden flex-col items-center gap-1 md:flex xl:hidden">
      {items.map((p, i) => (
        <Mascot
          key={p.type}
          type={p.type}
          sizes="130px"
          className={`w-[92px] lg:w-[124px] ${zig[i]}`}
          style={{ animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}

const SPARKLES = [
  "left-[3%] top-[14%] size-4",
  "left-[27%] top-[20%] size-3 hidden sm:block",
  "left-[48%] top-[4%] size-3",
  "right-[21%] top-[5%] size-4",
  "right-[4%] top-[40%] size-3",
  "left-[31%] top-[66%] size-3 hidden md:block",
  "right-[30%] top-[62%] size-4 hidden md:block",
  "left-[5%] top-[52%] size-3",
];

export function Hero() {
  return (
    <section className="sky relative overflow-hidden pb-10 pt-8 sm:pb-14 md:pt-12">
      {/* Back clouds */}
      {/* Back layer: smaller, fainter, slower */}
      <DriftingCloud shape="tall" className="top-[1%] hidden w-[280px] opacity-70 md:block" duration={150} offset={20} />
      <DriftingCloud shape="small" className="top-[12%] w-[200px] opacity-70" duration={130} offset={95} />
      <DriftingCloud shape="small" className="top-[40%] hidden w-[240px] opacity-60 md:block" duration={160} offset={60} />
      {/* Front layer: bigger and faster */}
      <DriftingCloud shape="wide" className="top-[5%] w-[300px] md:w-[400px]" duration={95} offset={10} />
      <DriftingCloud shape="wide" className="top-[20%] w-[280px] md:w-[420px]" duration={105} offset={62} />
      <DriftingCloud shape="tall" className="top-[48%] w-[260px] md:w-[380px]" duration={90} offset={35} />
      <DriftingCloud shape="small" className="top-[62%] hidden w-[260px] md:block" duration={100} offset={80} />
      <DriftingCloud shape="wide" className="bottom-0 hidden w-[480px] md:block" duration={115} offset={5} />

      {SPARKLES.map((cls) => (
        <StarIcon
          key={cls}
          className={`pointer-events-none absolute fill-sun stroke-dream ${cls}`}
          strokeWidth={1.5}
        />
      ))}
      <div
        aria-hidden
        className="absolute right-[26%] top-5 hidden size-14 rounded-full shadow-[inset_-12px_-6px_0_0_#fdeaa0] md:block"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-2 px-4 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <SideColumnWide items={LEFT} />
        <SideColumnCompact items={LEFT} side="left" />

        <div className="flex flex-col items-center text-center">
          <h1 className="text-[2.6rem] font-semibold leading-tight text-dream drop-shadow-[0_3px_0_#ffffff] sm:text-6xl md:text-[3.4rem] lg:text-7xl">
            Click your dream
          </h1>
          <p className="mt-3 rounded-full bg-sun px-5 py-1 text-2xl font-medium sm:mt-4 sm:px-6 sm:py-1.5 sm:text-3xl lg:text-4xl">
            Find your future
          </p>
          <p className="mt-5 text-base leading-relaxed sm:text-lg lg:text-xl">
            ลองคลิก... เปิดโลกของตัวเอง
            <br />
            แล้วค้นหาความฝันที่ใช่ไปด้วยกัน !
          </p>
          <QuizCta />

          {/* Phones: the six mascots sit on a cloud under the button */}
          <div className="relative mt-8 w-full max-w-sm md:hidden">
            <div aria-hidden className="sway absolute -bottom-[18%] -left-[12%] w-[124%]">
              <Cloud shape="wide" className="block h-auto w-full" />
            </div>
            <ul className="relative grid grid-cols-3 justify-items-center gap-x-2 gap-y-1">
              {Object.values(CHARACTERS).map((c, i) => (
                <li key={c.type}>
                  <Mascot
                    type={c.type}
                    sizes="100px"
                    className="w-[88px] sm:w-[100px]"
                    style={{ animationDelay: `${-i * 0.6}s` }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <SideColumnWide items={RIGHT} />
        <SideColumnCompact items={RIGHT} side="right" />
      </div>
    </section>
  );
}
