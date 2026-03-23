import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type ResolveUserPayload = {
  phone?: unknown;
};

function normalizePhone(phone: unknown) {
  if (typeof phone !== "string") return null;
  const trimmed = phone.trim().replace(/\s+/g, "");
  if (!/^\d{10}$/.test(trimmed)) return null;
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as ResolveUserPayload;
    const normalizedPhone = normalizePhone(payload.phone);

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Enter a valid email or mobile number" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new Error("Supabase admin client is not configured.");
    }

    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("phone", normalizedPhone)
      .limit(2);

    if (error) {
      throw new Error(error.message || "Unable to resolve user.");
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "User not found with this mobile number" },
        { status: 404 },
      );
    }

    if (data.length > 1) {
      return NextResponse.json(
        { error: "Multiple users found with this mobile number. Contact support." },
        { status: 409 },
      );
    }

    const email = data[0]?.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "User not found with this mobile number" },
        { status: 404 },
      );
    }

    return NextResponse.json({ email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
