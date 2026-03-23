import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { triggerEvent } from "@/lib/events/trigger-event";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { validateRegistrationPassword } from "@/lib/security/password-policy";

const ALLOWED_ART_STYLES = ["Abstract", "Modern", "Traditional", "Spiritual", "Custom Art"] as const;
const ALLOWED_USAGE = ["Living Room", "Office", "Bedroom"] as const;

type PreferencesPayload = {
  art_styles?: unknown;
  usage?: unknown;
};

type UsersPayload = {
  phone?: unknown;
  preferences?: PreferencesPayload;
  password?: unknown;
};

function normalizePhone(phone: unknown) {
  if (typeof phone !== "string") return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const normalizedDigits = trimmed.replace(/\D/g, "");
  const validFormat = /^\d{10}$/.test(normalizedDigits);
  if (!validFormat) {
    throw new Error("Please provide a valid phone number.");
  }
  return normalizedDigits;
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

function normalizePassword(password: unknown) {
  if (typeof password !== "string") return null;
  if (!password) return null;

  const passwordError = validateRegistrationPassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  return password;
}

function isEmailPasswordUser(authUser: User) {
  const provider = authUser.app_metadata?.provider;
  return provider === "email";
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    const userId = authUser?.id ?? "";

    if (!userId) {
      return NextResponse.json(
        { error: "Authenticated user context is required." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new Error("Supabase admin client is not configured.");
    }

    const { data, error } = await supabase
      .from("users")
      .select("id,email,phone,preferences,created_at,last_login")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to fetch user record.");
    }

    return NextResponse.json({ user: data ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
    const hasPassword = Object.prototype.hasOwnProperty.call(payload, "password");
    const phone = hasPhone ? normalizePhone(payload.phone) : undefined;
    const preferences = hasPreferences ? normalizePreferences(payload.preferences) : undefined;
    const password = hasPassword ? normalizePassword(payload.password) : undefined;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new Error("Supabase admin client is not configured.");
    }

    const upsertPayload: Record<string, unknown> = {
      id: userId,
      email,
      last_login: new Date().toISOString(),
    };

    if (hasPhone && phone) {
      const { data: existingPhoneOwner, error: phoneOwnerError } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .neq("id", userId)
        .maybeSingle();

      if (phoneOwnerError) {
        throw new Error(phoneOwnerError.message || "Failed to validate phone ownership.");
      }

      if (existingPhoneOwner) {
        return NextResponse.json(
          {
            error:
              "This mobile number is already linked to an account. Please login instead.",
          },
          { status: 409 },
        );
      }
    }

    if (hasPhone) upsertPayload.phone = phone;
    if (hasPreferences) upsertPayload.preferences = preferences;
    if (authUser && hasPassword && password && isEmailPasswordUser(authUser)) {
      upsertPayload.password_hash = await bcrypt.hash(password, 10);
    }

    const { error: upsertError } = await supabase.from("users").upsert(upsertPayload, {
      onConflict: "id",
    });
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
