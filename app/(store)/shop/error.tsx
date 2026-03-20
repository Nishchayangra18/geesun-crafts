"use client";

export default function ShopError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="container-shell section-space">
      <div className="card-surface mx-auto max-w-2xl p-8 text-center">
        <h1 className="font-[var(--font-heading)] text-4xl">Unable to load shop</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{error.message}</p>
        <button type="button" onClick={reset} className="olive-btn mt-6 rounded-full px-6 py-3 text-sm">
          Try Again
        </button>
      </div>
    </section>
  );
}
