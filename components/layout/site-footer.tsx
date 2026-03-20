import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--border-soft)] bg-[var(--secondary)]/45">
      <div className="container-shell grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-[var(--font-heading)] text-3xl">Geesun Crafts</p>
          <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Curated handcrafted paintings that bring warmth, heritage, and premium calm to your home.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">Quick Links</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <Link href="/shop" className="block hover:text-[var(--text-primary)]">
              Shop Paintings
            </Link>
            <Link href="/about" className="block hover:text-[var(--text-primary)]">
              Our Story
            </Link>
            <Link href="/contact" className="block hover:text-[var(--text-primary)]">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Support</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <p>help@geesuncrafts.com</p>
            <p>+91 90000 90000</p>
            <p>Mon - Sat, 10 AM to 7 PM</p>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border-soft)] py-4 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} Geesun Crafts. Designed for a premium art buying experience.
      </div>
    </footer>
  );
}
