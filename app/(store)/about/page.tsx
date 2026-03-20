import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="container-shell section-space">
      <div className="card-surface grid gap-7 overflow-hidden p-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80"
            alt="Geesun crafts studio"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>

        <div className="self-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">Our Story</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-5xl">Family-Led Artistry, Made in India</h1>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Geesun Crafts began as a family studio preserving handcrafted painting techniques passed down through
            generations. Every collection is curated to bring soulful, gallery-like elegance into modern homes.
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            We collaborate with independent Indian artists, ensure fair pay, and finish every piece with premium
            materials so your art investment stays timeless.
          </p>
        </div>
      </div>
    </section>
  );
}
