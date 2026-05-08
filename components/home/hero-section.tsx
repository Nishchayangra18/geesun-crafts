"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

type HeroSectionProps = {
  heroImage: string;
};

export function HeroSection({ heroImage }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, 20]);
  const contentY = useTransform(scrollY, [0, 500], [0, -8]);

  const benefits = [
    {
      title: "Original Artwork",
      copy: "100% unique and made with passion",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path d="M4 12c0-4.4 3.6-8 8-8 4.1 0 7.4 3 7.9 6.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M20 12c0 4.4-3.6 8-8 8-4 0-7.3-2.9-7.9-6.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="m8.2 12.6 2.2 2.2 5.2-5.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Premium Quality",
      copy: "High-grade canvas and materials",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path d="M4.5 19.5 17.8 6.2a2.2 2.2 0 0 1 3.1 3.1L7.6 22.6H4.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="m14.7 9.3 3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Secure Packaging",
      copy: "Safe delivery with care and love",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path d="m12 3 8 4.4v9.2L12 21l-8-4.4V7.4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M4 7.4 12 12l8-4.6M12 12v9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Easy Returns",
      copy: "Hassle-free returns within 7 days",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path d="M8 7H4V3M20 17h-4v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.7 8.4A8 8 0 0 1 18.9 7M19.3 15.6A8 8 0 0 1 5.1 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="px-6 pb-28 pt-8 lg:px-12 lg:pb-36">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative mx-auto grid w-full max-w-[1440px] overflow-visible border border-[#E7DDCF] bg-[#FBF8F3] shadow-[0_24px_48px_rgba(56,44,30,0.08)] lg:grid-cols-2"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[6%] top-[22%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(247,220,179,0.36),rgba(251,248,243,0)_72%)]" />
          <div className="absolute right-[10%] top-[12%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(107,125,94,0.12),rgba(251,248,243,0)_70%)]" />
          <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(130deg,rgba(255,255,255,0.55),rgba(255,255,255,0)_48%)]" />
        </div>

        <motion.div style={{ y: contentY }} className="relative z-10 self-center px-7 py-10 sm:px-10 lg:px-14 lg:py-16">
          <div className="mb-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6B7D5E] sm:text-xs">
            <span className="h-px w-8 bg-[#9AAE8A]" />
            TIMELESS ART, MADE WITH PASSION
          </div>
          <h1 className="max-w-xl font-[var(--font-heading)] text-[3.05rem] leading-[0.96] text-[#2A241F] sm:text-[4rem] lg:text-[5.2rem]">
            Art That Feels.
            <br />
            Decor That
            <br />
            Speaks.
          </h1>
          <p className="mt-6 max-w-[500px] text-base leading-[1.75] text-[#7A7267] sm:text-[1.05rem]">
            Discover original artworks that bring emotion, elegance, and personality into your space.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
              <Link href="/shop" className="inline-flex h-14 items-center justify-center rounded-full border border-[#6B7D5E] bg-[#6B7D5E] px-9 text-base font-medium text-white shadow-[0_10px_24px_rgba(107,125,94,0.28)] transition-all duration-300 hover:bg-[#5D6F52] hover:shadow-[0_14px_26px_rgba(107,125,94,0.34)]">
                Shop Collection
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link href="/about" className="group inline-flex h-14 items-center justify-center gap-2 rounded-full border border-[#C8B79F] bg-transparent px-8 text-base font-medium text-[#5E6E54] transition-all duration-300 hover:bg-[#6B7D5E] hover:text-white">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                  <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3.5 19.5c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5M15 9h6M18 6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                About Us
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          style={{ y: imageY }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="group relative min-h-[420px] overflow-hidden bg-[#F7F2EA] sm:min-h-[560px]"
        >
          <div className="absolute left-0 top-0 h-[62%] w-[74%] rounded-bl-[120px] bg-[#F1E8DA]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,249,240,0.8),rgba(247,242,234,0)_48%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(122deg,rgba(255,255,255,0.28)_8%,rgba(255,255,255,0)_38%)]" />
          <div className="absolute bottom-10 right-8 h-40 w-28 rounded-[46%_54%_55%_45%/50%_40%_60%_50%] border border-[#DFD3C1] bg-[linear-gradient(145deg,#F8F0E3,#EEDFC8)] shadow-[0_16px_32px_rgba(77,60,39,0.15)] sm:h-52 sm:w-36">
            <div className="absolute left-1/2 top-[37%] h-11 w-11 -translate-x-1/2 rounded-full border border-[#D2C2AA] sm:h-14 sm:w-14" />
          </div>
          <div className="absolute bottom-[132px] right-[95px] hidden h-36 w-14 rotate-[6deg] sm:block">
            <div className="absolute bottom-0 left-1/2 h-24 w-[2px] -translate-x-1/2 bg-[#6B7D5E]/45" />
            <span className="absolute left-4 top-3 h-5 w-8 rotate-[20deg] rounded-[100%_0_100%_0] border border-[#8DA17E] bg-[#B7C7AB]/55" />
            <span className="absolute left-0 top-10 h-5 w-7 -rotate-[12deg] rounded-[100%_0_100%_0] border border-[#8DA17E] bg-[#C4D1BB]/55" />
            <span className="absolute left-6 top-12 h-5 w-7 rotate-[15deg] rounded-[100%_0_100%_0] border border-[#8DA17E] bg-[#C7D3BE]/55" />
            <span className="absolute left-2 top-[4.3rem] h-4 w-6 rotate-[28deg] rounded-[100%_0_100%_0] border border-[#8DA17E] bg-[#B4C5A8]/55" />
          </div>
          <div className="absolute bottom-8 left-[9%] right-[15%] h-4 rounded-full bg-[rgba(127,91,52,0.22)] blur-xl" />

          <motion.div
            whileHover={{ scale: 1.025 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute bottom-[2.3rem] left-[18%] right-[22%]"
          >
            <div className="relative overflow-hidden border border-[#A4784D]/35 bg-[#D5B186] shadow-[0_18px_36px_rgba(68,48,28,0.3)]">
              <Image
                src={heroImage}
                alt="Luxury artwork display"
                width={960}
                height={1300}
                priority
                className="image-zoom aspect-[4/5] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65, ease: "easeOut" }}
          className="absolute -bottom-24 left-6 right-6 z-20 md:-bottom-24 md:left-10 md:right-10 lg:-bottom-20 lg:left-[5%] lg:right-[5%]"
        >
          <div className="rounded-[24px] border border-[#EEE3D2] bg-[rgba(255,255,255,0.75)] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-[10px] sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
              {benefits.map((item, index) => (
                <article
                  key={item.title}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2 sm:px-4 ${
                    index < benefits.length - 1 ? "lg:border-r lg:border-[#E9DECD]" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F4EEE4] text-[#6B7D5E]">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-[1.06rem] font-semibold text-[#2A241F]">{item.title}</h3>
                    <p className="mt-1 text-[0.95rem] leading-[1.45] text-[#6f675c]">{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
