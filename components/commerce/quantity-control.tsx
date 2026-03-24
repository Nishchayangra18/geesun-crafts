"use client";

type QuantityControlProps = {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disableIncrement?: boolean;
  disableDecrement?: boolean;
};

export function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
  disableIncrement = false,
  disableDecrement = false,
}: QuantityControlProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white p-1 shadow-[0_4px_10px_rgb(89_71_46_/_8%)]">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disableDecrement}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-[var(--text-primary)] transition hover:bg-[var(--secondary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="min-w-7 text-center text-sm font-medium tabular-nums text-[var(--text-primary)]">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disableIncrement}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-[var(--text-primary)] transition hover:bg-[var(--secondary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
