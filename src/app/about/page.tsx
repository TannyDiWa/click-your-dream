import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DriftingCloud } from "@/components/clouds";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { SiteHeader } from "@/components/site-header";
import { PRIVACY } from "@/lib/privacy";
import { CHARACTERS, type RiasecType } from "@/lib/riasec/types";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — Click your dream",
  description: "ที่มาของโครงงาน กรอบ Holland–RIASEC และที่มาของผลลัพธ์บน Click your dream",
};

const ONET_URL = "https://www.onetcenter.org/IP.html";
const MYTCAS_URL = "https://course.mytcas.com";

const GOALS = [
  { title: "รู้จักตัวเอง", body: "สำรวจสิ่งที่ชอบและกิจกรรม\nที่อยากลองทำ" },
  { title: "เห็นทางเลือก", body: "เชื่อมความสนใจกับสาขาเรียน\nและเส้นทางอาชีพที่น่าสำรวจ" },
  { title: "เริ่มลงมือทำ", body: "ใช้ผลลัพธ์เป็นจุดเริ่มต้น\nในการทดลองและวางแผนต่อ" },
];

const INTERESTS: { type: RiasecType; title: string; body: string; tint: string }[] = [
  { type: "realistic", title: "ลงมือทำ", body: "สนใจการใช้เครื่องมือ\nสร้าง ซ่อม และงานที่จับต้องได้", tint: "bg-[#e9f6f4]" },
  { type: "investigative", title: "ค้นหาคำตอบ", body: "สนใจการสังเกต วิเคราะห์\nค้นคว้า และทดลอง", tint: "bg-[#eceaff]" },
  { type: "artistic", title: "สร้างสรรค์", body: "สนใจการออกแบบ ศิลปะ\nและการถ่ายทอดจินตนาการ", tint: "bg-[#fff2da]" },
  { type: "social", title: "ช่วยเหลือผู้คน", body: "สนใจการช่วยเหลือ สอน\nรับฟัง และทำงานกับผู้คน", tint: "bg-[#fdebf4]" },
  { type: "enterprising", title: "ริเริ่มและนำทีม", body: "สนใจการนำทีม เจรจา\nและผลักดันเป้าหมายร่วมกัน", tint: "bg-[#f3ebff]" },
  { type: "conventional", title: "จัดการเป็นระบบ", body: "สนใจข้อมูล รายละเอียด\nและงานที่มีขั้นตอนชัดเจน", tint: "bg-[#e6f4ff]" },
];

// How a result is made, from the questions to the recommended programs.
const STEPS = [
  { title: "คำถาม\n42 ข้อ", body: "จาก RIASEC Checklist\nของ John L. Holland\nด้านละ 7 ข้อ ตอบ 1–4" },
  { title: "คะแนน\n6 ด้าน", body: "แต่ละด้านได้ 0–100\n3 ด้านสูงสุดคือ\nHolland code ของคุณ" },
  { title: "คำอธิบาย\nตามกลุ่มผู้ใช้", body: "เตรียมไว้ 360 ชุด\nร่างด้วย AI\nทีมตรวจทานก่อนแสดง" },
  { title: "สาขาและ\nหลักสูตร", body: "ม.ปลาย ได้ 5 สาขา\nพร้อมหลักสูตรจริง\nจาก myTCAS ปี 2570" },
  { title: "ข้อมูล\nของคุณ", body: "ไม่ต้องสมัครสมาชิก\nเก็บแค่ผลครั้งล่าสุด\nลบเองได้ทุกเมื่อ" },
];

// Sparkle positions from the Figma frame, as % of the 1536px-wide design
const SPARKLES = [
  { left: "5.4%", top: 256, size: 30 },
  { left: "93.3%", top: 280, size: 28 },
  { left: "26%", top: 514, size: 26 },
  { left: "94.4%", top: 1515, size: 27 },
  { left: "4.8%", top: 1899, size: 28 },
  { left: "93.1%", top: 2205, size: 25 },
];

const card = "rounded-[32px] border-2 border-white bg-paper shadow-[0_10px_15px_rgba(123,135,184,0.1)]";

function CharacterImage({ type, className, sizes, eager = false }: { type: RiasecType; className: string; sizes: string; eager?: boolean }) {
  const c = CHARACTERS[type];
  return (
    <Image src={c.src} alt={`${c.nameTh} (${c.letter})`} width={c.width} height={c.height} sizes={sizes} loading={eager ? "eager" : "lazy"} className={`h-auto object-contain ${className}`} />
  );
}

function SectionHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <header>
      <h2 className="text-2xl font-bold leading-normal text-navy sm:text-[29px]">
        <span className="mr-3">{number}</span>
        {title}
      </h2>
      <p className="mt-1 text-base leading-normal text-muted sm:text-[17px]">{subtitle}</p>
    </header>
  );
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader current="/about" />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-16 text-navy">
        {/* Background: shared drifting clouds (home-page style) */}
        <DriftingCloud shape="tall" className="top-0 hidden w-[340px] opacity-70 md:block" duration={150} offset={20} />
        <DriftingCloud shape="wide" className="top-[30px] w-[300px] md:w-[400px]" duration={95} offset={10} />
        <DriftingCloud shape="small" className="top-[120px] w-[220px] opacity-70 md:w-[280px]" duration={130} offset={75} />
        <DriftingCloud shape="wide" className="top-[560px] w-[320px] md:w-[480px]" duration={115} offset={45} />
        <DriftingCloud shape="tall" className="top-[640px] hidden w-[420px] md:block" duration={105} offset={85} />
        <DriftingCloud shape="small" className="top-[720px] hidden w-[300px] opacity-60 md:block" duration={160} offset={120} />

        {/* Dotted dream trail from the Figma frame, then a pastel wash behind the reading sections */}
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
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 top-[898px] bg-[#f0efff] opacity-70" />
        {SPARKLES.map((s) => (
          <Image
            unoptimized
            key={s.top}
            src="/decor/sparkle.svg"
            alt=""
            aria-hidden
            width={s.size}
            height={s.size}
            className="pointer-events-none absolute hidden opacity-80 drop-shadow-[0_0_5px_rgba(255,244,190,0.9)] lg:block"
            style={{ left: s.left, top: s.top - 82 }}
          />
        ))}

        <div className="relative mx-auto max-w-[1376px] px-4 sm:px-8">
          {/* Page title */}
          <div className="pt-9 text-center">
            <p className="text-sm font-bold text-violet">OUR STORY</p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-normal sm:text-[38px]">ทุกความฝัน เริ่มจากการรู้จักตัวเอง</h1>
            <p className="mt-1 text-base leading-normal sm:text-lg">
              รู้จักแนวคิดเบื้องหลัง Click your dream และเส้นทางการพัฒนาโครงงาน
            </p>
          </div>

          {/* 01 Project story */}
          <section aria-labelledby="story" className={`${card} mt-10 flex flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-start lg:gap-12`}>
            <div className="relative mx-auto flex h-[280px] w-full max-w-[350px] shrink-0 flex-col items-center justify-end rounded-[40px] bg-[#edf1ff] pb-2">
              <div className="absolute inset-x-0 top-6 flex items-end justify-center gap-1">
                <CharacterImage eager type="realistic" sizes="150px" className="w-[44%] max-w-[148px]" />
                <CharacterImage eager type="investigative" sizes="160px" className="w-[46%] max-w-[155px]" />
              </div>
              <p className="relative font-hand text-[28px] leading-normal">Find your future</p>
            </div>

            <div className="min-w-0 lg:pt-0.5">
              <p className="inline-block rounded-[20px] bg-chip px-[13px] py-1.5 text-[13px] font-bold text-violet">
                01&nbsp;&nbsp;ที่มาของโครงงาน
              </p>
              <h2 id="story" className="mt-2 text-[22px] font-bold leading-normal sm:text-[27px]">
                จากคำถามว่า “เราเหมาะกับอะไร?”
              </h2>
              <p className="mt-2 max-w-[860px] text-base leading-normal sm:text-[17px]">
                แนวคิดตั้งต้นของงานนี้คือช่วยให้ผู้ใช้สำรวจความสนใจของตนเอง
                <br className="hidden lg:inline" />
                และมองเห็นทางเลือกด้านการเรียนและอาชีพได้ง่ายขึ้น
                <br className="hidden lg:inline" />
                ผ่านคำถามที่เป็นมิตร ตัวละคร กราฟ และการ์ดผลลัพธ์ที่เข้าใจง่าย
              </p>
              <p className="mt-2 text-[15px] leading-normal text-muted">
                เป้าหมายคือเปลี่ยนความสงสัย ให้เป็นก้าวแรกของการลองทำและเรียนรู้
              </p>
            </div>
          </section>

          {/* Goals */}
          <ol className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
            {GOALS.map((g, i) => (
              <li key={g.title} className="flex items-center lg:min-h-[136px] gap-4 rounded-[24px] bg-paper px-6 py-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-badge text-lg font-bold text-violet">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[21px] font-bold leading-normal">{g.title}</h3>
                  <p className="mt-1 text-[15px] leading-normal text-muted lg:whitespace-pre-line">{g.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* 02 Holland–RIASEC */}
          <section aria-labelledby="theory" className="mt-10">
            <div id="theory">
              <SectionHeading
                number="02"
                title="ทฤษฎีเบื้องหลังแบบทดสอบ"
                subtitle="Holland–RIASEC: สำรวจความสนใจในกิจกรรมและโลกการทำงาน 6 ด้าน"
              />
            </div>
            <div className={`${card} mt-4 p-4 sm:p-6`}>
              <p className="text-base leading-normal sm:text-[17px]">
                กรอบ RIASEC ของ John L. Holland ช่วยจัดกลุ่มความสนใจเกี่ยวกับงานเป็น 6 ด้าน
                <br className="hidden lg:inline" />
                คนหนึ่งคนอาจสนใจหลายด้านร่วมกัน จึงใช้ผลลัพธ์เป็นแนวทางในการสำรวจตัวเองต่อ
              </p>

              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6">
                {INTERESTS.map((it) => {
                  const c = CHARACTERS[it.type];
                  return (
                    <li key={it.type} className={`flex min-h-[166px] items-center gap-3 rounded-[24px] px-4 py-4 ${it.tint}`}>
                      <CharacterImage type={it.type} sizes="100px" className="max-h-[126px] w-[100px] shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold leading-normal">
                          {c.letter} • {it.title}
                        </h3>
                        <p className="text-xs font-bold capitalize leading-normal text-violet">{it.type}</p>
                        <p className="mt-1 text-sm leading-normal text-muted lg:whitespace-pre-line">{it.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-6 text-sm leading-normal text-muted">
                ตัวละครและชื่อการ์ดเป็นการตีความของทีม เพื่อให้จำแต่ละด้านได้ง่ายขึ้น
              </p>
            </div>
          </section>

          {/* 03 Process */}
          <section aria-labelledby="process" className="mt-10">
            <div id="process">
              <SectionHeading
                number="03"
                title="เบื้องหลังผลลัพธ์"
                subtitle="ผลลัพธ์ที่คุณเห็นมาจากไหน ตั้งแต่คำถามจนถึงหลักสูตรที่แนะนำ"
              />
            </div>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col lg:min-h-[248px] gap-2 rounded-[26px] bg-paper p-5">
                  <span className="grid size-[34px] place-items-center rounded-xl bg-badge text-lg font-bold text-violet">{i + 1}</span>
                  <h3 className="whitespace-pre-line text-lg font-bold leading-normal">{s.title}</h3>
                  <p className="text-[13px] leading-normal text-muted lg:whitespace-pre-line">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-normal text-muted">
              คำตอบของคุณไม่ถูกส่งไปยังบริการ AI ใด ๆ • ดูรายละเอียดการเก็บข้อมูลใน{" "}
              <Link href="/privacy" className="font-bold text-violet underline underline-offset-2 hover:text-navy">
                ประกาศความเป็นส่วนตัว
              </Link>
            </p>
          </section>

          {/* How to read the result */}
          <div className="mt-7 rounded-[32px] border-2 border-white bg-[#f9f6ff] px-6 py-4 shadow-[0_10px_15px_rgba(123,135,184,0.1)]">
            <h2 className="text-[19px] font-bold leading-normal">ใช้ผลลัพธ์อย่างไรดี</h2>
            <p className="mt-1.5 text-[15px] leading-normal text-muted">
              ผลลัพธ์บอกความสนใจ ไม่ได้วัดความสามารถหรือตัดสินว่าคุณควรเรียนหรือทำงานอะไร
              แบบทดสอบฉบับภาษาไทยนี้ยังไม่ได้ตรวจความตรงและความเชื่อมั่นทางสถิติ
              จึงควรใช้คู่กับการพูดคุยกับครูแนะแนวหรือคนที่ทำงานในสายนั้น และตรวจเกณฑ์รับสมัครล่าสุดบน myTCAS ก่อนสมัครทุกครั้ง
            </p>
          </div>

          {/* References */}
          <div className={`${card} mt-7 px-6 py-4`}>
            <h2 className="text-[21px] font-bold leading-normal">แหล่งอ้างอิงและอ่านเพิ่มเติม</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-normal text-muted">
              <li>John L. Holland. RIASEC Checklist — ที่มาของข้อคำถาม (Counseling Center on East Campus)</li>
              <li>
                <a href={MYTCAS_URL} target="_blank" rel="noreferrer" className="font-bold text-violet underline underline-offset-2 hover:text-navy">
                  myTCAS&nbsp;↗
                </a>{" "}
                — ข้อมูลหลักสูตรและรอบรับสมัคร ปีการศึกษา 2570
              </li>
              <li>
                <a href={ONET_URL} target="_blank" rel="noreferrer" className="font-bold text-violet underline underline-offset-2 hover:text-navy">
                  O*NET Interest Profiler&nbsp;↗
                </a>{" "}
                — อ่านเพิ่มเติมเรื่องกรอบความสนใจ 6 ด้านตาม Holland–RIASEC
              </li>
            </ul>
            <p className="mt-4 text-sm leading-normal">
              มีคำถามหรือข้อเสนอแนะ ติดต่อ{PRIVACY.controller} ที่{" "}
              <a href={`mailto:${PRIVACY.contactEmail}`} className="font-bold text-violet underline underline-offset-2 hover:text-navy">
                {PRIVACY.contactEmail}
              </a>
            </p>
          </div>

          {/* Back to top */}
          <div className="mt-8 flex justify-center">
            <ScrollToTopButton className="cursor-pointer whitespace-nowrap rounded-[35px] bg-[#f6a0ce] px-[27px] py-4 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:bg-blush-deep">
              กลับขึ้นด้านบน&nbsp;&nbsp;↑
            </ScrollToTopButton>
          </div>
        </div>
      </main>
    </>
  );
}
