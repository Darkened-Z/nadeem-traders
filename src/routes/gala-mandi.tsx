import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Layers, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
} from "../components/store-layout";

export const Route = createFileRoute("/gala-mandi")({
  head: () => ({
    meta: [
      { title: "Wholesale Gala Mandi Catalog — Nadeem Traders" },
      {
        name: "description",
        content: "Buy bulk spices, flour, rice, and pulses at commercial wholesale mandi prices.",
      },
    ],
  }),
  component: GalaMandiPage,
});

function GalaMandiPage() {
  const { categories, products, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [search, setSearch] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const wholesaleProducts = products.filter(
    (p) =>
      !!p.wholesale_price &&
      (!search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddToCart = (product: any, qty?: number) => {
    if (!currentUser) {
      toast.error("Please sign in to place a wholesale order.");
      window.location.href = "/login?redirect=/gala-mandi";
      return;
    }
    const minQty = qty || product.wholesale_min_qty || 5;
    cartStore.addToCart(product, minQty, true);
    toast.success(`Added ${minQty}× ${product.name} at wholesale rate!`);
  };

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      quickViewProduct={quickViewProduct}
      setQuickViewProduct={setQuickViewProduct}
    >
      <section className="border-b border-border bg-stone-950 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">
              <Layers className="h-3.5 w-3.5" /> Gala Mandi Wholesale Desk
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">
              Commercial Wholesale Catalog
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              Adding any item from this page automatically adds the minimum bulk quantity to unlock mandi wholesale rates.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search wholesale items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {wholesaleProducts.map((p) => (
            <ModernProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onQuickView={setQuickViewProduct}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
              showWholesalePrimary={true}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Need 25kg or 50kg Sacks?
            </h3>
            <p className="text-xs text-muted-foreground">
              Submit a custom requirement list for full mandi sacks and palletized freight.
            </p>
          </div>
          <Link
            to="/bulk-orders"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Request Custom Quote <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
