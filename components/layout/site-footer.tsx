import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border-soft)] bg-[#f7f0e5]">
      <div className="container-shell grid gap-8 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-[var(--font-heading)] text-3xl text-[#2f2822]">Geesun Crafts</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            Timeless and meaningful art pieces designed to elevate your home with warmth and character.
          </p>
          <div className="mt-4 flex gap-2 text-xs text-[#7f7568]">
            <span className="rounded-full border border-[var(--border-soft)] px-2 py-1">IG</span>
            <span className="rounded-full border border-[var(--border-soft)] px-2 py-1">FB</span>
            <span className="rounded-full border border-[var(--border-soft)] px-2 py-1">PIN</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-[#2f2822]">Quick Links</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <Link href="/" className="block hover:text-[var(--text-primary)]">Home</Link>
            <Link href="/shop" className="block hover:text-[var(--text-primary)]">Shop</Link>
            <Link href="/about" className="block hover:text-[var(--text-primary)]">About Us</Link>
            <Link href="/contact" className="block hover:text-[var(--text-primary)]">Contact</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-[#2f2822]">Customer Care</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <p>Shipping & Delivery</p>
            <p>Returns & Refunds</p>
            <p>Track Order</p>
            <p>Privacy Policy</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-[#2f2822]">Contact Us</p>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <p>help@geesuncrafts.com</p>
            <p>+91 90000 90000</p>
            <p>Mon - Sat, 10 AM to 7 PM</p>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border-soft)] py-4">
        <p className="container-shell text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Geesun Crafts. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
