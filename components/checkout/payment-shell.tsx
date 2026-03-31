"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";

export function PaymentShell() {
  const router = useRouter();
  const { cart } = useStore();

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
      <div className="mx-auto max-w-5xl">
        <h1 className="font-[var(--font-heading)] text-5xl">Checkout</h1>

        <div className="mt-5 flex items-center gap-3 sm:gap-4">
          <StepBubble number={1} label="Shipping" />
          <span className="h-px flex-1 bg-[rgb(220_210_193)]" />
          <StepBubble number={2} label="Payment" active />
          <span className="h-px flex-1 bg-[rgb(220_210_193)]" />
          <StepBubble number={3} label="Review" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-7 rounded-[30px] border border-[rgb(223_213_196)] bg-[rgb(248_244_238)] p-6 shadow-[0_14px_34px_rgb(89_71_46_/_10%)] sm:p-8"
        >
          <h2 className="font-[var(--font-heading)] text-4xl leading-none sm:text-[2.15rem]">Payment</h2>
          <p className="mt-4 text-base text-[var(--text-muted)]">
            Payment step is now active. You can wire your payment form here next.
          </p>

          <div className="mt-8 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="h-14 rounded-full border border-[rgb(218_205_186)] bg-[rgb(255_253_248)] px-8 text-lg text-[var(--text-muted)] transition hover:bg-[rgb(252_248_240)]"
            >
              Back to Shipping
            </button>
            <button
              type="button"
              className="h-14 min-w-[230px] rounded-full bg-[#6B7D5E] px-8 text-lg font-medium text-white shadow-[0_12px_26px_rgb(107_125_94_/_30%)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5f7053]"
            >
              Continue to Review
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StepBubble({
  number,
  label,
  active = false,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap">
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
          active
            ? "bg-[var(--olive)] text-white"
            : "border border-[rgb(215_202_184)] bg-[rgb(250_245_238)] text-[var(--text-muted)]"
        }`}
      >
        {number}
      </span>
      <span className={`text-lg ${active ? "text-[var(--olive)]" : "text-[var(--text-muted)]"}`}>{label}</span>
    </div>
  );
}

