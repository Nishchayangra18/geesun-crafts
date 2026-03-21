"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Supabase keys are missing in environment variables.");
        return;
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await syncUserRecord(data.session?.access_token);
        setMessage("Account created. Please check your email for verification.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await syncUserRecord(data.session.access_token);
        setMessage("Login successful.");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Authentication failed";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container-shell section-space">
      <div className="card-surface mx-auto max-w-md p-7">
        <h1 className="font-[var(--font-heading)] text-4xl">
          {mode === "register" ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {mode === "register"
            ? "Create your Geesun Crafts account to save favorites and track orders."
            : "Login to continue your premium art shopping journey."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-[var(--text-muted)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 outline-none"
            />
          </label>

          <label className="block text-sm text-[var(--text-muted)]">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 outline-none"
            />
          </label>

          <button type="submit" disabled={loading} className="olive-btn w-full rounded-full px-5 py-3 text-sm">
            {loading ? "Please wait..." : mode === "register" ? "Register" : "Login"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-[var(--text-muted)]">{message}</p> : null}

        <p className="mt-5 text-sm text-[var(--text-muted)]">
          {mode === "register" ? "Already have an account?" : "New to Geesun Crafts?"}{" "}
          <Link
            href={mode === "register" ? "/login" : "/register"}
            className="text-[var(--olive)] underline underline-offset-2"
          >
            {mode === "register" ? "Login" : "Register"}
          </Link>
        </p>
      </div>
    </section>
  );
}

async function syncUserRecord(accessToken?: string) {
  if (!accessToken) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  await fetch("/api/users", {
    method: "POST",
    headers,
  });
}
