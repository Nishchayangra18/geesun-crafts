import Image from "next/image";
import Link from "next/link";
import { ProductCarousel } from "@/components/home/product-carousel";
import { featuredArtist, categories, testimonials } from "@/lib/content/home-content";
import { fetchProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await fetchProducts();
  const bestsellers = products.filter((product) => product.bestseller);
  const featured = products.filter((product) => product.featured);
  const heroImage =
    products[0]?.image ??
    "https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=1200&q=80";
  const featuredProducts = featured;

  const categoryCards = categories.map((item) => ({
    ...item,
    description:
      item.title === "Abstract"
        ? "Expressive and emotional"
        : item.title === "Traditional"
          ? "Rich heritage, culture, and timeless"
          : item.title === "Modern"
            ? "Serene, minimal, and stylish"
            : "Personalized paintings tailored to you",
  }));

  return (
    <>
      <section className="container-shell section-space">
        <div className="card-surface fade-in-on-scroll grain-overlay grid items-center gap-7 overflow-hidden p-4 sm:p-6 lg:grid-cols-[1.15fr_0.95fr] lg:gap-10 lg:p-8">
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-soft)]">
            <Image
              src={heroImage}
              alt="Geesun Crafts premium room decor"
              width={1320}
              height={980}
              priority
              className="image-zoom aspect-[5/3] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#f4e8d533] via-transparent to-[#efe2cc55]" />
          </div>

          <div className="self-center">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-gold)]">About Geesun Crafts</p>
            <h1 className="mt-2 max-w-lg font-[var(--font-heading)] text-4xl leading-tight text-[#3d342f] sm:text-6xl">
              Art That Feels. Decor That Speaks.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
              Geesun Crafts is a premium wall decor brand created to bring meaningful, high-quality art into everyday
              spaces.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
              Our artist-led premium art prints preserve the essence and emotion of original artworks while offering
              flexibility to suit your home, office, and lifestyle.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="olive-btn rounded-full px-7 py-3 text-sm shadow-[0_12px_24px_rgba(107,125,94,0.28)]">
                Shop Now
              </Link>
              <Link href="/about" className="outline-btn rounded-full px-7 py-3 text-sm">
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <div className="fade-in-on-scroll">
          <div className="text-center">
            <h2 className="font-[var(--font-heading)] text-4xl text-[#3d342f] sm:text-5xl">Shop By Category</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Discover our versatile art styles curated for every mood.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categoryCards.map((category) => (
              <article
                key={category.title}
                className="premium-hover-card h-full rounded-2xl border border-[var(--border-soft)] bg-[#f8f2e8] p-5"
              >
                <h3 className="font-[var(--font-heading)] text-2xl leading-snug text-[#433932]">{category.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{category.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <div className="card-surface fade-in-on-scroll grid gap-6 overflow-hidden p-6 md:grid-cols-[320px_1fr] lg:p-8">
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-soft)] shadow-[0_12px_30px_rgba(89,71,46,0.14)]">
            <Image
              src={featuredArtist.image}
              alt={featuredArtist.name}
              fill
              className="image-zoom object-cover"
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </div>

          <div className="self-center">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-gold)]">Featured Artist</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl leading-tight text-[#3d342f] sm:text-5xl">
              {featuredArtist.name}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">{featuredArtist.bio}</p>

            <blockquote className="mt-5 max-w-xl">
              <p className="font-[var(--font-heading)] text-4xl italic leading-none text-[#5a4c43]">&ldquo;</p>
              <p className="font-[var(--font-heading)] text-4xl italic leading-snug text-[#4a4038] sm:text-[2.4rem]">
                Art should not be exclusive to galleries. It should live in homes, inspire daily life, and connect
                with people.
              </p>
              <p className="text-right font-[var(--font-heading)] text-4xl italic leading-none text-[#5a4c43]">&rdquo;</p>
            </blockquote>

            <Link href="/shop" className="olive-btn mt-6 inline-block rounded-full px-7 py-3 text-sm">
              View Collection
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <div className="fade-in-on-scroll">
          <div className="flex items-center justify-center gap-5">
            <span className="h-px flex-1 bg-[var(--border-soft)]" />
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-gold)]">Geesun Crafts</p>
              <h2 className="mt-2 font-[var(--font-heading)] text-4xl text-[#3d342f] sm:text-5xl">Featured Collection</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Ancient premium artworks loved by many styles.</p>
            </div>
            <span className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>

          <div className="mt-8">
            <ProductCarousel products={featuredProducts} ariaLabel="Featured collection" />
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <div className="fade-in-on-scroll">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-gold)]">Geesun Crafts</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl text-[#3d342f] sm:text-5xl">Bestsellers</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Most-loved pieces from our curated premium range.</p>
          </div>

          <div className="mt-8">
            <ProductCarousel products={bestsellers} ariaLabel="Bestsellers" />
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <div className="fade-in-on-scroll text-center">
          <h2 className="font-[var(--font-heading)] text-4xl text-[#3d342f] sm:text-5xl">What Customers Say</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.id}
                className="premium-hover-card rounded-2xl border border-[var(--border-soft)] bg-[#f8f2e8] p-5 text-left shadow-[0_10px_24px_rgba(89,71,46,0.08)]"
              >
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.message}</p>
                <p className="mt-5 font-medium text-[#3d342f]">{item.name}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--accent-gold)]">{item.city}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <div className="card-surface fade-in-on-scroll p-7 text-center lg:p-10">
          <h2 className="font-[var(--font-heading)] text-4xl text-[#3d342f] sm:text-5xl">Discover More Art</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
            Explore our curated collection to find the perfect piece that reflects your personality and elevates your
            space.
          </p>
          <Link href="/shop" className="olive-btn mt-6 inline-block rounded-full px-8 py-3 text-sm">
            View Shop
          </Link>
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="card-surface fade-in-on-scroll p-6 lg:p-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-gold)]">Stay Inspired</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl text-[#3d342f] sm:text-5xl">Join Our Newsletter</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
              Receive new collection drops, style inspiration, and exclusive offers directly in your inbox.
            </p>
          </div>

          <form className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-12 flex-1 rounded-full border border-[var(--border-soft)] bg-[#fffaf2] px-5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#c7b293]"
              aria-label="Email address"
            />
            <button type="submit" className="olive-btn h-12 rounded-full px-7 text-sm">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {featuredProducts.length === 0 || bestsellers.length === 0 ? (
        <section className="container-shell pb-10">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[#f8f2e8] p-4 text-sm text-[var(--text-muted)]">
            Product collections are being updated. Featured and bestseller cards will appear as soon as inventory is
            available.
          </div>
        </section>
      ) : null}
    </>
  );
}
