"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/components/providers/store-provider";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function ProductDetailShell({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(product.image);
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } = useStore();
  const liked = isWishlisted(product.id);
  const outOfStock = product.quantity <= 0;
  const lowStock = product.quantity > 0 && product.quantity <= 3;

  return (
    <section className="container-shell section-space">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card-surface relative aspect-square overflow-hidden">
            <Image
              src={activeImage}
              alt={product.title}
              fill
              className="object-cover transition duration-300 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[product.image, ...new Array(3).fill(product.image)].map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(image)}
                className="card-surface relative aspect-square overflow-hidden"
              >
                <Image src={image} alt={`${product.title} ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">{product.style}</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-5xl">{product.title}</h1>
          <p className="mt-2 text-2xl font-semibold">{formatINR(product.price)}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{product.rating.toFixed(1)} ★ Reviews</p>
          <hr className="soft-divider" />
          <p className="text-sm text-[var(--text-muted)]">{product.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[var(--text-muted)]">
            <p>Size: {product.dimensions}</p>
            <p>Medium: {product.medium}</p>
            <p>Artist: {product.artist}</p>
            <p>Style: {product.style}</p>
          </div>
          <p className={`mt-3 text-sm ${outOfStock ? "text-red-600" : "text-[var(--text-muted)]"}`}>
            {outOfStock
              ? "Out of Stock"
              : lowStock
                ? `Only ${product.quantity} left in stock`
                : `${product.quantity} available`}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={outOfStock}
              className="olive-btn rounded-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={() => (liked ? removeFromWishlist(product.id) : addToWishlist(product))}
              className="outline-btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-3"
              aria-pressed={liked}
              aria-label={liked ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <span aria-hidden="true">{liked ? "\u2665" : "\u2661"}</span>
              {liked ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <h2 className="font-[var(--font-heading)] text-3xl">Customer Reviews</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Buyers appreciate the gallery-grade finish, secure packaging, and true-to-image colors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
