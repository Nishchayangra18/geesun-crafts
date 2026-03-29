"use client";

import { useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { Pagination } from "@/components/shop/pagination";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { Product } from "@/lib/types";

type SortType = "none" | "featured" | "bestseller" | "price_asc" | "price_desc" | "newest" | "quantity";
type StockFilter = "all" | "in_stock" | "out_of_stock" | "low_stock";

export function ShopShell({ products }: { products: Product[] }) {
  const itemsPerPage = 12;
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState<string>("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [medium, setMedium] = useState<string>("");
  const [setType, setSetType] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<SortType>("none");
  const [bestsellerFilter, setBestsellerFilter] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [priceLimit, setPriceLimit] = useState(8000);
  const [currentPage, setCurrentPage] = useState(1);
  const productsGridRef = useRef<HTMLDivElement | null>(null);

  const styleOptions = useMemo(() => [...new Set(products.map((product) => product.style).filter(Boolean))], [products]);
  const sizeOptions = useMemo(() => [...new Set(products.map((product) => product.size).filter(Boolean))], [products]);
  const mediumOptions = useMemo(() => [...new Set(products.map((product) => product.medium).filter(Boolean))], [products]);
  const setTypeOptions = useMemo(() => [...new Set(products.map((product) => product.setType).filter(Boolean))], [products]);

  const filteredProducts = useMemo<Product[]>(() => {
    const base = products.filter((product) => {
      const normalizedSearch = search.toLowerCase();
      const inSearch =
        product.title.toLowerCase().includes(normalizedSearch) ||
        product.articleCode.toLowerCase().includes(normalizedSearch) ||
        product.style.toLowerCase().includes(normalizedSearch);
      const inStyle = style ? product.style === style : true;
      const inSize = selectedSizes.length ? selectedSizes.includes(product.size) : true;
      const inMedium = medium ? product.medium === medium : true;
      const inSetType = setType ? product.setType === setType : true;
      const inPrice = product.price <= priceLimit;
      const inBestseller = bestsellerFilter ? Boolean(product.bestseller) : true;
      const inStock =
        stockFilter === "all"
          ? true
          : stockFilter === "in_stock"
            ? product.quantity > 0
            : stockFilter === "out_of_stock"
              ? product.quantity <= 0
              : product.quantity > 0 && product.quantity <= 3;

      return inSearch && inStyle && inSize && inMedium && inSetType && inPrice && inBestseller && inStock;
    });

    if (selectedSort === "none") {
      return [...base].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    }
    if (selectedSort === "price_asc") return [...base].sort((a, b) => a.price - b.price);
    if (selectedSort === "price_desc") return [...base].sort((a, b) => b.price - a.price);
    if (selectedSort === "featured") return [...base].sort((a, b) => Number(b.featured) - Number(a.featured));
    if (selectedSort === "bestseller") {
      return [...base].sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
    }
    if (selectedSort === "quantity") return [...base].sort((a, b) => b.quantity - a.quantity);
    if (selectedSort === "newest") {
      return [...base].sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
    }
    return base;
  }, [
    bestsellerFilter,
    medium,
    setType,
    priceLimit,
    products,
    search,
    selectedSizes,
    selectedSort,
    stockFilter,
    style,
  ]);

  const activeSizeChips = selectedSizes;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (normalizedCurrentPage - 1) * itemsPerPage;
  const visibleProducts = filteredProducts.slice(pageStartIndex, pageStartIndex + itemsPerPage);
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(style) ||
    Boolean(medium) ||
    Boolean(setType) ||
    selectedSizes.length > 0 ||
    bestsellerFilter ||
    stockFilter !== "all" ||
    priceLimit < 9000;

  function toggleSize(nextSize: string) {
    setSelectedSizes((current) =>
      current.includes(nextSize) ? current.filter((size) => size !== nextSize) : [...current, nextSize],
    );
  }

  function clearFilters() {
    setSearch("");
    setStyle("");
    setSelectedSizes([]);
    setMedium("");
    setSetType("");
    setBestsellerFilter(false);
    setStockFilter("all");
    setPriceLimit(9000);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === normalizedCurrentPage) {
      return;
    }

    setCurrentPage(nextPage);
    productsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
            value={selectedSort}
            onChange={(event) => setSelectedSort(event.target.value as SortType)}
            className="rounded-full border border-[var(--border-soft)] bg-white/80 px-4 py-2 text-sm outline-none"
          >
            <option value="none">Sort: None</option>
            <option value="featured">Sort: Featured</option>
            <option value="bestseller">Sort: Bestseller</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Sort: Newest</option>
            <option value="quantity">Sort: Quantity</option>
          </select>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          {search ? (
            <FilterChip label={`Search: ${search}`} onClear={() => setSearch("")} />
          ) : null}
          {style ? <FilterChip label={style} onClear={() => setStyle("")} /> : null}
          {medium ? <FilterChip label={medium} onClear={() => setMedium("")} /> : null}
          {setType ? <FilterChip label={setType} onClear={() => setSetType("")} /> : null}
          {activeSizeChips.map((sizeValue) => (
            <FilterChip key={sizeValue} label={sizeValue} onClear={() => toggleSize(sizeValue)} />
          ))}
          {bestsellerFilter ? (
            <FilterChip label="Bestseller" onClear={() => setBestsellerFilter(false)} />
          ) : null}
          {stockFilter !== "all" ? (
            <FilterChip
              label={
                stockFilter === "in_stock"
                  ? "In Stock"
                  : stockFilter === "out_of_stock"
                    ? "Out of Stock"
                    : "Low Stock"
              }
              onClear={() => setStockFilter("all")}
            />
          ) : null}
          {priceLimit < 9000 ? (
            <FilterChip label={`Max ₹${priceLimit}`} onClear={() => setPriceLimit(9000)} />
          ) : null}
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-[var(--border-soft)] px-3 py-1 text-[11px] text-[var(--text-muted)] transition hover:bg-white"
          >
            Clear all
          </button>
        </div>
      ) : null}

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

          <ToggleSwitch
            label="Bestseller"
            checked={bestsellerFilter}
            onChange={(checked) => setBestsellerFilter(checked)}
          />

          <label className="block text-sm text-[var(--text-muted)]">
            Stock
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value as StockFilter)}
              className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="all">All</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock (1-3)</option>
            </select>
          </label>

          <SelectBlock label="Style" value={style} onChange={setStyle} options={styleOptions} />
          <SelectBlock label="Set Type" value={setType} onChange={setSetType} options={setTypeOptions} />
          <MultiSelectBlock
            label="Size"
            selectedValues={selectedSizes}
            toggleValue={toggleSize}
            options={sizeOptions}
          />
          <SelectBlock label="Medium" value={medium} onChange={setMedium} options={mediumOptions} />
        </aside>

        {filteredProducts.length ? (
          <div ref={productsGridRef}>
            <div key={normalizedCurrentPage} className="page-slide-fade grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              currentPage={normalizedCurrentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        ) : (
          <div className="card-surface flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[var(--text-muted)]">
            <p>No products found.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-xs text-[var(--text-primary)] transition hover:bg-[var(--secondary)]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[var(--olive)] hover:text-[var(--text-primary)]"
    >
      {label} x
    </button>
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

function MultiSelectBlock<T extends string>({
  label,
  selectedValues,
  toggleValue,
  options,
}: {
  label: string;
  selectedValues: T[];
  toggleValue: (value: T) => void;
  options: T[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm text-[var(--text-muted)]">{label}</legend>
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={selectedValues.includes(option)}
            onChange={() => toggleValue(option)}
            className="h-4 w-4 accent-[var(--olive)]"
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}
