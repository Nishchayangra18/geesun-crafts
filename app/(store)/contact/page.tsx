export default function ContactPage() {
  return (
    <section className="container-shell section-space">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">Contact Us</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-5xl">Get In Touch</h1>
          <form className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Name" />
            <Field label="Email" type="email" />
            <Field label="Phone" />
            <Field label="Subject" />
            <label className="text-sm text-[var(--text-muted)] sm:col-span-2">
              Message
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 outline-none"
                placeholder="Tell us what you are looking for..."
              />
            </label>
            <button type="submit" className="olive-btn rounded-full px-6 py-3 text-sm sm:col-span-2 sm:w-fit">
              Send Message
            </button>
          </form>
        </div>

        <aside className="card-surface space-y-4 p-6">
          <h2 className="font-[var(--font-heading)] text-3xl">Studio Details</h2>
          <p className="text-sm text-[var(--text-muted)]">Geesun Crafts Atelier, Jaipur, Rajasthan</p>
          <p className="text-sm text-[var(--text-muted)]">help@geesuncrafts.com</p>
          <p className="text-sm text-[var(--text-muted)]">+91 90000 90000</p>
          <div className="overflow-hidden rounded-xl border border-[var(--border-soft)]">
            <iframe
              title="Geesun Crafts Map"
              src="https://www.google.com/maps?q=jaipur&output=embed"
              className="h-64 w-full border-0"
              loading="lazy"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label className="text-sm text-[var(--text-muted)]">
      {label}
      <input
        type={type}
        className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 outline-none"
      />
    </label>
  );
}
