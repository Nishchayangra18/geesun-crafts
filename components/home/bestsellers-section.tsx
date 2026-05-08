"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import type { Product } from "@/lib/types";

type BestsellersSectionProps = {
  products: Product[];
};

function getCardsPerView(width: number) {
  if (width >= 1280) return 4;
  if (width >= 768) return 2;
  return 1;
}

export function BestsellersSection({ products }: BestsellersSectionProps) {
  const [cardsPerView, setCardsPerView] = useState(() =>
    typeof window === "undefined" ? 4 : getCardsPerView(window.innerWidth)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const gapPx = 24;

  const maxStartIndex = Math.max(0, products.length - cardsPerView);
  const canScrollLeft = activeIndex > 0;
  const canScrollRight = activeIndex < maxStartIndex;

  useEffect(() => {
    function handleResize() {
      setCardsPerView(getCardsPerView(window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxStartIndex));
  }, [maxStartIndex]);

  function scrollByCards(direction: 1 | -1) {
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return 0;
      if (next > maxStartIndex) return maxStartIndex;
      return next;
    });
  }

  const cardBasis = useMemo(() => {
    if (cardsPerView <= 1) return "calc(100% - 0px)";
    if (cardsPerView === 2) return `calc((100% - ${gapPx}px) / 2)`;
    return `calc((100% - ${gapPx * 3}px) / 4)`;
  }, [cardsPerView]);

  const trackTransform = useMemo(() => {
    return `translateX(calc(${activeIndex} * -1 * (${cardBasis} + ${gapPx}px)))`;
  }, [activeIndex, cardBasis]);

  return (
    <section id="bestsellers" className="bg-transparent py-16 xl:py-24">
      <div className="mx-auto w-full max-w-[1680px] px-6 md:px-10 xl:px-16">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#6C7558]">
              <span aria-hidden className="text-[0.65rem]">◆</span>
              MOST LOVED
            </p>
            <h2 className="mt-2 font-[var(--font-heading)] text-5xl font-semibold tracking-tight text-[#1f1a17] xl:text-6xl">
              Bestsellers
            </h2>
            <p className="mt-2 text-base text-[#6f685f]">Most loved pieces from our art community.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center rounded-full bg-[#5A7442] px-8 text-base font-semibold text-white shadow-[0_8px_20px_rgba(66,84,49,0.3)] transition hover:bg-[#4f673a]"
            >
              View All
            </Link>
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canScrollLeft}
              aria-label="Scroll bestsellers left"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6DDCF] bg-[#F7F2E9] text-[#7C8570] shadow-[0_8px_18px_rgba(97,83,63,0.12)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden className="text-xl leading-none">←</span>
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canScrollRight}
              aria-label="Scroll bestsellers right"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6DDCF] bg-[#F7F2E9] text-[#3A382F] shadow-[0_8px_18px_rgba(97,83,63,0.12)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden className="text-xl leading-none">→</span>
            </button>
          </div>
        </div>

        <div className="relative mt-8 flex flex-col gap-6 xl:flex-row">
          <article className="min-h-[510px] rounded-[32px] bg-[linear-gradient(135deg,#2f4a22_0%,#4f733c_100%)] p-10 text-[#F6F2E8] shadow-[0_18px_36px_rgba(51,69,37,0.22)] xl:w-[16%] xl:min-w-[270px]">
            <div className="flex h-full flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.25em] text-[#D8CCB3]">BESTSELLERS</p>
              <div className="mt-4 h-px w-full bg-[#C8BCA4]/40" />
              <h3 className="mt-6 font-[var(--font-heading)] text-5xl leading-[1.02] tracking-tight">Most Loved Artworks</h3>
              <p className="mt-5 max-w-[12ch] text-[1.02rem] leading-[1.45] text-[#F0E8DA]">
                Most loved pieces from our art community.
              </p>
              <Link
                href="/shop"
                className="mt-8 inline-flex w-fit items-center gap-3 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold !text-black shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
              >
                View All Products
                <span aria-hidden className="!text-black">→</span>
              </Link>
            </div>
          </article>

          <div className="relative flex-1 overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: trackTransform }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="shrink-0"
                  style={{ flexBasis: cardBasis, minWidth: cardBasis, maxWidth: cardBasis }}
                >
                  <ProductCard
                    product={product}
                    className="h-full rounded-[28px] border border-[#E7DAC8] bg-[#FBF8F2] shadow-[0_10px_26px_rgba(72,56,36,0.08)] transition duration-300 hover:-translate-y-1 [&_.relative.block]:h-56 [&_.relative.block]:overflow-hidden [&_.relative.block]:rounded-t-[28px] [&_.relative.block]:bg-[#EFEBE3] [&_.space-y-3]:space-y-2.5 [&_.space-y-3]:p-4 [&_h3]:text-[3rem] [&_h3]:leading-[0.98] [&_.text-xs.uppercase]:tracking-[0.3em]"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canScrollRight}
              aria-label="Next bestseller products"
              className="absolute right-2 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#E6DDCF] bg-[#F7F2E9] text-[#3A382F] shadow-[0_10px_22px_rgba(97,83,63,0.14)] transition hover:scale-105 lg:flex disabled:opacity-50"
            >
              <span aria-hidden className="text-2xl leading-none">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
