"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import type { Product } from "@/lib/types";

type ProductCarouselProps = {
  products: Product[];
  ariaLabel: string;
};

function getCardsPerView(width: number) {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

export function ProductCarousel({ products, ariaLabel }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [visibleIndexes, setVisibleIndexes] = useState<Set<number>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(products.length > 0);

  const itemIds = useMemo(() => products.map((item) => item.id), [products]);

  const updateArrowState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const maxLeft = node.scrollWidth - node.clientWidth - 1;
    setCanScrollLeft(node.scrollLeft > 2);
    setCanScrollRight(node.scrollLeft < maxLeft);
  }, []);

  useEffect(() => {
    updateArrowState();
    const node = scrollRef.current;
    if (!node) return;

    const onScroll = () => updateArrowState();
    node.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      node.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [updateArrowState]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndexes((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const indexAttr = entry.target.getAttribute("data-index");
            const index = indexAttr ? Number(indexAttr) : -1;
            if (index < 0) return;
            if (entry.isIntersecting) next.add(index);
          });
          return next;
        });
      },
      { root: node, threshold: 0.35 }
    );

    const cards = Array.from(node.querySelectorAll("[data-index]"));
    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [itemIds]);

  function scrollByCards(direction: 1 | -1) {
    const node = scrollRef.current;
    if (!node) return;

    const card = node.querySelector<HTMLElement>("[data-card='true']");
    if (!card) return;

    const styles = window.getComputedStyle(node);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
    const cardsPerView = getCardsPerView(window.innerWidth);
    const amount = (card.offsetWidth + gap) * cardsPerView;

    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    if (!node || event.button !== 0) return;

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: node.scrollLeft,
    };
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    if (!node || !dragStateRef.current.active) return;
    event.preventDefault();
    const deltaX = event.clientX - dragStateRef.current.startX;
    node.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  }

  function stopDragging() {
    dragStateRef.current.active = false;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        disabled={!canScrollLeft}
        aria-label={`Scroll ${ariaLabel} left`}
        className="absolute top-1/2 left-0 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#dccbb5] bg-[#f6f1ea] text-[var(--text-muted)] shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#e9ddcd] hover:text-[var(--olive)] hover:shadow-[0_10px_22px_rgba(89,71,46,0.2)] disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
      >
        <span aria-hidden>&larr;</span>
      </button>

      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pr-10 touch-pan-y"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            data-index={index}
            data-card="true"
            className={`snap-start shrink-0 min-w-[calc(100%-0.5rem)] sm:min-w-[calc((100%-1rem)/2)] lg:min-w-[calc((100%-3rem)/4)] ${
              visibleIndexes.has(index) ? "carousel-card-in" : "carousel-card-out"
            }`}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-12 bg-gradient-to-r from-[var(--background)] to-transparent lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-12 bg-gradient-to-l from-[var(--background)] to-transparent lg:block"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => scrollByCards(1)}
        disabled={!canScrollRight}
        aria-label={`Scroll ${ariaLabel} right`}
        className="absolute top-1/2 right-0 z-10 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#dccbb5] bg-[#f6f1ea] text-[var(--text-muted)] shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#e9ddcd] hover:text-[var(--olive)] hover:shadow-[0_10px_22px_rgba(89,71,46,0.2)] disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
      >
        <span aria-hidden>&rarr;</span>
      </button>
    </div>
  );
}
