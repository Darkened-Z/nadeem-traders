import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Minus, Loader2, ChevronLeft } from "lucide-react";
import { recordRecentlyViewedDb } from "../lib/actions";
import { cartStore, openCheckoutModal } from "../lib/cart-store";
import {
  StoreLayout,
  ProductRail,
  useStoreData,
  getCategoryMeta,
  addToBag,
  rateLink,
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

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
          <h1 className="font-display text-3xl font-semibold">Product Nahi Mila</h1>
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
            {product.image_url && product.image_url !== failedSrc ? (
              <img
                src={product.image_url}
                alt={product.name}
                ref={(el) => {
                  if (el?.complete && el.naturalWidth === 0) setFailedSrc(product.image_url);
                }}
                onError={() => setFailedSrc(product.image_url)}
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
            {product.name_ur && (
              <p lang="ur" dir="rtl" className="font-urdu mt-2 text-right text-2xl text-foreground/85 md:text-left">
                {product.name_ur}
              </p>
            )}
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {product.origin && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Origin</dt>
                  <dd className="font-semibold">{product.origin}</dd>
                </div>
              )}
              {product.weight && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Pack</dt>
                  <dd className="font-semibold">{product.weight}</dd>
                </div>
              )}
            </dl>

            {product.price != null ? (
              <>
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
                    {product.stock ? "Add To Bag" : "Out Of Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={buyNow}
                    disabled={!product.stock}
                    className="h-12 bg-foreground text-sm font-semibold text-background disabled:opacity-40"
                  >
                    Buy Now
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  Is Item Ka Rate Quantity Ke Hisaab Se Hai — WhatsApp Karo, Jitna Zyada Saman, Utna Behtar Rate.
                </p>
                <a
                  href={rateLink(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-12 items-center justify-center bg-[#25D366] text-sm font-semibold text-[#0B3D1F]"
                >
                  WhatsApp Pe Rate Poochein
                </a>
              </div>
            )}

            <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
              <li>
                <strong className="font-semibold">No Prepayment, No Dhoka.</strong>{" "}
                <span className="text-muted-foreground">Paise Sirf Delivery Pe.</span>
              </li>
              <li>
                <strong className="font-semibold">Pakistan Bhar Mein Delivery.</strong>{" "}
                <span className="text-muted-foreground">Tracking SMS Dispatch Hote Hi.</span>
              </li>
              <li>
                <strong className="font-semibold">Faisalabad Mein?</strong>{" "}
                <span className="text-muted-foreground">InDrive Ya Yango Se Seedha Ghar.</span>
              </li>
              <li>
                <strong className="font-semibold">Asli Source, Saaf Likha.</strong>{" "}
                <span className="text-muted-foreground">Har Item Ka Origin Aapke Saamne.</span>
              </li>
            </ul>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-14 border-t border-border pt-8">
            <h2 className="font-display text-3xl font-semibold">Isse Bhi Try Karo</h2>
            <div className="mt-6">
              <ProductRail products={relatedProducts} />
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
