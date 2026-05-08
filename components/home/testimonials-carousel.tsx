"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { Testimonial } from "@/lib/types";

type TestimonialsCarouselProps = {
  testimonials: Testimonial[];
};

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-[var(--border-soft)] bg-[#f7f0e5] p-4 shadow-[0_16px_35px_rgba(73,61,45,0.08)] sm:p-6">
        <AnimatePresence mode="wait">
          <motion.article
            key={testimonials[active].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="grid gap-4 md:grid-cols-3"
          >
            {testimonials.map((item, index) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  index === active
                    ? "border-[#ccb89c] bg-[#fffaf3] shadow-[0_10px_25px_rgba(93,74,53,0.14)]"
                    : "border-[#e0d2bd] bg-[#f9f4eb]"
                }`}
              >
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.message}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#d9c9b0]">
                    <Image
                      src={item.image ?? "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80"}
                      alt={item.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2f2823]">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8f836f]">{item.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.article>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {testimonials.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`View testimonial ${index + 1}`}
            onClick={() => setActive(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === active ? "w-6 bg-[#6B7D5E]" : "w-2.5 bg-[#cabba3]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
