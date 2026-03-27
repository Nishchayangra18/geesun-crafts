"use client";

import { useEffect, useId } from "react";

type RestockEmailModalProps = {
  isOpen: boolean;
  email: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onEmailChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function RestockEmailModal({
  isOpen,
  email,
  isSubmitting,
  errorMessage,
  onEmailChange,
  onClose,
  onSubmit,
}: RestockEmailModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(36,31,24,0.45)] p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-[var(--border-soft)] bg-[#f8f2e9] p-5 shadow-[0_20px_40px_rgb(35_30_24_/_22%)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p
          id={titleId}
          className="font-[var(--font-heading)] text-2xl text-[var(--text-primary)]"
        >
          Notify Me
        </p>
        <p id={descriptionId} className="mt-1 text-sm text-[var(--text-muted)]">
          Enter your email and we&apos;ll let you know once this painting is available.
        </p>
        <div className="mt-4">
          <label htmlFor="restock-email" className="sr-only">
            Email
          </label>
          <input
            id="restock-email"
            type="email"
            value={email}
            autoFocus
            placeholder="you@example.com"
            onChange={(event) => onEmailChange(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[#fffaf2] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--olive)]"
          />
        </div>
        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-[rgb(194_168_117_/_0.45)] bg-[rgb(194_168_117_/_0.12)] px-3 py-2 text-xs text-[var(--text-primary)]">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="outline-btn rounded-2xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-2xl bg-[#6B7D5E] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_20px_rgb(107_125_94_/_32%)] transition hover:bg-[#617254] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Notify Me"}
          </button>
        </div>
      </div>
    </div>
  );
}
