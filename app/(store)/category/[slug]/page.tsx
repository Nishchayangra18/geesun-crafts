import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/commerce/product-card";
import { getCategoryProducts } from "@/lib/data/products";

const categoryContent = {
  abstract: {
    title: "Abstract",
    description: "Expressive and emotional artworks.",
  },
  spiritual: {
    title: "Spiritual",
    description: "Divine art inspired by culture and devotion.",
  },
  landscape: {
    title: "Landscape",
    description: "Nature-inspired paintings for calming interiors.",
  },
} as const;

type CategorySlug = keyof typeof categoryContent;

function getCategory(slug: string) {
  return categoryContent[slug as CategorySlug];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return {
      title: "Category | Geesun Crafts",
    };
  }

  return {
    title: `${category.title} Artworks | Geesun Crafts`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) notFound();

  const products = await getCategoryProducts(slug);

  return (
    <section className="bg-[var(--background)]">
      <div className="container-shell section-space">
        <div className="mb-9 flex flex-col gap-4 border-b border-[var(--border-soft)] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#6C7558]">Shop By Category</p>
            <h1 className="mt-3 font-[var(--font-heading)] text-5xl font-semibold tracking-tight text-[#1f1a17] sm:text-6xl">
              {category.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--text-muted)]">{category.description}</p>
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
              No {category.title.toLowerCase()} artworks available yet.
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
