import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Award } from "lucide-react";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
} from "../components/store-layout";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Partner Brands — Nadeem Traders" },
      { name: "description", content: "Explore products filtered by authentic Pakistani brands." },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const { categories, products, brands, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const brandNames = useMemo(() => {
    const fromDb = brands.map((b) => b.name);
    const fromProds = products.map((p) => p.brand);
    return Array.from(new Set([...fromDb, ...fromProds]));
  }, [brands, products]);

  const filteredProducts = selectedBrand
    ? products.filter((p) => p.brand === selectedBrand)
    : products;

  const handleAddToCart = (product: any, qty: number = 1) => {
    if (!currentUser) {
      toast.error("Please sign in to start shopping.");
      window.location.href = `/login?redirect=/brands`;
      return;
    }
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty}× ${product.name} to cart`);
  };

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      quickViewProduct={quickViewProduct}
      setQuickViewProduct={setQuickViewProduct}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Award className="h-3.5 w-3.5" /> Partner Producers
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
            Shop by Brand
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Select a producer or distributor below to filter catalog items.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedBrand(null)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              selectedBrand === null
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All Brands ({products.length})
          </button>
          {brandNames.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBrand(selectedBrand === b ? null : b)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedBrand === b
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map((p) => (
            <ModernProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onQuickView={setQuickViewProduct}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
