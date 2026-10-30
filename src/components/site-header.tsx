import Link from "next/link";
import { StarIcon, UserIcon } from "@/components/icons";

const NAV = [
  { href: "/", label: "หน้าแรก" },
  { href: "/about", label: "เกี่ยวกับเรา" },
  { href: "/quiz", label: "แบบทดสอบ" },
  { href: "/history", label: "ผลลัพธ์ของฉัน" },
  { href: "/contact", label: "ติดต่อเรา" },
];

export function SiteHeader({ current = "/" }: { current?: string }) {
  return (
    <header className="sticky top-0 z-20 rounded-b-3xl bg-cream/95 shadow-[0_2px_12px_#2f3d7c14] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <StarIcon className="size-7 fill-sun stroke-ink" strokeWidth={1.6} />
          <span className="whitespace-nowrap leading-tight">
            <span className="block text-base font-semibold sm:text-xl">Click your dream</span>
            <span className="hidden text-xs sm:block">Find your future</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="ml-auto hidden md:block">
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
          className="ml-auto whitespace-nowrap rounded-full bg-blush px-3 py-1.5 text-sm font-semibold text-white md:hidden"
        >
          แบบทดสอบ
        </Link>
        <Link
          href="/history"
          aria-label="โปรไฟล์ของฉัน"
          className="grid size-10 place-items-center rounded-full bg-bubble transition-colors hover:bg-sky md:ml-6"
        >
          <UserIcon className="size-5" />
        </Link>
      </div>
    </header>
  );
}
