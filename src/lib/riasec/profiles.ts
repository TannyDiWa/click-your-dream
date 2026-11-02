import type { RiasecType } from "./types";

/** Short label for each interest, used in score bars and chips. */
export const DIMENSION_LABELS: Record<RiasecType, { long: string; short: string }> = {
  realistic: { long: "การลงมือทำ", short: "ลงมือทำ" },
  investigative: { long: "การค้นคว้า", short: "ค้นคว้า" },
  artistic: { long: "ความคิดสร้างสรรค์", short: "สร้างสรรค์" },
  social: { long: "การช่วยเหลือผู้คน", short: "ช่วยเหลือ" },
  enterprising: { long: "การริเริ่มและนำทีม", short: "นำทีม" },
  conventional: { long: "การจัดการเป็นระบบ", short: "จัดระบบ" },
};
