import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";

export default function Home() {
  return (
    <>
      <SiteHeader current="/" />
      <main className="flex-1 bg-lavender">
        <Hero />
        <HowItWorks />
      </main>
    </>
  );
}
