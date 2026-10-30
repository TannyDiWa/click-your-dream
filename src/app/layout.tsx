import type { Metadata } from "next";
import { Mali } from "next/font/google";
import "./globals.css";

const mali = Mali({
  variable: "--font-mali",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Click your dream — Find your future",
  description:
    "ทำแบบทดสอบความสนใจ RIASEC แล้วค้นหาอาชีพและสาขาที่ใช่สำหรับคุณ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${mali.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
