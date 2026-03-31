"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

type CouponOffer = {
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount: number | null;
  eligible: boolean;
  remainingAmount: number;
  freeShipping: boolean;
};

type Recommendation = {
  id: string;
  slug: string;
  title: string;
  price: number;
  stock: number;
  size: string;
  style: string;
  medium: string;
  images: string[];
};

const DEFAULT_FREE_SHIPPING_THRESHOLD = 2000;
const DEFAULT_SHIPPING_FEE = 250;

function toMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function toCartPayload(cart: ReturnType<typeof useStore>["cart"]) {
  return cart.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    price: item.product.price,
  }));
}

function buildRecommendationProduct(item: Recommendation): Product {
  const image =
    item.images[0] ??
    "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1200&q=80";
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.title,
    image,
    galleryImages: item.images.slice(1),
    price: Number(item.price ?? 0),
    quantity: Math.max(0, Number(item.stock ?? 0)),
    maxQuantity: Math.max(1, Number(item.stock ?? 1)),
    rating: 4.6,
    articleCode: "",
    setType: "",
    frame: "",
    style: item.style ?? "",
    medium: item.medium ?? "",
    size: item.size ?? "",
    dimensions: item.size ?? "",
    artist: "Geesun Crafts",
    bestseller: true,
    featured: false,
  };
}

export function CartShell() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    addToCart,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
    appliedCoupon,
    couponMessage,
    applyCouponCode,
    removeAppliedCoupon,
    clearCouponMessage,
  } = useStore();

  const [availableCoupons, setAvailableCoupons] = useState<CouponOffer[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartPayload = useMemo(() => toCartPayload(cart), [cart]);

  const shippingWithoutCoupon =
    subtotal > 0 && subtotal < freeShippingThreshold ? DEFAULT_SHIPPING_FEE : 0;
  const normalizedCouponInput = couponInput.trim().toUpperCase();
  const isSameCouponApplied =
    Boolean(appliedCoupon?.code) && normalizedCouponInput === String(appliedCoupon?.code ?? "").toUpperCase();

  const effectiveDiscount = appliedCoupon?.discountAmount ?? 0;
  const effectiveShipping = shippingWithoutCoupon;
  const effectiveTotal = toMoney(subtotal - effectiveDiscount + effectiveShipping);
  const remainingForFreeShipping = Math.max(0, toMoney(freeShippingThreshold - subtotal));
  const freeShippingProgress =
    freeShippingThreshold > 0 ? Math.min(100, (subtotal / freeShippingThreshold) * 100) : 100;
  const hasUnlockedFreeShipping = subtotal > 0 && remainingForFreeShipping <= 0;

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      const response = await fetch("/api/store-settings", { cache: "no-store" }).catch(() => null);
      if (!response?.ok || isCancelled) return;
      const payload = (await response.json().catch(() => ({}))) as { freeShippingThreshold?: number };
      const threshold = Number(payload.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD);
      if (!isCancelled && Number.isFinite(threshold) && threshold > 0) {
        setFreeShippingThreshold(threshold);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      setIsCouponLoading(true);
      const params = new URLSearchParams({
        subtotal: String(toMoney(subtotal)),
        cartItems: JSON.stringify(cartPayload),
      });
      const response = await fetch(`/api/coupons/available?${params.toString()}`, {
        cache: "no-store",
      }).catch(() => null);

      if (!response || !response.ok) {
        if (!isCancelled) {
          setAvailableCoupons([]);
          setIsCouponLoading(false);
        }
        return;
      }

      const payload = (await response.json().catch(() => [])) as CouponOffer[];
      if (!isCancelled) {
        setAvailableCoupons(Array.isArray(payload) ? payload : []);
        setIsCouponLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [cartPayload, subtotal]);

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      if (!cartPayload.length) {
        if (!isCancelled) {
          setRecommendations([]);
          setIsRecommendationsLoading(false);
        }
        return;
      }

      setIsRecommendationsLoading(true);
      const params = new URLSearchParams({
        cartItems: JSON.stringify(cartPayload),
      });
      const response = await fetch(`/api/cart/recommendations?${params.toString()}`, {
        cache: "no-store",
      }).catch(() => null);

      if (!response || !response.ok) {
        if (!isCancelled) {
          setRecommendations([]);
          setIsRecommendationsLoading(false);
        }
        return;
      }

      const payload = (await response.json().catch(() => [])) as Recommendation[];
      if (!isCancelled) {
        setRecommendations(Array.isArray(payload) ? payload : []);
        setIsRecommendationsLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [cartPayload]);

  useEffect(() => {
    if (!couponMessage) return;
    const timeout = window.setTimeout(() => clearCouponMessage(), 3500);
    return () => window.clearTimeout(timeout);
  }, [clearCouponMessage, couponMessage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCouponInput(appliedCoupon?.code ?? "");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [appliedCoupon?.code]);

  if (!cart.length) {
    return (
      <section className="container-shell section-space">
        <div className="card-surface mx-auto max-w-xl p-8 text-center">
          <h1 className="font-[var(--font-heading)] text-4xl">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Explore our curated gallery and add your favorite pieces.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="w-full rounded-full border border-[rgb(197_187_171_/_0.9)] bg-[rgb(245_240_232)] px-8 py-3 text-sm font-medium text-[rgb(66_58_49)] shadow-[0_6px_18px_rgb(89_71_46_/_10%)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[rgb(183_172_155)] hover:bg-[rgb(239_232_221)] hover:shadow-[0_12px_24px_rgb(89_71_46_/_16%)] sm:w-auto"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell section-space">
      <h1 className="mb-6 font-[var(--font-heading)] text-5xl">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="card-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-[var(--font-heading)] text-3xl">Available Offers</h2>
              {isCouponLoading ? (
                <p className="text-xs text-[var(--text-muted)]">Updating...</p>
              ) : null}
            </div>
            <div className="space-y-2.5">
              {availableCoupons.map((coupon) => {
                const isApplied = appliedCoupon?.code === coupon.code;
                return (
                  <motion.article
                    key={coupon.code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-[var(--border-soft)] bg-[#fbf6ec] p-3 shadow-[0_5px_14px_rgb(89_71_46_/_8%)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[rgb(186_174_152)] bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.04em]">
                        {coupon.code}
                      </span>
                      <p className="flex-1 text-sm text-[var(--text-muted)]">{coupon.description}</p>
                      {coupon.eligible ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isApplied) {
                              void removeAppliedCoupon();
                              return;
                            }
                            setCouponInput(coupon.code);
                            void applyCouponCode(coupon.code);
                          }}
                          className={
                            isApplied
                              ? "rounded-full border border-[rgb(107_125_94_/_0.4)] bg-[rgb(107_125_94_/_0.12)] px-4 py-1.5 text-sm font-medium text-[rgb(74_93_62)]"
                              : "olive-btn rounded-full px-4 py-1.5 text-sm font-medium"
                          }
                          disabled={isCouponLoading}
                        >
                          {isApplied ? "Applied · Remove" : "Apply"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-full border border-[rgb(199_190_177)] bg-[rgb(240_234_225)] px-4 py-1.5 text-sm text-[rgb(117_107_95)]"
                        >
                          Locked
                        </button>
                      )}
                    </div>
                    {!coupon.eligible && coupon.remainingAmount > 0 ? (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Add {formatINR(coupon.remainingAmount)} more to unlock {coupon.code}.
                      </p>
                    ) : null}
                  </motion.article>
                );
              })}
              {!availableCoupons.length ? (
                <p className="text-sm text-[var(--text-muted)]">No active offers right now.</p>
              ) : null}
            </div>
          </section>

          <section className="card-surface p-4 sm:p-5">
            <h2 className="mb-4 font-[var(--font-heading)] text-3xl">Cart</h2>
            <div className="space-y-3.5">
              {cart.map((item) => (
                <motion.article
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  onClick={() => router.push(`/shop/${item.product.slug}`)}
                  className="group cursor-pointer rounded-2xl border border-[var(--border-soft)] bg-[#fbf6ec] p-3 transition-all duration-300 hover:shadow-[0_12px_26px_rgb(89_71_46_/_14%)] sm:p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[rgb(243_237_228)] sm:w-36">
                      <Image
                        src={item.product.image}
                        alt={item.product.title}
                        fill
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-[var(--font-heading)] text-2xl">{item.product.title}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{item.product.dimensions}</p>
                      <p className="mt-2 text-base font-semibold">{formatINR(item.product.price)}</p>
                      <p className="text-sm text-[var(--text-muted)]">In Stock ({item.product.quantity})</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/80 px-2 py-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void updateCartQuantity(item.product.id, item.quantity - 1);
                          }}
                          className="outline-btn rounded-full px-2.5 py-1 text-sm"
                        >
                          -
                        </button>
                        <p className="w-8 text-center font-medium">{item.quantity}</p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void updateCartQuantity(item.product.id, item.quantity + 1);
                          }}
                          className="outline-btn rounded-full px-2.5 py-1 text-sm"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (isWishlisted(item.product.id)) {
                              removeFromWishlist(item.product.id);
                              return;
                            }
                            void addToWishlist(item.product);
                          }}
                          className="outline-btn rounded-full px-2.5 py-1 text-sm"
                          aria-label={isWishlisted(item.product.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {isWishlisted(item.product.id) ? "\u2665" : "\u2661"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void removeFromCart(item.product.id);
                        }}
                        className="outline-btn rounded-full px-5 py-1.5 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-white/60 p-3">
              <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap">
                <input
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                  placeholder="Enter Coupon"
                  className="w-full min-w-[220px] flex-1 rounded-full border border-[var(--border-soft)] bg-[rgb(250_246_238)] px-4 py-2 text-sm outline-none transition focus:border-[rgb(170_157_137)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isSameCouponApplied) return;
                    void applyCouponCode(normalizedCouponInput);
                  }}
                  disabled={isCouponLoading || !normalizedCouponInput || isSameCouponApplied}
                  className="olive-btn w-[100px] shrink-0 rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSameCouponApplied ? "Applied" : "Apply"}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {couponMessage ? (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`mt-3 text-sm ${
                    couponMessage.tone === "success" ? "text-[rgb(76_96_63)]" : "text-[rgb(162_115_61)]"
                  }`}
                >
                  {couponMessage.text}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </section>

          <section className="card-surface p-4 sm:p-5">
            <h2 className="mb-4 font-[var(--font-heading)] text-3xl">You May Also Like</h2>
            <div className="space-y-3">
              {recommendations.map((item) => (
                <motion.article
                  key={item.id}
                  whileHover={{ y: -2 }}
                  onClick={() => router.push(`/shop/${item.slug}`)}
                  className="group cursor-pointer rounded-2xl border border-[var(--border-soft)] bg-[#fbf6ec] p-3 transition-all duration-300 hover:shadow-[0_12px_26px_rgb(89_71_46_/_14%)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-full overflow-hidden rounded-xl bg-[rgb(243_237_228)] sm:w-40">
                      <Image
                        src={
                          item.images[0] ??
                          "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1200&q=80"
                        }
                        alt={item.title}
                        fill
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-[var(--font-heading)] text-2xl leading-tight">{item.title}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{item.size}</p>
                      <p className="mt-1 text-lg font-semibold">{formatINR(item.price)}</p>
                      <p className="text-sm text-[var(--text-muted)]">In Stock ({item.stock})</p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void addToCart(buildRecommendationProduct(item));
                      }}
                      disabled={item.stock <= 0}
                      className="olive-btn rounded-full px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Add to Cart
                    </button>
                  </div>
                </motion.article>
              ))}
              {!recommendations.length && !isRecommendationsLoading ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Add more artworks to your cart to unlock personalized recommendations.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => router.push("/shop")}
                className="w-full rounded-full border border-[rgb(197_187_171_/_0.9)] bg-[rgb(245_240_232)] px-8 py-3 text-sm font-medium text-[rgb(66_58_49)] shadow-[0_6px_18px_rgb(89_71_46_/_10%)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[rgb(183_172_155)] hover:bg-[rgb(239_232_221)] hover:shadow-[0_12px_24px_rgb(89_71_46_/_16%)] sm:w-auto"
              >
                Continue Shopping
              </button>
            </div>
          </section>
        </div>

        <aside className="card-surface h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="font-[var(--font-heading)] text-4xl">Summary</h2>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[#f9f3e7] p-3">
            {hasUnlockedFreeShipping ? (
              <p className="text-sm text-[rgb(76_96_63)]">You&apos;ve unlocked free shipping!</p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                You&apos;re {formatINR(remainingForFreeShipping)} away from free shipping!
              </p>
            )}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgb(228_220_207)]">
              <motion.div
                className="h-full rounded-full bg-[var(--olive)]"
                animate={{ width: `${freeShippingProgress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          </div>

          <Line label="Subtotal" value={formatINR(subtotal)} />
          {effectiveDiscount > 0 ? (
            <Line label="Discount" value={`- ${formatINR(effectiveDiscount)}`} mutedValue={false} />
          ) : null}
          <Line label="Shipping" value={formatINR(effectiveShipping)} />
          <hr className="soft-divider" />
          <Line label="Total" value={formatINR(effectiveTotal)} strong />

          {appliedCoupon ? (
            <div className="rounded-xl border border-[rgb(107_125_94_/_0.35)] bg-[rgb(107_125_94_/_0.1)] px-3 py-2 text-sm text-[rgb(76_96_63)]">
              Coupon <strong>{appliedCoupon.code}</strong> applied
            </div>
          ) : null}

          <Link href="/checkout" className="olive-btn mt-4 block rounded-full px-5 py-3 text-center text-lg">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}

function Line({
  label,
  value,
  strong,
  mutedValue = true,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mutedValue?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-base">
      <p className={strong ? "font-semibold" : "text-[var(--text-muted)]"}>{label}</p>
      <p className={strong ? "font-semibold" : mutedValue ? "text-[var(--text-muted)]" : ""}>{value}</p>
    </div>
  );
}
