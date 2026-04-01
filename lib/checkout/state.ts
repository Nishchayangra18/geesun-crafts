export type ShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  pincode: string;
};

export type PaymentMethod = "card" | "upi" | "cod";
export type CardDraft = {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
};

export type PaymentDraft = {
  card: CardDraft;
  upiId: string;
};

export type LastOrderItemSnapshot = {
  product: {
    id: string;
    slug: string;
    title: string;
    image: string;
    price: number;
    style?: string;
  };
  quantity: number;
};

export type LastOrderSnapshot = {
  orderId: string;
  items: LastOrderItemSnapshot[];
  couponCode: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  placedAt: string;
};

export const CHECKOUT_SHIPPING_STORAGE_KEY = "checkout_shipping";
export const LEGACY_CHECKOUT_SHIPPING_STORAGE_KEY = "checkout_shipping_address";
export const CHECKOUT_SHIPPING_TOUCHED_STORAGE_KEY = "geesun_checkout_shipping_touched_v1";
export const CHECKOUT_SHIPPING_ATTEMPTED_STORAGE_KEY = "geesun_checkout_shipping_attempted_v1";
export const CHECKOUT_PAYMENT_METHOD_STORAGE_KEY = "checkout_payment_method";
export const CHECKOUT_PAYMENT_DRAFT_STORAGE_KEY = "checkout_payment_draft";
export const CHECKOUT_CURRENT_STEP_STORAGE_KEY = "checkout_current_step";
export const CHECKOUT_RESUME_DATA_STORAGE_KEY = "checkout_resume_data";
export const REDIRECT_AFTER_LOGIN_STORAGE_KEY = "redirectAfterLogin";
export const CHECKOUT_LAST_ORDER_STORAGE_KEY = "checkout_last_order";

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  fullName: "",
  phone: "",
  email: "",
  streetAddress: "",
  city: "",
  pincode: "",
};

export function normalizeShippingAddress(input: unknown): ShippingAddress {
  const parsed = (input ?? {}) as Partial<ShippingAddress> & {
    name?: string;
    street?: string;
  };

  return {
    fullName: String(parsed.fullName ?? parsed.name ?? ""),
    phone: String(parsed.phone ?? ""),
    email: String(parsed.email ?? ""),
    streetAddress: String(parsed.streetAddress ?? parsed.street ?? ""),
    city: String(parsed.city ?? ""),
    pincode: String(parsed.pincode ?? ""),
  };
}

export function paymentMethodLabel(method: PaymentMethod): string {
  if (method === "card") return "Credit / Debit Card";
  if (method === "upi") return "UPI";
  return "Cash on Delivery";
}

export const EMPTY_CARD_DRAFT: CardDraft = {
  cardNumber: "",
  cardName: "",
  expiry: "",
  cvv: "",
};

export const EMPTY_PAYMENT_DRAFT: PaymentDraft = {
  card: EMPTY_CARD_DRAFT,
  upiId: "",
};

export function normalizePaymentDraft(input: unknown): PaymentDraft {
  const parsed = (input ?? {}) as Partial<PaymentDraft> & {
    card?: Partial<CardDraft>;
  };

  return {
    card: {
      cardNumber: String(parsed.card?.cardNumber ?? ""),
      cardName: String(parsed.card?.cardName ?? ""),
      expiry: String(parsed.card?.expiry ?? ""),
      cvv: String(parsed.card?.cvv ?? ""),
    },
    upiId: String(parsed.upiId ?? ""),
  };
}
