import Link from "next/link";
import Image from "next/image";
import { HeroSection } from "@/components/home/hero-section";
import { ProductCarousel } from "@/components/home/product-carousel";
import { BestsellersSection } from "@/components/home/bestsellers-section";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { categories, testimonials } from "@/lib/content/home-content";
import { fetchProducts, getBestsellerProducts } from "@/lib/data/products";

const customArtworkImage =
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1300&q=80";

const customFeatures = [
  { title: "Personalized Designs", icon: "brush" },
  { title: "Any Size You Want", icon: "ruler" },
  { title: "Perfect for Gifting", icon: "gift" },
  { title: "Artist Made for You", icon: "heart" },
];

function CustomLockIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <rect x="5.5" y="10" width="13" height="10" rx="2" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
      <path d="M12 14.5v2" />
      <path d="M12 14.5h.01" />
    </svg>
  );
}

function CustomFeatureIcon({ icon }: { icon: string }) {
  const iconClass = "h-5 w-5";

  if (icon === "brush") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M14.5 4.5 19.5 9.5" />
        <path d="M13.5 5.5 5 14l-1 5 5-1 8.5-8.5" />
        <path d="M6 15.5 8.5 18" />
      </svg>
    );
  }

  if (icon === "ruler") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="m4 15 11-11 5 5L9 20z" />
        <path d="m8 15-1.5-1.5" />
        <path d="m11 12-1.5-1.5" />
        <path d="m14 9-1.5-1.5" />
      </svg>
    );
  }

  if (icon === "gift") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M4 11h16" />
        <path d="M5 11v8h14v-8" />
        <path d="M12 7v12" />
        <path d="M8.5 7H7a2 2 0 1 1 2-2c0 1.5-1 2-1 2h8s-1-.5-1-2a2 2 0 1 1 2 2h-1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M20.5 8.5c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.5Z" />
    </svg>
  );
}

function LaunchingSoonDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-full items-center justify-center gap-3 text-[#C9A86A] ${className}`}>
      <span className="h-px flex-1 bg-[#C9A86A]/70" />
      <span className="h-1 w-1 rounded-full bg-[#C9A86A]/85" />
      <span className="whitespace-nowrap text-[0.78rem] font-semibold uppercase tracking-[0.18em] sm:text-base sm:tracking-[0.2em]">
        Launching Soon
      </span>
      <span className="h-1 w-1 rounded-full bg-[#C9A86A]/85" />
      <span className="h-px flex-1 bg-[#C9A86A]/70" />
    </div>
  );
}

export default async function HomePage() {
  const [products, bestsellers] = await Promise.all([fetchProducts(), getBestsellerProducts()]);
  const featuredProducts = products.filter((product) => product.featured);
  const heroImage =
    products[0]?.image ??
    "https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      <HeroSection heroImage={heroImage} />

      <section className="container-shell section-space">
        <div className="fade-in-on-scroll">
          <div className="text-center">
            <h2 className="font-[var(--font-heading)] text-4xl text-[#312923] sm:text-5xl">Shop By Category</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Find the perfect style for every mood and space.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) =>
              category.title === "Custom" ? (
                <article
                  key={category.title}
                  className="group relative min-h-[326px] cursor-not-allowed overflow-hidden rounded-2xl border border-white/15 bg-[#161616] shadow-[0_16px_34px_rgba(43,35,24,0.16)] transition-[border-color,box-shadow] duration-[400ms] ease-out hover:border-[#C9A86A]/55 hover:shadow-[0_18px_42px_rgba(201,168,106,0.24)] sm:min-h-[300px] xl:min-h-[280px]"
                >
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-[rgba(22,22,22,0.55)] backdrop-blur-[2px] transition-colors duration-[400ms] ease-out group-hover:bg-[rgba(0,0,0,0.62)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_52%,rgba(255,255,255,0.16),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.1),rgba(98,65,20,0.18))]" />
                  <div className="relative z-10 flex h-full min-h-[326px] items-center justify-center px-4 py-7 text-center text-[#F6F1E8] sm:min-h-[300px] sm:px-5 xl:min-h-[280px] xl:px-4 xl:py-6">
                    <div className="flex w-full max-w-[300px] flex-col items-center justify-center gap-3 sm:max-w-[320px] xl:max-w-[270px] 2xl:max-w-[300px]">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-dashed border-white/25 bg-white/[0.06] shadow-[0_0_28px_rgba(255,255,255,0.12)] backdrop-blur-[3px] sm:h-[92px] sm:w-[92px] xl:h-20 xl:w-20 2xl:h-[90px] 2xl:w-[90px]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.12] backdrop-blur-[2px] sm:h-16 sm:w-16 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-7 w-7 text-white sm:h-8 sm:w-8 xl:h-7 xl:w-7 2xl:h-8 2xl:w-8"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          >
                            <rect x="5.5" y="10" width="13" height="10" rx="2" />
                            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
                            <path d="M12 14.5v2" />
                            <path d="M12 14.5h.01" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex w-full flex-col items-center">
                        <h3 className="w-full font-[var(--font-heading)] text-[34px] font-medium leading-[0.95] text-[#F7F2EA] sm:text-[44px] xl:text-[38px] 2xl:text-[42px]">
                          {category.title}
                        </h3>
                        <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-white/85 sm:text-[15px] xl:max-w-[240px] xl:text-[14px] 2xl:max-w-[270px] 2xl:text-[15px]">
                          {category.description}
                        </p>
                        <div className="mt-4 flex w-full items-center justify-center gap-2 text-[#D7B26D]">
                          <span className="h-px min-w-5 flex-1 bg-[#C9A86A]/70" />
                          <span className="whitespace-nowrap text-[0.74rem] font-semibold uppercase tracking-[0.16em] sm:text-[0.82rem] xl:text-[0.74rem] 2xl:text-[0.8rem]">
                            Launching Soon
                          </span>
                          <span className="h-px min-w-5 flex-1 bg-[#C9A86A]/70" />
                        </div>
                        <p className="mt-3 max-w-[230px] text-[13px] leading-relaxed text-white/90 sm:text-sm xl:max-w-[220px] 2xl:max-w-[240px]">
                          We&apos;re crafting something special for you.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ) : (
                <Link key={category.title} href={category.href} className="premium-hover-card block cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#f8f2e8]">
                  <div className="group relative">
                    <Image src={category.image} alt={category.title} width={700} height={500} className="image-zoom aspect-[16/11] w-full object-cover" sizes="(max-width: 1280px) 50vw, 25vw" />
                    <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f9f3ea] text-xs font-semibold text-[#6B7D5E] shadow-md transition-transform duration-300 group-hover:scale-110">
                      {category.icon}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-[var(--font-heading)] text-2xl text-[#3b332d]">{category.title}</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{category.description}</p>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#F7F4EE] py-[44px]">
        <div className="fade-in-on-scroll mx-auto grid w-[min(1560px,calc(100%-1.5rem))] gap-5 overflow-hidden lg:grid-cols-[640px_1fr] lg:items-stretch">
          <article className="group relative grid min-h-[500px] overflow-hidden rounded-[22px] shadow-[0_14px_34px_rgba(64,52,34,0.13)] lg:grid-cols-[0.75fr_1.75fr]">
            <div className="relative z-[1] flex flex-col justify-center bg-[linear-gradient(155deg,#2F4A28_0%,#4F6B3A_100%)] px-8 py-10 text-[#F8F5EF]">
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-[#CFC3AA]">FEATURED COLLECTION</p>
              <h2 className="mt-5 max-w-[310px] font-[var(--font-heading)] text-[3.25rem] leading-[0.95] tracking-[-0.012em]">
                Handpicked
                <br />
                For You
              </h2>
              <p className="mt-4 max-w-[250px] text-[1rem] leading-[1.55] text-[#E9E2D6]">
                Curated artworks selected for refined interiors.
              </p>
              <Link
                href="/shop"
                className="mt-8 inline-flex w-fit items-center gap-3 whitespace-nowrap rounded-full bg-[#F2F1EA] px-6 py-2 text-[0.95rem] font-semibold !text-black shadow-[0_10px_20px_rgba(20,30,12,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFFFFF]"
              >
                View All Products
                <span className="text-base !text-black transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="relative overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80"
                alt="Featured collection interior setup"
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 320px"
              />
            </div>
          </article>

          <ProductCarousel
            products={featuredProducts}
            ariaLabel="Featured collection"
            desktopCards={3}
            className="px-1 py-1"
            cardClassName="rounded-[24px] border-[#E7DAC8] bg-[#FBF8F2] shadow-[0_9px_22px_rgba(72,56,36,0.08)] transition duration-300 hover:-translate-y-1 [&_.relative.block]:h-52 [&_.relative.block]:sm:h-56 [&_.space-y-3]:space-y-2.5 [&_.space-y-3]:p-3.5 [&_h3]:text-[1.85rem] [&_.text-lg.font-semibold]:text-[1.62rem]"
          />
        </div>
      </section>

      <BestsellersSection products={bestsellers} />

      <section className="container-shell section-space">
        <div className="fade-in-on-scroll text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9f8f77]">Testimonials</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl text-[#312923] sm:text-5xl">What Customers Say</h2>
          <TestimonialsCarousel testimonials={testimonials} />
        </div>
      </section>

      <section className="section-space bg-[#F6F1E8]/45 pb-16">
        <div className="fade-in-on-scroll mx-auto w-[min(1400px,calc(100%-1.5rem))] rounded-[28px] border border-[#E2D2BC] bg-[linear-gradient(135deg,#FFFDF9_0%,#F8F2E9_100%)] p-4 shadow-[0_18px_48px_rgba(73,58,38,0.08)] sm:p-6 lg:p-8 xl:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.46fr_0.54fr] lg:items-center xl:gap-12">
            <article className="group relative min-h-[430px] overflow-hidden rounded-[24px] border border-white/15 bg-[#151914] shadow-[0_18px_40px_rgba(39,31,20,0.18)] md:min-h-[470px] lg:min-h-[410px] xl:min-h-[440px]">
              <Image
                src={customArtworkImage}
                alt="Custom artwork creation"
                fill
                className="object-cover object-center blur-[1px] transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) calc(100vw - 3rem), 620px"
              />
              <div className="absolute inset-0 bg-[rgba(15,20,14,0.52)] backdrop-blur-[2px] transition-colors duration-[400ms] ease-out group-hover:bg-[rgba(15,20,14,0.6)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.16)_0%,rgba(83,57,18,0.28)_100%)]" />
              <div className="relative z-10 flex min-h-[430px] flex-col items-center justify-center px-6 py-10 text-center text-[#F6F1E8] md:min-h-[470px] lg:min-h-[410px] xl:min-h-[440px]">
                <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-white/30 bg-[#F8F3EA]/18 shadow-[0_0_34px_rgba(248,243,234,0.16)] backdrop-blur-[3px] sm:h-[110px] sm:w-[110px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F3EA] text-[#9A773C] shadow-[inset_0_2px_10px_rgba(89,65,30,0.18),0_12px_26px_rgba(0,0,0,0.22)] sm:h-[78px] sm:w-[78px]">
                    <CustomLockIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                </div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]">Custom Artwork</p>
                <h2 className="mt-3 font-[var(--font-heading)] text-[34px] font-medium leading-[0.96] text-white sm:text-[44px] lg:text-[42px] xl:text-[54px]">
                  Custom Artwork
                </h2>
                <p className="mt-3 max-w-[320px] text-[15px] leading-relaxed text-white/88 sm:text-lg">
                  Personalized paintings crafted for you.
                </p>
                <LaunchingSoonDivider className="mt-7 max-w-[360px]" />
                <p className="mt-5 max-w-[310px] text-[15px] font-medium leading-[1.7] text-white/92 sm:text-[17px]">
                  We&apos;re creating something special.
                  <br />
                  Stay tuned!
                </p>
              </div>
            </article>

            <div className="flex flex-col justify-center text-center lg:text-left">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#9F7C3C]">Custom Artwork</p>
              <h2 className="mt-5 max-w-3xl font-[var(--font-heading)] text-[2.55rem] font-semibold leading-[1.02] text-[#252725] sm:text-[3.45rem] lg:text-[3.2rem] xl:text-[4.15rem]">
                Create Your Own Masterpiece
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#68645E] sm:text-lg">
                Bring your vision to life with personalized paintings crafted by our artists.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {customFeatures.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-center gap-4 rounded-[18px] border border-[#E3D3BE] bg-[#FFF9F0]/72 px-4 py-3 text-left text-sm font-medium text-[#2F302E] shadow-[inset_0_1px_0_rgba(255,255,255,0.52)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C9A86A]/70 hover:bg-[#FFFDF8] hover:shadow-[0_14px_28px_rgba(93,73,44,0.1)] sm:text-base"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2EBDD] text-[#9F7C3C] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                      <CustomFeatureIcon icon={feature.icon} />
                    </span>
                    {feature.title}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center lg:items-start">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-14 min-w-[280px] cursor-not-allowed items-center justify-center gap-4 rounded-full bg-[linear-gradient(135deg,#6F8067_0%,#8C9784_100%)] px-8 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_30px_rgba(82,98,73,0.26)] opacity-95 sm:min-w-[300px] sm:text-base"
                >
                  <CustomLockIcon className="h-5 w-5" />
                  Launching Soon
                </button>
                <p className="mt-3 text-center text-sm font-medium text-[#7B7770] sm:text-base lg:text-left">
                  Custom orders will open soon. Stay tuned!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
