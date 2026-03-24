"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount, wishlistCount, userEmail } = useStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setAccountMessage("");
  }, [pathname]);

  async function handleLogout() {
    setLogoutLoading(true);
    setAccountMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setAccountMessage("Supabase auth is not configured.");
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAccountOpen(false);
      router.replace("/");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not logout.";
      setAccountMessage(text);
    } finally {
      setLogoutLoading(false);
    }
  }

  const initials = (userEmail ?? "A").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-soft)]/80 bg-[color:rgba(245,241,235,0.93)] backdrop-blur">
      <div className="container-shell flex h-20 items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <p className="font-[var(--font-heading)] text-3xl leading-none">Geesun Crafts</p>
          <p className="text-xs text-[var(--text-muted)]">Timeless Art for Your Home</p>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm tracking-wide transition-colors",
                pathname === item.href ? "text-[var(--olive)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] md:gap-5 md:text-sm">
          <Link href="/wishlist" className="hover:text-[var(--text-primary)]">
            Wishlist ({wishlistCount})
          </Link>
          <Link href="/cart" data-cart-icon className="hover:text-[var(--text-primary)]">
            Cart ({cartCount})
          </Link>

          {userEmail ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[#fffaf2] px-3 py-1.5 text-[var(--text-primary)] transition hover:border-[var(--olive)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--olive)] text-[11px] font-medium text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[120px] truncate text-xs md:inline">{userEmail}</span>
                <span className="text-[10px] text-[var(--text-muted)]">▼</span>
              </button>

              <div
                className={cn(
                  "absolute right-0 top-[calc(100%+0.5rem)] w-52 rounded-2xl border border-[var(--border-soft)] bg-[#fffaf2] p-2 shadow-[0_16px_30px_rgb(89_71_46_/_15%)] transition-all duration-200",
                  accountOpen
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0",
                )}
              >
                <Link
                  href="/account"
                  className="block rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[#f3ecdf]"
                >
                  Profile
                </Link>
                <Link
                  href="/wishlist"
                  className="block rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[#f3ecdf]"
                >
                  Wishlist
                </Link>
                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-xl px-3 py-2 text-left text-sm text-[var(--text-muted)] opacity-70"
                >
                  Orders (Soon)
                </button>
                <hr className="my-2 border-0 border-t border-[var(--border-soft)]" />
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-[#8a4b4b] transition hover:bg-[#f7eaea] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {logoutLoading ? "Logging out..." : "Logout"}
                </button>
                {accountMessage ? (
                  <p className="px-3 pt-2 text-xs text-[#8a4b4b]">{accountMessage}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <Link href="/login" className="hover:text-[var(--text-primary)]">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
