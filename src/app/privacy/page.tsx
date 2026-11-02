import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DriftingCloud } from "@/components/clouds";
import { DeleteMyData } from "@/components/privacy/delete-my-data";
import { SiteHeader } from "@/components/site-header";
import { PRIVACY } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "ประกาศความเป็นส่วนตัว — Click your dream",
  description: "Click your dream เก็บข้อมูลอะไร ใช้ทำอะไร และคุณมีสิทธิ์อะไรบ้างตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล",
};

// What the app actually stores; keep in step with supabase/migrations.
const DATA = [
  ["รหัสผู้ใช้ชั่วคราว", "รหัสสุ่มที่ไม่ผูกกับชื่อหรืออีเมล", "ระบบสร้างให้เมื่อคุณยินยอมและเริ่มแบบทดสอบ"],
  ["คุกกี้ session", "คุกกี้ที่จำว่าเบราว์เซอร์นี้คือรหัสผู้ใช้ใด", "ระบบตั้งในเบราว์เซอร์ของคุณ"],
  ["กลุ่มผู้ใช้", "กำลังเรียน ม.ปลาย / มหาวิทยาลัย / ทำงานแล้ว", "คุณเลือกเอง"],
  ["การยินยอม", "วันเวลาที่ยินยอม และเวอร์ชันของประกาศที่ยินยอม", "ระบบบันทึกเมื่อคุณกดยินยอม"],
  ["คำตอบแบบทดสอบ", "คะแนน 1–4 ของคำถาม 42 ข้อ", "คุณตอบเอง"],
  ["ความคืบหน้า", "ข้อที่ทำถึง วันเวลาที่เริ่มและอัปเดต", "ระบบบันทึกระหว่างทำ"],
  ["ผลลัพธ์", "คะแนน 6 ด้าน (0–100) Holland code วันเวลาที่ทำเสร็จ", "ระบบคำนวณจากคำตอบ"],
];

const PURPOSES = [
  ["บันทึกความคืบหน้าให้ทำต่อได้ และแสดงผลลัพธ์ของคุณ", "ความยินยอม (มาตรา 19)"],
  ["แนะนำอาชีพ คณะ และมหาวิทยาลัยตามกลุ่มและผลของคุณ", "ความยินยอม (มาตรา 19)"],
  ["คุกกี้ session ที่จำเป็นต่อการทำงานของเว็บ", "ประโยชน์โดยชอบด้วยกฎหมาย (มาตรา 24(5))"],
];

const card = "rounded-[32px] border-2 border-white bg-paper shadow-[0_10px_15px_rgba(123,135,184,0.1)]";

function Section({ id, number, title, children }: { id: string; number: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-xl font-bold leading-normal sm:text-[23px]">
        <span className="mr-2 text-violet">{number}.</span>
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed sm:text-base">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#e3e6f5]">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm sm:text-[15px]">
        <thead className="bg-[#eef1ff] text-navy">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-[#e3e6f5] bg-white/70 align-top">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-2.5 font-bold">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-4 py-2.5 text-muted">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Mail() {
  return (
    <a href={`mailto:${PRIVACY.contactEmail}`} className="font-bold text-violet underline underline-offset-2 hover:text-navy">
      {PRIVACY.contactEmail}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader current="/privacy" />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#c9e5ff] via-[#eef7ff] via-[52%] to-[#ede5fc] pb-16 text-navy">
        <DriftingCloud shape="wide" className="top-[10px] w-[300px] md:w-[420px]" duration={100} offset={15} />
        <DriftingCloud shape="tall" className="top-[60px] hidden w-[320px] opacity-70 md:block" duration={150} offset={90} />
        <DriftingCloud shape="small" className="top-[560px] w-[240px] opacity-80 md:w-[320px]" duration={130} offset={55} />

        <div className="relative mx-auto max-w-[920px] px-4 sm:px-8">
          <div className="pt-9 text-center">
            <p className="text-sm font-bold text-violet">PRIVACY NOTICE</p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-normal sm:text-[38px]">ประกาศความเป็นส่วนตัว</h1>
          </div>

          <article className={`${card} mt-8 px-5 py-6 sm:px-9 sm:py-8`}>
            <p className="text-[15px] leading-relaxed sm:text-base">
              ประกาศนี้อธิบายว่า Click your dream เก็บข้อมูลอะไร ใช้ทำอะไร และคุณมีสิทธิ์อะไรบ้าง
              ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มีผลตั้งแต่วันที่ {PRIVACY.effectiveDate}
            </p>

            <Section id="controller" number={1} title="ผู้ควบคุมข้อมูลส่วนบุคคล">
              <p>
                {PRIVACY.controller} ผู้พัฒนาเว็บไซต์ Click your dream ติดต่อได้ที่ <Mail />
              </p>
            </Section>

            <Section id="data" number={2} title="ข้อมูลที่เราเก็บ">
              <Table head={["ข้อมูล", "ตัวอย่าง", "ได้มาจาก"]} rows={DATA} />
              <p>
                เราไม่เก็บชื่อ อีเมล เบอร์โทร ตำแหน่งที่ตั้ง หรือข้อมูลอ่อนไหวตามมาตรา 26
                และไม่ใช้คุกกี้โฆษณาหรือเครื่องมือติดตามของบุคคลที่สาม
              </p>
            </Section>

            <Section id="purposes" number={3} title="วัตถุประสงค์และฐานทางกฎหมาย">
              <Table head={["วัตถุประสงค์", "ฐานทางกฎหมาย"]} rows={PURPOSES} />
              <p>
                คำอธิบายผลลัพธ์บนเว็บเขียนเตรียมไว้ล่วงหน้าตาม Holland code และกลุ่มผู้ใช้ เราไม่ส่งคำตอบของคุณไปยังบริการ AI ใด
                ผลลัพธ์เป็นแนวทางสำรวจตัวเอง ไม่ใช่การตัดสินหรือวินิจฉัยใด ๆ
              </p>
            </Section>

            <Section id="retention" number={4} title="ระยะเวลาเก็บ">
              <ul className="list-disc space-y-1 pl-6">
                <li>คำตอบและความคืบหน้าที่ยังทำไม่เสร็จ: ลบเมื่อคุณกด “เริ่มใหม่” หรือเมื่อส่งแบบทดสอบ</li>
                <li>ผลลัพธ์ล่าสุด: เก็บไว้ {PRIVACY.retention} หรือจนกว่าคุณขอลบ แล้วระบบจะลบให้อัตโนมัติ</li>
                <li>เราเก็บเฉพาะผลครั้งล่าสุด การทำแบบทดสอบใหม่จะแทนที่ผลเดิม</li>
              </ul>
            </Section>

            <Section id="recipients" number={5} title="ผู้ที่ได้รับข้อมูลและการส่งข้อมูลไปต่างประเทศ">
              <p>
                เราไม่ขายหรือเปิดเผยข้อมูลให้ใครเพื่อการตลาด ข้อมูลเก็บบนฐานข้อมูลของ Supabase ซึ่งเป็นผู้ประมวลผลข้อมูลแทนเรา
                เซิร์ฟเวอร์ตั้งอยู่ที่ {PRIVACY.supabaseRegion} หากอยู่นอกประเทศไทย
                เราใช้ผู้ให้บริการที่มีมาตรการคุ้มครองข้อมูลตามมาตรา 28–29
              </p>
            </Section>

            <Section id="rights" number={6} title="สิทธิ์ของคุณ">
              <p>
                คุณมีสิทธิ์ถอนความยินยอม ขอเข้าถึงหรือขอสำเนาข้อมูล ขอแก้ไข ขอลบ ขอระงับการใช้ คัดค้านการประมวลผล
                และขอโอนย้ายข้อมูล ส่งคำขอได้ที่ <Mail /> เราจะตอบภายใน 30 วัน การถอนความยินยอมไม่กระทบสิ่งที่ทำไปก่อนหน้า
                หากเห็นว่าเราไม่ปฏิบัติตามกฎหมาย คุณร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ได้
              </p>
              <p>
                เพราะเราไม่รู้ว่าคุณเป็นใคร ข้อมูลของคุณจึงผูกกับคุกกี้ในเบราว์เซอร์ที่ใช้ทำแบบทดสอบ
                หากล้างคุกกี้ เราจะไม่สามารถหาข้อมูลชุดนั้นเจอเพื่อแสดงหรือลบให้คุณได้
              </p>
              <div className="rounded-2xl bg-[#f9f6ff] px-4 py-4 sm:px-5">
                <p className="font-bold">ลบข้อมูลและถอนความยินยอมด้วยตัวเอง</p>
                <p className="text-muted">กดปุ่มนี้บนเบราว์เซอร์ที่ใช้ทำแบบทดสอบ เพื่อลบคำตอบ ความคืบหน้า และผลลัพธ์ทั้งหมดทันที</p>
                <DeleteMyData />
              </div>
            </Section>

            <Section id="changes" number={7} title="การเปลี่ยนแปลงประกาศ">
              <p>หากมีการแก้ไขประกาศนี้ เราจะแจ้งบนเว็บไซต์ อัปเดตวันที่มีผลด้านบน และขอความยินยอมใหม่ก่อนทำแบบทดสอบครั้งถัดไป</p>
            </Section>

            <Section id="minors" number={8} title="ผู้ใช้อายุต่ำกว่า 20 ปี">
              <p>
                เว็บไซต์นี้เปิดให้นักเรียนทำแบบทดสอบได้ หากผู้ใช้อายุต่ำกว่า 20 ปี เราขอให้ผู้ปกครองหรือผู้ใช้อำนาจปกครอง
                อ่านและให้ความยินยอมก่อนเริ่ม ผู้ปกครองที่ต้องการให้ลบข้อมูลของบุตรหลาน กด “ลบข้อมูลของฉัน”
                บนอุปกรณ์ที่ใช้ทำแบบทดสอบ หรือติดต่อ <Mail />
              </p>
            </Section>
          </article>
        </div>
      </main>
    </>
  );
}
