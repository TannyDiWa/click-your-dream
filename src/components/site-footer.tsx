import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-cream text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 sm:flex-row sm:px-8">
        <p>© Click your dream · Find your future</p>
        <nav aria-label="ลิงก์ท้ายเว็บ" className="sm:ml-auto">
          <ul className="flex gap-5">
            <li>
              <Link href="/about" className="transition-colors hover:text-dream">
                เกี่ยวกับเรา
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="font-semibold text-ink underline underline-offset-4 transition-colors hover:text-dream">
                ประกาศความเป็นส่วนตัว
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
