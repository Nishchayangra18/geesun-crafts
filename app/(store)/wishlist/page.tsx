"use client";

import { ProductCard } from "@/components/commerce/product-card";
import { useStore } from "@/components/providers/store-provider";

export default function WishlistPage() {
  const { wishlist } = useStore();

  return (
    <section className="container-shell section-space">
      <h1 className="mb-6 font-[var(--font-heading)] text-5xl">Wishlist</h1>
      {!wishlist.length ? (
        <div className="card-surface p-6 text-sm text-[var(--text-muted)]">
          You have not added paintings to wishlist yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
