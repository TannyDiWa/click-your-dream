import Link from "next/link";
import { MenuIcon, StarIcon, UserIcon } from "@/components/icons";

const NAV = [
  { href: "/", label: "หน้าแรก" },
  { href: "/about", label: "เกี่ยวกับเรา" },
  { href: "/quiz", label: "แบบทดสอบ" },
  { href: "/history", label: "ผลลัพธ์ของฉัน" },
  { href: "/contact", label: "ติดต่อเรา" },
];

export function SiteHeader({ current = "/" }: { current?: string }) {
  return (
    <header className="sticky top-0 z-30 rounded-b-3xl bg-cream/95 shadow-[0_2px_12px_#2f3d7c14] backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-20 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <StarIcon className="size-7 fill-sun stroke-ink" strokeWidth={1.6} />
          <span className="whitespace-nowrap leading-tight">
            <span className="block text-base font-semibold sm:text-xl">Click your dream</span>
            <span className="hidden text-xs sm:block">Find your future</span>
          </span>
        </Link>

        {/* Laptop and up: inline links */}
        <nav aria-label="เมนูหลัก" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-8 text-[15px]">
            {NAV.map((item) => {
              const active = item.href === current;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "border-b-2 border-dream pb-1 font-semibold"
                        : "pb-1 transition-colors hover:text-dream"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/quiz"
          className="ml-auto whitespace-nowrap rounded-full bg-blush px-3 py-1.5 text-sm font-semibold text-white sm:px-4 sm:text-base lg:hidden"
        >
          แบบทดสอบ
        </Link>
        <Link
          href="/history"
          aria-label="โปรไฟล์ของฉัน"
          className="hidden size-10 shrink-0 place-items-center rounded-full bg-bubble transition-colors hover:bg-sky sm:grid lg:ml-6"
        >
          <UserIcon className="size-5" />
        </Link>

        {/* Phone and tablet: dropdown menu (no JS needed) */}
        <details className="group lg:hidden">
          <summary
            aria-label="เปิดเมนู"
            className="grid size-10 cursor-pointer list-none place-items-center rounded-full transition-colors hover:bg-bubble [&::-webkit-details-marker]:hidden"
          >
            <MenuIcon className="size-6" />
          </summary>
          <nav
            aria-label="เมนูหลัก"
            className="absolute inset-x-4 top-full mt-2 rounded-3xl bg-cream p-2 shadow-[0_12px_30px_#2f3d7c26] sm:left-auto sm:right-8 sm:w-64"
          >
            <ul>
              {NAV.map((item) => {
                const active = item.href === current;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-2xl px-4 py-3 transition-colors hover:bg-bubble ${active ? "bg-bubble font-semibold" : ""}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
