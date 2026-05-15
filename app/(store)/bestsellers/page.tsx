import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/commerce/product-card";
import { getBestsellerProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Bestsellers | Geesun Crafts",
  description: "Most loved pieces from the Geesun Crafts art community.",
};

export default async function BestsellersPage() {
  const products = await getBestsellerProducts();

  return (
    <section className="bg-[var(--background)]">
      <div className="container-shell section-space">
        <div className="mb-9 flex flex-col gap-4 border-b border-[var(--border-soft)] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#6C7558]">Most Loved</p>
            <h1 className="mt-3 font-[var(--font-heading)] text-5xl font-semibold tracking-tight text-[#1f1a17] sm:text-6xl">
              Bestsellers
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--text-muted)]">
              Most loved pieces from our art community.
            </p>
          </div>
          <Link href="/shop" className="olive-btn inline-flex w-fit rounded-full px-6 py-2.5 text-sm font-medium">
            Explore Collection
          </Link>
        </div>

        {products.length ? (
          <div className="page-slide-fade grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="card-surface flex min-h-80 flex-col items-center justify-center gap-4 bg-[#FBF8F2] p-8 text-center">
            <p className="font-[var(--font-heading)] text-3xl text-[#2a241f]">
              No bestseller artworks available yet.
            </p>
            <Link
              href="/shop"
              className="olive-btn inline-flex rounded-full px-6 py-2.5 text-sm font-medium shadow-[0_12px_24px_rgb(107_125_94_/_24%)]"
            >
              Explore Collection
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
