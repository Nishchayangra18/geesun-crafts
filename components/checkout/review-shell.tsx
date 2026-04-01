"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/components/providers/store-provider";
import type { User } from "@supabase/supabase-js";
import {
  CHECKOUT_CURRENT_STEP_STORAGE_KEY,
  CHECKOUT_LAST_ORDER_STORAGE_KEY,
  CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY,
  CHECKOUT_PAYMENT_METHOD_STORAGE_KEY,
  CHECKOUT_RESUME_DATA_STORAGE_KEY,
  CHECKOUT_SHIPPING_ATTEMPTED_STORAGE_KEY,
  CHECKOUT_SHIPPING_STORAGE_KEY,
  CHECKOUT_SHIPPING_TOUCHED_STORAGE_KEY,
  REDIRECT_AFTER_LOGIN_STORAGE_KEY,
  EMPTY_SHIPPING_ADDRESS,
  LEGACY_CHECKOUT_SHIPPING_STORAGE_KEY,
  normalizeShippingAddress,
  paymentMethodLabel,
  type PaymentMethod,
  type ShippingAddress,
} from "@/lib/checkout/state";
import { DEFAULT_SHIPPING_FEE } from "@/lib/cart/pricing";
import { formatINR } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_FREE_SHIPPING_THRESHOLD = 2000;

function toMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function ReviewShell() {
  const router = useRouter();
  const { cart, appliedCoupon, clearCart } = useStore();

  const [address] = useState<ShippingAddress>(() => {
    if (typeof window === "undefined") return EMPTY_SHIPPING_ADDRESS;
    try {
      const savedAddress =
        localStorage.getItem(CHECKOUT_SHIPPING_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_CHECKOUT_SHIPPING_STORAGE_KEY) ??
        localStorage.getItem("geesun_checkout_shipping_form_v1");
      if (!savedAddress) return EMPTY_SHIPPING_ADDRESS;
      return normalizeShippingAddress(JSON.parse(savedAddress));
    } catch {
      return EMPTY_SHIPPING_ADDRESS;
    }
  });

  const [paymentMethod] = useState<PaymentMethod | null>(() => {
    if (typeof window === "undefined") return null;
    const savedPaymentMethod = localStorage.getItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
    if (savedPaymentMethod === "card" || savedPaymentMethod === "upi" || savedPaymentMethod === "cod") {
      return savedPaymentMethod;
    }
    return null;
  });

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getSupabaseBrowserClient()));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const subtotal = useMemo(
    () => toMoney(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)),
    [cart],
  );
  const discount = useMemo(() => toMoney(appliedCoupon?.discountAmount ?? 0), [appliedCoupon?.discountAmount]);
  const shipping = useMemo(() => {
    if (appliedCoupon) return toMoney(appliedCoupon.shipping);
    return subtotal > 0 && subtotal < freeShippingThreshold ? DEFAULT_SHIPPING_FEE : 0;
  }, [appliedCoupon, freeShippingThreshold, subtotal]);
  const total = useMemo(() => toMoney(subtotal - discount + shipping), [discount, shipping, subtotal]);
  const couponLabel = appliedCoupon?.code ? `Coupon ${appliedCoupon.code} applied` : "No coupon applied";
  const isLoggedIn = Boolean(currentUser);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let active = true;

    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setCurrentUser(data.user ?? null);
      setAuthLoading(false);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/store-settings", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as { freeShippingThreshold?: number };
        const threshold = Number(payload.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD);
        if (Number.isFinite(threshold) && threshold > 0) {
          setFreeShippingThreshold(threshold);
        }
      } catch {
        // keep fallback threshold
      }
    })();
  }, []);

  async function handlePlaceOrder() {
    if (authLoading || !isLoggedIn) {
      return;
    }

    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }
    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    const paymentStatus = paymentMethod === "cod" ? "pending" : "mock_paid";
    setIsPlacingOrder(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Authentication is not configured.");
        setIsPlacingOrder(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? "";
      if (!accessToken) {
        setError("You must be logged in to place an order.");
        setIsPlacingOrder(false);
        return;
      }

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          shippingAddress: address,
          paymentMethod,
          couponCode: appliedCoupon?.code ?? null,
          subtotal,
          discount,
          shipping,
          total,
          paymentStatus,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        orderId?: string;
        pricing?: {
          subtotal?: number;
          discount?: number;
          shipping?: number;
          total?: number;
        };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Failed to place order.");
        setIsPlacingOrder(false);
        return;
      }

      const pricing = payload.pricing ?? {
        subtotal,
        discount,
        shipping,
        total,
      };
      localStorage.setItem(
        CHECKOUT_LAST_ORDER_STORAGE_KEY,
        JSON.stringify({
          orderId: String(payload.orderId ?? ""),
          items: cart.map((item) => ({
            product: {
              id: item.product.id,
              slug: item.product.slug,
              title: item.product.title,
              image: item.product.image,
              price: item.product.price,
              style: item.product.style,
            },
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code ?? null,
          subtotal: Number(pricing.subtotal ?? subtotal),
          discount: Number(pricing.discount ?? discount),
          shipping: Number(pricing.shipping ?? shipping),
          total: Number(pricing.total ?? total),
          placedAt: new Date().toISOString(),
        }),
      );

      localStorage.removeItem(CHECKOUT_SHIPPING_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CHECKOUT_SHIPPING_STORAGE_KEY);
      localStorage.removeItem("geesun_checkout_shipping_form_v1");
      localStorage.removeItem(CHECKOUT_SHIPPING_TOUCHED_STORAGE_KEY);
      localStorage.removeItem(CHECKOUT_SHIPPING_ATTEMPTED_STORAGE_KEY);
      localStorage.removeItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
      localStorage.removeItem(CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY);
      localStorage.removeItem(CHECKOUT_RESUME_DATA_STORAGE_KEY);
      localStorage.removeItem(CHECKOUT_CURRENT_STEP_STORAGE_KEY);
      clearCart();

      setMessage("Order placed successfully. Redirecting...");
      const orderId = String(payload.orderId ?? "");
      setTimeout(() => {
        const url = orderId ? `/checkout/success?orderId=${encodeURIComponent(orderId)}` : "/checkout/success";
        router.push(url);
      }, 900);
    } catch {
      setError("Failed to place order.");
      setIsPlacingOrder(false);
    }
  }

  function handleLoginFromReview() {
    localStorage.setItem(CHECKOUT_CURRENT_STEP_STORAGE_KEY, "review");
    localStorage.setItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY, "/checkout?step=review");
    localStorage.setItem(
      CHECKOUT_RESUME_DATA_STORAGE_KEY,
      JSON.stringify({
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon?.code ?? null,
        totals: {
          subtotal,
          discount,
          shipping,
          total,
        },
      }),
    );
    router.push("/login");
  }

  if (!cart.length) {
    return (
      <section className="container-shell section-space">
        <div className="card-surface mx-auto max-w-xl p-8 text-center">
          <h1 className="font-[var(--font-heading)] text-4xl">No items to checkout</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Add some paintings to your cart to continue.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell section-space">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-[960px]">
          <CheckoutStepper />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-5 rounded-[28px] border border-[rgb(223_213_196)] bg-[rgb(247_242_236)] p-5 shadow-[0_16px_34px_rgb(89_71_46_/_12%)] sm:p-7"
          >
            <h1 className="font-[var(--font-heading)] text-5xl leading-none text-[rgb(66_57_48)]">Checkout</h1>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.3, ease: "easeOut" }}
              className="mt-5 rounded-3xl border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-4 shadow-[0_10px_22px_rgb(89_71_46_/_9%)] sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-3xl font-semibold text-[rgb(83_74_63)]">Review Order</h2>
                <EditPill label="Edit" onClick={() => router.push("/checkout")} />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.95fr]">
                <div className="space-y-3">
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <Image
                          src={item.product.image}
                          alt={item.product.title}
                          className="h-12 w-16 rounded-md border border-[rgb(227_216_198)] object-cover"
                          width={64}
                          height={48}
                        />
                        <p className="text-lg text-[rgb(90_80_68)]">
                          {item.product.title} <span className="text-[rgb(118_106_92)]">x {item.quantity}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  <CouponStrip label={couponLabel} amount={formatINR(total)} />
                </div>

                <div className="rounded-2xl border border-[rgb(223_213_196)] bg-[rgb(255_252_247)] p-4">
                  <p className="text-2xl font-semibold text-[rgb(83_74_63)]">Shipping to</p>
                  <AddressBlock address={address} className="mt-3 text-[rgb(95_84_72)]" />
                </div>
              </div>
            </motion.section>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                className="rounded-3xl border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-4 shadow-[0_9px_20px_rgb(89_71_46_/_8%)]"
              >
                <p className="text-3xl font-semibold text-[rgb(83_74_63)]">Shipping to</p>
                <AddressBlock address={address} className="mt-3 text-[rgb(95_84_72)]" />
                <div className="mt-4">
                  <CouponStrip label={couponLabel} amount={formatINR(total)} />
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.3, ease: "easeOut" }}
                className="rounded-3xl border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-4 shadow-[0_9px_20px_rgb(89_71_46_/_8%)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-3xl font-semibold text-[rgb(83_74_63)]">Payment</p>
                  <EditPill label="Edit" onClick={() => router.push("/checkout/payment")} />
                </div>

                <p className="mt-3 text-xl text-[rgb(90_80_68)]">
                  {paymentMethod ? paymentMethodLabel(paymentMethod) : "Not selected"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(228_218_202)] bg-[rgb(255_252_247)] px-3 py-2">
                  <LogoBadge label="VISA" />
                  <LogoBadge label="Mastercard" />
                  <LogoBadge label="Razorpay" />
                </div>

                <div className="mt-4 space-y-2 border-t border-[rgb(229_220_205)] pt-3 text-[rgb(95_84_72)]">
                  <PriceLine label="Subtotal" value={formatINR(subtotal)} />
                  <PriceLine label="Discount" value={`-${formatINR(discount)}`} />
                  <PriceLine label="Shipping" value={formatINR(shipping)} />
                  <PriceLine label="Total" value={formatINR(total)} strong />
                </div>
              </motion.section>
            </div>

            {!authLoading && !isLoggedIn ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.28, ease: "easeOut" }}
                className="mt-4 flex min-h-[54px] items-center justify-between gap-3 rounded-2xl border border-[rgb(225_213_194)] bg-[rgb(248_241_231)] px-4 py-2"
              >
                <div className="flex items-center gap-2.5 text-[rgb(108_97_84)]">
                  <LockIcon />
                  <p className="text-base">You must be logged in to place an order</p>
                </div>
                <button
                  type="button"
                  onClick={handleLoginFromReview}
                  className="inline-flex h-10 items-center rounded-full bg-[#6B7D5E] px-5 text-sm font-medium text-white transition hover:bg-[#5e6f53]"
                >
                  Login
                </button>
              </motion.div>
            ) : null}

            {error ? <p className="mt-4 text-sm text-[rgb(180_87_87)]">{error}</p> : null}
            {message ? <p className="mt-4 text-sm text-[rgb(76_96_63)]">{message}</p> : null}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.28, ease: "easeOut" }}
              className="mt-6 flex flex-wrap items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => router.push("/checkout/payment")}
                className="h-14 rounded-full border border-[rgb(212_198_178)] bg-[rgb(255_252_247)] px-8 text-2xl text-[rgb(108_97_84)] transition hover:bg-[rgb(251_246_238)]"
              >
                Back to Payment
              </button>
              <button
                type="button"
                disabled={authLoading || isPlacingOrder || !paymentMethod || !isLoggedIn}
                onClick={handlePlaceOrder}
                className={`inline-flex h-14 min-w-[230px] items-center justify-center gap-2 rounded-full px-8 text-2xl font-medium text-white transition-all duration-300 ${
                  authLoading || isPlacingOrder || !paymentMethod || !isLoggedIn
                    ? "cursor-not-allowed bg-[#91a084] opacity-60"
                    : "bg-[#6B7D5E] shadow-[0_13px_24px_rgb(107_125_94_/_30%)] hover:-translate-y-0.5 hover:bg-[#5d6f52]"
                }`}
              >
                <span>{isPlacingOrder ? "Placing Order..." : "Place Order"}</span>
                <ArrowRightIcon />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CheckoutStepper() {
  return (
    <div className="flex items-center gap-2.5 sm:gap-4">
      <StepNode number={1} label="Shipping" state="completed" />
      <span className="h-px flex-1 bg-[rgb(218_206_188)]" />
      <StepNode number={2} label="Payment" state="completed" />
      <span className="h-px flex-1 bg-[rgb(218_206_188)]" />
      <StepNode number={3} label="Review" state="active" />
    </div>
  );
}

function StepNode({
  number,
  label,
  state,
}: {
  number: number;
  label: string;
  state: "completed" | "active";
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
          state === "completed"
            ? "bg-[rgb(104_124_89)] text-white"
            : "border border-[rgb(213_201_183)] bg-[rgb(251_246_239)] text-[rgb(142_129_113)]"
        }`}
      >
        {number}
      </span>
      <span className={`text-lg ${state === "completed" ? "text-[rgb(83_74_63)]" : "text-[rgb(142_129_113)]"}`}>
        {label}
      </span>
    </div>
  );
}

function CouponStrip({
  label,
  amount,
}: {
  label: string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[rgb(228_218_201)] bg-[rgb(246_240_231)] px-3 py-2 text-[rgb(111_99_84)]">
      <p className="text-base">{label}</p>
      <p className="text-lg font-semibold text-[rgb(84_75_63)]">{amount}</p>
    </div>
  );
}

function EditPill({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(223_213_196)] bg-[rgb(243_235_223)] px-4 text-sm text-[rgb(118_106_92)] transition hover:bg-[rgb(238_229_215)]"
    >
      <PencilIcon />
      {label}
      <ArrowRightMiniIcon />
    </button>
  );
}

function AddressBlock({
  address,
  className,
}: {
  address: ShippingAddress;
  className?: string;
}) {
  return (
    <div className={`space-y-1 text-base leading-relaxed ${className ?? ""}`}>
      <p>{address.fullName || "-"}</p>
      <p>{address.phone || "-"}</p>
      <p>{address.email || "-"}</p>
      <p>{address.streetAddress || "-"}</p>
      <p>{address.city || "-"}</p>
      <p>{address.pincode || "-"}</p>
    </div>
  );
}

function LogoBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-[rgb(223_213_196)] bg-white px-2.5 py-1 text-sm font-semibold text-[rgb(89_80_67)]">
      {label}
    </span>
  );
}

function PriceLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className={strong ? "text-2xl font-semibold text-[rgb(76_66_55)]" : "text-lg"}>{label}</p>
      <p className={strong ? "text-2xl font-semibold text-[rgb(76_66_55)]" : "text-lg"}>{value}</p>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h9M8.5 3.5L13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightMiniIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5h5M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 8.8l.4-2.1L7.9 1.2a1 1 0 0 1 1.4 0l1.5 1.5a1 1 0 0 1 0 1.4L5.3 9.6 3.2 10z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.25" y="6.25" width="9.5" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 6.25V4.5a2.5 2.5 0 015 0v1.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
