"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";
import {
  CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY,
  CHECKOUT_PAYMENT_METHOD_STORAGE_KEY,
  EMPTY_PAYMENT_DRAFT,
  normalizePaymentDraft,
  paymentMethodLabel,
  type CardDraft,
  type PaymentMethod,
} from "@/lib/checkout/state";

function normalizeCardNumber(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(" ");
}

function normalizeExpiry(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateCardDraft(values: CardDraft) {
  const errors: Partial<Record<keyof CardDraft, string>> = {};
  if (!/^\d{16}$/.test(values.cardNumber.replace(/\s/g, ""))) {
    errors.cardNumber = "Card number must be 16 digits.";
  }
  if (!values.cardName.trim()) {
    errors.cardName = "Name on card is required.";
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry.trim())) {
    errors.expiry = "Expiry should be in MM/YY format.";
  }
  if (!/^\d{3}$/.test(values.cvv.trim())) {
    errors.cvv = "CVV must be 3 digits.";
  }
  return errors;
}

function validateUpiId(value: string) {
  return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(value.trim());
}

export function PaymentShell() {
  const router = useRouter();
  const { cart } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(() => {
    if (typeof window === "undefined") return null;
    const savedMethod = localStorage.getItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
    if (savedMethod === "card" || savedMethod === "upi" || savedMethod === "cod") {
      return savedMethod;
    }
    return null;
  });
  const [cardDraft, setCardDraft] = useState<CardDraft>(() => {
    if (typeof window === "undefined") return EMPTY_PAYMENT_DRAFT.card;
    try {
      const savedDraft = localStorage.getItem(CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY);
      if (!savedDraft) return EMPTY_PAYMENT_DRAFT.card;
      return normalizePaymentDraft(JSON.parse(savedDraft)).card;
    } catch {
      return EMPTY_PAYMENT_DRAFT.card;
    }
  });
  const [upiId, setUpiId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const savedDraft = localStorage.getItem(CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY);
      if (!savedDraft) return "";
      return normalizePaymentDraft(JSON.parse(savedDraft)).upiId;
    } catch {
      return "";
    }
  });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const cardErrors = useMemo(() => validateCardDraft(cardDraft), [cardDraft]);
  const isCardValid = useMemo(() => Object.keys(cardErrors).length === 0, [cardErrors]);
  const isUpiValid = useMemo(() => validateUpiId(upiId), [upiId]);

  const canContinueToReview = useMemo(() => {
    if (!selectedMethod) return false;
    if (selectedMethod === "card") return isCardValid;
    if (selectedMethod === "upi") return isUpiValid;
    return true;
  }, [isCardValid, isUpiValid, selectedMethod]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedMethod) {
      localStorage.setItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY, selectedMethod);
      return;
    }
    localStorage.removeItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
  }, [selectedMethod]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY,
      JSON.stringify({
        card: cardDraft,
        upiId,
      }),
    );
  }, [cardDraft, upiId]);

  function selectMethod(method: PaymentMethod) {
    setSelectedMethod(method);
    void fetch("/api/checkout/save-payment-method", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentMethod: method }),
    }).catch(() => null);
  }

  function handleContinueToReview() {
    setAttemptedSubmit(true);
    if (!canContinueToReview || !selectedMethod) return;

    localStorage.setItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY, selectedMethod);
    void fetch("/api/checkout/save-payment-method", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentMethod: selectedMethod }),
    }).catch(() => null);
    router.push("/checkout/review");
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
          <p className="mt-3 text-sm text-[var(--text-muted)]">Choose your preferred payment method.</p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <PaymentOption
              title={paymentMethodLabel("card")}
              selected={selectedMethod === "card"}
              onSelect={() => selectMethod("card")}
            />
            <PaymentOption title={paymentMethodLabel("upi")} selected={selectedMethod === "upi"} onSelect={() => selectMethod("upi")} />
            <PaymentOption
              title={paymentMethodLabel("cod")}
              selected={selectedMethod === "cod"}
              onSelect={() => selectMethod("cod")}
            />
          </div>

          {selectedMethod === "card" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6 rounded-2xl border border-[rgb(223_213_196)] bg-[rgb(253_250_245)] p-5"
            >
              <p className="text-sm font-medium text-[rgb(111_99_84)]">Card details (temporary UI only)</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Card Number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDraft.cardNumber}
                  onChange={(value) => setCardDraft((s) => ({ ...s, cardNumber: normalizeCardNumber(value) }))}
                  error={attemptedSubmit ? cardErrors.cardNumber : undefined}
                />
                <TextInput
                  label="Name on Card"
                  placeholder="Enter name on card"
                  value={cardDraft.cardName}
                  onChange={(value) => setCardDraft((s) => ({ ...s, cardName: value }))}
                  error={attemptedSubmit ? cardErrors.cardName : undefined}
                />
                <TextInput
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={cardDraft.expiry}
                  onChange={(value) => setCardDraft((s) => ({ ...s, expiry: normalizeExpiry(value) }))}
                  error={attemptedSubmit ? cardErrors.expiry : undefined}
                />
                <TextInput
                  label="CVV"
                  placeholder="123"
                  value={cardDraft.cvv}
                  onChange={(value) => setCardDraft((s) => ({ ...s, cvv: value.replace(/\D/g, "").slice(0, 3) }))}
                  error={attemptedSubmit ? cardErrors.cvv : undefined}
                />
              </div>
            </motion.div>
          ) : null}

          {selectedMethod === "upi" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6 rounded-2xl border border-[rgb(223_213_196)] bg-[rgb(253_250_245)] p-5"
            >
              <TextInput
                label="UPI ID"
                placeholder="yourname@upi"
                value={upiId}
                onChange={setUpiId}
                error={attemptedSubmit && !isUpiValid ? "Please enter a valid UPI ID." : undefined}
              />
            </motion.div>
          ) : null}

          {selectedMethod === "cod" ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6 rounded-2xl border border-[rgb(223_213_196)] bg-[rgb(253_250_245)] px-5 py-4 text-sm text-[var(--text-muted)]"
            >
              Pay with cash when your order is delivered.
            </motion.p>
          ) : null}

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
              disabled={!canContinueToReview}
              onClick={handleContinueToReview}
              className={`h-14 min-w-[230px] rounded-full px-8 text-lg font-medium text-white transition-all duration-300 ${
                canContinueToReview
                  ? "bg-[#6B7D5E] shadow-[0_12px_26px_rgb(107_125_94_/_30%)] hover:-translate-y-0.5 hover:bg-[#5f7053]"
                  : "cursor-not-allowed bg-[#91a084] opacity-60"
              }`}
            >
              Continue to Review
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PaymentOption({
  title,
  selected,
  onSelect,
}: {
  title: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-16 items-center justify-between rounded-2xl border px-4 text-left transition ${
        selected
          ? "border-[rgb(126_155_109)] bg-[rgb(240_247_236)]"
          : "border-[rgb(223_213_196)] bg-[rgb(255_253_248)] hover:bg-[rgb(252_248_240)]"
      }`}
    >
      <span className="text-lg text-[rgb(82_73_62)]">{title}</span>
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
          selected
            ? "border-[rgb(126_155_109)] bg-[rgb(126_155_109)]"
            : "border-[rgb(207_194_176)] bg-[rgb(255_253_248)]"
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-white" : "bg-transparent"}`} />
      </span>
    </button>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const hasError = Boolean(error);
  return (
    <label className="text-base text-[rgb(111_99_84)]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 h-14 w-full rounded-2xl px-5 text-lg text-[var(--text-primary)] outline-none transition placeholder:text-[rgb(168_155_138)] ${
          hasError
            ? "border border-[rgb(213_149_149)] bg-[rgb(255_244_244)] focus:border-[rgb(198_118_118)] focus:shadow-[0_0_0_4px_rgb(198_118_118_/_15%)]"
            : "border border-[rgb(223_211_193)] bg-[rgb(255_254_250)] focus:border-[rgb(134_154_119)] focus:shadow-[0_0_0_4px_rgb(107_125_94_/_12%)]"
        }`}
      />
      {hasError ? <p className="mt-1 text-xs text-[rgb(180_87_87)]">{error}</p> : null}
    </label>
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
