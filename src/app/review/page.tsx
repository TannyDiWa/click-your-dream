import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DriftingCloud } from "@/components/clouds";
import { ReviewView, type ReviewItem } from "@/components/review/review-view";
import { SiteHeader } from "@/components/site-header";
import { USER_GROUPS, type UserGroup } from "@/lib/riasec/types";
import explanations from "../../../supabase/explanations.json";

export const metadata: Metadata = {
  title: "ตรวจคำอธิบาย — Click your dream",
  robots: { index: false },
};

type Stored = {
  code: string;
  group: UserGroup;
  content: {
    title: string;
    summary: string;
    strengths: { title: string; detail: string }[];
    careers: { title: string; reason: string; tag: string }[];
    guidance: { title: string; tag: string; detail: string }[];
    try_this_week: string[];
  };
};

const LETTER_ORDER = "RIASEC";
const groupOrder = USER_GROUPS.map((g) => g.value);

// Review the pre-generated explanations (supabase/explanations.json, including rows not yet
// reviewed in Supabase) with the result page's own components. Development only, or a build
// with ENABLE_REVIEW_PAGE=1.
export default function ReviewPage() {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_REVIEW_PAGE) notFound();

  const items: ReviewItem[] = (Object.values(explanations) as Stored[])
    .map(({ code, group, content: c }) => ({
      code,
      group,
      explanation: {
        title: c.title,
        summary: c.summary,
        strengths: c.strengths,
        careers: c.careers,
        guidance: c.guidance,
        tryThisWeek: c.try_this_week,
      },
    }))
    .sort((a, b) => {
      for (let i = 0; i < 3; i++) {
        const d = LETTER_ORDER.indexOf(a.code[i]) - LETTER_ORDER.indexOf(b.code[i]);
        if (d) return d;
      }
      return groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
    });

  return (
    <>
      <SiteHeader current="/review" />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-16 text-navy">
        <DriftingCloud shape="wide" className="top-[10px] w-[300px] md:w-[420px]" duration={100} offset={15} />
        <DriftingCloud shape="small" className="top-[560px] w-[240px] opacity-80 md:w-[320px]" duration={130} offset={55} />
        <div className="relative mx-auto max-w-[1376px] px-4 pt-8 sm:px-8">
          <ReviewView items={items} />
        </div>
      </main>
    </>
  );
}
