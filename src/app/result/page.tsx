import type { Metadata } from "next";
import { DriftingCloud } from "@/components/clouds";
import { DreamTrail, Sparkle } from "@/components/decor";
import { ResultView } from "@/components/result/result-view";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "ผลลัพธ์ของฉัน — Click your dream",
  description: "ผลการสำรวจความสนใจ RIASEC จุดเด่น การ์ดความฝัน และสาขาที่น่าสนใจ",
};

const SPARKLES = [
  { left: "4.9%", top: 166, size: 26, delay: 0 },
  { left: "93.2%", top: 167, size: 30, delay: 0.8 },
  { left: "18.4%", top: 102, size: 22, delay: 1.6 },
  { left: "80.9%", top: 102, size: 23, delay: 2.4 },
  { left: "4.4%", top: 570, size: 26, delay: 3.2 },
  { left: "93.8%", top: 1052, size: 28, delay: 4 },
];

export default function ResultPage() {
  return (
    <>
      <SiteHeader current="/result" />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-16 text-navy">
        <DriftingCloud shape="wide" className="top-[10px] w-[300px] md:w-[420px]" duration={100} offset={15} />
        <DriftingCloud shape="tall" className="top-[60px] hidden w-[320px] opacity-70 md:block" duration={150} offset={90} />
        <DriftingCloud shape="small" className="top-[560px] w-[240px] opacity-80 md:w-[320px]" duration={130} offset={55} />
        <DriftingCloud shape="wide" className="top-[760px] hidden w-[480px] md:block" duration={110} offset={30} />
        <DreamTrail />
        {SPARKLES.map((s) => (
          <Sparkle key={`${s.left}-${s.top}`} size={s.size} delay={s.delay} className="hidden opacity-75 lg:block" style={{ left: s.left, top: s.top }} />
        ))}

        <div className="relative mx-auto max-w-[1376px] px-4 pt-8 sm:px-8">
          <ResultView />
        </div>
      </main>
    </>
  );
}
