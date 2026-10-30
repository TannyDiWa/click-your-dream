import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, StarIcon } from "@/components/icons";
import { CHARACTERS, type RiasecType } from "@/lib/riasec/types";

type Placement = {
  type: RiasecType;
  className: string; // position inside the side column
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

function Mascot({ p, sizes }: { p: Placement; sizes: string }) {
  const c = CHARACTERS[p.type];
  return (
    <Image
      src={c.src}
      alt={`${c.nameTh} (${c.letter})`}
      width={c.width}
      height={c.height}
      sizes={sizes}
      className="bob h-auto drop-shadow-[0_6px_10px_#2f3d7c22]"
      style={{ width: p.width, animationDelay: p.delay }}
    />
  );
}

function SideColumn({ items }: { items: Placement[] }) {
  return (
    <div className="relative hidden h-[480px] lg:block">
      {items.map((p) => (
        <div key={p.type}>
          <div className={`absolute ${p.className}`}>
            <Mascot p={p} sizes="150px" />
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

const SPARKLES = [
  "left-[3%] top-[18%] size-4",
  "left-[27%] top-[22%] size-3",
  "left-[48%] top-[6%] size-3",
  "right-[21%] top-[6%] size-4",
  "right-[5%] top-[45%] size-3",
  "left-[31%] top-[78%] size-3",
  "right-[30%] top-[72%] size-4",
  "left-[6%] bottom-[8%] size-3",
];

export function Hero() {
  return (
    <section className="sky relative overflow-hidden pb-40 pt-10 sm:pt-14">
      {SPARKLES.map((cls) => (
        <StarIcon
          key={cls}
          className={`pointer-events-none absolute fill-sun stroke-dream ${cls}`}
          strokeWidth={1.5}
        />
      ))}
      <div
        aria-hidden
        className="absolute right-[24%] top-6 hidden size-14 rounded-full shadow-[inset_-12px_-6px_0_0_#fdeaa0] lg:block"
      />

      <div className="relative mx-auto grid max-w-7xl items-center px-4 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <SideColumn items={LEFT} />

        <div className="flex flex-col items-center text-center lg:px-2">
          <h1 className="text-5xl font-semibold leading-tight text-dream drop-shadow-[0_3px_0_#ffffff] sm:text-7xl">
            Click your dream
          </h1>
          <p className="mt-4 rounded-full bg-sun px-6 py-1.5 text-3xl font-medium sm:text-4xl">
            Find your future
          </p>
          <p className="mt-5 text-lg leading-relaxed sm:text-xl">
            ลองคลิก... เปิดโลกของตัวเอง
            <br />
            แล้วค้นหาความฝันที่ใช่ไปด้วยกัน !
          </p>
          <Link
            href="/quiz"
            className="group mt-7 inline-flex items-center gap-4 rounded-full border-2 border-dream/70 bg-blush px-8 py-3.5 text-xl font-semibold text-white shadow-[0_6px_0_#d36aa3] transition hover:-translate-y-0.5 hover:bg-blush-deep active:translate-y-1 active:shadow-[0_2px_0_#d36aa3] sm:text-2xl"
          >
            <StarIcon className="size-6 fill-sun stroke-white" strokeWidth={1.5} />
            เริ่มทำแบบทดสอบ
            <ArrowRightIcon className="size-6 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Small screens: all six mascots in a row under the button */}
          <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6 lg:hidden">
            {Object.values(CHARACTERS).map((c, i) => (
              <li key={c.type}>
                <Image
                  src={c.src}
                  alt={`${c.nameTh} (${c.letter})`}
                  width={c.width}
                  height={c.height}
                  sizes="96px"
                  className="bob h-auto w-20 sm:w-24"
                  style={{ animationDelay: `${-i * 0.6}s` }}
                />
              </li>
            ))}
          </ul>
        </div>

        <SideColumn items={RIGHT} />
      </div>
    </section>
  );
}
