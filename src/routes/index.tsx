import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
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
          "Dry fruits, seeds aur masalay — duniya bhar se chun kar aapke kitchen tak. Cash on delivery across Pakistan.",
      },
    ],
  }),
  component: HomePage,
});

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

      <div className="border-b border-border bg-card/40">
        <ul className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border px-1 sm:px-6">
          <li data-reveal style={stagger(0)} className="px-3 py-3.5 sm:px-5 sm:first:pl-0">
            <strong className="block text-[13px] font-semibold leading-tight sm:text-sm">Cash On Delivery</strong>
            <span className="block text-xs text-muted-foreground sm:text-sm">Pay At Doorstep</span>
          </li>

          <li data-reveal style={stagger(1)} className="px-3 py-3.5 sm:px-5">
            <strong className="block text-[13px] font-semibold leading-tight sm:text-sm">Across Pakistan</strong>
            <span className="block text-xs text-muted-foreground sm:text-sm">All Cities &amp; Towns</span>
          </li>

          <li data-reveal style={stagger(2)} className="px-3 py-3.5 sm:px-5">
            <strong className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-tight sm:text-sm">
              <span>In Faisalabad</span>
              <MapPin className="h-3.5 w-3.5 fill-foreground text-foreground shrink-0" />
            </strong>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <img src="/logos/indrive.svg" alt="inDrive" className="h-4 sm:h-5 w-auto object-contain" />
              <img src="/logos/yango.svg" alt="Yango" className="h-4 sm:h-5 w-auto object-contain" />
            </div>
          </li>
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

      <OrderSteps />
    </StoreLayout>
  );
}

const STEP_IMAGES = ["/hero/slide-1.jpg", "/hero/slide-2.jpg", "/hero/slide-5.jpg"];

function OrderSteps() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reducedMotion ? <StepsSimple /> : <StepsShowcase />;
}

function StepsShowcase() {
  const containerRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const headerH = window.innerWidth >= 640 ? 64 : 56;
      const travel = rect.height - (window.innerHeight - headerH);
      const p = Math.min(1, Math.max(0, (headerH - rect.top) / travel));
      el.style.setProperty("--p", p.toFixed(4));
      STEPS.forEach((_, i) => {
        el.style.setProperty(`--s${i}`, Math.min(1, Math.max(0, p * STEPS.length - i)).toFixed(4));
      });
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const current = STEPS[step];

  return (
    <section ref={containerRef} className="relative h-[320vh] bg-[#141311] text-white" aria-label="Order Kaise Karein?">
      <div className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-hidden sm:top-16 sm:h-[calc(100svh-4rem)]">
        {STEP_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === step ? "opacity-100" : "opacity-0"}`}
            style={{ transform: "scale(calc(1.02 + var(--p, 0) * 0.18))" }}
          />
        ))}
        <div className="absolute inset-0 bg-[#141311]/75" />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-8 sm:px-6 sm:py-12">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold sm:text-5xl">Order Kaise Karein?</h2>
              <span className="hidden shrink-0 text-sm font-semibold text-[#E6CE9C] sm:inline">3 Steps. Bas.</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {STEPS.map((s, i) => (
                <span key={s.title} className="block h-1 bg-white/20">
                  <span
                    className="block h-full origin-left bg-[#E6CE9C]"
                    style={{ transform: `scaleX(var(--s${i}, 0))` }}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="grid items-end gap-x-10 gap-y-4 lg:grid-cols-[1fr_auto]">
            <div className="flex items-end gap-5 sm:gap-8">
              <span
                key={`n${step}`}
                className="animate-step-num font-display text-[9rem] font-bold leading-[0.78] lining-nums text-[#E6CE9C] sm:text-[14rem] lg:text-[18rem]"
              >
                {step + 1}
              </span>
              <div key={`t${step}`} className="animate-fade-up pb-2 sm:pb-6">
                <h3 className="font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">{current.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">{current.body}</p>
              </div>
            </div>

            <ol className="hidden space-y-3 pb-6 lg:block">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className={`flex items-center gap-3 text-lg font-semibold transition-colors duration-500 ${i === step ? "text-white" : "text-white/35"}`}
                >
                  <span className="w-6 font-display text-2xl lining-nums">{i + 1}</span>
                  {s.title}
                </li>
              ))}
            </ol>
          </div>

          <p
            className={`text-sm text-white/60 transition-opacity duration-500 ${step === 0 ? "opacity-100" : "opacity-0"}`}
          >
            Scroll Karo ↓
          </p>
        </div>
      </div>
    </section>
  );
}

function StepsSimple() {
  return (
    <section className="stack-section relative bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
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
      </div>
    </section>
  );
}

const HERO_SLIDES = [
  { image: "/hero/slide-1.jpg", label: "Shop All", line: "Poori Dukaan, Ek Click Pe", href: "/shop", color: "#6B4226" },
  { image: "/hero/slide-2.jpg", label: "Daawat Season", line: "Daawat Ka Plan? Saman Humara", href: "/shop", color: "#2F6B3A" },
  { image: "/hero/slide-3.jpg", label: "Spices", line: "Lal Mirch, Full Garmi", href: "/category/spices", color: "#A1281C" },
  { image: "/hero/slide-4.jpg", label: "Whole Spices", line: "Daig Ka Asli Raaz: Sabut Masalay", href: "/category/whole-spices", color: "#8A6100" },
  { image: "/hero/slide-5.jpg", label: "Seeds", line: "Chotay Seeds, Achi Immunity", href: "/category/seeds", color: "#2F6B3A" },
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
       <div className="hero-parallax-img absolute inset-0 lg:-top-24">
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
       </div>

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
        <div className="hero-parallax-text lg:max-w-[46%]">
          <p className="animate-fade-up text-sm font-semibold text-[#E6CE9C]">Apka Trusted Stop</p>
          <h1 style={{ animationDelay: "120ms" }} className="animate-fade-up mt-3 font-display text-[2.5rem] font-semibold leading-[1.02] sm:text-6xl xl:text-7xl">
            Good Food Starts With Good Ingredients.
          </h1>
          <p style={{ animationDelay: "240ms" }} className="animate-fade-up mt-4 max-w-md text-base leading-relaxed text-white/80">
            Dry Fruits, Seeds Aur Masalay — Duniya Bhar Se Chun Kar, Aapke Kitchen Tak. 100% Purity, Zero Milawat.
          </p>
          <div style={{ animationDelay: "360ms" }} className="animate-fade-up mt-7 flex gap-3">
            <Link
              to="/shop"
              className="btn-swipe flex-1 bg-white py-3.5 text-center text-sm font-semibold text-[#141311] sm:flex-none sm:px-8"
            >
              Shop Now
            </Link>
            <Link
              to="/categories"
              className="btn-swipe flex-1 border border-white/60 py-3.5 text-center text-sm font-semibold text-white sm:flex-none sm:px-8"
              style={{ "--swipe": "#fff" } as React.CSSProperties}
            >
              Categories
            </Link>
          </div>

          <div style={{ animationDelay: "480ms" }} className="animate-fade-up mt-9 lg:mt-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Aaj Ki Picks</p>
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
    "Assalam o Alaikum! Mujhe larger quantity / custom quotation chahiye. Meri requirement:",
  )}`;
  return (
    <section className="stack-section sticky top-14 bg-[#141311] text-white sm:top-16">
      <div data-reveal className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-14">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Need Larger Quantities?
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
            For larger quantities or custom quotations, you can contact us directly —{" "}
            <strong className="font-semibold text-white">Jitna Zyada Saman, Utna Behtar Rate.</strong>
          </p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-swipe shrink-0 bg-[#25D366] px-7 py-3.5 text-center text-sm font-semibold text-[#0B3D1F]"
          style={{ "--swipe": "#fff", "--swipe-fg": "#0B3D1F" } as React.CSSProperties}
        >
          Contact For Quotation
        </a>
      </div>
    </section>
  );
}
