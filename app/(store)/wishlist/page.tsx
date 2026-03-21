"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/providers/store-provider";
import { formatINR } from "@/lib/utils";

export default function WishlistPage() {
  const { wishlist, moveWishlistToCart, removeFromWishlist } = useStore();

  return (
    <section className="container-shell section-space">
      <h1 className="mb-6 font-[var(--font-heading)] text-5xl">Wishlist</h1>
      {!wishlist.length ? (
        <div className="card-surface p-6 text-sm text-[var(--text-muted)]">
          You have not added paintings to wishlist yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {wishlist.map((entry) => (
            <article key={entry.productId} className="card-surface p-4">
              {entry.product ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href={`/shop/${entry.product.slug}`}
                    className="relative block h-28 w-full overflow-hidden rounded-lg sm:w-36"
                  >
                    <Image
                      src={entry.product.image}
                      alt={entry.product.title}
                      fill
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <h2 className="font-[var(--font-heading)] text-2xl leading-tight">
                      {entry.product.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {entry.product.dimensions}
                    </p>
                    <p className="mt-2 text-sm font-medium">{formatINR(entry.product.price)}</p>
                    <p
                      className={`mt-1 text-xs ${
                        entry.product.quantity <= 0
                          ? "text-red-600"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {entry.product.quantity <= 0
                        ? "Out of Stock"
                        : `In Stock (${entry.product.quantity})`}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => moveWishlistToCart(entry.productId)}
                      disabled={entry.product.quantity <= 0}
                      className="olive-btn rounded-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Move to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(entry.productId)}
                      className="outline-btn rounded-full px-4 py-2 text-sm"
                    >
                      Remove from Wishlist
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-[var(--font-heading)] text-2xl">Product unavailable</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      This item is no longer available in the catalog.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(entry.productId)}
                    className="outline-btn rounded-full px-4 py-2 text-sm"
                  >
                    Remove from Wishlist
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
