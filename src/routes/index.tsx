import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  StoreLayout,
  ProductRail,
  CategoryRail,
  SectionHeader,
  useStoreData,
  getCategoryMeta,
  WHATSAPP_NUMBER,
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

const STEPS = [
  { title: "Bag mein daalo", body: "Jo chahiye, Add dabao. Koi account, koi login nahi." },
  { title: "Order place karo", body: "Naam, number, address — bas. 30 second ka kaam." },
  { title: "Darwaze pe paise do", body: "Maal check karo, phir cash do. Simple." },
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
      <section className="relative flex min-h-[440px] items-end overflow-hidden bg-[#141311] text-white sm:min-h-[580px] sm:items-center">
        <video
          src="/promo.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold text-[#E6CE9C]">Apka Trusted Stop</p>
          <h1 className="mt-3 max-w-2xl font-display text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            Asli maal. Mandi rates. No cap.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85">
            Dry fruits, masalay, daal, chawal — seedha mandi se aapke kitchen tak. Zero milawat, zero scenes.
          </p>
          <div className="mt-7 flex gap-3">
            <Link
              to="/shop"
              className="flex-1 bg-white py-3.5 text-center text-sm font-semibold text-[#141311] sm:flex-none sm:px-8"
            >
              Shop now
            </Link>
            <Link
              to="/categories"
              className="flex-1 border border-white/70 py-3.5 text-center text-sm font-semibold text-white sm:flex-none sm:px-8"
            >
              Categories
            </Link>
          </div>
        </div>
      </section>

      <div className="border-b border-border">
        <ul className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border px-1 py-3.5 text-center sm:px-6 sm:text-left">
          {[
            ["Cash on delivery", "paise baad mein"],
            ["Pakistan bhar mein", "har sheher"],
            ["Mandi se direct", "no middlemen"],
          ].map(([head, sub]) => (
            <li key={head} className="px-2 sm:px-5 sm:first:pl-0">
              <strong className="block text-[13px] font-semibold leading-tight sm:inline sm:text-sm">{head}</strong>
              <span className="block text-xs text-muted-foreground sm:inline sm:text-sm">
                <span className="hidden sm:inline"> · </span>
                {sub}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14">
        <section>
          <SectionHeader title="Shop by category" subtitle="Apna section chuno." href="/categories" />
          <CategoryRail categories={categories} />
        </section>

        <section>
          <SectionHeader title="Trending rn" subtitle="Jo sab le ja rahe hain." href="/shop" />
          <ProductRail products={trending} />
        </section>

        {categoryRows.map(({ category, items }, idx) => {
          const meta = getCategoryMeta(category.name);
          return (
            <Fragment key={category.id}>
              <section>
                <SectionHeader
                  title={category.name}
                  subtitle={meta.tagline}
                  href={`/category/${category.id}`}
                  color={meta.color}
                />
                <ProductRail products={items} />
              </section>
              {idx === 1 && <WhatsAppBand />}
            </Fragment>
          );
        })}

        <section className="border-t border-border pt-10">
          <h2 className="font-display text-[1.75rem] font-semibold sm:text-4xl">Order kaise karein?</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="w-7 shrink-0 font-display text-5xl font-semibold leading-none text-muted-foreground/50">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </StoreLayout>
  );
}

function WhatsAppBand() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Assalam o Alaikum! Mujhe yeh saman chahiye:",
  )}`;
  return (
    <section className="-mx-4 bg-[#141311] px-4 py-10 text-white sm:mx-0 sm:px-10 sm:py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Lambi list hai? WhatsApp kar do.
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            Ration list ki photo ya message bhejo — hum sab pack karke ghar bhej denge.
          </p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-[#25D366] px-7 py-3.5 text-center text-sm font-semibold text-[#0B3D1F]"
        >
          Order on WhatsApp
        </a>
      </div>
    </section>
  );
}
