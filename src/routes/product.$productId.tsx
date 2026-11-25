import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Minus, Loader2, ChevronLeft, MapPin, ShieldCheck, Truck } from "lucide-react";
import { recordRecentlyViewedDb } from "../lib/actions";
import { cartStore, openCheckoutModal } from "../lib/cart-store";
import { getProductDetailInfo } from "../lib/product-descriptions";
import { productOptions, optionView } from "../lib/catalog";
import {
  StoreLayout,
  ProductRail,
  useStoreData,
  getCategoryMeta,
  addToBag,
  rateLink,
  cleanProductTitle,
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
  const classifications = productOptions(product);
  const [selectedVariant, setSelectedVariant] = useState(classifications[0]?.name || "");

  const relatedProducts = product
    ? products.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
    : [];

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setSelectedVariant(classifications[0]?.name || "");
    setFailedSrc(null);
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    setFailedSrc(null);
  }, [selectedVariant]);

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
  const displayName = product ? cleanProductTitle(product.name) : "";
  const details = getProductDetailInfo(displayName || product.name);
  const view = optionView(product, selectedVariant);
  const effectivePrice = view.price;
  const effectiveWeight = view.weight || "Standard Pack";
  const canBuy = !!product.stock && effectivePrice != null;
  const effectiveProduct = {
    ...product,
    name: displayName || product.name,
    price: effectivePrice,
    weight: effectiveWeight,
    image_url: view.image_url,
  };

  const imageSrc = view.image_url;
  const targetProduct = selectedVariant
    ? { ...effectiveProduct, name: `${displayName || product.name} (${selectedVariant})`, variant: selectedVariant }
    : effectiveProduct;

  const buyNow = () => {
    if (!canBuy) return;
    cartStore.addToCart(targetProduct, qty);
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
          <div className="-mx-4 aspect-[4/3] overflow-hidden bg-muted sm:mx-0">
            {imageSrc && imageSrc !== failedSrc ? (
              imageSrc.startsWith("data:") ? (
                <img
                  src={imageSrc}
                  alt={selectedVariant ? `${displayName || product.name} (${selectedVariant})` : displayName || product.name}
                  ref={(el) => {
                    if (el?.complete && el.naturalWidth === 0) setFailedSrc(imageSrc);
                  }}
                  onError={() => setFailedSrc(imageSrc)}
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
              ) : (
                <picture key={imageSrc}>
                  <source
                    srcSet={imageSrc.replace(/\.jpe?g$/, ".webp")}
                    type="image/webp"
                  />
                  <img
                    src={imageSrc}
                    alt={selectedVariant ? `${displayName || product.name} (${selectedVariant})` : displayName || product.name}
                    ref={(el) => {
                      if (el?.complete && el.naturalWidth === 0) setFailedSrc(imageSrc);
                    }}
                    onError={() => setFailedSrc(imageSrc)}
                    className="h-full w-full object-cover transition-opacity duration-300"
                  />
                </picture>
              )
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
            <h1 className="mt-1 font-display text-4xl font-semibold leading-tight sm:text-5xl">{displayName || product.name}</h1>
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
              {view.weight && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Pack</dt>
                  <dd className="font-semibold">{view.weight}</dd>
                </div>
              )}
            </dl>

            {classifications.length > 0 && (
              <div className="mt-5 border-y border-border py-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  <span>Classification / قسم منتخب کریں:</span>
                  <span className="font-semibold text-foreground">{selectedVariant}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {classifications.map((c) => {
                    const active = selectedVariant === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedVariant(c.name)}
                        className={`flex flex-col items-center justify-center p-3 text-center border transition-all ${
                          active
                            ? "border-foreground bg-foreground text-background shadow-xs font-semibold"
                            : "border-border bg-card text-foreground hover:border-foreground/50"
                        }`}
                      >
                        <span className="text-sm font-semibold">{c.name}</span>
                        <span lang="ur" dir="rtl" className="font-urdu text-xs opacity-80 mt-0.5">
                          {c.name_ur}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing & Cart Controls */}
            <div className="mt-5">
              <div className="flex items-baseline gap-3">
                <p className="font-display text-3xl sm:text-4xl font-semibold">
                  {effectivePrice != null ? `Rs. ${effectivePrice.toLocaleString()}` : "Rate Poochein"}
                </p>
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                  / {effectiveWeight}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="inline-flex items-center border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-11 w-11 place-items-center hover:bg-muted transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-11 w-11 place-items-center hover:bg-muted transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {qty > 1 && effectivePrice != null && (
                  <span className="text-sm text-muted-foreground font-medium">
                    Total: <strong className="text-foreground font-semibold">Rs. {(effectivePrice * qty).toLocaleString()}</strong>
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => addToBag(targetProduct, qty)}
                  disabled={!canBuy}
                  className="h-12 border border-foreground bg-background text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
                >
                  {product.stock ? "Add To Bag" : "Out Of Stock"}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={!canBuy}
                  className="h-12 bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Brand-Level Editorial Description */}
            <div className="mt-7 border-t border-border pt-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A56E]">
                Product Overview &amp; Heritage
              </span>
              <p className="mt-2 text-sm sm:text-base font-serif italic text-foreground leading-relaxed border-l-2 border-[#C5A56E] pl-3">
                "{details.tagline}"
              </p>
              <p className="mt-3 text-xs sm:text-sm text-foreground/80 leading-relaxed font-light">
                {details.description}
              </p>

              {/* Flavor Profile & Culinary Specs */}
              <div className="mt-5 space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C5A56E]" />
                    Flavor &amp; Texture Profile
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground pl-3.5">
                    {details.flavorProfile}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C5A56E]" />
                    Culinary Uses &amp; Pairing Ideas
                  </h3>
                  <ul className="mt-1.5 space-y-1 pl-3.5 text-xs sm:text-sm text-muted-foreground list-disc list-inside">
                    {details.culinaryUses.map((use, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C5A56E]" />
                    Key Health &amp; Nutrition Highlights
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-3.5">
                    {details.healthHighlights.map((hl, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground"
                      >
                        ✓ {hl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/80 pt-3 text-[11px] text-muted-foreground pl-3.5">
                  <strong className="text-foreground">Storage Advice:</strong> {details.storageAdvice}
                </div>
              </div>

              {/* Trust & Dispatch Guarantees */}
              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
                <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C5A56E] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-foreground">100% Purity</strong>
                    <span className="text-[11px] text-muted-foreground">Unadulterated mandi source.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5">
                  <Truck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-foreground">Nationwide COD</strong>
                    <span className="text-[11px] text-muted-foreground">PostEx Courier dispatch.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5">
                  <MapPin className="h-4 w-4 text-foreground shrink-0 mt-0.5 fill-foreground" />
                  <div>
                    <strong className="block font-semibold text-foreground">In Faisalabad</strong>
                    <span className="text-[11px] text-muted-foreground">inDrive &amp; Yango doorstep.</span>
                  </div>
                </div>
              </div>
            </div>
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
