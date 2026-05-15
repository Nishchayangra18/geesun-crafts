"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/utils";

type OrderDetails = {
  id: string;
  created_at: string | null;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    fullName?: string;
    phone?: string;
    email?: string;
    streetAddress?: string;
    city?: string;
    pincode?: string;
    [key: string]: unknown;
  };
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      slug: string;
      title: string;
      image: string | null;
    } | null;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paymentMethodLabel(value: string) {
  if (value === "card") return "Credit / Debit Card";
  if (value === "upi") return "UPI";
  if (value === "cod") return "Cash on Delivery";
  return value || "-";
}

export function OrderDetailsShell({
  orderId,
  source,
}: {
  orderId: string;
  source?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          throw new Error("Authentication is not configured.");
        }
        const auth = supabase.auth;

        async function getAccessTokenWithRetry() {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const {
              data: { session },
            } = await auth.getSession();
            const token = session?.access_token ?? "";
            if (token) return token;
            await new Promise((resolve) => window.setTimeout(resolve, 250));
          }
          return "";
        }

        const accessToken = await getAccessTokenWithRetry();
        if (!accessToken) {
          throw new Error("You must be logged in to view this order.");
        }

        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          order?: OrderDetails;
        };

        if (!response.ok || !payload.ok || !payload.order) {
          if (response.status === 401) {
            throw new Error(payload.error ?? "Invalid user session");
          }
          if (response.status === 404) {
            throw new Error(payload.error ?? "Order not found.");
          }
          throw new Error(payload.error ?? "Failed to load order details.");
        }

        if (!active) return;
        setOrder(payload.order);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load order details.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <section className="container-shell section-space">
        <div className="mx-auto max-w-5xl rounded-[30px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-8 shadow-[0_12px_26px_rgb(89_71_46_/_10%)]">
          <h1 className="font-[var(--font-heading)] text-5xl text-[rgb(69_60_50)]">Order Details</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">Loading your order details...</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-shell section-space">
        <div className="mx-auto max-w-4xl rounded-[30px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-8 text-center shadow-[0_12px_26px_rgb(89_71_46_/_10%)]">
          <h1 className="font-[var(--font-heading)] text-5xl text-[rgb(69_60_50)]">Order Details</h1>
          <p className="mt-3 text-base text-[rgb(128_100_92)]">{error ?? "Order not found."}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/account"
              className="inline-flex h-12 items-center rounded-full border border-[rgb(216_202_184)] bg-[rgb(255_253_248)] px-6 text-base text-[rgb(107_95_81)] transition hover:bg-[rgb(250_246_239)]"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const address = order.shipping_address ?? {};
  const isFromConfirmation = source === "confirmation";
  const secondaryButtonHref = isFromConfirmation
    ? `/order-confirmed?orderId=${encodeURIComponent(order.id)}`
    : "/account/orders";
  const secondaryButtonLabel = isFromConfirmation ? "Back to Confirmation Page" : "Back to Orders Page";

  return (
    <section className="container-shell section-space">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[var(--font-heading)] text-6xl text-[rgb(69_60_50)]">Order Details</h1>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-[26px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-5 shadow-[0_11px_24px_rgb(89_71_46_/_9%)] lg:col-span-2"
          >
            <h2 className="font-[var(--font-heading)] text-4xl text-[rgb(70_61_51)]">Order</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetaLine label="Order ID" value={order.id} />
              <MetaLine label="Order date" value={formatDate(order.created_at)} />
              <MetaLine label="Payment method" value={paymentMethodLabel(order.payment_method)} />
              <MetaLine label="Payment status" value={order.payment_status || "-"} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3, ease: "easeOut" }}
            className="rounded-[26px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-5 shadow-[0_11px_24px_rgb(89_71_46_/_9%)]"
          >
            <h2 className="font-[var(--font-heading)] text-4xl text-[rgb(70_61_51)]">Shipping</h2>
            <div className="mt-4 space-y-1 text-[rgb(101_90_75)]">
              <p>{String(address.fullName ?? "-")}</p>
              <p>{String(address.phone ?? "-")}</p>
              <p>{String(address.email ?? "-")}</p>
              <p>{String(address.streetAddress ?? "-")}</p>
              <p>{String(address.city ?? "-")}</p>
              <p>{String(address.pincode ?? "-")}</p>
            </div>
          </motion.section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.3, ease: "easeOut" }}
            className="rounded-[26px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-5 shadow-[0_11px_24px_rgb(89_71_46_/_9%)]"
          >
            <h2 className="font-[var(--font-heading)] text-4xl text-[rgb(70_61_51)]">Items</h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={`${item.product_id}-${item.quantity}`} className="rounded-xl border border-[rgb(229_219_203)] bg-[rgb(255_252_247)] p-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={
                        item.product?.image ??
                        "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={item.product?.title ?? "Order item"}
                      width={84}
                      height={64}
                      className="h-16 w-[84px] rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-lg font-medium text-[rgb(79_70_59)]">{item.product?.title ?? "Product"}</p>
                      <p className="text-sm text-[rgb(121_108_90)]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-base font-semibold text-[rgb(79_70_59)]">{formatINR(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3, ease: "easeOut" }}
            className="rounded-[26px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-5 shadow-[0_11px_24px_rgb(89_71_46_/_9%)]"
          >
            <h2 className="font-[var(--font-heading)] text-4xl text-[rgb(70_61_51)]">Totals</h2>
            <div className="mt-4 space-y-2 text-[rgb(101_90_75)]">
              <TotalLine label="Subtotal" value={formatINR(order.subtotal)} />
              <TotalLine label="Discount" value={`-${formatINR(order.discount)}`} />
              <TotalLine label="Shipping" value={formatINR(order.shipping)} />
              <TotalLine label="Coupon" value={order.coupon_code || "-"} />
              <TotalLine label="Total" value={formatINR(order.total)} strong />
            </div>
          </motion.section>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center rounded-full bg-[#6B7D5E] px-6 text-base font-medium text-white shadow-[0_10px_22px_rgb(107_125_94_/_30%)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5d6f52]"
          >
            Continue Shopping
          </Link>
          <Link
            href={secondaryButtonHref}
            className="inline-flex h-12 items-center rounded-full border border-[rgb(216_202_184)] bg-[rgb(255_253_248)] px-6 text-base text-[rgb(107_95_81)] transition hover:bg-[rgb(250_246_239)]"
          >
            {secondaryButtonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(229_219_203)] bg-[rgb(255_252_247)] px-3 py-2">
      <p className="text-xs uppercase tracking-[0.07em] text-[rgb(134_122_106)]">{label}</p>
      <p className="mt-1 text-[rgb(88_79_67)]">{value}</p>
    </div>
  );
}

function TotalLine({
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
      <p className={strong ? "text-xl font-semibold text-[rgb(76_66_55)]" : "text-base"}>{label}</p>
      <p className={strong ? "text-xl font-semibold text-[rgb(76_66_55)]" : "text-base"}>{value}</p>
    </div>
  );
}
