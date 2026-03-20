export default function ShopLoading() {
  return (
    <section className="container-shell section-space">
      <div className="mb-6 h-10 w-56 animate-pulse rounded-lg bg-[var(--secondary)]" />
      <div className="grid gap-7 lg:grid-cols-[260px_1fr]">
        <div className="card-surface h-80 animate-pulse" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card-surface h-80 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
