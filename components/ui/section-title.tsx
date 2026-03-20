export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">Geesun Crafts</p>
      <h2 className="mt-2 font-[var(--font-heading)] text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
    </div>
  );
}
