import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  Minus,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { recordRecentlyViewedDb } from "../lib/actions";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
} from "../components/store-layout";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product Details | Nadeem Traders" },
      { name: "description", content: "View retail and wholesale rates." },
    ],
  }),
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { productId } = Route.useParams() as any;
  const { categories, products, currentUser, wishlist, toggleWishlist, isLoading } = useStoreData();
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);

  const product = products.find((p) => p.id === Number(productId)) || null;
  const relatedProducts = product
    ? products.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
    : [];

  useEffect(() => {
    if (!product) return;
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  }, [product?.id]);

  const handleAddToCart = (item = product, quantity = qty) => {
    if (!item) return;
    if (!currentUser) {
      toast.error("Please sign in to add items to your bag.");
      window.location.href = `/login?redirect=/product/${productId}`;
      return;
    }
    cartStore.addToCart(item, quantity);
    toast.success(`Added ${quantity}× ${item.name} to your bag`);
  };

  if (isLoading && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <StoreLayout categories={categories} products={products} currentUser={currentUser}>
        <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-4">
          <h1 className="font-display text-3xl font-normal">Product Not Found</h1>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/shop"
              className="bg-primary px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const isWholesaleAvailable = !!product.wholesale_price;
  const isBulkRateApplied = isWholesaleAvailable && qty >= (product.wholesale_min_qty || 5);
  const activePrice = isBulkRateApplied ? product.wholesale_price : product.price;
  const isWishlisted = wishlist.some((w) => w.id === product.id);

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      activeCategoryId={product.category_id}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 space-y-16">
        <nav className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categories" className="hover:text-foreground">
            Categories
          </Link>
          {product.category_id && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                to={`/category/${product.category_id}` as any}
                className="hover:text-foreground"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 border border-border bg-card p-6 sm:p-10">
          <div className="aspect-[4/5] overflow-hidden bg-muted flex items-center justify-center">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-8xl">{product.emoji || "🌾"}</span>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-secondary">
                {product.category_name}
              </p>

              <h1 className="font-display text-3xl sm:text-4xl font-normal text-foreground">
                {product.name}
              </h1>

              <p className="text-xs text-muted-foreground">
                {product.brand} &nbsp;|&nbsp; {product.weight}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <div
                  onClick={() => setQty(1)}
                  className={`cursor-pointer border p-4 transition ${
                    !isBulkRateApplied
                      ? "border-foreground bg-background"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider block">
                    Retail Price
                  </span>
                  <div className="mt-1 font-display text-2xl font-medium text-foreground">
                    Rs. {Number(product.price).toLocaleString()}
                  </div>
                </div>

                {isWholesaleAvailable && (
                  <div
                    onClick={() => setQty(product.wholesale_min_qty || 5)}
                    className={`cursor-pointer border p-4 transition ${
                      isBulkRateApplied
                        ? "border-foreground bg-background"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-secondary block">
                      Wholesale ({product.wholesale_min_qty || 5}+ units)
                    </span>
                    <div className="mt-1 font-display text-2xl font-medium text-foreground">
                      Rs. {Number(product.wholesale_price).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center border border-border bg-background">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 text-xs font-medium">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3.5 py-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <span className="font-display text-2xl font-medium text-foreground">
                  Rs. {(activePrice * qty).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product, qty)}
                  disabled={!product.stock}
                  className="flex-1 bg-primary py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:opacity-95 disabled:opacity-50"
                >
                  {product.stock ? "Add to Bag" : "Out of Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="border border-border px-4 py-3.5 text-foreground hover:border-foreground"
                  aria-label="Toggle Wishlist"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-600 text-rose-600" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="border-t border-border pt-12 space-y-6">
            <h2 className="font-display text-2xl font-normal text-foreground">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <ModernProductCard
                  key={rp.id}
                  product={rp}
                  onAddToCart={(item, q) => handleAddToCart(item, q)}
                  onToggleWishlist={toggleWishlist}
                  wishlist={wishlist}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
