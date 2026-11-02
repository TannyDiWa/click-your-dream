import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DriftingCloud } from "@/components/clouds";
import { SiteHeader } from "@/components/site-header";
import { PRIVACY } from "@/lib/privacy";
import { CHARACTERS } from "@/lib/riasec/types";

export const metadata: Metadata = {
  title: "ติดต่อเรา — Click your dream",
  description: "ติดต่อทีมพัฒนา Click your dream ทางอีเมล สำหรับคำถาม ข้อเสนอแนะ และคำขอเกี่ยวกับข้อมูลส่วนบุคคล",
};

const TOPICS = [
  { title: "คำถามเกี่ยวกับผลลัพธ์", body: "สงสัยว่าผลหรือสาขาที่แนะนำหมายถึงอะไร" },
  { title: "ข้อเสนอแนะ", body: "เจอคำถามที่ไม่ชัด ข้อมูลผิด หรืออยากให้เพิ่มอะไร" },
  { title: "ข้อมูลส่วนบุคคล", body: "ขอสำเนา ขอลบ หรือถอนความยินยอม" },
];

const card = "rounded-[32px] border-2 border-white bg-paper shadow-[0_10px_15px_rgba(123,135,184,0.1)]";

export default function ContactPage() {
  const social = CHARACTERS.social;
  return (
    <>
      <SiteHeader current="/contact" />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-16 text-navy">
        <DriftingCloud shape="wide" className="top-[10px] w-[300px] md:w-[420px]" duration={100} offset={15} />
        <DriftingCloud shape="tall" className="top-[60px] hidden w-[320px] opacity-70 md:block" duration={150} offset={90} />
        <DriftingCloud shape="small" className="top-[460px] w-[240px] opacity-80 md:w-[320px]" duration={130} offset={55} />

        <div className="relative mx-auto max-w-[920px] px-4 sm:px-8">
          <div className="pt-9 text-center">
            <p className="text-sm font-bold text-violet">CONTACT US</p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-normal sm:text-[38px]">ติดต่อเรา</h1>
            <p className="mt-1 text-base leading-normal sm:text-lg">มีอะไรอยากถามหรือบอกทีม ส่งอีเมลมาได้เลย</p>
          </div>

          <section className={`${card} mt-8 flex flex-col items-center gap-6 px-5 py-7 sm:flex-row sm:px-9`}>
            <Image
              src={social.src}
              alt={`${social.nameTh} (${social.letter})`}
              width={social.width}
              height={social.height}
              sizes="140px"
              loading="eager"
              className="h-auto w-[120px] shrink-0 object-contain sm:w-[140px]"
            />
            <div className="min-w-0 text-center sm:text-left">
              <h2 className="text-xl font-bold leading-normal sm:text-[23px]">{PRIVACY.controller}</h2>
              <p className="mt-1 text-[15px] text-muted">อีเมล</p>
              <a
                href={`mailto:${PRIVACY.contactEmail}`}
                className="mt-0.5 block text-base font-bold [overflow-wrap:anywhere] text-violet underline underline-offset-4 hover:text-navy sm:text-xl"
              >
                {PRIVACY.contactEmail}
              </a>
              <p className="mt-3 text-sm text-muted">ทีมจะตอบกลับโดยเร็ว คำขอเกี่ยวกับข้อมูลส่วนบุคคลตอบภายใน 30 วัน</p>
            </div>
          </section>

          <h2 className="mt-10 text-xl font-bold leading-normal sm:text-[23px]">ติดต่อเรื่องอะไรได้บ้าง</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {TOPICS.map((t) => (
              <li key={t.title} className="rounded-[24px] bg-paper px-5 py-4">
                <h3 className="text-lg font-bold leading-normal">{t.title}</h3>
                <p className="mt-1 text-[15px] leading-normal text-muted">{t.body}</p>
              </li>
            ))}
          </ul>

          <p className="mt-6 rounded-[24px] bg-[#f9f6ff] px-5 py-4 text-[15px] leading-relaxed">
            เราไม่รู้ว่าผลลัพธ์ชุดไหนเป็นของใคร ถ้าต้องการลบข้อมูล กด “ลบข้อมูลของฉัน” ใน{" "}
            <Link href="/privacy#rights" className="font-bold text-violet underline underline-offset-2 hover:text-navy">
              ประกาศความเป็นส่วนตัว
            </Link>{" "}
            บนเบราว์เซอร์ที่ใช้ทำแบบทดสอบได้ทันที โดยไม่ต้องส่งอีเมล
          </p>
        </div>
      </main>
    </>
  );
}
