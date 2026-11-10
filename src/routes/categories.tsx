import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import { recordRecentlyViewedDb } from "../lib/actions";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
  getCategoryMeta,
} from "../components/store-layout";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories | Nadeem Traders" },
      {
        name: "description",
        content:
          "Browse all categories at Nadeem Traders: Dry Fruits, Spices, Pulses & Lentils, Rice & Grains, Cooking Oils, and Sugar & Salt.",
      },
    ],
  }),
  component: CategoriesDirectoryPage,
});

function CategoriesDirectoryPage() {
  const { categories, products, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const handleAddToCart = (product: any, qty: number = 1) => {
    if (!currentUser) {
      toast.error("Please sign in to add items to your bag.");
      window.location.href = `/login?redirect=/categories`;
      return;
    }
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty}× ${product.name} to your bag`);
  };

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  };

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      activeCategoryId={-1}
      quickViewProduct={quickViewProduct}
      setQuickViewProduct={setQuickViewProduct}
    >
      <section className="border-b border-border bg-[#F1ECE1] py-14 sm:py-20 text-center px-4">
        <div className="mx-auto max-w-2xl space-y-3 animate-fade-up">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-secondary">
            Nadeem Traders
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-foreground">
            All Categories
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Select a category below to browse products in retail and wholesale quantities.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 space-y-20">
        {categories.map((cat, idx) => {
          const meta = getCategoryMeta(cat.name);
          const catProducts = products.filter((p) => p.category_id === cat.id);
          const isReversed = idx % 2 === 1;

          return (
            <div
              key={cat.id}
              className="space-y-10 border-t border-border pt-14 first:border-t-0 first:pt-0 animate-fade-up"
            >
              <div className="grid gap-8 lg:grid-cols-12 items-center">
                <div className={`lg:col-span-5 space-y-4 ${isReversed ? "lg:order-2" : ""}`}>
                  <h2 className="font-display text-3xl sm:text-4xl font-normal text-foreground">
                    {cat.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                  <div className="pt-2">
                    <Link
                      to={`/category/${cat.id}` as any}
                      className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:opacity-95 transition"
                    >
                      Shop {cat.name} ({catProducts.length}) <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className={`lg:col-span-7 ${isReversed ? "lg:order-1" : ""}`}>
                  <Link
                    to={`/category/${cat.id}` as any}
                    className="group block relative aspect-[16/9] overflow-hidden bg-muted border border-border"
                  >
                    {cat.image_url && (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {catProducts.slice(0, 4).map((p) => (
                    <ModernProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onQuickView={handleQuickView}
                      onToggleWishlist={toggleWishlist}
                      wishlist={wishlist}
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
