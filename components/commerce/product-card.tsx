"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QuantityControl } from "@/components/commerce/quantity-control";
import { RestockEmailModal } from "@/components/commerce/restock-email-modal";
import { StockIndicator } from "@/components/commerce/stock-indicator";
import { useStore } from "@/components/providers/store-provider";
import { runFlyToTargetAnimation } from "@/lib/animations/fly-to-cart";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESTOCK_GUEST_EMAIL_KEY = "geesun_restock_guest_email";
export const PRIMARY_CTA_CLASS =
  "w-full rounded-2xl bg-[#6B7D5E] px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgb(107_125_94_/_32%)] transition hover:bg-[#617254] disabled:cursor-not-allowed disabled:opacity-70";
export const SECONDARY_CTA_CLASS =
  "outline-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60";

function readGuestRestockEmail() {
  if (typeof window === "undefined") return "";
  return String(localStorage.getItem(RESTOCK_GUEST_EMAIL_KEY) ?? "")
    .trim()
    .toLowerCase();
}

function writeGuestRestockEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESTOCK_GUEST_EMAIL_KEY, email.trim().toLowerCase());
}

export function ProductCard({ product, className = "" }: { product: Product; className?: string }) {
  const { cart, addToCart, updateCartQuantity, addToWishlist, removeFromWishlist, isWishlisted, userEmail } = useStore();
  const liked = isWishlisted(product.id);
  const outOfStock = product.quantity <= 0;
  const existingCartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = existingCartItem?.quantity ?? 0;

  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockEmail, setRestockEmail] = useState("");
  const [isSubscribingRestock, setIsSubscribingRestock] = useState(false);
  const [isRestockStatusLoading, setIsRestockStatusLoading] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);
  const [isRestockSubscribed, setIsRestockSubscribed] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const imageWrapRef = useRef<HTMLAnchorElement | null>(null);
  const animationLockRef = useRef<Record<"cart" | "wishlist", boolean>>({ cart: false, wishlist: false });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!outOfStock) {
      setIsRestockSubscribed(false);
      return;
    }

    let cancelled = false;
    const activeEmail = userEmail?.trim().toLowerCase() || readGuestRestockEmail();

    const loadStatus = async () => {
      if (!activeEmail) {
        if (!cancelled) setIsRestockSubscribed(false);
        return;
      }

      setIsRestockStatusLoading(true);
      try {
        const params = new URLSearchParams({
          product_id: product.id,
          email: activeEmail,
        });
        const response = await fetch(`/api/restock-subscribe?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (!cancelled) setIsRestockSubscribed(false);
          return;
        }
        if (!cancelled) setIsRestockSubscribed(Boolean(payload?.subscribed));
      } catch {
        if (!cancelled) setIsRestockSubscribed(false);
      } finally {
        if (!cancelled) setIsRestockStatusLoading(false);
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [outOfStock, product.id, userEmail]);

  async function handleAdd() {
    if (isUpdatingCart || animationLockRef.current.cart) return;
    setIsUpdatingCart(true);
    animationLockRef.current.cart = true;

    try {
      const source = cardRef.current ?? imageWrapRef.current;
      if (!source) {
        const fallbackResult = await addToCart(product);
        if (fallbackResult.ok) {
          setFeedback({ tone: "success", text: "Added to cart" });
        } else {
          setFeedback({
            tone: "warning",
            text:
              fallbackResult.code === "stock_limit" || fallbackResult.code === "out_of_stock"
                ? fallbackResult.message
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
              text: result.code === "stock_limit" || result.code === "out_of_stock" ? result.message : "Could not update cart",
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

  async function handleDecrement() {
    if (isUpdatingCart || quantityInCart <= 0) return;
    setIsUpdatingCart(true);
    const result = await updateCartQuantity(product.id, quantityInCart - 1);
    setIsUpdatingCart(false);
    if (!result.ok) {
      setFeedback({ tone: "warning", text: result.message });
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
      const source = cardRef.current ?? imageWrapRef.current;
      if (!source) {
        const fallbackResult = await addToWishlist(product);
        if (!fallbackResult.ok) {
          setFeedback({
            tone: fallbackResult.code === "already_wishlisted" ? "success" : "warning",
            text: fallbackResult.code === "already_wishlisted" ? "Already in wishlist" : fallbackResult.message,
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

  async function submitRestockSubscription(inputEmail: string) {
    const normalizedEmail = inputEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setRestockError("Please enter a valid email address.");
      return;
    }

    setIsSubscribingRestock(true);
    setRestockError(null);

    try {
      const response = await fetch("/api/restock-subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          product_id: product.id,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setRestockError(String(payload?.error ?? "Could not subscribe right now."));
        return;
      }

      setIsRestockSubscribed(true);
      if (!userEmail) {
        writeGuestRestockEmail(normalizedEmail);
      }
      setIsRestockModalOpen(false);
      setRestockError(null);
      setFeedback({ tone: "success", text: "You're on the list" });
    } catch {
      setRestockError("Could not subscribe right now.");
    } finally {
      setIsSubscribingRestock(false);
    }
  }

  async function handleNotifyMe() {
    if (isRestockSubscribed || isSubscribingRestock || isRestockStatusLoading) return;

    if (userEmail) {
      await submitRestockSubscription(userEmail);
      return;
    }

    setRestockEmail("");
    setRestockError(null);
    setIsRestockModalOpen(true);
  }

  return (
    <>
      <article
        ref={cardRef}
        className={`card-surface grain-overlay relative flex h-full flex-col overflow-hidden transition-all duration-300 ease-out ${className} ${
          feedback?.tone === "success"
            ? "ring-2 ring-[rgb(107_125_94_/_0.45)] shadow-[0_12px_26px_rgb(107_125_94_/_20%)]"
            : feedback?.tone === "warning"
              ? "ring-2 ring-[rgb(194_168_117_/_0.45)]"
              : ""
        } ${isUpdatingCart || isUpdatingWishlist || isSubscribingRestock ? "will-change-transform" : ""}`}
      >
        <Link
          ref={imageWrapRef}
          href={`/shop/${product.slug}`}
          className="relative block h-56 overflow-hidden bg-[rgb(244_241_235)] sm:h-60"
        >
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-4 sm:p-5">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="h-full w-full max-h-full max-w-full object-contain object-center transition-transform duration-300 ease-out"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </Link>
        <button
          type="button"
          onClick={handleWishlist}
          disabled={isUpdatingWishlist || isUpdatingCart}
          aria-label={liked ? "Remove from Wishlist" : "Add to Wishlist"}
          className="absolute right-4 top-4 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-[#dbcdb5] bg-[#fff8f0]/95 text-sm text-[#6B7D5E] shadow-[0_8px_14px_rgba(74,63,48,0.15)] transition hover:scale-105 hover:bg-[#fff] disabled:opacity-70"
        >
          <span aria-hidden="true">{liked ? "\u2665" : "\u2661"}</span>
        </button>
        <div className="flex flex-1 flex-col space-y-3 p-4">
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
          <div className="min-h-[5.25rem]">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{product.style}</p>
            <h3 className="mt-1 font-[var(--font-heading)] text-2xl leading-tight">{product.title}</h3>
          </div>
          <div className="min-h-[5.4rem] space-y-1 text-sm text-[var(--text-muted)]">
            <p>{product.dimensions}</p>
            {product.articleCode ? <p className="text-xs">Code: {product.articleCode}</p> : null}
            {product.setType ? <p className="text-xs">{product.setType}</p> : null}
          </div>
          <div className="mt-auto flex items-end justify-between gap-3">
            <p className="text-lg font-semibold">{formatINR(product.price)}</p>
            <p className="text-sm text-[var(--text-muted)]">{product.rating.toFixed(1)} ★</p>
          </div>

          {outOfStock ? (
            <div className="space-y-3 pt-1">
              <span className="inline-flex items-center rounded-full border border-[rgb(107_125_94_/_0.25)] bg-[rgb(107_125_94_/_0.09)] px-3 py-1 text-xs font-medium text-[rgb(84_100_72)]">
                Out of Stock
              </span>
              <button
                type="button"
                onClick={handleNotifyMe}
                disabled={isSubscribingRestock || isRestockSubscribed || isRestockStatusLoading}
                className={PRIMARY_CTA_CLASS}
              >
                {isRestockStatusLoading
                  ? "Checking..."
                  : isSubscribingRestock
                  ? "Submitting..."
                  : isRestockSubscribed
                    ? "You're on the list ✓"
                    : "Notify Me"}
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                disabled={isUpdatingWishlist || isUpdatingCart}
                className={SECONDARY_CTA_CLASS}
                aria-pressed={liked}
                aria-label={liked ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <span aria-hidden="true">{liked ? "\u2665" : "\u2661"}</span>
                {liked ? "Remove Wishlist" : "Add Wishlist"}
              </button>
            </div>
          ) : (
            <>
              <StockIndicator stock={product.quantity} maxQuantity={product.maxQuantity} />
              <div className="space-y-3">
                {quantityInCart > 0 ? (
                  <div className="flex w-full items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-1.5 shadow-[0_4px_10px_rgb(89_71_46_/_8%)]">
                    <QuantityControl
                      quantity={quantityInCart}
                      onDecrement={handleDecrement}
                      onIncrement={handleAdd}
                      disableDecrement={isUpdatingCart}
                      disableIncrement={isUpdatingCart || isUpdatingWishlist || outOfStock || quantityInCart >= product.quantity}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={outOfStock || isUpdatingCart || isUpdatingWishlist}
                    className={PRIMARY_CTA_CLASS}
                  >
                    Add to Cart
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={isUpdatingWishlist || isUpdatingCart}
                  className={SECONDARY_CTA_CLASS}
                  aria-pressed={liked}
                  aria-label={liked ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <span aria-hidden="true">{liked ? "\u2665" : "\u2661"}</span>
                  {liked ? "Remove Wishlist" : "Add Wishlist"}
                </button>
              </div>
            </>
          )}
        </div>
      </article>
      <RestockEmailModal
        isOpen={isRestockModalOpen}
        email={restockEmail}
        isSubmitting={isSubscribingRestock}
        errorMessage={restockError}
        onEmailChange={setRestockEmail}
        onClose={() => {
          if (isSubscribingRestock) return;
          setIsRestockModalOpen(false);
        }}
        onSubmit={() => {
          void submitRestockSubscription(restockEmail);
        }}
      />
    </>
  );
}
