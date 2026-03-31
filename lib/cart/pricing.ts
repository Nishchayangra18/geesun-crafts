import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 2000;
export const DEFAULT_SHIPPING_FEE = 250;

export type CouponRow = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number | string | null;
  minimum_order_amount: number | string | null;
  maximum_discount: number | string | null;
  free_shipping: boolean | null;
  is_active: boolean | null;
  usage_limit: number | null;
  used_count: number | null;
  start_date: string | null;
  end_date: string | null;
  applicable_categories: string[] | null;
  applicable_product_ids: string[] | null;
};

export type CartLineInput = {
  productId: string;
  quantity: number;
  price?: number;
};

export type CouponCartProduct = {
  id: string;
  category?: string | null;
  style?: string | null;
  medium?: string | null;
  price: number;
  isActive?: boolean;
};

export type CouponEvaluation = {
  eligible: boolean;
  remainingAmount: number;
  reason?: string;
};

export function toMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function hasStarted(startDate: string | null, nowIso: string) {
  if (!startDate) return true;
  return new Date(startDate).getTime() <= new Date(nowIso).getTime();
}

function notExpired(endDate: string | null, nowIso: string) {
  if (!endDate) return true;
  return new Date(endDate).getTime() >= new Date(nowIso).getTime();
}

function hasUsageLeft(usageLimit: number | null, usedCount: number | null) {
  if (!Number.isFinite(Number(usageLimit)) || usageLimit === null) return true;
  return Number(usedCount ?? 0) < Number(usageLimit);
}

function matchesApplicableProducts(coupon: CouponRow, cartProducts: CouponCartProduct[]) {
  const restrictedProductIds = (coupon.applicable_product_ids ?? []).filter(Boolean);
  if (!restrictedProductIds.length) return true;

  const set = new Set(restrictedProductIds.map((id) => String(id)));
  return cartProducts.some((product) => set.has(String(product.id)));
}

function matchesApplicableCategories(coupon: CouponRow, cartProducts: CouponCartProduct[]) {
  const restrictedCategories = (coupon.applicable_categories ?? []).filter(Boolean);
  if (!restrictedCategories.length) return true;

  const set = new Set(restrictedCategories.map((category) => category.toLowerCase()));
  return cartProducts.some((product) => set.has(String(product.category ?? "").toLowerCase()));
}

export function evaluateCoupon(
  coupon: CouponRow,
  input: {
    subtotal: number;
    cartProducts: CouponCartProduct[];
    nowIso?: string;
  },
): CouponEvaluation {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const subtotal = toMoney(input.subtotal);
  const minAmount = toMoney(toNumber(coupon.minimum_order_amount));
  const remainingAmount = Math.max(0, toMoney(minAmount - subtotal));

  if (!Boolean(coupon.is_active)) {
    return { eligible: false, remainingAmount, reason: "Coupon is inactive." };
  }
  if (!hasStarted(coupon.start_date, nowIso)) {
    return { eligible: false, remainingAmount, reason: "Coupon is not active yet." };
  }
  if (!notExpired(coupon.end_date, nowIso)) {
    return { eligible: false, remainingAmount, reason: "Coupon has expired." };
  }
  if (!hasUsageLeft(coupon.usage_limit, coupon.used_count)) {
    return { eligible: false, remainingAmount, reason: "Coupon usage limit exceeded." };
  }
  if (remainingAmount > 0) {
    return { eligible: false, remainingAmount, reason: "Minimum order amount not reached." };
  }
  if (!matchesApplicableProducts(coupon, input.cartProducts)) {
    return { eligible: false, remainingAmount, reason: "Coupon is not applicable to selected products." };
  }
  if (!matchesApplicableCategories(coupon, input.cartProducts)) {
    return { eligible: false, remainingAmount, reason: "Coupon is not applicable to selected categories." };
  }

  return { eligible: true, remainingAmount: 0 };
}

export function calculateDiscountAmount(coupon: CouponRow, subtotal: number) {
  const safeSubtotal = toMoney(subtotal);
  const discountValue = toNumber(coupon.discount_value);
  let discount = 0;

  if (coupon.discount_type === "percentage") {
    discount = safeSubtotal * (discountValue / 100);
  } else {
    discount = discountValue;
  }

  const maxDiscount = toNumber(coupon.maximum_discount);
  if (maxDiscount > 0) {
    discount = Math.min(discount, maxDiscount);
  }

  return Math.min(toMoney(discount), safeSubtotal);
}

export function calculateSummaryTotals(input: {
  subtotal: number;
  discountAmount: number;
  freeShippingThreshold: number;
  freeShippingCoupon?: boolean;
  baseShippingFee?: number;
}) {
  const subtotal = toMoney(input.subtotal);
  const discountAmount = toMoney(input.discountAmount);
  const threshold = Math.max(0, toMoney(input.freeShippingThreshold));
  const baseShippingFee = Math.max(0, toMoney(input.baseShippingFee ?? DEFAULT_SHIPPING_FEE));

  const shippingUnlockedByThreshold = subtotal >= threshold && threshold > 0;
  const shipping = subtotal <= 0
    ? 0
    : input.freeShippingCoupon || shippingUnlockedByThreshold
      ? 0
      : baseShippingFee;

  const total = Math.max(0, toMoney(subtotal - discountAmount + shipping));
  return {
    subtotal,
    discountAmount,
    shipping: toMoney(shipping),
    total,
  };
}

export async function getFreeShippingThreshold(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("store_settings")
    .select("key, value")
    .eq("key", "free_shipping_threshold")
    .maybeSingle();

  if (error || !data?.value) return DEFAULT_FREE_SHIPPING_THRESHOLD;
  const threshold = Number(data.value);
  if (!Number.isFinite(threshold) || threshold <= 0) return DEFAULT_FREE_SHIPPING_THRESHOLD;
  return threshold;
}

