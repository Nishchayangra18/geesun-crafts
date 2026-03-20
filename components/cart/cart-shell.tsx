"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/providers/store-provider";
import { formatINR } from "@/lib/utils";

export function CartShell() {
  const { cart, removeFromCart, updateCartQuantity } = useStore();
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 250 : 0;
  const total = subtotal + shipping;

  if (!cart.length) {
    return (
      <section className="container-shell section-space">
        <div className="card-surface mx-auto max-w-xl p-8 text-center">
          <h1 className="font-[var(--font-heading)] text-4xl">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Explore our curated gallery and add your favorite pieces.
          </p>
          <Link href="/shop" className="olive-btn mt-6 inline-block rounded-full px-6 py-3 text-sm">
            Browse Paintings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell section-space">
      <h1 className="mb-6 font-[var(--font-heading)] text-5xl">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {cart.map((item) => (
            <article
              key={item.product.id}
              className="card-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-28 w-full overflow-hidden rounded-lg sm:w-36">
                <Image src={item.product.image} alt={item.product.title} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <h2 className="font-[var(--font-heading)] text-2xl">{item.product.title}</h2>
                <p className="text-sm text-[var(--text-muted)]">{item.product.dimensions}</p>
                <p className="mt-2 text-sm font-medium">{formatINR(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="outline-btn rounded-full px-3 py-1"
                >
                  -
                </button>
                <p className="w-8 text-center">{item.quantity}</p>
                <button
                  type="button"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="outline-btn rounded-full px-3 py-1"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(item.product.id)}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Remove
              </button>
            </article>
          ))}
        </div>

        <aside className="card-surface h-fit space-y-4 p-5">
          <h2 className="font-[var(--font-heading)] text-3xl">Summary</h2>
          <Line label="Subtotal" value={formatINR(subtotal)} />
          <Line label="Shipping" value={formatINR(shipping)} />
          <hr className="soft-divider" />
          <Line label="Total" value={formatINR(total)} strong />
          <Link href="/checkout" className="olive-btn mt-4 block rounded-full px-5 py-3 text-center">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <p className={strong ? "font-semibold" : "text-[var(--text-muted)]"}>{label}</p>
      <p className={strong ? "font-semibold" : ""}>{value}</p>
    </div>
  );
}
