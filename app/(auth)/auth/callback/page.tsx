"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncAuthenticatedUser } from "@/lib/supabase/sync-user";

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

        if (active) {
          setMessage("Login successful. Redirecting...");
          router.replace("/account");
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
