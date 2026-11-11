import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Minus, Loader2, ChevronLeft } from "lucide-react";
import { recordRecentlyViewedDb } from "../lib/actions";
import { cartStore, openCheckoutModal } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
  getCategoryMeta,
  addToBag,
} from "../components/store-layout";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product | Nadeem Traders" },
      { name: "description", content: "Asli maal, sahi daam. Cash on delivery across Pakistan." },
    ],
  }),
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { productId } = Route.useParams() as any;
  const { categories, products, currentUser, isLoading } = useStoreData();
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);

  const product = products.find((p) => p.id === Number(productId)) || null;
  const relatedProducts = product
    ? products.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
    : [];

  useEffect(() => {
    if (!product) return;
    setQty(1);
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  }, [product?.id]);

  if (isLoading && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <StoreLayout categories={categories} products={products} currentUser={currentUser}>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold">Product nahi mila</h1>
          <Link
            to="/shop"
            className="mt-6 inline-block bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            All products
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const categoryColor = product.category_name ? getCategoryMeta(product.category_name).color : undefined;

  const buyNow = () => {
    cartStore.addToCart(product, qty);
    openCheckoutModal();
  };

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-10">
        {product.category_id && (
          <Link
            to={`/category/${product.category_id}` as any}
            className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> {product.category_name}
          </Link>
        )}

        <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-12">
          <div className="-mx-4 aspect-square overflow-hidden bg-muted sm:mx-0">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <img src="/LOGO.png" alt="" className="h-24 w-24 object-contain opacity-60" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.category_name && (
              <span className="text-sm font-semibold" style={{ color: categoryColor }}>
                {product.category_name}
              </span>
            )}
            <h1 className="mt-1 font-display text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{product.weight}</p>

            <p className="mt-5 text-3xl font-semibold">Rs. {Number(product.price).toLocaleString()}</p>

            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center border border-border">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-12 w-12 place-items-center"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-12 w-12 place-items-center"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {qty > 1 && (
                <span className="text-sm text-muted-foreground">
                  = Rs. {(product.price * qty).toLocaleString()}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addToBag(product, qty)}
                disabled={!product.stock}
                className="h-12 border border-foreground text-sm font-semibold disabled:opacity-40"
              >
                {product.stock ? "Add to bag" : "Out of stock"}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={!product.stock}
                className="h-12 bg-foreground text-sm font-semibold text-background disabled:opacity-40"
              >
                Buy now
              </button>
            </div>

            <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
              <li>
                <strong className="font-semibold">Cash on delivery.</strong>{" "}
                <span className="text-muted-foreground">Pehle maal dekho, phir paise do.</span>
              </li>
              <li>
                <strong className="font-semibold">Nationwide delivery.</strong>{" "}
                <span className="text-muted-foreground">Tracking SMS dispatch hote hi.</span>
              </li>
              <li>
                <strong className="font-semibold">Mandi se direct.</strong>{" "}
                <span className="text-muted-foreground">Saaf, sealed, zero milawat.</span>
              </li>
            </ul>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-14 border-t border-border pt-8">
            <h2 className="font-display text-3xl font-semibold">Isse bhi try karo</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <ModernProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
