import { createFileRoute, Link } from "@tanstack/react-router";
import {
  StoreLayout,
  ModernProductCard,
  CategoryTile,
  useStoreData,
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

function HomePage() {
  const { categories, products, currentUser } = useStoreData();

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <section className="relative flex min-h-[460px] items-end overflow-hidden bg-[#141311] text-white sm:min-h-[580px] sm:items-center">
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
        <ul className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border px-4 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          <li className="py-3.5 sm:px-5 sm:first:pl-0">
            <strong className="font-semibold">Cash on delivery</strong>
            <span className="text-muted-foreground"> — paise tab, jab maal haath mein ho</span>
          </li>
          <li className="py-3.5 sm:px-5">
            <strong className="font-semibold">Pakistan bhar mein delivery</strong>
            <span className="text-muted-foreground"> — har sheher, har gali</span>
          </li>
          <li className="py-3.5 sm:px-5">
            <strong className="font-semibold">Mandi se direct</strong>
            <span className="text-muted-foreground"> — no middlemen, no markup</span>
          </li>
        </ul>
      </div>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Shop by category</h2>
        <p className="mt-1 text-sm text-muted-foreground">Apna section chuno.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryTile key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Trending rn</h2>
            <p className="mt-1 text-sm text-muted-foreground">Jo sab le ja rahe hain.</p>
          </div>
          <Link to="/shop" className="shrink-0 text-sm font-semibold underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ModernProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </StoreLayout>
  );
}
