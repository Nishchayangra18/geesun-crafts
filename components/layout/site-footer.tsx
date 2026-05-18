import Link from "next/link";
import Image from "next/image";

type IconProps = {
  className?: string;
};

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const customerCareLinks = [
  { href: "/shipping-delivery", label: "Shipping & Delivery" },
  { href: "/returns-refunds", label: "Returns & Refunds" },
  { href: "/account/orders", label: "Track Order" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
];

const socialLinks = [
  { href: "#", label: "Facebook", Icon: FacebookIcon },
  { href: "#", label: "Instagram", Icon: InstagramIcon },
  { href: "#", label: "YouTube", Icon: YoutubeIcon },
  { href: "#", label: "Pinterest", Icon: PinterestIcon },
];

const contactItems = [
  { label: "hello@geesuncrafts.com", Icon: MailIcon },
  { label: "+91 90000 90000", Icon: PhoneIcon },
  { label: "Bengaluru, India", Icon: LocationIcon },
];

const paymentMethods = [
  { label: "Paytm", src: "/payment-methods/paytm.svg" },
  { label: "PhonePe", src: "/payment-methods/phonepe.svg" },
  { label: "UPI", src: "/payment-methods/upi.svg" },
  { label: "Google Pay", src: "/payment-methods/google-pay.svg" },
  { label: "RuPay", src: "/payment-methods/rupay.svg" },
  { label: "Visa", src: "/payment-methods/visa.svg" },
];

export function SiteFooter() {
  return (
    <footer className="luxury-site-footer-section">
      <div className="luxury-footer-card container-shell">
        <LeafWatermark />

        <div className="luxury-footer-grid">
          <section className="luxury-brand-column" aria-label="Geesun Crafts">
            <div className="luxury-brand-lockup">
              <LogoMark className="luxury-footer-logo" />
              <h2>Geesun Crafts</h2>
            </div>
            <p className="luxury-brand-description">
              Timeless and meaningful art pieces designed to elevate your home with warmth and character.
            </p>

            <div className="luxury-social-list" aria-label="Social links">
              {socialLinks.map(({ href, label, Icon }) => (
                <Link key={label} href={href} aria-label={label} className="luxury-social-link">
                  <Icon className="luxury-social-icon" />
                </Link>
              ))}
            </div>

            <div className="luxury-newsletter">
              <h3>Elevate Your Space With Timeless Art</h3>
              <p>Receive exclusive collections, artist updates, and curated inspiration.</p>
              <form className="luxury-newsletter-form">
                <label className="sr-only" htmlFor="footer-email">
                  Email address
                </label>
                <input id="footer-email" name="email" type="email" placeholder="Enter your email..." />
                <button type="submit">Submit</button>
              </form>
            </div>
          </section>

          <FooterLinkColumn title="Quick Links" links={quickLinks} />
          <FooterLinkColumn title="Customer Care" links={customerCareLinks} />

          <section className="luxury-footer-column luxury-contact-column">
            <h3>Contact Us</h3>
            <div className="luxury-contact-list">
              {contactItems.map(({ label, Icon }) => (
                <p key={label}>
                  <Icon className="luxury-contact-icon" />
                  <span>{label}</span>
                </p>
              ))}
            </div>
          </section>
        </div>

        <div className="luxury-footer-bottom">
          <p>© 2026 Geesun Crafts. All rights reserved.</p>
          <PaymentMethods />
        </div>
      </div>
    </footer>
  );
}

function PaymentMethods() {
  return (
    <div className="luxury-payment-row">
      <span className="luxury-payment-title">We accept:</span>
      <div className="luxury-payment-list" aria-label="Accepted payment methods">
        {paymentMethods.map((method) => (
          <span key={method.label} className="luxury-payment-chip" role="img" aria-label={method.label}>
            <Image
              src={method.src}
              alt=""
              width={80}
              height={24}
              className="luxury-payment-logo"
              unoptimized
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="luxury-footer-column">
      <h3>{title}</h3>
      <nav aria-label={title}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}

function LogoMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 56 72" fill="none" aria-hidden="true">
      <path d="M27.5 67.5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M27.5 18C21 16.6 16 10.7 15 4C21.7 5.5 26.6 11.2 27.5 18Z" fill="currentColor" opacity="0.82" />
      <path d="M28.2 29.5C37.3 27.8 43.7 20.3 44.8 11.8C35.8 13.7 29.2 21 28.2 29.5Z" fill="currentColor" opacity="0.74" />
      <path d="M26.8 34C17.5 32.5 10.2 25.6 7.8 16.8C17.2 18.3 24.4 25.2 26.8 34Z" fill="currentColor" opacity="0.9" />
      <path d="M28.1 47.5C38.1 45.9 45.8 38.7 48.4 29.4C38.3 31.2 30.5 38.2 28.1 47.5Z" fill="currentColor" opacity="0.58" />
      <path d="M26.9 54.5C16.9 53 9.2 45.6 6.7 36.2C16.7 37.9 24.5 45.1 26.9 54.5Z" fill="currentColor" opacity="0.62" />
      <path d="M29 18L20.5 10.5M29.5 30L38.2 20.2M26.8 34L14.2 24.6M28.2 47.4L40.8 38M27 54.4L14.7 44.4" stroke="#1A2618" strokeWidth="1" strokeLinecap="round" opacity="0.36" />
    </svg>
  );
}

function LeafWatermark() {
  return (
    <svg className="luxury-leaf-watermark" viewBox="0 0 280 360" fill="none" aria-hidden="true">
      <path d="M74 321C138 245 174 159 190 39" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M169 91C202 79 221 52 226 18C193 29 174 57 169 91Z" stroke="currentColor" strokeWidth="2" />
      <path d="M151 143C112 136 82 109 70 73C109 81 140 107 151 143Z" stroke="currentColor" strokeWidth="2" />
      <path d="M130 190C176 183 212 151 226 109C180 117 144 148 130 190Z" stroke="currentColor" strokeWidth="2" />
      <path d="M111 234C75 229 46 205 34 172C70 177 99 201 111 234Z" stroke="currentColor" strokeWidth="2" />
      <path d="M94 275C134 269 166 242 179 205C139 211 108 238 94 275Z" stroke="currentColor" strokeWidth="2" />
      <path d="M186 45L205 28M171 91L217 48M151 143L86 91M130 190L208 132M111 234L50 186M94 275L165 222" stroke="currentColor" strokeWidth="1.5" opacity="0.75" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.2 8.6H16V5.7C15.7 5.7 14.7 5.6 13.6 5.6C11.2 5.6 9.6 7 9.6 9.7V12H7V15.2H9.6V22H12.9V15.2H15.5L15.9 12H12.9V10C12.9 9.1 13.2 8.6 14.2 8.6Z" fill="currentColor" />
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="7.6" r="1" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.2" y="7" width="15.6" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 10.1L14.6 12L10.5 13.9V10.1Z" fill="currentColor" />
    </svg>
  );
}

function PinterestIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11.9 4.8C8.2 4.8 5.7 7.2 5.7 10.4C5.7 12.3 6.7 13.9 8.2 14.5C8.5 14.6 8.8 14.5 8.9 14.1L9.2 13C9.3 12.7 9.3 12.6 9 12.2C8.5 11.6 8.2 10.9 8.2 10C8.2 8.1 9.6 6.5 11.8 6.5C13.8 6.5 14.9 7.7 14.9 9.3C14.9 11.4 14 13.2 12.6 13.2C11.9 13.2 11.3 12.6 11.5 11.8C11.8 10.9 12.2 10 12.2 9.4C12.2 8.8 11.9 8.3 11.2 8.3C10.4 8.3 9.8 9.1 9.8 10.2C9.8 10.9 10 11.4 10 11.4L9 15.7C8.7 17 8.9 18.6 9 19.2C9 19.4 9.3 19.5 9.4 19.3C9.6 19 10.4 17.9 10.7 16.7L11.2 14.8C11.6 15.5 12.5 16 13.5 16C16.4 16 18.3 13.3 18.3 9.8C18.3 7.1 16 4.8 11.9 4.8Z" fill="currentColor" />
    </svg>
  );
}

function MailIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.5H20V17.5H4V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.7 7.2L12 12.8L19.3 7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.2 4.5L9.7 5.1L10.4 9L8.6 10.1C9.7 12.5 11.5 14.3 13.9 15.4L15 13.6L18.9 14.3L19.5 16.8C19.7 17.6 19.2 18.4 18.4 18.7C17.5 19 16.6 19.2 15.7 19.2C9.7 19.2 4.8 14.3 4.8 8.3C4.8 7.4 5 6.5 5.3 5.6C5.6 4.8 6.4 4.3 7.2 4.5Z" fill="currentColor" />
    </svg>
  );
}

function LocationIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21C12 21 18 15.5 18 10.5C18 7.2 15.3 4.5 12 4.5C8.7 4.5 6 7.2 6 10.5C6 15.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
