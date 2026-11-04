import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { DriftingCloud } from "@/components/clouds";
import { DreamTrail, Sparkle } from "@/components/decor";
import { NextDeadline } from "@/components/explore/next-deadline";
import { ProgramExplorer } from "@/components/explore/program-explorer";
import { SiteHeader } from "@/components/site-header";
import { CALENDAR_CHECKED, EXAM_CARDS, ROUNDS } from "@/lib/tcas/calendar";
import { thaiDate } from "@/lib/tcas/subjects";
import type { TcasIndex } from "@/lib/tcas/types";
import { CHARACTERS, type RiasecType } from "@/lib/riasec/types";
import tcasIndex from "../../../public/tcas/2570/index.json";

export const metadata: Metadata = {
  title: "สำรวจเส้นทาง TCAS70 — Click your dream",
  description: "เลือกมหาวิทยาลัย คณะ และหลักสูตร แล้วดูวิชาที่ต้องสมัครสอบ สัดส่วนคะแนน วันสอบ และปฏิทิน TCAS70",
};

const index = tcasIndex as TcasIndex;

const GUIDES: { type: RiasecType; className: string }[] = [
  { type: "conventional", className: "w-[118px]" },
  { type: "investigative", className: "w-[106px] -ml-3 mt-1" },
];

const SPARKLES = [
  { left: "4.2%", top: 300, size: 36, delay: 0 },
  { left: "94%", top: 470, size: 34, delay: 0.8 },
  { left: "4.3%", top: 1180, size: 32, delay: 1.6 },
  { left: "94.3%", top: 1900, size: 34, delay: 2.4 },
];

const card = "rounded-[28px] border border-white bg-paper shadow-[0_10px_30px_rgba(123,135,184,0.1)]";
const link = "font-bold text-violet underline underline-offset-4 hover:text-navy";

function SectionHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <header>
      <h2 className="text-2xl font-bold leading-normal sm:text-[29px]">
        <span className="mr-3">{number}</span>
        {title}
      </h2>
      <p className="mt-0.5 text-[15px] leading-normal sm:text-base">{subtitle}</p>
    </header>
  );
}

export default function ExplorePage() {
  return (
    <>
      <SiteHeader current="/explore" />
      {/* clip, not hidden: a hidden box can still be scrolled sideways (focus, scrollIntoView) past the wide clouds */}
      <main className="relative flex-1 overflow-clip bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-16 text-navy">
        <DriftingCloud shape="wide" className="top-[10px] w-[300px] md:w-[420px]" duration={100} offset={15} />
        <DriftingCloud shape="tall" className="top-[60px] hidden w-[320px] opacity-70 md:block" duration={150} offset={90} />
        <DriftingCloud shape="small" className="top-[620px] w-[240px] opacity-80 md:w-[320px]" duration={130} offset={55} />
        <DriftingCloud shape="wide" className="top-[900px] hidden w-[480px] md:block" duration={110} offset={30} />
        <DreamTrail />
        {SPARKLES.map((s) => (
          <Sparkle key={s.top} size={s.size} delay={s.delay} className="hidden opacity-80 lg:block" style={{ left: s.left, top: s.top }} />
        ))}

        <div className="relative mx-auto max-w-[1376px] px-4 sm:px-8">
          {/* Hero */}
          <div className="flex items-start gap-6 pt-9">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-violet">YOUR NEXT CHAPTER&nbsp;&nbsp;•&nbsp;&nbsp;TCAS70</p>
              <h1 className="mt-1.5 text-[28px] font-bold leading-normal sm:text-[38px]">สำรวจเส้นทาง สู่มหาวิทยาลัยในฝัน</h1>
              <p className="mt-1 text-base leading-normal sm:text-lg">
                เลือกหลักสูตรที่อยากเข้า แล้วดูว่าต้องสมัครสอบวิชาอะไร สอบวันไหน และแต่ละรอบรับกี่คน
              </p>
              <p className="mt-2 text-sm">
                ปีการศึกษา {index.year}&nbsp;&nbsp;·&nbsp;&nbsp;ข้อมูลหลักสูตรจาก myTCAS เมื่อ {thaiDate(index.fetchedAt.slice(0, 10))}
              </p>
            </div>
            <div aria-hidden className="hidden shrink-0 items-start sm:flex">
              {GUIDES.map((g) => {
                const c = CHARACTERS[g.type];
                return (
                  <Image key={g.type} src={c.src} alt="" width={c.width} height={c.height} sizes="120px" loading="eager" className={`h-auto object-contain ${g.className}`} />
                );
              })}
            </div>
          </div>

          <NextDeadline />

          {/* 01 Program explorer */}
          <section aria-labelledby="explore" className="mt-11">
            <div id="explore">
              <SectionHeading number="01" title="เลือกหลักสูตรที่อยากเข้า" subtitle="ดูวิชาที่ต้องสมัครสอบ สัดส่วนคะแนนรอบ 3 วันสอบ และเกณฑ์ขั้นต่ำ จากข้อมูล myTCAS" />
            </div>
            <div className="mt-4">
              <Suspense fallback={<div className={`${card} h-[118px]`} aria-busy="true" />}>
                <ProgramExplorer universities={index.universities} />
              </Suspense>
            </div>
          </section>

          {/* 02 Exam calendar */}
          <section aria-labelledby="calendar" className="mt-12">
            <div id="calendar">
              <SectionHeading number="02" title="ปฏิทินสมัครสอบและวันสอบ" subtitle="สมัครสอบเฉพาะวิชาที่หลักสูตรที่สนใจใช้ และตรวจตารางรายวิชาจากประกาศต้นฉบับ" />
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {EXAM_CARDS.map((c) => (
                <div key={c.title} className={`${card} p-6`}>
                  <h3 className="text-[24px] font-bold leading-normal sm:text-[26px]">{c.title}</h3>
                  <p className="text-sm text-muted">{c.subtitle}</p>
                  <dl className="mt-3 space-y-2">
                    {c.rows.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[132px_1fr] gap-3 sm:grid-cols-[150px_1fr]">
                        <dt className="text-sm leading-relaxed text-muted">{k}</dt>
                        <dd className="text-[15px] font-bold leading-relaxed sm:text-base">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <a href={c.source} target="_blank" rel="noreferrer" className={`${link} mt-4 inline-block text-sm`}>
                    ดูปฏิทินสอบต้นฉบับ&nbsp;↗
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2 rounded-[28px] border border-white bg-[#fdebf6] px-6 py-4 shadow-[0_10px_30px_rgba(123,135,184,0.1)] sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[19px] font-bold leading-normal">TPAT1&nbsp;&nbsp;•&nbsp;&nbsp;วิชาเฉพาะ กสพท (แพทย์ ทันตะ เภสัช)</p>
                <p className="text-[15px]">สอบ 13 ก.พ. 2570 08.30–12.30 น.&nbsp;&nbsp;·&nbsp;&nbsp;สมัครผ่านระบบของ กสพท แยกจาก myTCAS</p>
              </div>
              <a href="https://cotmesadmission.com/" target="_blank" rel="noreferrer" className={`${link} shrink-0 text-[15px]`}>
                ดูประกาศ กสพท&nbsp;↗
              </a>
            </div>
          </section>

          {/* 03 Admission rounds */}
          <section aria-labelledby="rounds" className="mt-12">
            <div id="rounds">
              <SectionHeading number="03" title="เส้นทางสมัคร TCAS ทั้ง 4 รอบ" subtitle="วันในตารางเป็นกำหนดการส่วนกลาง ส่วนรายละเอียดโครงการให้ตรวจจากมหาวิทยาลัย" />
            </div>
            <div className={`${card} mt-4 overflow-hidden`}>
              <div className="hidden grid-cols-[1fr_1.4fr_1.2fr_1.2fr] gap-5 bg-[#e8e7ff] px-6 py-3.5 font-bold md:grid">
                <span>รอบการสมัคร</span>
                <span>เปิดรับสมัคร</span>
                <span>ประกาศผลในระบบ</span>
                <span>ยืนยันสิทธิ์ในระบบ</span>
              </div>
              <ul>
                {ROUNDS.map((r, i) => (
                  <li key={r.no} className={`grid gap-x-5 gap-y-2 px-6 py-5 md:grid-cols-[1fr_1.4fr_1.2fr_1.2fr] ${i % 2 ? "bg-[#f7f5ff]" : "bg-[#fffdf9]"}`}>
                    <span className="text-[19px] font-bold leading-normal">
                      {r.no}&nbsp;&nbsp;{r.name}
                    </span>
                    {(
                      [
                        ["เปิดรับสมัคร", r.apply],
                        ["ประกาศผล", r.result],
                        ["ยืนยันสิทธิ์", r.confirm],
                      ] as const
                    ).map(([k, lines]) => (
                      <span key={k} className="text-[15px] leading-relaxed text-[#526b9d]">
                        <span className="mr-2 font-bold text-navy md:hidden">{k}:</span>
                        {lines.map((l) => (
                          <span key={l} className="md:block">
                            {l}{" "}
                          </span>
                        ))}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 rounded-[28px] border border-white bg-[#f9f4ff] px-6 py-4 shadow-[0_10px_30px_rgba(123,135,184,0.1)]">
              <p className="text-[19px] font-bold leading-normal">วันสละสิทธิ์ และสิ่งที่ควรรู้</p>
              <p className="mt-1 text-[15px]">รอบ 1: 12 มี.ค. หรือ 5 พ.ค. 2570&nbsp;&nbsp;·&nbsp;&nbsp;รอบ 2: 5 พ.ค. 2570&nbsp;&nbsp;·&nbsp;&nbsp;รอบ 3: 28 พ.ค. 2570*</p>
              <p className="mt-1 text-sm text-muted">สละสิทธิ์ได้สูงสุด 1 ครั้ง&nbsp;&nbsp;·&nbsp;&nbsp;*วันที่ 28 พ.ค. เฉพาะผู้ยืนยันรอบ 3 ที่ยังไม่เคยสละสิทธิ์</p>
            </div>
          </section>

          {/* Sources */}
          <div className={`${card} mt-10 px-6 py-5`}>
            <h2 className="text-[21px] font-bold leading-normal">ข้อมูลจาก TCAS อย่างเป็นทางการ</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              ปฏิทินอ้างอิง myTCAS / ทปอ. ตรวจสอบ {thaiDate(CALENDAR_CHECKED)}&nbsp;&nbsp;·&nbsp;&nbsp;ข้อมูลหลักสูตรและเกณฑ์จาก course.mytcas.com เมื่อ{" "}
              {thaiDate(index.fetchedAt.slice(0, 10))}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              กำหนดการอาจเปลี่ยนแปลง และแต่ละหลักสูตรอาจกำหนดรายละเอียดต่างกัน ตรวจประกาศของมหาวิทยาลัยก่อนสมัครทุกครั้ง
            </p>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-2 text-[15px]">
              <a href="https://www.mytcas.com/" target="_blank" rel="noreferrer" className={link}>
                เปิดปฏิทิน myTCAS&nbsp;↗
              </a>
              <a href="https://course.mytcas.com/" target="_blank" rel="noreferrer" className={link}>
                ค้นหาหลักสูตรและเกณฑ์บน myTCAS&nbsp;↗
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-lg">ทุกเส้นทางเริ่มจากก้าวเล็ก ๆ ของคุณ ♡</p>
        </div>
      </main>
    </>
  );
}
