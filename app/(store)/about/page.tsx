import Image from "next/image";
import Link from "next/link";

const featureCards = [
  {
    title: "Artist-Led Creations",
    text: "Designed and curated by a professional artist, never generic mass-market selections.",
    icon: "palette",
  },
  {
    title: "Luxury within Reach",
    text: "Luxury aesthetics without the limitations of original artwork pricing.",
    icon: "gem",
  },
  {
    title: "Versatile Formats",
    text: "Multiple sizes, layouts, and compositions to suit every wall.",
    icon: "frame",
  },
  {
    title: "Thoughtful Collections",
    text: "Curated for modern homes, offices, studios, cafes, and premium spaces.",
    icon: "layers",
  },
  {
    title: "Inspired by Nature",
    text: "Fresh designs inspired by art, nature, urban life, and evolving contemporary trends.",
    icon: "leaf",
  },
] as const;

const artistPoints = [
  "Nature and changing moods",
  "Urban energy and modern life",
  "Spiritual depth and inner balance",
  "A sense of identity for your space",
  "Emotion and storytelling on your walls",
  "A balance of aesthetics and meaning",
];

function FeatureIcon({ icon }: { icon: (typeof featureCards)[number]["icon"] }) {
  const baseClass = "h-5 w-5 text-[var(--accent-gold)]";

  if (icon === "palette") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={baseClass} aria-hidden>
        <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1.5a2.5 2.5 0 1 1 0-5H15a4 4 0 0 0 0-8h-3Z" />
        <circle cx="7.5" cy="10" r="1" />
        <circle cx="10" cy="7.5" r="1" />
      </svg>
    );
  }

  if (icon === "gem") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={baseClass} aria-hidden>
        <path d="m3 9 4-4h10l4 4-9 11L3 9Z" />
        <path d="M7 5 12 20M17 5 12 20M3 9h18" />
      </svg>
    );
  }

  if (icon === "frame") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={baseClass} aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <path d="M8 8h8v8H8z" />
      </svg>
    );
  }

  if (icon === "layers") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={baseClass} aria-hidden>
        <path d="m12 4 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={baseClass} aria-hidden>
      <path d="M5 13c4-1 6-5 6-9 4 2 8 6 8 11a6 6 0 0 1-12 0c0-.7.1-1.4.3-2Z" />
      <path d="M9 15c1.8-.3 3-1.8 3-4.2 2.1 1.2 3.2 2.8 3.2 4.7a3.2 3.2 0 1 1-6.4 0c0-.2 0-.3.2-.5Z" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <section className="container-shell section-space">
      <div className="space-y-9 lg:space-y-12">
        <article className="card-surface fade-in-on-scroll grid items-center gap-7 overflow-hidden p-4 sm:p-6 lg:grid-cols-[1.04fr_1fr] lg:gap-9 lg:p-8">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border-soft)]">
            <Image
              src="https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80"
              alt="Curated Geesun Crafts wall decor in a premium interior"
              fill
              className="image-zoom object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <Link
              href="/shop"
              className="absolute bottom-4 left-4 rounded-xl border border-[var(--border-soft)] bg-[#f7f0e3] px-4 py-2 text-sm text-[var(--text-primary)] shadow-[0_8px_20px_rgba(89,71,46,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f9f3e8]"
            >
              Shop Our Collection
            </Link>
          </div>

          <div className="self-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">About Geesun Crafts</p>
            <h1 className="mt-2 font-[var(--font-heading)] text-4xl leading-tight text-[#3d342f] sm:text-5xl">
              Art That Feels. Decor That Speaks.
            </h1>
            <p className="mt-4 text-base text-[var(--text-muted)]">
              Geesun Crafts is a modern wall decor brand born from the vision of an artist, created to bring meaningful,
              high-quality art into everyday spaces.
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              In a world where original paintings are often limited by high cost and fixed sizes, we bridge the gap
              between authentic art and practical living. Our premium art prints capture the essence, emotion, and
              depth of original artworks while offering flexibility to match your space, style, and budget.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Each piece is thoughtfully curated to elevate interiors across contemporary homes, refined offices, and
              premium commercial spaces.
            </p>
          </div>
        </article>

        <hr className="soft-divider my-1" />

        <section className="fade-in-on-scroll">
          <h2 className="font-[var(--font-heading)] text-4xl leading-tight text-[#3d342f] sm:text-5xl">
            Premium Art. Purposeful Living.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-muted)]">
            Geesun Crafts offers premium elegance and practical versatility for spaces that deserve depth, mood, and
            meaning.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((item) => (
              <article key={item.title} className="premium-hover-card group h-full rounded-2xl border border-[var(--border-soft)] bg-[#f8f2e7] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[#f4ecde]">
                    <FeatureIcon icon={item.icon} />
                  </div>
                  <div>
                    <h3 className="font-[var(--font-heading)] text-xl leading-snug text-[#413730]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="fade-in-on-scroll">
          <div className="flex items-center gap-5 py-2 lg:gap-7">
            <span className="h-px flex-1 bg-[var(--border-soft)]" />
            <p className="font-[var(--font-heading)] text-center text-2xl italic leading-relaxed text-[#4a4038] sm:text-3xl">
              &ldquo;Don&apos;t just decorate your wall. Define your space.&rdquo;
            </p>
            <span className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>
        </section>

        <article className="card-surface fade-in-on-scroll grid gap-6 overflow-hidden p-6 sm:p-7 lg:grid-cols-[1.06fr_0.94fr] lg:gap-9 lg:p-8">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">About The Artist</p>
              <h2 className="mt-2 font-[var(--font-heading)] text-4xl leading-tight text-[#3d342f] sm:text-5xl">
                Sunil Angra
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                Sunil Angra is a contemporary artist with over 25 years of experience, known for his abstract and
                semi-abstract works that blend emotion, texture, and visual harmony.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                His artistic journey is rooted in a deep understanding of colour, composition, and human emotion,
                allowing him to create works that are not just seen, but felt.
              </p>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
              <blockquote className="rounded-2xl bg-[#f7efe2] p-4 text-center lg:text-left">
                <p className="font-[var(--font-heading)] text-3xl italic leading-tight text-[#4a4038]">“</p>
                <p className="mt-1 font-[var(--font-heading)] text-3xl italic leading-snug text-[#4a4038]">
                  Art should not be exclusive to galleries.
                </p>
                <p className="mt-2 font-[var(--font-heading)] text-2xl italic leading-snug text-[#4a4038]">
                  It should live in homes, inspire daily life, and connect with people.
                </p>
                <p className="mt-2 text-right font-[var(--font-heading)] text-3xl italic leading-none text-[#4a4038]">
                  ”
                </p>
              </blockquote>

              <span className="hidden h-full w-px bg-[var(--border-soft)] lg:block" aria-hidden />

              <ul className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {artistPoints.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--olive)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="group relative order-last overflow-hidden rounded-2xl border border-[var(--border-soft)] shadow-[0_16px_32px_rgba(89,71,46,0.14)] lg:order-none">
            <Image
              src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1000&q=80"
              alt="Artist portrait placeholder for Sunil Angra"
              width={980}
              height={1200}
              className="image-zoom h-full w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          <p className="text-sm leading-relaxed text-[var(--text-muted)] lg:col-span-2">
            With every piece, you&apos;re not just buying decor - you&apos;re bringing an artist&apos;s vision into your life.
          </p>
        </article>
      </div>
    </section>
  );
}
