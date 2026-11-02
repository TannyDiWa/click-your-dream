// Privacy notice details shown on /privacy and in the consent popup.
// Values in [brackets] must be filled in by the team before launch.
export const PRIVACY = {
  /** Stored in profiles.pdpa_notice_version; change it whenever the notice changes so visitors consent again. */
  version: "2026-11-03",
  effectiveDate: "[วันที่เริ่มใช้]",
  controller: "[ชื่อทีม/หน่วยงาน]",
  contactEmail: "[อีเมลติดต่อ]",
  /** Project Settings → General in Supabase */
  supabaseRegion: "[ประเทศ/region ของ Supabase project]",
  /** Must match purge_inactive_guests() in supabase/migrations/20261103000000_pdpa_consent.sql */
  retention: "1 ปีนับจากทำแบบทดสอบครั้งล่าสุด",
};
