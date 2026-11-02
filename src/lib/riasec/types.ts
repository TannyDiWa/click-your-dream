export type RiasecType =
  | "realistic"
  | "investigative"
  | "artistic"
  | "social"
  | "enterprising"
  | "conventional";

/** Fixed RIASEC order; also the tie-break order when two scores are equal. */
export const RIASEC_ORDER: RiasecType[] = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
];

/** Database `riasec_letter` ↔ the type names used in the app. */
export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export const LETTER_TO_TYPE: Record<RiasecLetter, RiasecType> = {
  R: "realistic",
  I: "investigative",
  A: "artistic",
  S: "social",
  E: "enterprising",
  C: "conventional",
};

export const isRiasecLetter = (v: unknown): v is RiasecLetter =>
  typeof v === "string" && v in LETTER_TO_TYPE;

/** Matches the `user_group` enum in the database design. */
export type UserGroup = "high_school" | "university" | "working";

export const USER_GROUPS: { value: UserGroup; title: string; description: string }[] = [
  { value: "high_school", title: "กำลังเรียน ม.ปลาย", description: "กำลังมองหาคณะและมหาวิทยาลัยที่ใช่" },
  { value: "university", title: "กำลังเรียนมหาวิทยาลัย", description: "อยากรู้ว่าเส้นทางอาชีพไหนเหมาะกับตัวเอง" },
  { value: "working", title: "ทำงานแล้ว", description: "อยากสำรวจงานใหม่ หรือมองหาการเรียนต่อ" },
];

export type Character = {
  type: RiasecType;
  letter: "R" | "I" | "A" | "S" | "E" | "C";
  nameTh: string;
  src: string;
  width: number;
  height: number;
};

// Mascot for each RIASEC type; image sizes match the files in public/characters.
export const CHARACTERS: Record<RiasecType, Character> = {
  realistic: { type: "realistic", letter: "R", nameTh: "นักลงมือทำ", src: "/characters/realistic.webp", width: 521, height: 640 },
  investigative: { type: "investigative", letter: "I", nameTh: "นักค้นคว้า", src: "/characters/investigative.webp", width: 558, height: 640 },
  artistic: { type: "artistic", letter: "A", nameTh: "นักสร้างสรรค์", src: "/characters/artistic.webp", width: 447, height: 640 },
  social: { type: "social", letter: "S", nameTh: "นักช่วยเหลือ", src: "/characters/social.webp", width: 563, height: 640 },
  enterprising: { type: "enterprising", letter: "E", nameTh: "นักบริหาร", src: "/characters/enterprising.webp", width: 523, height: 640 },
  conventional: { type: "conventional", letter: "C", nameTh: "นักจัดระบบ", src: "/characters/conventional.webp", width: 536, height: 640 },
};
