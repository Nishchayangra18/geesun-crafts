"use client";

type StockIndicatorProps = {
  stock: number;
  maxQuantity?: number | null;
};

const GREEN = "#6B7D5E";
const MUSTARD = "#D4A017";
const RED = "#C65D5D";
const GREY = "#D9D9D9";

function getSafeStock(stock: number) {
  if (!Number.isFinite(stock)) return 0;
  return Math.max(0, Math.trunc(stock));
}

function getSafeMaxQuantity(stock: number, maxQuantity?: number | null) {
  const normalizedMax = Number(maxQuantity);
  if (Number.isFinite(normalizedMax) && normalizedMax > 0) return Math.trunc(normalizedMax);
  return Math.max(getSafeStock(stock), 10);
}

function getIndicatorPalette(stock: number, maxQuantity?: number | null) {
  const safeStock = getSafeStock(stock);
  const safeMaxQuantity = getSafeMaxQuantity(safeStock, maxQuantity);
  if (safeStock <= 0) return [GREY, GREY, GREY];

  const cappedStock = Math.min(safeStock, safeMaxQuantity);
  const stockPercentage = cappedStock / safeMaxQuantity;

  if (stockPercentage >= 0.7) return [GREEN, GREEN, GREEN];
  if (stockPercentage >= 0.3) return [MUSTARD, MUSTARD, GREY];
  if (stockPercentage > 0) return [RED, GREY, GREY];
  return [GREY, GREY, GREY];
}

function getStockLabel(stock: number) {
  const safeStock = getSafeStock(stock);
  if (safeStock <= 0) return "Out of Stock";
  if (safeStock < 3) return `Low Stock (${safeStock})`;
  return `In Stock (${safeStock})`;
}

export function StockIndicator({ stock, maxQuantity }: StockIndicatorProps) {
  const safeStock = getSafeStock(stock);
  const barColors = getIndicatorPalette(safeStock, maxQuantity);
  const dotColors = [...barColors];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-1.5">
          {barColors.map((color, index) => (
            <span
              key={`stock-bar-${index}`}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">{getStockLabel(safeStock)}</p>
      </div>
      <div className="flex items-center gap-3">
        {dotColors.map((color, index) => (
          <span
            key={`stock-dot-${index}`}
            className="h-2 w-2 rounded-full transition-colors duration-300"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
