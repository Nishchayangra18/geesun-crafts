"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QuantityControl } from "@/components/commerce/quantity-control";
import { useStore } from "@/components/providers/store-provider";
import { runFlyToCartAnimation } from "@/lib/animations/fly-to-cart";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { cart, addToCart, updateCartQuantity, addToWishlist, removeFromWishlist, isWishlisted } = useStore();
  const liked = isWishlisted(product.id);
  const outOfStock = product.quantity <= 0;
  const lowStock = product.quantity > 0 && product.quantity <= 3;
  const existingCartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = existingCartItem?.quantity ?? 0;

  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [isTakingOff, setIsTakingOff] = useState(false);
  const imageWrapRef = useRef<HTMLAnchorElement | null>(null);
  const animationLockRef = useRef(false);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function handleAdd() {
    if (isUpdatingCart) return;
    setIsUpdatingCart(true);
    const result = await addToCart(product);
    setIsUpdatingCart(false);

    if (result.ok) {
      setFeedback({ tone: "success", text: "Added to cart" });
      const sourceAnchor = imageWrapRef.current;
      if (sourceAnchor && !animationLockRef.current) {
        animationLockRef.current = true;
        setIsTakingOff(true);
        window.setTimeout(() => setIsTakingOff(false), 320);
        void (async () => {
          await new Promise((resolve) => window.setTimeout(resolve, 230));
          await runFlyToCartAnimation({ sourceElement: sourceAnchor });
          animationLockRef.current = false;
        })();
      }
      return;
    }

    setFeedback({
      tone: "warning",
      text: result.code === "stock_limit" || result.code === "out_of_stock" ? result.message : "Could not update cart",
    });
  }

  async function handleDecrement() {
    if (isUpdatingCart || quantityInCart <= 0) return;
    setIsUpdatingCart(true);
    const result = await updateCartQuantity(product.id, quantityInCart - 1);
    setIsUpdatingCart(false);
    if (!result.ok) {
      setFeedback({ tone: "warning", text: result.message });
    }
  }

  return (
    <article
      className={`card-surface grain-overlay overflow-hidden transition-all duration-300 ease-out ${
        feedback?.tone === "success"
          ? "ring-2 ring-[rgb(107_125_94_/_0.45)] shadow-[0_12px_26px_rgb(107_125_94_/_20%)]"
          : feedback?.tone === "warning"
            ? "ring-2 ring-[rgb(194_168_117_/_0.45)]"
            : ""
      } ${isTakingOff ? "-translate-y-2.5 scale-[1.03] bg-[rgb(107_125_94_/_0.08)] shadow-[0_18px_30px_rgb(107_125_94_/_24%)]" : ""} ${
        isUpdatingCart ? "will-change-transform" : ""
      }`}
    >
      <Link
        ref={imageWrapRef}
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="space-y-3 p-4">
        {feedback ? (
          <div
            className={`rounded-lg border px-3 py-2 text-xs ${
              feedback.tone === "success"
                ? "border-[rgb(107_125_94_/_0.35)] bg-[rgb(107_125_94_/_0.1)] text-[var(--text-primary)]"
                : "border-[rgb(194_168_117_/_0.45)] bg-[rgb(194_168_117_/_0.12)] text-[var(--text-primary)]"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}
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
          {quantityInCart > 0 ? (
            <div className="flex items-center">
              <QuantityControl
                quantity={quantityInCart}
                onDecrement={handleDecrement}
                onIncrement={handleAdd}
                disableDecrement={isUpdatingCart}
                disableIncrement={isUpdatingCart || outOfStock || quantityInCart >= product.quantity}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock || isUpdatingCart}
              className="olive-btn rounded-full px-4 py-2 text-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          )}
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
