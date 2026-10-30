import type { ComponentType, SVGProps } from "react";
import { BulbIcon, ChecklistIcon, MapIcon, StarIcon } from "@/components/icons";

type Step = {
  title: string;
  body: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClass: string;
};

const STEPS: Step[] = [
  {
    title: "ทำแบบทดสอบ",
    body: "ตอบคำถามสั้นๆ เกี่ยวกับความสนใจ บุคลิกภาพ และความชอบของคุณ",
    Icon: ChecklistIcon,
    iconClass: "stroke-ink",
  },
  {
    title: "ดูผลลัพธ์",
    body: "รับคำแนะนำเกี่ยวกับแนวทางอาชีพ คณะ และสายอาชีพที่เหมาะกับคุณ",
    Icon: BulbIcon,
    iconClass: "stroke-ink fill-sun",
  },
  {
    title: "สำรวจเส้นทาง",
    body: "เรียนรู้ข้อมูลเพิ่มเติมเกี่ยวกับเส้นทางที่สนใจ",
    Icon: MapIcon,
    iconClass: "stroke-ink fill-sky",
  },
  {
    title: "ก้าวสู่อนาคต",
    body: "วางแผนและเริ่มต้นเส้นทางในแบบของคุณ!",
    Icon: StarIcon,
    iconClass: "stroke-ink fill-sun",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-8 sm:pt-14">
        <h2
          id="how-it-works"
          className="flex items-center justify-center gap-3 text-2xl font-medium"
        >
          <StarIcon className="size-4 fill-white stroke-dream" strokeWidth={1.6} />
          How it works?
          <StarIcon className="size-4 fill-white stroke-dream" strokeWidth={1.6} />
        </h2>

        <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[1fr_220px] lg:items-center">
          <ol className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {STEPS.map(({ title, body, Icon, iconClass }, i) => (
              <li key={title} className="flex flex-col items-center text-center">
                <span className="grid size-16 place-items-center rounded-full bg-bubble sm:size-20">
                  <Icon className={`size-8 sm:size-10 ${iconClass}`} strokeWidth={1.6} />
                </span>
                <h3 className="mt-3 flex items-center gap-2 text-base font-semibold sm:mt-4 sm:text-lg">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#5b8de0] text-sm font-medium text-white">
                    {i + 1}
                  </span>
                  {title}
                </h3>
                <p className="mt-2 max-w-[14rem] text-[13px] leading-relaxed text-ink/80 sm:text-sm">{body}</p>
              </li>
            ))}
          </ol>

          <p className="text-center text-lg leading-relaxed">
            ไม่ว่าคุณจะฝันอะไร
            <br />
            เราพร้อมเป็นส่วนหนึ่ง
            <br />
            ในการเดินทางของคุณ
            <br />
            <span aria-hidden>♡</span>
          </p>
        </div>
      </div>
    </section>
  );
}
