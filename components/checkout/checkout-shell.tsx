"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/utils";

const steps = ["Address", "Payment", "Review"] as const;

export function CheckoutShell() {
  const router = useRouter();
  const { cart, clearCart } = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    orderId: string;
    totalAmount: number;
    subTotal: number;
    shipping: number;
  } | null>(null);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    city: "",
    street: "",
    pincode: "",
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingAmount = subtotal > 0 ? 250 : 0;
  const total = subtotal + shippingAmount;

  async function placeOrder() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Please login to place your order.");
      }

      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const validationResponse = await fetch("/api/orders/validate-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: orderItems,
        }),
      });
      const validationPayload = await validationResponse.json();
      if (!validationResponse.ok || !validationPayload.ok) {
        const issueMessage =
          validationPayload?.issues?.[0]?.title
            ? `${validationPayload.issues[0].title}: requested ${validationPayload.issues[0].requested}, available ${validationPayload.issues[0].available}`
            : validationPayload.error;
        throw new Error(issueMessage ?? "Stock changed while checking out.");
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: orderItems,
          shipping_amount: shippingAmount,
          shipping_address: address,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to place order");

      setConfirmation({
        orderId: payload.orderId ?? "pending",
        totalAmount: Number(payload.pricing?.total ?? 0),
        subTotal: Number(payload.pricing?.sub_total ?? 0),
        shipping: Number(payload.pricing?.shipping ?? 0),
      });
      clearCart();
      startTransition(() => {
        router.replace(`/checkout?success=true&orderId=${payload.orderId ?? "pending"}`);
      });
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "We could not place your order. Please retry.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <section className="container-shell section-space">
        <div className="card-surface mx-auto max-w-2xl p-8 text-center">
          <h1 className="font-[var(--font-heading)] text-4xl">Order Confirmed</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Your order <span className="font-medium">{confirmation.orderId}</span> has been placed.
          </p>
          <div className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl border border-[var(--border-soft)] bg-white/70 p-4 text-left">
            <p className="text-sm text-[var(--text-muted)]">
              Server Subtotal: <span className="font-medium text-[var(--text-primary)]">{formatINR(confirmation.subTotal)}</span>
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Server Shipping: <span className="font-medium text-[var(--text-primary)]">{formatINR(confirmation.shipping)}</span>
            </p>
            <p className="text-sm font-semibold">
              Server Total: {formatINR(confirmation.totalAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/shop")}
            className="olive-btn mt-6 rounded-full px-6 py-3 text-sm"
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  if (!cart.length) {
    return (
      <section className="container-shell section-space">
        <div className="card-surface mx-auto max-w-xl p-8 text-center">
          <h1 className="font-[var(--font-heading)] text-4xl">No items to checkout</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Add some paintings to your cart to continue.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell section-space">
      <h1 className="font-[var(--font-heading)] text-5xl">Checkout</h1>
      <div className="mt-4 flex gap-3 text-sm">
        {steps.map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => setStep(index)}
            className={`rounded-full px-4 py-2 ${
              index === step
                ? "olive-btn"
                : "border border-[var(--border-soft)] bg-[var(--panel)] text-[var(--text-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card-surface p-5">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={address.name} onChange={(name) => setAddress((s) => ({ ...s, name }))} />
              <Field label="Phone" value={address.phone} onChange={(phone) => setAddress((s) => ({ ...s, phone }))} />
              <Field label="City" value={address.city} onChange={(city) => setAddress((s) => ({ ...s, city }))} />
              <Field
                label="Street Address"
                value={address.street}
                onChange={(street) => setAddress((s) => ({ ...s, street }))}
              />
              <Field
                label="Pincode"
                value={address.pincode}
                onChange={(pincode) => setAddress((s) => ({ ...s, pincode }))}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="font-[var(--font-heading)] text-3xl">Payment</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Razorpay integration is ready via `/api/payments/create-order` and `/api/payments/verify`.
              </p>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                For now this setup uses order API-first flow so you can enable payments as soon as keys are added.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="font-[var(--font-heading)] text-3xl">Review Order</h2>
              <div className="mt-4 space-y-2 text-sm">
                {cart.map((item) => (
                  <p key={item.product.id}>
                    {item.product.title} x {item.quantity}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="outline-btn rounded-full px-5 py-2 text-sm disabled:opacity-50"
            >
              Back
            </button>
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                className="olive-btn rounded-full px-5 py-2 text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={placeOrder}
                disabled={loading}
                className="olive-btn rounded-full px-5 py-2 text-sm disabled:opacity-70"
              >
                {loading ? "Placing..." : "Place Order"}
              </button>
            )}
          </div>
        </div>

        <aside className="card-surface h-fit space-y-3 p-5">
          <h2 className="font-[var(--font-heading)] text-3xl">Order Summary</h2>
          <p className="text-sm text-[var(--text-muted)]">Subtotal: {formatINR(subtotal)}</p>
          <p className="text-sm text-[var(--text-muted)]">Shipping: {formatINR(shippingAmount)}</p>
          <hr className="soft-divider" />
          <p className="font-semibold">Total: {formatINR(total)}</p>
        </aside>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="text-sm text-[var(--text-muted)]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-[var(--text-primary)] outline-none"
      />
    </label>
  );
}
