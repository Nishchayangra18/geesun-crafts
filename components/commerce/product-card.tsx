"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/providers/store-provider";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } = useStore();
  const liked = isWishlisted(product.id);
  const outOfStock = product.quantity <= 0;
  const lowStock = product.quantity > 0 && product.quantity <= 3;

  return (
    <article className="card-surface grain-overlay overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{product.style}</p>
          <h3 className="mt-1 font-[var(--font-heading)] text-2xl leading-tight">{product.title}</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{product.dimensions}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-lg font-semibold">{formatINR(product.price)}</p>
          <p className="text-sm text-[var(--text-muted)]">{product.rating.toFixed(1)} ★</p>
        </div>
        <p className={`text-xs ${outOfStock ? "text-red-600" : "text-[var(--text-muted)]"}`}>
          {outOfStock
            ? "Out of Stock"
            : lowStock
              ? `Only ${product.quantity} left`
              : `In Stock (${product.quantity})`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="olive-btn rounded-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
          <button
            type="button"
            onClick={() => (liked ? removeFromWishlist(product.id) : addToWishlist(product))}
            className="outline-btn inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm"
            aria-pressed={liked}
            aria-label={liked ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <span aria-hidden="true">{liked ? "\u2665" : "\u2661"}</span>
            {liked ? "Remove Wishlist" : "Add Wishlist"}
          </button>
        </div>
      </div>
    </article>
  );
}
