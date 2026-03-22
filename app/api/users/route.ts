import { NextResponse } from "next/server";
import { triggerEvent } from "@/lib/events/trigger-event";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";

const ALLOWED_ART_STYLES = ["Abstract", "Modern", "Traditional", "Spiritual", "Custom Art"] as const;
const ALLOWED_USAGE = ["Living Room", "Office", "Bedroom"] as const;

type PreferencesPayload = {
  art_styles?: unknown;
  usage?: unknown;
};

type UsersPayload = {
  phone?: unknown;
  preferences?: PreferencesPayload;
};

function normalizePhone(phone: unknown) {
  if (typeof phone !== "string") return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  if (trimmed.length > 30) throw new Error("Phone number is too long.");

  const validFormat = /^[+\d()\-\s]{7,30}$/.test(trimmed);
  if (!validFormat) {
    throw new Error("Please provide a valid phone number.");
  }
  return trimmed;
}

function normalizeStringArray(input: unknown) {
  if (!Array.isArray(input)) return [] as string[];
  return [...new Set(input.map((item) => String(item).trim()).filter(Boolean))];
}

function normalizePreferences(preferences: PreferencesPayload | undefined) {
  if (!preferences) return null;

  const artStyles = normalizeStringArray(preferences.art_styles).filter((item) =>
    ALLOWED_ART_STYLES.includes(item as (typeof ALLOWED_ART_STYLES)[number]),
  );
  const usage = normalizeStringArray(preferences.usage).filter((item) =>
    ALLOWED_USAGE.includes(item as (typeof ALLOWED_USAGE)[number]),
  );

  return {
    art_styles: artStyles,
    usage,
  };
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    const userId = authUser?.id ?? "";
    const email = authUser?.email ?? "";

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Authenticated user context is required." },
        { status: 401 },
      );
    }

    let payload: UsersPayload = {};
    try {
      payload = (await request.json()) as UsersPayload;
    } catch {
      payload = {};
    }

    const hasPhone = Object.prototype.hasOwnProperty.call(payload, "phone");
    const hasPreferences = Object.prototype.hasOwnProperty.call(payload, "preferences");
    const phone = hasPhone ? normalizePhone(payload.phone) : undefined;
    const preferences = hasPreferences ? normalizePreferences(payload.preferences) : undefined;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new Error("Supabase admin client is not configured.");
    }

    const upsertPayload: Record<string, unknown> = {
      id: userId,
      email,
    };

    if (hasPhone) upsertPayload.phone = phone;
    if (hasPreferences) upsertPayload.preferences = preferences;

    const { error: upsertError } = await supabase.from("users").upsert(upsertPayload);
    if (upsertError) {
      throw new Error(upsertError.message || "Failed to upsert user record.");
    }

    await triggerEvent("user_registered", { user_id: userId, email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
