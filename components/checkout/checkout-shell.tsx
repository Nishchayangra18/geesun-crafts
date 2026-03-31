"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";

type ShippingForm = {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  pincode: string;
};

type FieldKey = keyof ShippingForm;
type FieldErrors = Partial<Record<FieldKey, string>>;
type TouchedState = Record<FieldKey, boolean>;

const SHIPPING_FORM_STORAGE_KEY = "geesun_checkout_shipping_form_v1";
const SHIPPING_TOUCHED_STORAGE_KEY = "geesun_checkout_shipping_touched_v1";
const SHIPPING_ATTEMPTED_STORAGE_KEY = "geesun_checkout_shipping_attempted_v1";

const EMPTY_FORM: ShippingForm = {
  name: "",
  phone: "",
  email: "",
  city: "",
  street: "",
  pincode: "",
};

const EMPTY_TOUCHED: TouchedState = {
  name: false,
  phone: false,
  email: false,
  street: false,
  city: false,
  pincode: false,
};

function validateShipping(values: ShippingForm): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim() || values.name.trim().length < 2) {
    errors.name = "Please enter at least 2 characters.";
  }
  if (!/^\d{10}$/.test(values.phone.trim())) {
    errors.phone = "Phone must be exactly 10 digits.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.street.trim() || values.street.trim().length < 8) {
    errors.street = "Street address must be at least 8 characters.";
  }
  if (!values.city.trim() || values.city.trim().length < 2) {
    errors.city = "City must be at least 2 characters.";
  }
  if (!/^\d{6}$/.test(values.pincode.trim())) {
    errors.pincode = "Pincode must be exactly 6 digits.";
  }

  return errors;
}

export function CheckoutShell() {
  const router = useRouter();
  const { cart } = useStore();
  const [address, setAddress] = useState<ShippingForm>(EMPTY_FORM);
  const [touched, setTouched] = useState<TouchedState>(EMPTY_TOUCHED);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [shakeNonce, setShakeNonce] = useState(0);
  const fieldRefs = useRef<Record<FieldKey, HTMLDivElement | null>>({
    name: null,
    phone: null,
    email: null,
    street: null,
    city: null,
    pincode: null,
  });

  const errors = useMemo(() => validateShipping(address), [address]);
  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const savedAddress = localStorage.getItem(SHIPPING_FORM_STORAGE_KEY);
        const savedTouched = localStorage.getItem(SHIPPING_TOUCHED_STORAGE_KEY);
        const savedAttempted = localStorage.getItem(SHIPPING_ATTEMPTED_STORAGE_KEY);

        if (savedAddress) {
          const parsed = JSON.parse(savedAddress) as Partial<ShippingForm>;
          setAddress({
            name: String(parsed.name ?? ""),
            phone: String(parsed.phone ?? ""),
            email: String(parsed.email ?? ""),
            street: String(parsed.street ?? ""),
            city: String(parsed.city ?? ""),
            pincode: String(parsed.pincode ?? ""),
          });
        }
        if (savedTouched) {
          const parsedTouched = JSON.parse(savedTouched) as Partial<TouchedState>;
          setTouched({
            name: Boolean(parsedTouched.name),
            phone: Boolean(parsedTouched.phone),
            email: Boolean(parsedTouched.email),
            street: Boolean(parsedTouched.street),
            city: Boolean(parsedTouched.city),
            pincode: Boolean(parsedTouched.pincode),
          });
        }
        if (savedAttempted) {
          setAttemptedSubmit(savedAttempted === "true");
        }
      } catch {
        // Ignore malformed local state and keep empty form defaults.
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    localStorage.setItem(SHIPPING_FORM_STORAGE_KEY, JSON.stringify(address));
    localStorage.setItem(SHIPPING_TOUCHED_STORAGE_KEY, JSON.stringify(touched));
    localStorage.setItem(SHIPPING_ATTEMPTED_STORAGE_KEY, String(attemptedSubmit));
  }, [address, attemptedSubmit, touched]);

  function handleFieldChange(field: FieldKey, value: string) {
    const nextValue =
      field === "phone" || field === "pincode" ? value.replace(/\D/g, "") : value;

    setAddress((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  function handleContinueToPayment() {
    if (!isFormValid) {
      setAttemptedSubmit(true);
      setTouched({
        name: true,
        phone: true,
        email: true,
        street: true,
        city: true,
        pincode: true,
      });
      setShakeNonce((value) => value + 1);

      const orderedFields: FieldKey[] = [
        "name",
        "phone",
        "email",
        "street",
        "city",
        "pincode",
      ];
      const firstInvalidField = orderedFields.find((field) => Boolean(errors[field]));
      if (firstInvalidField) {
        fieldRefs.current[firstInvalidField]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    router.push("/checkout/payment");
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
          <StepBubble number={1} label="Shipping" active />
          <span className="h-px flex-1 bg-[rgb(220_210_193)]" />
          <StepBubble number={2} label="Payment" />
          <span className="h-px flex-1 bg-[rgb(220_210_193)]" />
          <StepBubble number={3} label="Review" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-7 rounded-[30px] border border-[rgb(223_213_196)] bg-[rgb(248_244_238)] p-6 shadow-[0_14px_34px_rgb(89_71_46_/_10%)] sm:p-8"
        >
          <h2 className="font-[var(--font-heading)] text-4xl leading-none sm:text-[2.15rem]">Shipping Address</h2>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field
              fieldKey="name"
              label="Full Name"
              placeholder="Enter your full name"
              value={address.name}
              onChange={(name) => handleFieldChange("name", name)}
              onBlur={() => setTouched((s) => ({ ...s, name: true }))}
              error={errors.name}
              showError={Boolean(touched.name || attemptedSubmit)}
              shakeNonce={shakeNonce}
              refCallback={(node) => {
                fieldRefs.current.name = node;
              }}
            />
            <Field
              fieldKey="phone"
              label="Phone"
              placeholder="Enter your phone number"
              value={address.phone}
              onChange={(phone) => handleFieldChange("phone", phone)}
              onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
              error={errors.phone}
              showError={Boolean(touched.phone || attemptedSubmit)}
              shakeNonce={shakeNonce}
              refCallback={(node) => {
                fieldRefs.current.phone = node;
              }}
            />
            <Field
              fieldKey="email"
              label="Email"
              placeholder="Enter your email address"
              value={address.email}
              onChange={(email) => handleFieldChange("email", email)}
              onBlur={() => setTouched((s) => ({ ...s, email: true }))}
              error={errors.email}
              showError={Boolean(touched.email || attemptedSubmit)}
              shakeNonce={shakeNonce}
              refCallback={(node) => {
                fieldRefs.current.email = node;
              }}
            />
            <Field
              fieldKey="street"
              label="Street Address"
              placeholder="Enter your street address"
              value={address.street}
              onChange={(street) => handleFieldChange("street", street)}
              onBlur={() => setTouched((s) => ({ ...s, street: true }))}
              error={errors.street}
              showError={Boolean(touched.street || attemptedSubmit)}
              shakeNonce={shakeNonce}
              refCallback={(node) => {
                fieldRefs.current.street = node;
              }}
            />
            <Field
              fieldKey="city"
              label="City"
              placeholder="Enter your city"
              value={address.city}
              onChange={(city) => handleFieldChange("city", city)}
              onBlur={() => setTouched((s) => ({ ...s, city: true }))}
              error={errors.city}
              showError={Boolean(touched.city || attemptedSubmit)}
              shakeNonce={shakeNonce}
              refCallback={(node) => {
                fieldRefs.current.city = node;
              }}
            />
            <Field
              fieldKey="pincode"
              label="Pincode"
              placeholder="Enter your pincode"
              value={address.pincode}
              onChange={(pincode) => handleFieldChange("pincode", pincode)}
              onBlur={() => setTouched((s) => ({ ...s, pincode: true }))}
              error={errors.pincode}
              showError={Boolean(touched.pincode || attemptedSubmit)}
              shakeNonce={shakeNonce}
              refCallback={(node) => {
                fieldRefs.current.pincode = node;
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
            className="mt-8 flex items-center justify-between gap-3"
          >
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="h-14 rounded-full border border-[rgb(218_205_186)] bg-[rgb(255_253_248)] px-8 text-lg text-[var(--text-muted)] transition hover:bg-[rgb(252_248_240)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={!isFormValid}
              className={`h-14 min-w-[230px] rounded-full px-8 text-lg font-medium text-white transition-all duration-300 ${
                isFormValid
                  ? "bg-[#6B7D5E] shadow-[0_12px_26px_rgb(107_125_94_/_30%)] hover:-translate-y-0.5 hover:bg-[#5f7053]"
                  : "cursor-not-allowed bg-[#91a084] opacity-55"
              }`}
            >
              Continue to Payment
            </button>
          </motion.div>
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

function Field({
  fieldKey,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  showError,
  shakeNonce,
  refCallback,
}: {
  fieldKey: FieldKey;
  label: string;
  placeholder: string;
  value: string;
  onChange: (nextValue: string) => void;
  onBlur: () => void;
  error?: string;
  showError: boolean;
  shakeNonce: number;
  refCallback: (node: HTMLDivElement | null) => void;
}) {
  const shouldShowError = showError && Boolean(error);

  return (
    <motion.div
      ref={refCallback}
      animate={shouldShowError ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: shouldShowError ? 0.28 : 0, ease: "easeOut" }}
      key={`${fieldKey}-${shakeNonce}`}
    >
      <label className="text-base text-[rgb(111_99_84)]">
        {label}
        <input
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`mt-2 h-14 w-full rounded-2xl px-5 text-lg text-[var(--text-primary)] outline-none transition placeholder:text-[rgb(168_155_138)] ${
            shouldShowError
              ? "border border-[rgb(213_149_149)] bg-[rgb(255_244_244)] focus:border-[rgb(198_118_118)] focus:shadow-[0_0_0_4px_rgb(198_118_118_/_15%)]"
              : "border border-[rgb(223_211_193)] bg-[rgb(255_254_250)] focus:border-[rgb(134_154_119)] focus:shadow-[0_0_0_4px_rgb(107_125_94_/_12%)]"
          }`}
        />
      </label>
      {shouldShowError ? <p className="mt-1 text-xs text-[rgb(180_87_87)]">{error}</p> : null}
    </motion.div>
  );
}
