import { NextResponse } from "next/server";
import { normalizeCouponCode } from "@/lib/cart/pricing";

type RemoveCouponRequest = {
  couponCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RemoveCouponRequest;
    const couponCode = normalizeCouponCode(String(body.couponCode ?? ""));

    if (!couponCode) {
      return NextResponse.json({ success: false, error: "Coupon code is required." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Coupon removed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove coupon";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

