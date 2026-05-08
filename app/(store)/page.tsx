import Link from "next/link";
import Image from "next/image";
import { HeroSection } from "@/components/home/hero-section";
import { ProductCarousel } from "@/components/home/product-carousel";
import { BestsellersSection } from "@/components/home/bestsellers-section";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { categories, testimonials } from "@/lib/content/home-content";
import { fetchProducts } from "@/lib/data/products";

const customFeatures = [
  "Personalized Designs",
  "Any Size You Want",
  "Perfect for Gifting",
  "Artist Made for You",
];

export default async function HomePage() {
  const products = await fetchProducts();
  const bestsellers = products.filter((product) => product.bestseller);
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
            {categories.map((category) => (
              <article key={category.title} className="premium-hover-card overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#f8f2e8]">
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
              </article>
            ))}
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

      <section className="container-shell section-space">
        <div className="card-surface fade-in-on-scroll grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-soft)]">
            <Image
              src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1300&q=80"
              alt="Custom artwork creation"
              width={1200}
              height={900}
              className="image-zoom aspect-[4/3] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
          <div className="self-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9f8f77]">Custom Artwork</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl leading-tight text-[#302822]">Create Your Own Masterpiece</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Bring your vision to life with personalized paintings crafted by our artists.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {customFeatures.map((feature) => (
                <div key={feature} className="rounded-xl border border-[var(--border-soft)] bg-[#faf5ec] px-3 py-2 text-sm text-[#433930] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(89,71,46,0.12)]">
                  {feature}
                </div>
              ))}
            </div>
            <Link href="/contact" className="olive-btn mt-6 inline-block rounded-full px-6 py-2.5 text-sm">
              Start Custom Order
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell section-space pb-16">
        <div className="fade-in-on-scroll overflow-hidden rounded-[1.4rem] border border-[#6f8360] bg-[#6B7D5E] p-5 text-white shadow-[0_20px_36px_rgba(74,92,64,0.35)] sm:p-7">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#d8e3cf]">Join Our Art Community</p>
              <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">Weekly inspiration in your inbox</h2>
            </div>
            <form className="glass-form flex w-full max-w-xl flex-col gap-3 rounded-full p-1 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="h-11 flex-1 rounded-full border border-[#d5e1cc]/45 bg-white/80 px-4 text-sm text-[#2a241f] outline-none transition focus:border-[#f0f5eb] focus:bg-white"
              />
              <button type="submit" className="h-11 rounded-full bg-[#2d3f2a] px-6 text-sm font-medium text-white transition hover:bg-[#22341f]">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
