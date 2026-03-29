"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { PRIMARY_CTA_CLASS, SECONDARY_CTA_CLASS } from "@/components/commerce/product-card";
import { QuantityControl } from "@/components/commerce/quantity-control";
import { useStore } from "@/components/providers/store-provider";
import { runFlyToTargetAnimation } from "@/lib/animations/fly-to-cart";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const cardAnimation = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function getReviewCount(product: Product) {
  return Math.max(4, Math.round(product.rating * 2));
}

export function ProductDetailShell({ product }: { product: Product }) {
  const gallery = useMemo(
    () => (product.galleryImages.length ? product.galleryImages : [product.image]),
    [product.galleryImages, product.image],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const { cart, addToCart, updateCartQuantity, addToWishlist, removeFromWishlist, isWishlisted } = useStore();
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const imageStageRef = useRef<HTMLDivElement | null>(null);
  const animationLockRef = useRef<Record<"cart" | "wishlist", boolean>>({ cart: false, wishlist: false });
  const liked = isWishlisted(product.id);
  const outOfStock = product.quantity <= 0;
  const reviewCount = getReviewCount(product);
  const existingCartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = existingCartItem?.quantity ?? 0;

  const safeActiveIndex = Math.min(activeIndex, gallery.length - 1);
  const activeImage = gallery[safeActiveIndex] ?? product.image;
  const prevIndex = safeActiveIndex === 0 ? gallery.length - 1 : safeActiveIndex - 1;
  const nextIndex = safeActiveIndex === gallery.length - 1 ? 0 : safeActiveIndex + 1;
  const prevImage = gallery[prevIndex] ?? activeImage;
  const nextImage = gallery[nextIndex] ?? activeImage;

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function goToPrevious() {
    if (gallery.length <= 1) return;
    setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  }

  function goToNext() {
    if (gallery.length <= 1) return;
    setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  }

  async function handleAddToCart() {
    if (outOfStock || isUpdatingCart || animationLockRef.current.cart) return;
    setIsUpdatingCart(true);
    animationLockRef.current.cart = true;

    try {
      const source = imageStageRef.current;
      if (!source) {
        const result = await addToCart(product);
        if (result.ok) {
          setFeedback({ tone: "success", text: "Added to cart" });
        } else {
          setFeedback({
            tone: "warning",
            text:
              result.code === "stock_limit" || result.code === "out_of_stock"
                ? result.message
                : "Could not update cart",
          });
        }
        return;
      }

      await runFlyToTargetAnimation({
        sourceElement: source,
        type: "cart",
        onComplete: async () => {
          const result = await addToCart(product);
          if (!result.ok) {
            setFeedback({
              tone: "warning",
              text:
                result.code === "stock_limit" || result.code === "out_of_stock"
                  ? result.message
                  : "Could not update cart",
            });
            return false;
          }
          setFeedback({ tone: "success", text: "Added to cart" });
          return true;
        },
      });
    } finally {
      animationLockRef.current.cart = false;
      setIsUpdatingCart(false);
    }
  }

  async function handleWishlist() {
    if (isUpdatingWishlist || animationLockRef.current.wishlist) return;

    if (liked) {
      removeFromWishlist(product.id);
      setFeedback({ tone: "success", text: "Removed from wishlist" });
      return;
    }

    setIsUpdatingWishlist(true);
    animationLockRef.current.wishlist = true;

    try {
      const source = imageStageRef.current;
      if (!source) {
        const result = await addToWishlist(product);
        if (!result.ok) {
          setFeedback({
            tone: result.code === "already_wishlisted" ? "success" : "warning",
            text: result.code === "already_wishlisted" ? "Already in wishlist" : result.message,
          });
          return;
        }
        setFeedback({ tone: "success", text: "Added to wishlist" });
        return;
      }

      await runFlyToTargetAnimation({
        sourceElement: source,
        type: "wishlist",
        onComplete: async () => {
          const result = await addToWishlist(product);
          if (!result.ok) {
            setFeedback({
              tone: result.code === "already_wishlisted" ? "success" : "warning",
              text: result.code === "already_wishlisted" ? "Already in wishlist" : result.message,
            });
            return false;
          }
          setFeedback({ tone: "success", text: "Added to wishlist" });
          return true;
        },
      });
    } finally {
      animationLockRef.current.wishlist = false;
      setIsUpdatingWishlist(false);
    }
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
    <section className="container-shell section-space">
      <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          variants={cardAnimation}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-[2rem] border border-[rgb(219_205_181_/_0.8)] bg-[rgb(249_244_236_/_0.94)] p-4 shadow-[0_16px_32px_rgb(89_71_46_/_8%)] sm:p-6"
        >
          <div className="relative overflow-hidden rounded-[1.45rem] border border-[rgb(219_205_181_/_0.75)] bg-[rgb(247_241_233_/_0.9)] p-4 sm:p-5">
            <div className="pointer-events-none absolute inset-y-8 left-2 hidden w-24 overflow-hidden rounded-xl opacity-40 sm:block">
              <Image src={prevImage} alt="" fill className="object-cover blur-[0.2px]" />
            </div>
            <div className="pointer-events-none absolute inset-y-8 right-2 hidden w-24 overflow-hidden rounded-xl opacity-40 sm:block">
              <Image src={nextImage} alt="" fill className="object-cover blur-[0.2px]" />
            </div>

            <div
              ref={imageStageRef}
              className="relative mx-auto flex h-[420px] w-full max-w-[560px] items-center justify-center overflow-hidden rounded-[1.25rem] border border-[rgb(219_205_181_/_0.7)] bg-[rgb(239_232_219_/_0.9)] p-4 sm:h-[460px] sm:p-6"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
                >
                  <Image
                    src={activeImage}
                    alt={product.title}
                    fill
                    className="object-contain transition-transform duration-500 ease-out hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgb(219_205_181_/_0.85)] bg-[rgb(247_241_233_/_0.9)] text-xl text-[var(--text-muted)] transition-all duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={gallery.length <= 1}
              >
                &#8249;
              </button>

              <button
                type="button"
                onClick={goToNext}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgb(219_205_181_/_0.85)] bg-[rgb(247_241_233_/_0.9)] text-xl text-[var(--text-muted)] transition-all duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={gallery.length <= 1}
              >
                &#8250;
              </button>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-3">
                {gallery.map((image, index) => {
                  const selected = index === safeActiveIndex;
                  return (
                    <motion.button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      whileHover={{ y: -2, scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-[#f7f1e4] shadow-[0_8px_18px_rgb(89_71_46_/_8%)] transition-all duration-200 sm:h-24 sm:w-24 ${
                        selected
                          ? "border-[rgb(107_125_94_/_0.7)] ring-2 ring-[rgb(107_125_94_/_0.18)]"
                          : "border-[rgb(219_205_181_/_0.85)] hover:border-[rgb(107_125_94_/_0.4)]"
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    >
                      <Image src={image} alt={`${product.title} thumbnail ${index + 1}`} fill className="object-cover" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardAnimation}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.08 }}
          className="rounded-[2rem] border border-[rgb(219_205_181_/_0.82)] bg-[rgb(250_246_239_/_0.95)] p-6 shadow-[0_16px_32px_rgb(89_71_46_/_8%)] sm:p-7"
        >
          <p className="text-xs uppercase tracking-[0.23em] text-[var(--text-muted)]">{product.style}</p>
          <h1 className="mt-3 font-[var(--font-heading)] text-4xl leading-[1.1] text-[var(--text-primary)] sm:text-5xl">
            {product.title}
          </h1>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">{formatINR(product.price)}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {product.rating.toFixed(1)} ★ ({reviewCount} Reviews)
          </p>

          <hr className="my-5 border-0 border-t border-[rgb(219_205_181_/_0.7)]" />

          {feedback ? (
            <div
              className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
                feedback.tone === "success"
                  ? "border-[rgb(107_125_94_/_0.35)] bg-[rgb(107_125_94_/_0.1)] text-[var(--text-primary)]"
                  : "border-[rgb(194_168_117_/_0.45)] bg-[rgb(194_168_117_/_0.12)] text-[var(--text-primary)]"
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          <p className="text-base leading-relaxed text-[var(--text-muted)]">{product.description}</p>

          <div className="mt-6 grid gap-x-7 gap-y-3 text-sm text-[var(--text-muted)] sm:grid-cols-2">
            <p>Size: {product.dimensions}</p>
            <p>Medium: {product.medium}</p>
            <p>Artist: {product.artist}</p>
            <p>Style: {product.style}</p>
            <p>Set Type: {product.setType || "N/A"}</p>
            <p>Frame: {product.frame || "N/A"}</p>
            <p>Availability: {outOfStock ? "Out of Stock" : `${product.quantity} available`}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {quantityInCart > 0 ? (
              <div className="flex w-full items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-1.5 shadow-[0_4px_10px_rgb(89_71_46_/_8%)]">
                <QuantityControl
                  quantity={quantityInCart}
                  onDecrement={handleDecrement}
                  onIncrement={handleAddToCart}
                  disableDecrement={isUpdatingCart}
                  disableIncrement={
                    isUpdatingCart || isUpdatingWishlist || outOfStock || quantityInCart >= product.quantity
                  }
                />
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ y: -2, boxShadow: "0 12px 22px rgba(107,125,94,0.22)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={outOfStock || isUpdatingCart || isUpdatingWishlist}
                className={PRIMARY_CTA_CLASS}
              >
                {outOfStock ? "Out of Stock" : "Add to Cart"}
              </motion.button>
            )}

            <motion.button
              type="button"
              whileHover={{ y: -2, boxShadow: "0 10px 18px rgba(89,71,46,0.12)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWishlist}
              disabled={isUpdatingWishlist || isUpdatingCart}
              className={SECONDARY_CTA_CLASS}
              aria-pressed={liked}
              aria-label={liked ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <motion.span
                aria-hidden="true"
                animate={{ scale: liked ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`text-lg leading-none transition-colors duration-200 ${liked ? "text-[var(--olive)]" : ""}`}
              >
                {liked ? "\u2665" : "\u2661"}
              </motion.span>
              <span className="inline-block min-w-[8.9rem] text-center">
                {liked ? "Remove Wishlist" : "Add to Wishlist"}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
