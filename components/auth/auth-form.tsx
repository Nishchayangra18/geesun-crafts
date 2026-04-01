"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncAuthenticatedUser } from "@/lib/supabase/sync-user";
import { PASSWORD_MIN_LENGTH, validateRegistrationPassword } from "@/lib/security/password-policy";
import { REDIRECT_AFTER_LOGIN_STORAGE_KEY } from "@/lib/checkout/state";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [errors, setErrors] = useState<{
    identifier?: string;
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function getInputClass(hasError: boolean, shape: "pill" | "rounded") {
    const radius = shape === "pill" ? "rounded-2xl" : "rounded-lg";
    return `mt-2 w-full ${radius} border bg-white px-3 py-3 outline-none transition-all duration-200 ${
      hasError
        ? "border-[#c66156] focus:border-[#c66156]"
        : "border-[var(--border-soft)] focus:border-[var(--olive)]"
    }`;
  }

  async function resolveEmailForLogin(rawIdentifier: string) {
    const trimmed = rawIdentifier.trim();
    if (!trimmed) {
      throw new Error("Email or mobile number is required.");
    }

    if (trimmed.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        throw new Error("Enter a valid email or mobile number");
      }
      return trimmed.toLowerCase();
    }

    const normalizedPhone = trimmed.replace(/\s+/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) {
      throw new Error("Enter a valid email or mobile number");
    }

    const response = await fetch("/api/auth/resolve-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: normalizedPhone }),
    });

    const result = (await response.json().catch(() => ({}))) as { email?: string; error?: string };
    if (!response.ok || !result.email) {
      throw new Error(result.error || "User not found with this mobile number");
    }

    return result.email;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIdentifierError("");
    setErrors({});

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Supabase keys are missing in environment variables.");
        return;
      }

      if (mode === "register") {
        const registerErrors: { email?: string; password?: string } = {};
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
          registerErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          registerErrors.email = "Enter a valid email address";
        }

        const passwordError = validateRegistrationPassword(password);
        if (passwordError) registerErrors.password = passwordError;
        if (registerErrors.email || registerErrors.password) {
          setErrors(registerErrors);
          return;
        }

        const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password });
        if (error) throw error;
        await syncAuthenticatedUser(data.session?.access_token);
        setMessage("Account created. Please check your email for verification.");
      } else {
        const loginErrors: { identifier?: string; password?: string } = {};
        const trimmedIdentifier = identifier.trim();
        if (!trimmedIdentifier) {
          loginErrors.identifier = "Email or mobile number is required";
        } else if (
          !trimmedIdentifier.includes("@") &&
          !/^\d{10}$/.test(trimmedIdentifier.replace(/\s+/g, ""))
        ) {
          loginErrors.identifier = "Enter a valid email or mobile number";
        }

        if (!password) {
          loginErrors.password = "Password is required";
        } else if (password.length < PASSWORD_MIN_LENGTH) {
          loginErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
        }

        if (loginErrors.identifier || loginErrors.password) {
          setErrors(loginErrors);
          return;
        }

        const resolvedEmail = await resolveEmailForLogin(identifier);
        const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
        if (error) throw error;
        await syncAuthenticatedUser(data.session.access_token);
        setMessage("Login successful.");
        const redirectAfterLogin = localStorage.getItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY);
        if (redirectAfterLogin) {
          localStorage.removeItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY);
          router.push(redirectAfterLogin);
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Authentication failed";
      if (
        text === "Email or mobile number is required." ||
        text === "Enter a valid email or mobile number" ||
        text === "User not found with this mobile number"
      ) {
        setIdentifierError(text);
      }
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Supabase keys are missing in environment variables.");
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
      setMessage("Redirecting to Google...");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Google authentication failed";
      setMessage(text);
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setMessage("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setMessage("Enter your email first, then click Forgot password.");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Supabase keys are missing in environment variables.");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;

      setMessage("Password reset link sent. Please check your inbox.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not send reset email";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "login") {
    return (
      <section className="container-shell section-space">
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--border-soft)] bg-[var(--panel)] shadow-[0_18px_45px_rgb(89_71_46_/_16%)] lg:grid lg:min-h-[78vh] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden overflow-hidden lg:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2f2a23cc] via-[#6b7d5e55] to-[#f5f1eba8]" />
            <div className="relative z-10 flex h-full items-end p-10">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#f3ead7]">Geesun Crafts</p>
                <h2 className="mt-3 max-w-md font-[var(--font-heading)] text-4xl leading-tight text-white">
                  Timeless Art for Your Home
                </h2>
                <p className="mt-3 max-w-sm text-sm text-[#f7f1e8]">
                  Discover handcrafted pieces that elevate living spaces with warmth and character.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-[#f8f3ea] p-6 sm:p-8 lg:p-10">
            <div className="w-full">
              <h1 className="font-[var(--font-heading)] text-4xl text-[var(--text-primary)]">Welcome Back</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Login to continue your premium art shopping journey.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-5 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--olive)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--olive)] border-r-transparent" />
                ) : null}
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                <span className="h-px flex-1 bg-[var(--border-soft)]" />
                OR
                <span className="h-px flex-1 bg-[var(--border-soft)]" />
              </div>

              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm text-[var(--text-muted)]">
                  Email or Mobile Number
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => {
                      setIdentifier(event.target.value);
                      setErrors((current) => ({ ...current, identifier: undefined }));
                      setIdentifierError("");
                    }}
                    placeholder="Enter your email (e.g. user@gmail.com) or mobile number (e.g. 9876543210)"
                    className={getInputClass(Boolean(errors.identifier || identifierError), "pill")}
                    aria-invalid={Boolean(errors.identifier || identifierError)}
                  />
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    You can login using your registered email or mobile number
                  </p>
                  {errors.identifier ? <p className="mt-1 text-xs text-[#c66156]">{errors.identifier}</p> : null}
                  {identifierError ? <p className="mt-1 text-xs text-[#8b4a3d]">{identifierError}</p> : null}
                </label>

                <label className="block text-sm text-[var(--text-muted)]">
                  Password
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((current) => ({ ...current, password: undefined }));
                      }}
                      className={`w-full rounded-2xl border bg-white px-3 py-3 pr-12 outline-none transition-all duration-200 ${
                        errors.password
                          ? "border-[#c66156] focus:border-[#c66156]"
                          : "border-[var(--border-soft)] focus:border-[var(--olive)]"
                      }`}
                      aria-invalid={Boolean(errors.password)}
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
                  {errors.password ? <p className="mt-1 text-xs text-[#c66156]">{errors.password}</p> : null}
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs text-[var(--olive)] underline underline-offset-2"
                >
                  Forgot password?
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="olive-btn flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  ) : null}
                  Continue to Your Gallery →
                </button>
              </form>

              {message ? <p className="mt-4 text-sm text-[var(--text-muted)]">{message}</p> : null}

              <p className="mt-6 text-sm text-[var(--text-muted)]">
                New to Geesun Crafts?{" "}
                <Link href="/register" className="text-[var(--olive)] underline underline-offset-2">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
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

          <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm text-[var(--text-muted)]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                className={getInputClass(Boolean(errors.email), "rounded")}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="mt-1 text-xs text-[#c66156]">{errors.email}</p> : null}
            </label>

            <label className="block text-sm text-[var(--text-muted)]">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                className={getInputClass(Boolean(errors.password), "rounded")}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="mt-1 text-xs text-[#c66156]">{errors.password}</p> : null}
            </label>

          <button type="submit" disabled={loading} className="olive-btn w-full rounded-full px-5 py-3 text-sm">
            {loading ? "Please wait..." : mode === "register" ? "Register" : "Login"}
          </button>

          {mode === "login" ? (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--olive)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Continue with Google
            </button>
          ) : null}
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
