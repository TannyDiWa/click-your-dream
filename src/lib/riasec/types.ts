export type RiasecType =
  | "realistic"
  | "investigative"
  | "artistic"
  | "social"
  | "enterprising"
  | "conventional";

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
