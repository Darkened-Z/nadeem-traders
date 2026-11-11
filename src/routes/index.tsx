import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  StoreLayout,
  ProductRail,
  CategoryRail,
  CategorySection,
  SectionHeader,
  useStoreData,
  WHATSAPP_NUMBER,
  stagger,
} from "../components/store-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nadeem Traders — Apka Trusted Stop" },
      {
        name: "description",
        content:
          "Dry fruits, masalay, daal, chawal aur oil — seedha mandi se aapke kitchen tak. Cash on delivery across Pakistan.",
      },
    ],
  }),
  component: HomePage,
});

const PERKS = [
  ["Cash On Delivery", "Paise Baad Mein"],
  ["Pakistan Bhar Mein", "Har Sheher"],
  ["Faisalabad Mein", "InDrive / Yango Delivery"],
  ["Mandi Se Direct", "No Middlemen"],
];

const STEPS = [
  { title: "Bag Mein Daalo", body: "Jo Chahiye, Add Dabao. Koi Account, Koi Login Nahi." },
  { title: "Order Place Karo", body: "Naam, Number, Address — Bas 30 Second Ka Kaam." },
  { title: "No Prepayment, No Dhoka", body: "Advance Mein Ek Rupaya Nahi. Paise Sirf Delivery Pe." },
];

function HomePage() {
  const { categories, products, currentUser } = useStoreData();

  const trending = categories
    .map((c) => products.find((p) => p.category_id === c.id))
    .filter(Boolean);

  const categoryRows = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.category_id === c.id) }))
    .filter((row) => row.items.length > 0);

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <Hero />

      <div className="border-b border-border">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
          {PERKS.map(([head, sub], i) => (
            <li
              key={head}
              data-reveal
              style={stagger(i)}
              className={`py-3.5 ${i % 2 === 0 ? "pr-3" : "border-l border-border pl-3"} ${i < 2 ? "border-b border-border lg:border-b-0" : ""} lg:border-l lg:px-5 lg:first:border-l-0 lg:first:pl-0`}
            >
              <strong className="block text-[13px] font-semibold leading-tight sm:text-sm">{head}</strong>
              <span className="block text-xs text-muted-foreground sm:text-sm">{sub}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14">
        <section>
          <SectionHeader title="Shop By Category" subtitle="Apna Section Chuno." href="/categories" />
          <CategoryRail categories={categories} />
        </section>

        <section>
          <SectionHeader title="Trending" subtitle="Jo Sab Le Ja Rahe Hain." href="/shop" />
          <ProductRail products={trending} />
        </section>
      </div>

      {categoryRows.map(({ category, items }, idx) => (
        <Fragment key={category.id}>
          <CategorySection category={category} items={items} />
          {idx === 1 && <WhatsAppBand />}
        </Fragment>
      ))}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 data-reveal className="font-display text-[1.75rem] font-semibold sm:text-4xl">Order Kaise Karein?</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} data-reveal style={stagger(i)} className="flex items-start gap-4">
              <span className="w-12 shrink-0 font-display text-7xl font-bold leading-[0.8] lining-nums text-foreground sm:text-8xl sm:w-14">
                {i + 1}
              </span>
              <div className="pt-1">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </StoreLayout>
  );
}

const HERO_SLIDES = [
  { image: "/hero/slide-1.jpg", label: "Shop All", line: "Poori Mandi, Ek Click Pe", href: "/shop", color: "#6B4226" },
  { image: "/hero/slide-2.jpg", label: "Daawat Season", line: "Daawat Ka Plan? Saman Humara", href: "/shop", color: "#2F6B3A" },
  { image: "/hero/slide-3.jpg", label: "Spices", line: "Lal Mirch, Full Garmi", href: "/category/spices", color: "#A1281C" },
  { image: "/hero/slide-4.jpg", label: "Rice & Grains", line: "Pulao Pe Compromise? Never.", href: "/category/rice-grains", color: "#1E3A5F" },
  { image: "/hero/slide-5.jpg", label: "Pulses & Grains", line: "Bori Se Seedha Aapke Ghar", href: "/category/pulses-lentils", color: "#8A6100" },
];

const SLIDE_MS = 5000;

function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = HERO_SLIDES.length;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active, paused, reducedMotion, count]);

  const go = (delta: number) => setActive((i) => (i + delta + count) % count);
  const current = HERO_SLIDES[active];

  return (
    <section
      className="relative overflow-hidden bg-[#141311] text-white lg:h-[min(86vh,760px)] lg:min-h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="hero-fade relative aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[64%]"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
        aria-roledescription="carousel"
        aria-label="Featured"
      >
        {HERO_SLIDES.map((slide, i) => {
          const isActive = i === active;
          return (
            <Link
              key={slide.image}
              to={slide.href as any}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <img
                src={slide.image}
                alt={slide.line}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${isActive ? "scale-110" : "scale-100"}`}
              />
            </Link>
          );
        })}

        <Link
          to={current.href as any}
          className="absolute left-3 top-3 flex items-center gap-3 px-3.5 py-2.5 text-white transition-colors duration-500 lg:bottom-10 lg:left-auto lg:right-10 lg:top-auto lg:px-5 lg:py-4"
          style={{ backgroundColor: current.color }}
        >
          <div>
            <p className="text-[11px] font-semibold text-white/80 lg:text-xs">{current.label}</p>
            <p className="text-sm font-semibold leading-tight lg:text-lg">{current.line}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
        </Link>
      </div>

      <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-4 pb-10 sm:-mt-20 sm:px-6 lg:mt-0 lg:flex lg:h-full lg:items-center lg:pb-0">
        <div className="lg:max-w-[46%]">
          <p className="animate-fade-up text-sm font-semibold text-[#E6CE9C]">Apka Trusted Stop</p>
          <h1 style={{ animationDelay: "120ms" }} className="animate-fade-up mt-3 font-display text-[2.5rem] font-semibold leading-[1.02] sm:text-6xl xl:text-7xl">
            Asli Maal. Mandi Rates. No Cap.
          </h1>
          <p style={{ animationDelay: "240ms" }} className="animate-fade-up mt-4 max-w-md text-base leading-relaxed text-white/80">
            Dry Fruits, Masalay, Daal, Chawal — Seedha Mandi Se Aapke Kitchen Tak. Zero Milawat, Full Bharosa.
          </p>
          <div style={{ animationDelay: "360ms" }} className="animate-fade-up mt-7 flex gap-3">
            <Link
              to="/shop"
              className="flex-1 bg-white py-3.5 text-center text-sm font-semibold text-[#141311] sm:flex-none sm:px-8"
            >
              Shop Now
            </Link>
            <Link
              to="/categories"
              className="flex-1 border border-white/60 py-3.5 text-center text-sm font-semibold text-white sm:flex-none sm:px-8"
            >
              Categories
            </Link>
          </div>

          <div style={{ animationDelay: "480ms" }} className="animate-fade-up mt-9 lg:mt-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Aaj Ki Mandi</p>
            <div className="mt-3 flex gap-2.5 lg:gap-3">
              {HERO_SLIDES.map((slide, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={slide.image}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Show slide ${i + 1}: ${slide.label}`}
                    aria-current={isActive}
                    className="group w-full max-w-[76px] text-left"
                  >
                    <span
                      className={`block aspect-square overflow-hidden transition-opacity ${isActive ? "opacity-100" : "opacity-45 group-hover:opacity-80"}`}
                    >
                      <img src={slide.image.replace("slide-", "thumb-")} alt="" className="h-full w-full object-cover" />
                    </span>
                    <span className="mt-2 block h-0.5 w-full bg-white/15">
                      {isActive && (
                        <span
                          key={active}
                          className="hero-progress block h-full bg-white"
                          style={{
                            animationDuration: `${SLIDE_MS}ms`,
                            animationPlayState: paused || reducedMotion ? "paused" : "running",
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatsAppBand() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Assalam o Alaikum! Mujhe poore mahine ka ration chahiye, rate pe baat karni hai. Meri list:",
  )}`;
  return (
    <section className="bg-[#141311] text-white">
      <div data-reveal className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-14">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Pura Mahina Guzaarna Hai?
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
            Poore Mahine Ka Ration Ek Saath Lo, Paise Bhi Munasib. List WhatsApp Karo Ya Baat Karke Apni Marzi Ka
            Rate Lagwao — <strong className="font-semibold text-white">Jitna Zyada Saman, Utna Behtar Rate.</strong>
          </p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-[#25D366] px-7 py-3.5 text-center text-sm font-semibold text-[#0B3D1F]"
        >
          WhatsApp Pe Rate Fix Karo
        </a>
      </div>
    </section>
  );
}
