// Privacy notice details shown on /privacy and in the consent popup.
export const PRIVACY = {
  /** Stored in profiles.pdpa_notice_version; change it whenever the notice changes so visitors consent again. */
  version: "2026-11-03",
  effectiveDate: "3 พฤศจิกายน 2569",
  controller: "ทีมพัฒนา Click your dream",
  contactEmail: "click.your.dream.team@gmail.com",
  /** Project Settings → General in Supabase */
  supabaseRegion: "ประเทศสิงคโปร์",
  /** Must match purge_inactive_guests() in supabase/migrations/20261103000000_pdpa_consent.sql */
  retention: "1 ปีนับจากทำแบบทดสอบครั้งล่าสุด",
};
