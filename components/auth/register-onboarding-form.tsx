"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncAuthenticatedUser } from "@/lib/supabase/sync-user";
import { validateRegistrationPassword } from "@/lib/security/password-policy";

const ART_STYLES = ["Abstract", "Modern", "Traditional", "Spiritual", "Custom Art"] as const;
const USAGE_OPTIONS = ["Living Room", "Office", "Bedroom"] as const;

type Step = 1 | 2 | 3;
type AlertType = "success" | "error";
type RegisterOnboardingFormProps = {
  initialStep?: number;
  oauthMode?: boolean;
};

function mapAuthErrorToUserMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  const originalMessage = error.message;
  const message = error.message.toLowerCase();
  if (message.startsWith("password must") || message.includes("password cannot contain spaces")) {
    return originalMessage;
  }
  if (message.includes("please enter a valid phone number")) {
    return "Please enter a valid phone number or leave it blank.";
  }
  if (message.includes("please choose at least one art style")) {
    return "Please choose at least one art style.";
  }
  if (message.includes("please sign in again to continue onboarding")) {
    return "Your session expired. Please sign in again to continue.";
  }
  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already registered")
  ) {
    return "An account with this email already exists. Please login instead.";
  }
  if (message.includes("mobile number is already linked")) {
    return "This mobile number is already linked to an account. Please login instead.";
  }
  if (message.includes("weak password") || (message.includes("password") && message.includes("weak"))) {
    return "Password is too weak. Use at least 6 characters with a mix of letters and numbers.";
  }
  if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
    return "Incorrect email or password";
  }
  return "We couldn't complete your request right now. Please try again.";
}

export function RegisterOnboardingForm({
  initialStep = 1,
  oauthMode = false,
}: RegisterOnboardingFormProps) {
  const router = useRouter();
  const defaultStep: Step = oauthMode ? (initialStep === 3 ? 3 : 2) : 1;
  const [step, setStep] = useState<Step>(defaultStep);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState<AlertType | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    phone?: string;
  }>({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedUsage, setSelectedUsage] = useState<string[]>([]);

  const progress = useMemo(() => `${step} / 3`, [step]);

  function toggleChoice(current: string[], value: string) {
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  }

  function validatePhone(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return true;
    const normalizedDigits = trimmed.replace(/\D/g, "");
    return /^\d{10}$/.test(normalizedDigits);
  }

  function stepInputClass(hasError: boolean) {
    return `mt-2 w-full rounded-lg border bg-white px-3 py-2 outline-none transition-all duration-200 ${
      hasError
        ? "border-[#c66156] focus:border-[#c66156]"
        : "border-[var(--border-soft)] focus:border-[var(--olive)]"
    }`;
  }

  async function handleStepOneNext(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setAlertType(null);
    setFieldErrors({});

    try {
      const nextErrors: { email?: string; password?: string; phone?: string } = {};

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        nextErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        nextErrors.email = "Enter a valid email address";
      }

      if (!validatePhone(phone)) {
        nextErrors.phone = "Please enter a valid phone number or leave it blank.";
      }

      if (!oauthMode) {
        const passwordError = validateRegistrationPassword(password);
        if (passwordError) nextErrors.password = passwordError;
      }

      if (nextErrors.email || nextErrors.password || nextErrors.phone) {
        setFieldErrors(nextErrors);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase keys are missing in environment variables.");
      }
      setStep(2);
    } catch (error) {
      console.error("Registration step failed", error);
      const text = mapAuthErrorToUserMessage(error);
      setMessage(text);
      setAlertType("error");
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding(skipUsage = false) {
    setLoading(true);
    setMessage("");
    setAlertType(null);

    try {
      if (!selectedStyles.length) {
        throw new Error("Please choose at least one art style.");
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase keys are missing in environment variables.");
      }

      const normalizedEmail = email.trim();
      const normalizedPhone = phone.trim() || null;
      const preferences = {
        art_styles: selectedStyles,
        usage: skipUsage ? [] : selectedUsage,
      };

      const {
        data: { session: existingSession },
        error: existingSessionError,
      } = await supabase.auth.getSession();

      if (existingSessionError) throw existingSessionError;

      if (!oauthMode && existingSession?.access_token) {
        await syncAuthenticatedUser(existingSession.access_token, {
          phone: normalizedPhone,
          preferences,
          password,
        });

        setMessage("Welcome to Geesun Crafts 🎨");
        setAlertType("success");
        router.replace("/");
        return;
      }

      if (oauthMode) {
        if (!existingSession?.access_token) {
          throw new Error("Please sign in again to continue onboarding.");
        }

        await syncAuthenticatedUser(existingSession.access_token, {
          preferences,
        });

        setMessage("Welcome to Geesun Crafts 🎨");
        setAlertType("success");
        router.replace("/");
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      const token = signUpData.session?.access_token ?? null;

      if (!token) {
        setMessage("Your account has been created successfully 🎉");
        setAlertType("success");
        return;
      }

      await syncAuthenticatedUser(token, {
        phone: normalizedPhone,
        preferences,
        password,
      });

      setMessage("Welcome to Geesun Crafts 🎨");
      setAlertType("success");
      router.replace("/");
    } catch (error) {
      console.error("Registration/onboarding failed", error);
      const text = mapAuthErrorToUserMessage(error);
      setMessage(text);
      setAlertType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container-shell section-space">
      <div className="card-surface mx-auto max-w-2xl p-7 md:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-heading)] text-4xl">
              {oauthMode ? "Complete Your Profile" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {oauthMode
                ? "Just a quick style setup to personalize your Geesun Crafts experience."
                : "Set up your Geesun Crafts profile in three quick steps."}
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
          <form noValidate onSubmit={handleStepOneNext} className="space-y-4">
            <label className="block text-sm text-[var(--text-muted)]">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                className={stepInputClass(Boolean(fieldErrors.email))}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <p className="mt-1 text-xs text-[#c66156]">{fieldErrors.email}</p> : null}
            </label>

            <label className="block text-sm text-[var(--text-muted)]">
              Password
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-white px-3 py-2 pr-12 outline-none transition-all duration-200 ${
                    fieldErrors.password
                      ? "border-[#c66156] focus:border-[#c66156]"
                      : "border-[var(--border-soft)] focus:border-[var(--olive)]"
                  }`}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M9.88 5.09A10.94 10.94 0 0112 5c6 0 10 7 10 7a17.31 17.31 0 01-4.31 5.07" />
                      <path d="M6.61 6.61A17.3 17.3 0 002 12s4 7 10 7a10.94 10.94 0 005.09-1.17" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Use at least 8 characters with uppercase, lowercase, number, and special character.
              </p>
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-[#c66156]">{fieldErrors.password}</p>
              ) : null}
            </label>

            <label className="block text-sm text-[var(--text-muted)]">
              Phone Number <span className="text-xs">(Optional, recommended)</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setFieldErrors((current) => ({ ...current, phone: undefined }));
                }}
                placeholder="9876543210"
                className={stepInputClass(Boolean(fieldErrors.phone))}
                aria-invalid={Boolean(fieldErrors.phone)}
              />
              {fieldErrors.phone ? <p className="mt-1 text-xs text-[#c66156]">{fieldErrors.phone}</p> : null}
            </label>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="olive-btn w-full rounded-full px-5 py-3 text-sm">
                {loading ? "Continuing..." : "Next: Art Interests"}
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
              {!oauthMode ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="outline-btn rounded-full px-5 py-3 text-sm"
                >
                  Back
                </button>
              ) : null}
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
                {loading ? (oauthMode ? "Saving..." : "Creating account...") : "Skip"}
              </button>
              <button
                type="button"
                onClick={() => completeOnboarding(false)}
                disabled={loading}
                className="olive-btn rounded-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (oauthMode ? "Saving..." : "Creating account...") : "Finish"}
              </button>
            </div>
          </div>
        ) : null}

        {message ? (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              alertType === "error"
                ? "border-[#d7b2aa] bg-[#fff5f3] text-[#8b4a3d]"
                : "border-[#bdcda4] bg-[#f3f8ea] text-[#506339]"
            }`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        ) : null}

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
