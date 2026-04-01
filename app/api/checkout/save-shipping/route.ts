import { NextResponse } from "next/server";
import { normalizeShippingAddress } from "@/lib/checkout/state";

function validateShippingAddress(input: ReturnType<typeof normalizeShippingAddress>) {
  if (!input.fullName.trim() || input.fullName.trim().length < 2) return "Please enter a valid full name.";
  if (!/^\d{10}$/.test(input.phone.trim())) return "Phone must be exactly 10 digits.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Please enter a valid email address.";
  if (!input.streetAddress.trim() || input.streetAddress.trim().length < 8) return "Please enter a valid street address.";
  if (!input.city.trim() || input.city.trim().length < 2) return "Please enter a valid city.";
  if (!/^\d{6}$/.test(input.pincode.trim())) return "Pincode must be exactly 6 digits.";
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shippingAddress = normalizeShippingAddress(body?.shippingAddress ?? body ?? {});
    const error = validateShippingAddress(shippingAddress);
    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, shippingAddress });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save shipping details";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

