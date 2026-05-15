import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Custom Order | Geesun Crafts",
  description: "Personalized paintings tailored for you by Geesun Crafts.",
};

export default function CustomOrderPage() {
  return (
    <section className="container-shell section-space">
      <div className="card-surface grid overflow-hidden bg-[#FBF8F2] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[#6C7558]">Custom Artwork</p>
          <h1 className="mt-3 font-[var(--font-heading)] text-5xl font-semibold leading-tight text-[#1f1a17] sm:text-6xl">
            Personalized paintings tailored for you.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
            Commission a handmade piece shaped around your space, palette, size, and gifting moment.
          </p>
          <Link href="/contact" className="olive-btn mt-7 inline-flex w-fit rounded-full px-7 py-3 text-sm font-medium">
            Start Custom Order
          </Link>
        </div>
        <div className="relative min-h-[360px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80"
            alt="Artist painting a custom artwork"
            fill
            className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 48vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
