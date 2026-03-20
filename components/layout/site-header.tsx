"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { cartCount, wishlistCount, userEmail } = useStore();

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
          <Link href="/cart" className="hover:text-[var(--text-primary)]">
            Cart ({cartCount})
          </Link>
          <Link href={userEmail ? "/account" : "/login"} className="hover:text-[var(--text-primary)]">
            {userEmail ? "Account" : "Login"}
          </Link>
        </div>
      </div>
    </header>
  );
}
