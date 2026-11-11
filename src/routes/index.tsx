import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { recordRecentlyViewedDb } from "../lib/actions";
import { cartStore } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
  getCategoryMeta,
} from "../components/store-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nadeem Traders | Retail & Wholesale Marketplace" },
      {
        name: "description",
        content:
          "Spices, basmati rice, pulses, dry fruits, cooking oils, and sugar & salt in retail and wholesale quantities.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { categories, products, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [pricingTab, setPricingTab] = useState<"retail" | "wholesale">("retail");

  const handleAddToCart = (product: any, qty: number = 1) => {
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty}× ${product.name} to your bag`);
  };

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  };

  const featuredProducts = products.slice(0, 4);

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      quickViewProduct={quickViewProduct}
      setQuickViewProduct={setQuickViewProduct}
    >
      {/* 1. Clean Editorial Hero */}
      <section className="relative min-h-[520px] lg:min-h-[600px] flex items-center justify-center overflow-hidden bg-[#141311] text-white text-center px-4 py-20">
        <video
          src="/promo.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/75" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-6 animate-fade-up">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A56E]">
            Nadeem Traders
          </p>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.06] text-[#F9F6F0]">
            Spices, Grains &amp; <br className="hidden sm:inline" />
            <span className="italic font-normal">Daily Essentials</span>
          </h1>

          <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#E6E1D6]/90 leading-relaxed font-light">
            Dry fruits, culinary spices, pulses, basmati rice, and cooking oils available in retail packs and wholesale quantities.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/categories"
              className="bg-[#F9F6F0] text-[#171513] px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] hover:bg-white transition-colors"
            >
              Browse Categories
            </Link>
            <Link
              to="/shop"
              className="border border-[#F9F6F0]/60 text-[#F9F6F0] px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] hover:border-white hover:bg-white/10 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Selection */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 mb-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">
              Catalog
            </p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-normal text-foreground">
              Featured Products
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="inline-flex border border-border bg-card p-0.5 text-[11px] uppercase tracking-[0.16em]">
              <button
                type="button"
                onClick={() => setPricingTab("retail")}
                className={`px-3.5 py-1.5 transition ${
                  pricingTab === "retail"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Retail
              </button>
              <button
                type="button"
                onClick={() => setPricingTab("wholesale")}
                className={`px-3.5 py-1.5 transition ${
                  pricingTab === "wholesale"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Wholesale
              </button>
            </div>

            <Link
              to="/shop"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground underline underline-offset-8 hover:text-secondary transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {featuredProducts.map((p) => (
            <ModernProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
              showWholesalePrimary={pricingTab === "wholesale"}
            />
          ))}
        </div>
      </section>

      {/* 3. Categories Showcase */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-8 space-y-20">
        <div className="text-center space-y-2 border-t border-border pt-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-secondary">
            Departments
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-normal text-foreground">
            Shop by Category
          </h2>
        </div>

        {categories.map((cat, idx) => {
          const meta = getCategoryMeta(cat.name);
          const catProducts = products.filter((p) => p.category_id === cat.id).slice(0, 3);
          const isReversed = idx % 2 === 1;

          return (
            <div key={cat.id} className="space-y-10 border-t border-border pt-14 first:border-t-0 first:pt-0">
              <div className="grid gap-8 lg:grid-cols-12 items-center">
                <div className={`lg:col-span-5 space-y-4 ${isReversed ? "lg:order-2" : ""}`}>
                  <h3 className="font-display text-3xl sm:text-4xl font-normal text-foreground">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                  <div className="pt-2">
                    <Link
                      to={`/category/${cat.id}` as any}
                      className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                    >
                      Shop {cat.name} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className={`lg:col-span-7 ${isReversed ? "lg:order-1" : ""}`}>
                  <Link
                    to={`/category/${cat.id}` as any}
                    className="group block relative aspect-[16/9] w-full overflow-hidden bg-muted border border-border"
                  >
                    {cat.image_url && (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between text-white">
                      <span className="font-display text-2xl">{cat.name}</span>
                      <span className="text-[11px] uppercase tracking-[0.2em] underline underline-offset-4">
                        View Category
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              {catProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catProducts.map((p) => (
                    <ModernProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onQuickView={handleQuickView}
                      onToggleWishlist={toggleWishlist}
                      wishlist={wishlist}
                      showWholesalePrimary={pricingTab === "wholesale"}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </StoreLayout>
  );
}
