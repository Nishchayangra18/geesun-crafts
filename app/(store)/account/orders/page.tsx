import Link from "next/link";

export default function OrdersIndexPage() {
  return (
    <section className="container-shell section-space">
      <div className="mx-auto max-w-4xl rounded-[30px] border border-[rgb(223_213_196)] bg-[rgb(252_249_244)] p-8 text-center shadow-[0_12px_26px_rgb(89_71_46_/_10%)]">
        <h1 className="font-[var(--font-heading)] text-5xl text-[rgb(69_60_50)]">Your Orders</h1>
        <p className="mt-3 text-base text-[var(--text-muted)]">
          Order history list can be expanded here. Open order details directly from confirmation pages.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center rounded-full bg-[#6B7D5E] px-6 text-base font-medium text-white transition hover:bg-[#5d6f52]"
          >
            Continue Shopping
          </Link>
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

