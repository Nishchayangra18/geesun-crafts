"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import type { ArtMedium, ArtSize, ArtStyle, Product } from "@/lib/types";

const styles: ArtStyle[] = ["Abstract", "Traditional", "Modern", "Custom"];
const sizes: ArtSize[] = ["Small", "Medium", "Large"];
const media: ArtMedium[] = ["Oil on Canvas", "Acrylic", "Mixed Media", "Watercolor"];

type SortType = "featured" | "price_asc" | "price_desc";

export function ShopShell({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState<ArtStyle | "">("");
  const [size, setSize] = useState<ArtSize | "">("");
  const [medium, setMedium] = useState<ArtMedium | "">("");
  const [sortBy, setSortBy] = useState<SortType>("featured");
  const [priceLimit, setPriceLimit] = useState(8000);

  const filteredProducts = useMemo(() => {
    const base = products.filter((product) => {
      const inSearch = product.title.toLowerCase().includes(search.toLowerCase());
      const inStyle = style ? product.style === style : true;
      const inSize = size ? product.size === size : true;
      const inMedium = medium ? product.medium === medium : true;
      const inPrice = product.price <= priceLimit;
      return inSearch && inStyle && inSize && inMedium && inPrice;
    });

    if (sortBy === "price_asc") return [...base].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") return [...base].sort((a, b) => b.price - a.price);
    return [...base].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [medium, priceLimit, products, search, size, sortBy, style]);

  return (
    <section className="container-shell section-space">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[var(--font-heading)] text-5xl">Shop Paintings</h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search paintings"
            className="rounded-full border border-[var(--border-soft)] bg-white/80 px-4 py-2 text-sm outline-none"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortType)}
            className="rounded-full border border-[var(--border-soft)] bg-white/80 px-4 py-2 text-sm outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[260px_1fr]">
        <aside className="card-surface h-fit space-y-5 p-5">
          <h2 className="font-[var(--font-heading)] text-2xl">Filters</h2>

          <label className="block text-sm text-[var(--text-muted)]">
            Max Price: ₹{priceLimit}
            <input
              type="range"
              min={2000}
              max={9000}
              step={100}
              value={priceLimit}
              onChange={(event) => setPriceLimit(Number(event.target.value))}
              className="mt-2 w-full accent-[var(--olive)]"
            />
          </label>

          <SelectBlock label="Style" value={style} onChange={setStyle} options={styles} />
          <SelectBlock label="Size" value={size} onChange={setSize} options={sizes} />
          <SelectBlock label="Medium" value={medium} onChange={setMedium} options={media} />
        </aside>

        {filteredProducts.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="card-surface flex min-h-80 items-center justify-center p-6 text-center text-sm text-[var(--text-muted)]">
            No paintings matched these filters. Try clearing some filter options.
          </div>
        )}
      </div>
    </section>
  );
}

function SelectBlock<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | "";
  onChange: (value: T | "") => void;
  options: T[];
}) {
  return (
    <label className="block text-sm text-[var(--text-muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T | "")}
        className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
