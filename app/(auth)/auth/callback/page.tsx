"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchAuthenticatedUserProfile, syncAuthenticatedUser } from "@/lib/supabase/sync-user";
import { REDIRECT_AFTER_LOGIN_STORAGE_KEY } from "@/lib/checkout/state";

function hasCompletedPreferences(preferences: unknown) {
  if (!preferences || typeof preferences !== "object") return false;
  const value = preferences as { art_styles?: unknown };
  return Array.isArray(value.art_styles) && value.art_styles.length > 0;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finalizing login...");

  useEffect(() => {
    let active = true;

    const completeOAuthLogin = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          throw new Error("Supabase keys are missing in environment variables.");
        }

        const url = new URL(window.location.href);
        const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
        if (authError) {
          throw new Error(decodeURIComponent(authError));
        }

        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          throw new Error("Could not complete sign in. Please try again.");
        }

        await syncAuthenticatedUser(session.access_token);
        const profile = await fetchAuthenticatedUserProfile(session.access_token);
        const needsOnboarding = !profile || !hasCompletedPreferences(profile.preferences);

        if (active) {
          if (needsOnboarding) {
            setMessage("Complete your style preferences to personalize your experience.");
            router.replace("/register?step=2&oauth=true");
            return;
          }

          setMessage("Login successful. Redirecting...");
          const redirectAfterLogin = localStorage.getItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY);
          if (redirectAfterLogin) {
            localStorage.removeItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY);
            router.replace(redirectAfterLogin);
          } else {
            router.replace("/");
          }
        }
      } catch (error) {
        if (!active) return;

        const text = error instanceof Error ? error.message : "Authentication failed";
        setMessage(text);
        window.setTimeout(() => {
          router.replace("/login");
        }, 1800);
      }
    };

    void completeOAuthLogin();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <section className="container-shell section-space">
      <div className="card-surface mx-auto max-w-md p-7">
        <h1 className="font-[var(--font-heading)] text-3xl">Google Sign In</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{message}</p>
      </div>
    </section>
  );
}
