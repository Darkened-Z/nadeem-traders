import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
} from "../components/store-layout";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Special Offers & Seasonal Discounts — Nadeem Traders" },
      { name: "description", content: "Check out active discounts on atta, spices, rice, and cooking oil." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { categories, products, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const discountedProducts = products.filter(
    (p) => (p.discount && p.discount > 0) || (p.old_price && p.old_price > p.price)
  );
  const displayList = discountedProducts.length > 0 ? discountedProducts : products;

  const handleAddToCart = (product: any, qty: number = 1) => {
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> Promotional Pricing
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
            Seasonal Offers & Bundle Discounts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Direct harvest markdowns on spices, dry fruits, pulses, and cooking oils.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayList.map((p) => (
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
