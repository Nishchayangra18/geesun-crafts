"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import {
  CHECKOUT_LAST_ORDER_STORAGE_KEY,
  type LastOrderSnapshot,
} from "@/lib/checkout/state";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

type Recommendation = Product;

function toMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function readLastOrderSnapshot(): LastOrderSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastOrderSnapshot;
  } catch {
    return null;
  }
}

export function OrderConfirmedShell({ orderId }: { orderId: string }) {
  const { addToCart } = useStore();
  const [orderSnapshot, setOrderSnapshot] = useState<LastOrderSnapshot | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    setOrderSnapshot(readLastOrderSnapshot());
  }, []);

  const effectiveOrderId = useMemo(
    () => String(orderSnapshot?.orderId ?? orderId ?? ""),
    [orderId, orderSnapshot?.orderId],
  );

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as { products?: Product[] };
        const allProducts = Array.isArray(payload.products) ? payload.products : [];
        if (!allProducts.length) return;

        const purchasedIds = new Set(orderSnapshot?.items.map((entry) => entry.product.id) ?? []);
        const preferredStyle = orderSnapshot?.items[0]?.product.style ?? "";
        const prioritized = allProducts
          .filter((item) => !purchasedIds.has(item.id))
          .sort((a, b) => {
            const aScore = a.style === preferredStyle ? 1 : 0;
            const bScore = b.style === preferredStyle ? 1 : 0;
            return bScore - aScore;
          })
          .slice(0, 2);

        setRecommendations(prioritized);
      } catch {
        // leave recommendations hidden if fetch fails
      }
    })();
  }, [orderSnapshot?.items]);

  async function handleAddToCart(product: Product) {
    setAddingProductId(product.id);
    try {
      await addToCart(product);
    } finally {
      setAddingProductId(null);
    }
  }

  const hasOrderItems = Boolean(orderSnapshot?.items?.length);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[rgb(250_246_240)] via-[rgb(248_243_237)] to-[rgb(245_239_232)]">
      <div className="container-shell section-space">
        <div className="mx-auto max-w-[1240px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mx-auto max-w-4xl rounded-[32px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] px-6 py-10 text-center shadow-[0_18px_42px_rgb(89_71_46_/_12%)] sm:px-10"
          >
            <h1 className="font-[var(--font-heading)] text-6xl leading-none text-[rgb(66_57_48)]">Order Confirmed</h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-[rgb(114_101_85)]">
              Thank you for shopping with Geesun Crafts! Your order has been placed successfully.
            </p>
            {effectiveOrderId ? (
              <p className="mt-4 text-lg text-[rgb(121_108_90)]">
                Order ID: <span className="font-semibold text-[rgb(84_75_63)]">{effectiveOrderId}</span>
              </p>
            ) : null}
            <div className="mt-8 flex justify-center">
              <Link
                href="/shop"
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#6B7D5E] px-8 text-lg font-medium text-white shadow-[0_12px_24px_rgb(107_125_94_/_30%)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5c6d51] sm:w-auto"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>

          {hasOrderItems ? (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.34, ease: "easeOut" }}
              className="mt-14"
            >
              <h2 className="font-[var(--font-heading)] text-5xl text-[rgb(70_61_51)]">Order Summary</h2>
              <div className="mt-4 rounded-[30px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-4 shadow-[0_14px_30px_rgb(89_71_46_/_10%)] sm:p-6">
                <div className="overflow-x-auto md:overflow-visible">
                  <div className="flex min-w-max gap-3 md:min-w-0 md:flex-wrap lg:flex-nowrap">
                    {orderSnapshot?.items.map((entry, index) => (
                      <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14 + index * 0.06, duration: 0.25, ease: "easeOut" }}
                      key={`${entry.product.id}-${entry.quantity}`}
                      className="min-w-[248px] rounded-2xl border border-[rgb(229_219_203)] bg-[rgb(255_252_247)] p-3 transition duration-300 hover:-translate-y-0.5 md:flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={entry.product.image}
                          alt={entry.product.title}
                          width={96}
                          height={72}
                          className="h-[72px] w-24 rounded-md border border-[rgb(228_217_200)] object-cover"
                        />
                        <div>
                          <p className="text-lg font-medium leading-tight text-[rgb(78_69_58)]">
                            {entry.product.title} <span className="text-[rgb(118_106_90)]">x {entry.quantity}</span>
                          </p>
                          <p className="mt-1 text-base font-semibold text-[rgb(80_70_59)]">
                            {formatINR(toMoney(entry.product.price * entry.quantity))}
                          </p>
                        </div>
                      </div>
                      </motion.article>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[rgb(226_215_198)] bg-[rgb(245_239_230)] px-4 py-3 text-[rgb(102_90_76)] sm:px-5">
                  {orderSnapshot?.couponCode ? (
                    <p className="text-base font-medium">{`Coupon ${orderSnapshot.couponCode} applied`}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xl font-semibold text-[rgb(77_68_57)]">
                    {formatINR(toMoney(orderSnapshot?.total ?? 0))}
                  </p>
                </div>
              </div>
            </motion.section>
          ) : null}

          {effectiveOrderId ? (
            <div className="mt-5 text-center">
              <Link
                href={`/account/orders/${encodeURIComponent(effectiveOrderId)}?source=confirmation`}
                className="group inline-flex items-center gap-1 text-lg text-[rgb(112_99_84)] transition hover:text-[rgb(83_72_60)]"
              >
                View Order Details
                <span className="transition group-hover:translate-x-0.5">›</span>
              </Link>
            </div>
          ) : null}

          <div className={`mt-10 grid gap-5 ${recommendations.length ? "lg:grid-cols-[1fr_1.2fr]" : ""}`}>
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.34, ease: "easeOut" }}
              className="rounded-[26px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-6 shadow-[0_12px_26px_rgb(89_71_46_/_9%)]"
            >
              <h3 className="font-[var(--font-heading)] text-4xl text-[rgb(70_61_51)]">Need Help?</h3>
              <p className="mt-2 text-base text-[rgb(114_101_85)]">Need support help? Get in touch with us quickly.</p>

              <div className="mt-5 space-y-3">
                <a
                  href="tel:+919000090000"
                  className="inline-flex w-full items-center gap-2 rounded-full border border-[rgb(226_215_198)] bg-white px-4 py-2.5 text-[rgb(94_82_68)] transition hover:bg-[rgb(248_243_236)]"
                >
                  <PhoneIcon />
                  +91 90000 90000
                </a>
                <a
                  href="mailto:help@geesuncrafts.com"
                  className="inline-flex w-full items-center gap-2 rounded-full border border-[rgb(226_215_198)] bg-white px-4 py-2.5 text-[rgb(94_82_68)] transition hover:bg-[rgb(248_243_236)]"
                >
                  <MailIcon />
                  help@geesuncrafts.com
                </a>
              </div>
            </motion.section>

            {recommendations.length ? (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.34, ease: "easeOut" }}
                className="rounded-[26px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-5 shadow-[0_12px_26px_rgb(89_71_46_/_9%)]"
              >
                <h3 className="font-[var(--font-heading)] text-4xl text-[rgb(70_61_51)]">You may also like</h3>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
                  {recommendations.map((product, index) => (
                    <motion.article
                      key={product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.24 + index * 0.08, duration: 0.3, ease: "easeOut" }}
                      className="min-w-[220px] flex-1 rounded-2xl border border-[rgb(226_215_198)] bg-white p-3 shadow-[0_8px_18px_rgb(89_71_46_/_8%)] transition hover:-translate-y-0.5"
                    >
                      <Link href={`/shop/${product.slug}`}>
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={260}
                          height={160}
                          className="h-32 w-full rounded-xl object-cover"
                        />
                      </Link>
                      <p className="mt-2 text-lg font-medium text-[rgb(84_75_63)]">{product.title}</p>
                      <p className="mt-1 text-base font-semibold text-[rgb(80_70_59)]">{formatINR(toMoney(product.price))}</p>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={addingProductId === product.id}
                        className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#6B7D5E] px-4 text-sm font-medium text-white transition hover:bg-[#5d6e52] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {addingProductId === product.id ? "Adding..." : "Add to Cart"}
                      </button>
                    </motion.article>
                  ))}
                </div>
              </motion.section>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 1.75h2l1 2.5L4.75 5.5A9 9 0 008.5 9.25L9.75 8l2.5 1v2A1.25 1.25 0 0111 12.25h-.5A9.75 9.75 0 011.75 3.5V3A1.25 1.25 0 013 1.75z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.75" y="2.5" width="10.5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 3.25L7 6.5l4.5-3.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
