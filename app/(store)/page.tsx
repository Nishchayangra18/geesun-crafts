import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/commerce/product-card";
import { SectionTitle } from "@/components/ui/section-title";
import { featuredArtist, categories, testimonials } from "@/lib/content/home-content";
import { fetchProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await fetchProducts();
  const bestsellers = products.filter((product) => product.bestseller).slice(0, 4);
  const featured = products.filter((product) => product.featured).slice(0, 3);
  const heroImage =
    products[0]?.image ??
    "https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      <section className="container-shell section-space">
        <div className="card-surface grain-overlay grid items-center gap-8 overflow-hidden p-8 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">
              Handcrafted Luxury Collection
            </p>
            <h1 className="mt-3 max-w-lg font-[var(--font-heading)] text-6xl leading-[1.05]">
              Timeless Art for Your Home
            </h1>
            <p className="mt-4 max-w-md text-sm text-[var(--text-muted)]">
              Gallery-inspired handmade paintings designed to elevate modern Indian homes with calm and character.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="olive-btn rounded-full px-7 py-3 text-sm">
                Shop Now
              </Link>
              <Link href="/about" className="outline-btn rounded-full px-7 py-3 text-sm">
                Our Story
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border-soft)]">
            <Image
              src={heroImage}
              alt="Hero painting"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <SectionTitle title="Shop By Category" subtitle="Minimal curation for every aesthetic and room mood." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <article key={category.title} className="card-surface p-5">
              <h3 className="font-[var(--font-heading)] text-2xl">{category.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell section-space">
        <SectionTitle title="Bestsellers" subtitle="Most loved paintings from our premium collectors." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-shell section-space">
        <SectionTitle title="Featured Artist" subtitle="Crafted by passionate hands with heritage and precision." />
        <div className="card-surface grid gap-6 overflow-hidden p-6 md:grid-cols-[320px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
            <Image
              src={featuredArtist.image}
              alt={featuredArtist.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </div>
          <div className="self-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">{featuredArtist.title}</p>
            <h3 className="mt-2 font-[var(--font-heading)] text-4xl">{featuredArtist.name}</h3>
            <p className="mt-4 text-sm text-[var(--text-muted)]">{featuredArtist.bio}</p>
            <Link href="/shop" className="olive-btn mt-6 inline-block rounded-full px-6 py-3 text-sm">
              View Collection
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell section-space">
        <SectionTitle title="What Customers Say" />
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.id} className="card-surface p-5">
              <p className="text-sm text-[var(--text-muted)]">{item.message}</p>
              <p className="mt-4 font-medium">{item.name}</p>
              <p className="text-xs text-[var(--accent-gold)]">{item.city}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="card-surface p-6 text-center">
          <h2 className="font-[var(--font-heading)] text-4xl">Discover More Art</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Explore the curated shop with filters for style, medium, size, and pricing.
          </p>
          <Link href="/shop" className="olive-btn mt-5 inline-block rounded-full px-8 py-3 text-sm">
            Browse Shop
          </Link>
        </div>
      </section>

      <section className="container-shell section-space">
        <SectionTitle title="Featured Collection" subtitle="Recent premium arrivals loved by interior stylists." />
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
