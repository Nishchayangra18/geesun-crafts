type IconProps = {
  className?: string;
};

const contactRows = [
  { eyebrow: "Email", value: "hello@geesuncrafts.com", Icon: MailIcon },
  { eyebrow: "Phone", value: "+91 90000 90000", Icon: PhoneIcon },
  { eyebrow: "Location", value: "Bengaluru, India", Icon: PinIcon },
  { eyebrow: "Studio", value: "Geesun Crafts Atelier, Jaipur, Rajasthan", Icon: StudioIcon },
];

const socialLinks = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Pinterest", href: "#", Icon: PinterestIcon },
  { label: "YouTube", href: "#", Icon: YoutubeIcon },
];

const benefits = [
  {
    title: "Original Artwork",
    text: "100% unique and made with passion",
    Icon: LeafIcon,
  },
  {
    title: "Premium Quality",
    text: "High-grade canvas and materials",
    Icon: PenIcon,
  },
  {
    title: "Secure Packaging",
    text: "Safe delivery with care and love",
    Icon: BoxIcon,
  },
  {
    title: "Easy Returns",
    text: "Hassle-free returns within 7 days",
    Icon: RefreshIcon,
  },
];

export default function ContactPage() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1500px] rounded-[28px] border border-[#ded3c2] bg-[#f8f5ef] p-5 shadow-[0_18px_45px_rgb(87_70_48_/_10%)] sm:p-8 lg:p-9">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] xl:grid-cols-[0.86fr_1.36fr_1.9fr] xl:items-stretch">
          <IntroPanel />
          <ContactForm />
          <StudioPanel />
        </div>

        <BenefitsStrip />
      </div>
    </section>
  );
}

function IntroPanel() {
  return (
    <aside className="relative min-h-[430px] overflow-hidden rounded-[24px] px-2 py-2 sm:min-h-[470px] xl:min-h-full">
      <p className="text-[13px] font-semibold uppercase tracking-[0.32em] text-[#9f7c3c]">Contact Us</p>
      <h1 className="mt-6 max-w-[360px] font-[var(--font-heading)] text-[3.2rem] font-medium leading-[1.03] text-[#2e2923] sm:text-[4rem] xl:text-[4.25rem]">
        We&rsquo;re Just a Message Away
      </h1>
      <p className="mt-7 max-w-[390px] text-[1.02rem] leading-[1.75] text-[#5f574d]">
        Reach out to us for product inquiries, custom orders, or any other assistance. We&rsquo;ll get back to you as
        soon as possible.
      </p>
      <BotanicalArt className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[330px] text-[#bfae95] opacity-45 sm:h-[360px] sm:w-[390px]" />
    </aside>
  );
}

function ContactForm() {
  return (
    <form className="rounded-[18px] border border-[#ded3c2] bg-[#fbf8f2]/70 p-5 shadow-[0_14px_32px_rgb(87_70_48_/_6%)] sm:p-6">
      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <Field label="Full Name" placeholder="Enter your full name" />
        <Field label="Email Address" type="email" placeholder="Enter your email" />
        <Field label="Phone Number" type="tel" placeholder="Enter your phone number" />
        <Field label="Subject" placeholder="Enter subject" />
        <label className="sm:col-span-2">
          <span className="text-[15px] font-medium text-[#4f493f]">Message</span>
          <textarea
            className="mt-2 h-[150px] w-full resize-none rounded-xl border border-[#d9cdbc] bg-[#fdfaf5] px-4 py-3 text-[15px] text-[#2f2a24] outline-none transition placeholder:text-[#928a80] focus:border-[#6b7d5e] focus:bg-white focus:shadow-[0_0_0_4px_rgb(107_125_94_/_12%)]"
            placeholder="Tell us what you are looking for..."
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#536a43_0%,#344729_100%)] px-8 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgb(58_74_43_/_20%)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgb(58_74_43_/_25%)]"
      >
        Send Message
        <PlaneIcon className="h-4 w-4" />
      </button>
    </form>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label>
      <span className="text-[15px] font-medium text-[#4f493f]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 h-[52px] w-full rounded-xl border border-[#d9cdbc] bg-[#fdfaf5] px-4 text-[15px] text-[#2f2a24] outline-none transition placeholder:text-[#928a80] focus:border-[#6b7d5e] focus:bg-white focus:shadow-[0_0_0_4px_rgb(107_125_94_/_12%)]"
      />
    </label>
  );
}

function StudioPanel() {
  return (
    <div className="grid gap-7 lg:col-span-2 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch xl:col-span-1 xl:border-l xl:border-[#ded3c2] xl:pl-7">
      <aside className="flex flex-col">
        <p className="text-[13px] font-semibold uppercase tracking-[0.32em] text-[#9f7c3c]">Studio Details</p>
        <h2 className="mt-5 font-[var(--font-heading)] text-[2rem] font-medium leading-tight text-[#2e2923]">
          Geesun Crafts Atelier
        </h2>
        <p className="mt-3 text-base text-[#61584e]">Jaipur, Rajasthan</p>

        <div className="mt-8 grid gap-5">
          {contactRows.map(({ eyebrow, value, Icon }) => (
            <div key={eyebrow} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0ece4] text-[#617151]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-[#3f392f]">{eyebrow}</span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[#665e53]">{value}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-9">
          {socialLinks.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfc2af] text-[#617151] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#617151] hover:bg-[#617151] hover:text-white"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </aside>

      <MapCard />
    </div>
  );
}

function MapCard() {
  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-[22px] border border-[#ded3c2] bg-[#eee7dc] shadow-[0_14px_30px_rgb(87_70_48_/_8%)]">
      <a
        href="https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20Rajasthan"
        target="_blank"
        rel="noreferrer"
        className="absolute left-5 top-5 z-10 inline-flex h-11 items-center gap-2 rounded-xl border border-[#e2d8ca] bg-white/90 px-4 text-[13px] font-medium text-[#3d352c] shadow-[0_10px_20px_rgb(87_70_48_/_10%)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
      >
        Open in Maps
        <ExternalIcon className="h-4 w-4 text-[#617151]" />
      </a>
      <iframe
        title="Geesun Crafts Atelier Map"
        src="https://www.google.com/maps?q=Jaipur%2C%20Rajasthan&output=embed"
        className="h-full min-h-[460px] w-full border-0 opacity-90"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

function BenefitsStrip() {
  return (
    <div className="mt-9 rounded-[22px] border border-[#ded3c2] bg-[#fbf8f2] px-5 py-6 shadow-[0_12px_28px_rgb(87_70_48_/_5%)] sm:px-7">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        {benefits.map(({ title, text, Icon }, index) => (
          <div
            key={title}
            className={`flex items-center gap-5 xl:px-9 ${index > 0 ? "xl:border-l xl:border-[#ded3c2]" : ""}`}
          >
            <span className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full bg-[#f0ece4] text-[#617151]">
              <Icon className="h-8 w-8" />
            </span>
            <span>
              <span className="block font-[var(--font-heading)] text-xl font-medium text-[#2f2a24]">{title}</span>
              <span className="mt-2 block text-[15px] leading-snug text-[#5f574d]">{text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BotanicalArt({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 390 360" fill="none" aria-hidden="true">
      <path d="M35 325C109 252 181 173 264 52" stroke="currentColor" strokeWidth="1.6" />
      <path d="M78 281C61 256 47 230 44 194C70 210 86 236 78 281Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M111 245C89 218 77 189 81 150C110 172 123 204 111 245Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M151 202C136 176 130 146 142 110C166 137 173 168 151 202Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M194 156C184 127 185 98 203 64C224 96 222 127 194 156Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M232 103C229 75 237 49 263 21C276 57 266 82 232 103Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M84 279C119 272 151 278 185 303C145 315 111 307 84 279Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M118 239C158 231 193 240 226 270C180 279 145 267 118 239Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M157 197C197 186 233 194 269 222C224 235 187 226 157 197Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M200 151C239 135 276 138 315 162C273 181 235 178 200 151Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M236 101C270 78 307 73 350 88C313 114 276 120 236 101Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M50 309L80 282M80 282L112 246M112 246L151 203M151 203L194 157M194 157L233 104" stroke="currentColor" strokeWidth="1" opacity="0.8" />
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

function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21C12 21 18 15.6 18 10.5C18 7.2 15.3 4.5 12 4.5C8.7 4.5 6 7.2 6 10.5C6 15.6 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function StudioIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 19V9.5L12 4L19.5 9.5V19H4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 19V12H16V19M9.5 8.8H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 15H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PlaneIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 4L10.8 13.2M20 4L14 20L10.8 13.2M20 4L4 10L10.8 13.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5H5V19H19V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 5H19V11M19 5L10.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.2 8.6H16V5.7C15.7 5.7 14.7 5.6 13.6 5.6C11.2 5.6 9.6 7 9.6 9.7V12H7V15.2H9.6V22H12.9V15.2H15.5L15.9 12H12.9V10C12.9 9.1 13.2 8.6 14.2 8.6Z" fill="currentColor" />
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

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.2" y="7" width="15.6" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 10.1L14.6 12L10.5 13.9V10.1Z" fill="currentColor" />
    </svg>
  );
}

function LeafIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21V8M12 12C8.5 11.8 6 9.1 5.4 5.5C9 5.8 11.6 8.5 12 12ZM12 15C16.2 14.6 19.2 11.5 20 7.4C15.8 7.8 12.7 10.8 12 15Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PenIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 19.5L8.3 18.7L18.8 8.2C19.7 7.3 19.7 5.8 18.8 4.9C17.9 4 16.4 4 15.5 4.9L5 15.4L4.5 19.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.2 6.2L17.5 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.8L20 8.2V16.5L12 20.8L4 16.5V8.2L12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4.5 8.5L12 12.6L19.5 8.5M12 12.6V20.3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.2 9.5C6.2 6.8 8.8 5 11.8 5C14.1 5 16.1 6 17.4 7.6L19 9.5M19 9.5V5.5M19 9.5H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.8 14.5C17.8 17.2 15.2 19 12.2 19C9.9 19 7.9 18 6.6 16.4L5 14.5M5 14.5V18.5M5 14.5H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
