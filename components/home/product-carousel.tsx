"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import type { Product } from "@/lib/types";

type ProductCarouselProps = {
  products: Product[];
  ariaLabel: string;
  desktopCards?: number;
  className?: string;
  cardClassName?: string;
  arrowsOutside?: boolean;
};

function getCardsPerView(width: number, desktopCards: number) {
  if (width >= 1024) return desktopCards;
  if (width >= 640) return 2;
  return 1;
}

export function ProductCarousel({
  products,
  ariaLabel,
  desktopCards = 3,
  className = "",
  cardClassName = "",
  arrowsOutside = false,
}: ProductCarouselProps) {
  const [cardsPerView, setCardsPerView] = useState(() =>
    typeof window === "undefined" ? desktopCards : getCardsPerView(window.innerWidth, desktopCards)
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const maxStartIndex = Math.max(0, products.length - cardsPerView);
  const canScrollLeft = activeIndex > 0;
  const canScrollRight = activeIndex < maxStartIndex;
  const gapPx = 16;

  useEffect(() => {
    function handleResize() {
      const nextCardsPerView = getCardsPerView(window.innerWidth, desktopCards);
      setCardsPerView(nextCardsPerView);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [desktopCards]);

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
    return `calc((100% - ${gapPx * 2}px) / 3)`;
  }, [cardsPerView]);

  const trackTransform = useMemo(() => {
    return `translateX(calc(${activeIndex} * -1 * (${cardBasis} + ${gapPx}px)))`;
  }, [activeIndex, cardBasis]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  function onTouchStart(clientX: number) {
    setTouchStartX(clientX);
  }

  function onTouchEnd(clientX: number) {
    if (touchStartX === null) return;
    const delta = clientX - touchStartX;
    if (Math.abs(delta) < 40) return;
    scrollByCards(delta < 0 ? 1 : -1);
    setTouchStartX(null);
  }

  return (
    <div className={`relative w-full max-w-full overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        disabled={!canScrollLeft}
        aria-label={`Scroll ${ariaLabel} left`}
        className={`absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCCBB5] bg-[#FBF7F0] text-[#6B7D5E] shadow-[0_10px_20px_rgba(78,64,46,0.12)] transition-all duration-300 hover:scale-105 hover:bg-[#EFE3D1] disabled:cursor-not-allowed disabled:opacity-60 lg:flex ${
          arrowsOutside ? "left-1 -translate-x-1/2" : "left-3"
        }`}
      >
        <span aria-hidden className="text-lg leading-none">←</span>
      </button>

      <div
        role="region"
        aria-label={ariaLabel}
        className="relative w-full overflow-hidden"
        onTouchStart={(event) => onTouchStart(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <div
          className="flex gap-4 transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: trackTransform }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0"
              style={{ flexBasis: cardBasis, minWidth: cardBasis, maxWidth: cardBasis }}
            >
              <ProductCard product={product} className={cardClassName} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-10 bg-gradient-to-r from-[var(--background)] to-transparent lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-10 bg-gradient-to-l from-[var(--background)] to-transparent lg:block"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => scrollByCards(1)}
        disabled={!canScrollRight}
        aria-label={`Scroll ${ariaLabel} right`}
        className={`absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCCBB5] bg-[#FBF7F0] text-[#6B7D5E] shadow-[0_10px_20px_rgba(78,64,46,0.12)] transition-all duration-300 hover:scale-105 hover:bg-[#EFE3D1] disabled:cursor-not-allowed disabled:opacity-60 lg:flex ${
          arrowsOutside ? "right-1 translate-x-1/2" : "right-3"
        }`}
      >
        <span aria-hidden className="text-lg leading-none">→</span>
      </button>
    </div>
  );
}
