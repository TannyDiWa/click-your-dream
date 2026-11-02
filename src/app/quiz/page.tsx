import type { Metadata } from "next";
import Image from "next/image";
import { Cloud, DriftingCloud } from "@/components/clouds";
import { DreamTrail, Sparkle } from "@/components/decor";
import { QuizFlow } from "@/components/quiz/quiz-flow";
import { SiteHeader } from "@/components/site-header";
import { CHARACTERS, type RiasecType } from "@/lib/riasec/types";

export const metadata: Metadata = {
  title: "แบบทดสอบ — Click your dream",
  description: "ตอบคำถาม 42 ข้อเพื่อสำรวจความสนใจตามกรอบ Holland–RIASEC",
};

// Side companions from the Figma quiz frame (desktop only).
const COMPANIONS: { type: RiasecType; bubble: [string, string]; caption: string; side: "left" | "right" }[] = [
  { type: "realistic", bubble: ["สิ่งที่คุณชอบวันนี้", "อาจเป็นความฝันในวันหน้า"], caption: "Your possibilities", side: "left" },
  { type: "investigative", bubble: ["ค่อย ๆ คิดได้เลย", "เราจะไปด้วยกันนะ!"], caption: "Your future starts here", side: "right" },
];

const SPARKLES = [
  { left: "19%", top: 172, size: 38, delay: 0 },
  { left: "77.6%", top: 160, size: 32, delay: 0.76 },
  { left: "20.4%", top: 734, size: 34, delay: 1.02 },
  { left: "77.1%", top: 744, size: 42, delay: 1.28 },
  { left: "4.3%", top: 355, size: 30, delay: 1.54 },
  { left: "95.6%", top: 457, size: 34, delay: 1.8 },
  { left: "16.5%", top: 21, size: 27, delay: 0 },
  { left: "80.9%", top: 22, size: 28, delay: 0.76 },
];

export default function QuizPage() {
  return (
    <>
      <SiteHeader current="/quiz" />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-14 text-navy">
        <DriftingCloud shape="wide" className="top-[10px] w-[300px] md:w-[420px]" duration={100} offset={15} />
        <DriftingCloud shape="tall" className="top-[60px] hidden w-[320px] opacity-70 md:block" duration={150} offset={90} />
        <DriftingCloud shape="small" className="top-[520px] w-[240px] opacity-80 md:w-[320px]" duration={130} offset={55} />
        <DriftingCloud shape="wide" className="top-[700px] hidden w-[480px] md:block" duration={110} offset={30} />
        <DreamTrail />
        {SPARKLES.map((s) => (
          <Sparkle key={`${s.left}-${s.top}`} size={s.size} delay={s.delay} className="hidden opacity-80 lg:block" style={{ left: s.left, top: s.top }} />
        ))}

        <div className="relative mx-auto max-w-[1440px] px-4 pt-9 sm:px-8">
          <QuizFlow />

          {COMPANIONS.map((c) => {
            const ch = CHARACTERS[c.type];
            return (
              <div
                key={c.type}
                aria-hidden
                className={`pointer-events-none absolute top-[290px] hidden w-[230px] flex-col items-center 2xl:flex ${
                  c.side === "left" ? "left-8" : "right-8"
                }`}
              >
                <p className="whitespace-nowrap rounded-3xl border-[1.5px] border-[#d4def4] bg-white px-4 py-3 text-center text-[15px] leading-normal">
                  {c.bubble[0]}
                  <br />
                  {c.bubble[1]}
                </p>
                <div className="relative mt-8 w-[200px]">
                  <Cloud shape="small" className="absolute -bottom-8 left-1/2 w-[240px] -translate-x-1/2" />
                  <Image
                    src={ch.src}
                    alt=""
                    width={ch.width}
                    height={ch.height}
                    sizes="200px"
                    loading="eager"
                    className="relative h-auto w-full object-contain"
                  />
                </div>
                <p className="mt-6 font-hand text-[27px] leading-normal text-violet">{c.caption}</p>
              </div>
            );
          })}

          <p className="mt-6 text-center text-[15px]">ทุกคำตอบ คือก้าวเล็ก ๆ สู่อนาคตในแบบของคุณ</p>
          <p className="mt-2 text-center text-xs text-muted">ข้อคำถามจาก RIASEC Checklist ของ John L. Holland • ที่มา: Counseling Center on East Campus</p>
        </div>
      </main>
    </>
  );
}
