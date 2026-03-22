"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncAuthenticatedUser } from "@/lib/supabase/sync-user";

const ART_STYLES = ["Abstract", "Modern", "Traditional", "Spiritual", "Custom Art"] as const;
const USAGE_OPTIONS = ["Living Room", "Office", "Bedroom"] as const;

type Step = 1 | 2 | 3;

export function RegisterOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedUsage, setSelectedUsage] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const progress = useMemo(() => `${step} / 3`, [step]);

  function toggleChoice(current: string[], value: string) {
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  }

  function validatePhone(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return true;
    return /^[+\d()\-\s]{7,30}$/.test(trimmed);
  }

  async function handleStepOneNext(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!validatePhone(phone)) {
        throw new Error("Please enter a valid phone number or leave it blank.");
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase keys are missing in environment variables.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const token = data.session?.access_token ?? null;
      setAccessToken(token);

      if (token) {
        await syncAuthenticatedUser(token, {
          phone: phone.trim() || null,
        });
      }

      setStep(2);
      if (!token) {
        setMessage("Account created. Complete your preferences and verify your email before first login.");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Registration failed";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding(skipUsage = false) {
    setLoading(true);
    setMessage("");

    try {
      if (!selectedStyles.length) {
        throw new Error("Please choose at least one art style.");
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase keys are missing in environment variables.");
      }

      let token = accessToken;
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token ?? null;
      }

      if (!token) {
        throw new Error("Please verify your email and login again to complete onboarding.");
      }

      await syncAuthenticatedUser(token, {
        phone: phone.trim() || null,
        preferences: {
          art_styles: selectedStyles,
          usage: skipUsage ? [] : selectedUsage,
        },
      });

      setMessage("Welcome to Geesun Crafts. Your profile is ready.");
      router.replace("/");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to complete onboarding";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container-shell section-space">
      <div className="card-surface mx-auto max-w-2xl p-7 md:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-heading)] text-4xl">Create Account</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Set up your Geesun Crafts profile in three quick steps.
            </p>
          </div>
          <p className="rounded-full border border-[var(--border-soft)] bg-white/70 px-3 py-1 text-xs text-[var(--text-muted)]">
            Step {progress}
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-2 flex-1 rounded-full ${step >= item ? "bg-[var(--olive)]" : "bg-[var(--secondary)]"}`}
            />
          ))}
        </div>

        {step === 1 ? (
          <form onSubmit={handleStepOneNext} className="space-y-4">
            <label className="block text-sm text-[var(--text-muted)]">
              Email
              <input
                type="email"
                required
                autoComplete="email"
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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 outline-none"
              />
            </label>

            <label className="block text-sm text-[var(--text-muted)]">
              Phone Number <span className="text-xs">(Optional, recommended)</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 90000 90000"
                className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 outline-none"
              />
            </label>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="olive-btn w-full rounded-full px-5 py-3 text-sm">
                {loading ? "Creating account..." : "Next: Art Interests"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className="font-[var(--font-heading)] text-3xl">What kind of art do you love?</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Choose one or more styles to personalize your feed.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ART_STYLES.map((style) => {
                const selected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyles((current) => toggleChoice(current, style))}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-[var(--olive)] bg-[#eef2eb] text-[var(--text-primary)]"
                        : "border-[var(--border-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--olive)]"
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="outline-btn rounded-full px-5 py-3 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={loading || !selectedStyles.length}
                className="olive-btn rounded-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                Next: Personalization
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h2 className="font-[var(--font-heading)] text-3xl">Where will you use art?</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              This step is optional. Select one or more spaces if you want tailored picks.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {USAGE_OPTIONS.map((usage) => {
                const selected = selectedUsage.includes(usage);
                return (
                  <button
                    key={usage}
                    type="button"
                    onClick={() => setSelectedUsage((current) => toggleChoice(current, usage))}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-[var(--olive)] bg-[#eef2eb] text-[var(--text-primary)]"
                        : "border-[var(--border-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--olive)]"
                    }`}
                  >
                    {usage}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="outline-btn rounded-full px-5 py-3 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => completeOnboarding(true)}
                disabled={loading}
                className="outline-btn rounded-full px-5 py-3 text-sm"
              >
                {loading ? "Saving..." : "Skip"}
              </button>
              <button
                type="button"
                onClick={() => completeOnboarding(false)}
                disabled={loading}
                className="olive-btn rounded-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Saving..." : "Finish"}
              </button>
            </div>
          </div>
        ) : null}

        {message ? <p className="mt-5 text-sm text-[var(--text-muted)]">{message}</p> : null}

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--olive)] underline underline-offset-2">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
