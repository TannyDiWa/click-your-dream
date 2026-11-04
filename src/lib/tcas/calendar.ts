// TCAS70 central calendar for /explore, from the official myTCAS calendars
// (assets.mytcas.com/70/TCAS70-TGAT-TPAT.jpg and TCAS70-A-Level.jpg) and the TCAS70 round
// schedule. Checked 4 Nov 2026; update with the next TCAS year.

export const CALENDAR_CHECKED = "2026-11-04";

/** Milestones for the "what's next" banner, in date order (to = last day). */
export const MILESTONES: { from: string; to: string; title: string; detail: string; link?: { label: string; href: string } }[] = [
  {
    from: "2026-11-04",
    to: "2026-11-10",
    title: "สมัครสอบ TGAT/TPAT2–5",
    detail: "สมัครที่ student.mytcas.com",
    link: { label: "ไป myTCAS", href: "https://student.mytcas.com/" },
  },
  { from: "2026-12-07", to: "2027-02-01", title: "พิมพ์บัตรที่นั่งสอบ TGAT/TPAT2–5", detail: "พิมพ์จาก student.mytcas.com ก่อนวันสอบ" },
  { from: "2027-01-14", to: "2027-01-20", title: "สมัครสอบ A-Level", detail: "สมัครที่ student.mytcas.com • ยื่นคำร้องล่าช้า 21–22 ม.ค. 2570", link: { label: "ไป myTCAS", href: "https://student.mytcas.com/" } },
  { from: "2027-01-30", to: "2027-02-01", title: "สอบ TGAT/TPAT2–5", detail: "30 ม.ค. TPAT3 / TGAT • 31 ม.ค. TPAT5 / TPAT2 • 1 ก.พ. TPAT4" },
  { from: "2027-02-13", to: "2027-02-13", title: "สอบ TPAT1 วิชาเฉพาะ กสพท", detail: "จัดสอบโดย กสพท", link: { label: "ดูประกาศ กสพท", href: "https://cotmesadmission.com/" } },
  { from: "2027-03-13", to: "2027-03-15", title: "สอบ A-Level", detail: "ดูวันสอบแต่ละวิชาของหลักสูตรที่คุณเลือกได้ด้านล่าง" },
  { from: "2027-05-07", to: "2027-05-13", title: "สมัครรอบ 3 Admission", detail: "7–11 พ.ค. และเพิ่มเติม 12–13 พ.ค. 2570 ผ่าน myTCAS", link: { label: "ไป myTCAS", href: "https://student.mytcas.com/" } },
  { from: "2027-05-29", to: "2027-06-15", title: "สมัครรอบ 4 Direct Admission", detail: "สมัครกับมหาวิทยาลัยโดยตรง" },
];

export type ExamCard = { title: string; subtitle: string; rows: [string, string][]; source: string };

export const EXAM_CARDS: ExamCard[] = [
  {
    title: "TGAT / TPAT2–5",
    subtitle: "ความถนัดทั่วไปและความถนัดเฉพาะด้าน",
    rows: [
      ["สมัครสอบ", "4–10 พ.ย. 2569"],
      ["พิมพ์บัตรสอบ", "7 ธ.ค. 2569 – 1 ก.พ. 2570"],
      ["30 ม.ค. 2570", "TPAT3 เช้า / TGAT บ่าย"],
      ["31 ม.ค. 2570", "TPAT5 เช้า / TPAT2 บ่าย"],
      ["1 ก.พ. 2570", "TPAT4 เช้า"],
      ["ประกาศคะแนน", "28 ก.พ. 2570"],
      ["ขอทบทวนคะแนน", "21–27 เม.ย. 2570"],
    ],
    source: "https://assets.mytcas.com/70/TCAS70-TGAT-TPAT.jpg",
  },
  {
    title: "A-Level",
    subtitle: "ความรู้เชิงวิชาการ • สอบ 13–15 มี.ค. 2570",
    rows: [
      ["สมัครสอบ", "14–20 ม.ค. 2570"],
      ["คำร้องสมัครล่าช้า", "21–22 ม.ค. 2570"],
      ["พิมพ์บัตรสอบ", "15 ก.พ. – 15 มี.ค. 2570"],
      ["13 มี.ค. 2570", "ชีวะ • ฟิสิกส์ • ภาษาไทย • สังคม"],
      ["14 มี.ค. 2570", "คณิต 1 • ภาษาอังกฤษ • เคมี"],
      ["15 มี.ค. 2570", "คณิต 2 • วิทย์ประยุกต์ • ภาษาต่างประเทศ"],
      ["ประกาศเฉลย", "26 มี.ค. 2570"],
    ],
    source: "https://assets.mytcas.com/70/TCAS70-A-Level.jpg",
  },
];

export const ROUNDS: { no: string; name: string; apply: string[]; result: string[]; confirm: string[] }[] = [
  { no: "01", name: "Portfolio", apply: ["มหาวิทยาลัยกำหนด", "15 ส.ค. 2569 เป็นต้นไป"], result: ["10 มี.ค. 2570"], confirm: ["10–11 มี.ค. 2570"] },
  { no: "02", name: "Quota", apply: ["มหาวิทยาลัยกำหนด", "13 มี.ค. 2570 เป็นต้นไป"], result: ["3 พ.ค. 2570"], confirm: ["3–4 พ.ค. 2570"] },
  { no: "03", name: "Admission", apply: ["7–11 พ.ค. 2570", "เพิ่มเติม 12–13 พ.ค. 2570"], result: ["ครั้งที่ 1: 22 พ.ค. 2570", "ครั้งที่ 2: 27 พ.ค. 2570"], confirm: ["22–23 พ.ค. 2570"] },
  { no: "04", name: "Direct Admission", apply: ["29 พ.ค. – 15 มิ.ย. 2570", "สมัครผ่านมหาวิทยาลัย"], result: ["ครั้งที่ 1: 7 มิ.ย. 2570", "ครั้งที่ 2: 18 มิ.ย. 2570"], confirm: ["ครั้งที่ 1: 7–8 มิ.ย. 2570", "ครั้งที่ 2: 18–19 มิ.ย. 2570"] },
];
