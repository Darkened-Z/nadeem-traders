import { Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { ShoppingBag, Search, Plus, Minus, X, Check, Menu, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  getCategories,
  getProducts,
  getBrands,
  getStoreSettings,
  createOrder,
  validateCoupon,
  restoreSession,
  clearCartDb,
  getUserAddresses,
} from "../lib/actions";
import {
  DEFAULT_STORE_SETTINGS,
  sanitizeWhatsappNumber,
  calculateDeliveryFee,
  type StoreSettings,
} from "../lib/store-settings";
import {
  useCart,
  cartStore,
  subscribeCartDrawer,
  subscribeCheckoutModal,
  openCartDrawer,
} from "../lib/cart-store";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS, productOptions, optionView, cleanProductTitle } from "../lib/catalog";
import { track, identifyCustomer } from "../lib/analytics";
export { cleanProductTitle };

export const WHATSAPP_NUMBER = DEFAULT_STORE_SETTINGS.whatsapp_number;

let cachedStoreSettings: StoreSettings = DEFAULT_STORE_SETTINGS;
const storeSettingsListeners = new Set<(s: StoreSettings) => void>();
let storeSettingsFetch: Promise<StoreSettings> | null = null;

function publishStoreSettings(next: StoreSettings) {
  cachedStoreSettings = next;
  storeSettingsListeners.forEach((cb) => cb(next));
}

function loadStoreSettingsOnce(): Promise<StoreSettings> {
  if (!storeSettingsFetch) {
    storeSettingsFetch = getStoreSettings()
      .then((res) => {
        const merged: StoreSettings = { ...DEFAULT_STORE_SETTINGS, ...res };
        publishStoreSettings(merged);
        return merged;
      })
      .catch(() => cachedStoreSettings)
      .finally(() => {
        storeSettingsFetch = null;
      });
  }
  return storeSettingsFetch;
}

const StoreSettingsContext = createContext<StoreSettings>(DEFAULT_STORE_SETTINGS);

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}

export interface CategoryMeta {
  slug: string;
  color: string;
  tagline: string;
}

export const CATEGORY_METADATA: Record<string, CategoryMeta> = {
  "Dry Fruits": {
    slug: "dry-fruits",
    color: "#0B4A36",
    tagline: "Rozana Ki Tawanai. Duniya Bhar Ke Behtareen Dry Fruits.",
  },
  Seeds: {
    slug: "seeds",
    color: "#14563F",
    tagline: "Chotay Seeds, Achi Immunity.",
  },
  Spices: {
    slug: "spices",
    color: "#0E3D2E",
    tagline: "Khalis Masalay, Asli Zaiqa. Zero Artificial Rang.",
  },
  "Whole Spices": {
    slug: "whole-spices",
    color: "#175E46",
    tagline: "Sabut Masalay, Poori Khushboo. Daig Ka Asli Raaz.",
  },
  "Special Items": {
    slug: "special-items",
    color: "#09392A",
    tagline: "Healthy Choices, Roz Ke Liye.",
  },
};

const FALLBACK_COLORS = ["#0B4A36", "#0E3D2E", "#14563F", "#09392A", "#175E46"];

export function getCategoryMeta(name: string): CategoryMeta {
  if (CATEGORY_METADATA[name]) return CATEGORY_METADATA[name];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return {
    slug,
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
    tagline: `Asli ${name}, Sahi Daam.`,
  };
}

export const DEFAULT_CATEGORIES = CATALOG_CATEGORIES;
export const DEFAULT_PRODUCTS = CATALOG_PRODUCTS;

export function addToBag(product: any, qty = 1) {
  cartStore.addToCart(product, qty);
  window.dispatchEvent(new Event("bag:add"));
  toast.success(`${qty}× ${product.name} bag mein`, {
    action: { label: "View bag", onClick: openCartDrawer },
  });
}

export function useStoreData() {
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<any[]>(DEFAULT_PRODUCTS);
  const [brands, setBrands] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(cachedStoreSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onSettings = (next: StoreSettings) => setStoreSettings(next);
    storeSettingsListeners.add(onSettings);
    return () => {
      storeSettingsListeners.delete(onSettings);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const [cats, prods, brs, settings] = await Promise.all([
          getCategories(),
          getProducts(),
          getBrands(),
          loadStoreSettingsOnce(),
        ]);
        if (!mounted) return;
        if (cats && cats.length > 0) setCategories(cats);
        if (prods && prods.length > 0) setProducts(prods);
        if (brs && brs.length > 0) setBrands(brs);
        if (settings) setStoreSettings(settings);
      } catch (e) {
        console.error("Using default catalog:", e);
      } finally {
        if (mounted) setIsLoading(false);
      }

      try {
        const session = await restoreSession();
        if (session && session.success && mounted) {
          setCurrentUser(session.user);
          identifyCustomer(session.user);
        }
      } catch {}

      await cartStore.load();
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, products, brands, currentUser, isLoading, storeSettings };
}

export function ModernProductCard({ product }: { product: any }) {
  const settings = useStoreSettings();
  const classifications = productOptions(product);
  const [selectedVariant, setSelectedVariant] = useState(classifications[0]?.name || "");
  const [justAdded, setJustAdded] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displayName = cleanProductTitle(product.name);
  const view = optionView(product, selectedVariant);
  const imageSrc = view.image_url;

  useEffect(() => {
    setSelectedVariant(classifications[0]?.name || "");
    setFailedSrc(null);
  }, [product?.id]);

  useEffect(() => {
    setFailedSrc(null);
  }, [selectedVariant]);

  const handleAdd = () => {
    if (!product.stock || view.price == null) return;
    const baseName = displayName || product.name;
    const sold = { ...product, price: view.price, weight: view.weight, image_url: view.image_url };
    const itemToAdd = selectedVariant
      ? { ...sold, name: `${baseName} (${selectedVariant})`, variant: selectedVariant }
      : { ...sold, name: baseName };
    addToBag(itemToAdd, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div data-reveal className="flex flex-col transition-transform duration-300 hover:-translate-y-1">
      <Link
        to={`/product/${product.id}` as any}
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-muted"
      >
        {imageSrc && imageSrc !== failedSrc ? (
          imageSrc.startsWith("data:") ? (
            <img
              src={imageSrc}
              alt={selectedVariant ? `${displayName} (${selectedVariant})` : displayName}
              loading="lazy"
              onError={() => setFailedSrc(imageSrc)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <picture key={imageSrc}>
              <source
                srcSet={imageSrc.replace(/\.jpe?g$/, ".webp")}
                type="image/webp"
              />
              <img
                src={imageSrc}
                alt={selectedVariant ? `${displayName} (${selectedVariant})` : displayName}
                loading="lazy"
                onError={() => setFailedSrc(imageSrc)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                draggable={false}
              />
            </picture>
          )
        ) : (
          <div className="grid h-full w-full place-items-center">
            <img src="/LOGO.png" alt="" className="h-14 w-14 object-contain opacity-60 pointer-events-none select-none" draggable={false} />
          </div>
        )}
        {!product.stock && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <span className="text-xs font-semibold text-foreground">Out of stock</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-2.5">
        <Link
          to={`/product/${product.id}` as any}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline underline-offset-2"
        >
          {displayName}
        </Link>
        {product.name_ur && (
          <p lang="ur" dir="rtl" className="font-urdu mt-1 text-right text-base text-foreground/80">
            {product.name_ur}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[product.origin, view.weight].filter(Boolean).join(" · ")}
        </p>

        {classifications.length > 0 && (
          <div className="mt-2 flex gap-1 rounded bg-muted/70 p-0.5" role="group" aria-label="Classification">
            {classifications.map((c) => {
              const isSel = selectedVariant === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(c.name);
                    track("option_selected", { product_id: product.id, product_name: product.name, option: c.name, where: "card" });
                  }}
                  className={`flex-1 rounded py-1 px-1.5 text-center text-[10px] font-medium transition-colors ${
                    isSel
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={`${c.name} (${c.name_ur})`}
                >
                  <span className="truncate block">{c.short_name || c.name.split("/")[0].trim()}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          {view.price != null ? (
            <>
              <span className="text-sm font-semibold text-foreground">
                Rs. {Number(view.price).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!product.stock}
                aria-label={`Add ${product.name} to bag`}
                className="inline-flex h-9 min-w-[3.25rem] items-center justify-center gap-1 btn-gold-outline px-3 text-xs font-semibold text-foreground disabled:opacity-40"
              >
                {justAdded ? <Check className="h-4 w-4 animate-pop" /> : "Add"}
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-foreground">Rate Poochein</span>
              <a
                href={rateLink(product, selectedVariant || undefined, settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ask rate for ${product.name} on WhatsApp`}
                className="inline-flex h-9 items-center justify-center bg-[#25D366] px-3 text-xs font-semibold text-[#0B3D1F] transition-opacity hover:opacity-90"
              >
                WhatsApp
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function rateLink(product: any, variant?: string, whatsappNumber?: string) {
  const label = variant ? `${product.name} (${variant})` : product.name;
  const phone = sanitizeWhatsappNumber(whatsappNumber ?? cachedStoreSettings.whatsapp_number);
  return `https://wa.me/${phone}?text=${encodeURIComponent(
    `Assalam o Alaikum! Mujhe ${label} ka rate bata dein.`,
  )}`;
}

export function CategoryTile({ category }: { category: any }) {
  const meta = getCategoryMeta(category.name);
  const [imgError, setImgError] = useState(false);
  return (
    <Link data-reveal to={`/category/${category.id}` as any} className="group flex w-full flex-col overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: categoryTint(meta.color) }}>
        {category.image_url && !imgError ? (
          category.image_url.startsWith("data:") ? (
            <img
              src={category.image_url}
              alt={category.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <picture>
              <source
                srcSet={category.image_url.replace(/\.jpe?g$/, ".webp")}
                type="image/webp"
              />
              <img
                src={category.image_url}
                alt={category.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                draggable={false}
              />
            </picture>
          )
        ) : (
          <div className="grid h-full w-full place-items-center">
            <img src="/LOGO.png" alt="" className="h-14 w-14 object-contain opacity-60 pointer-events-none select-none" draggable={false} />
          </div>
        )}
      </div>
      <div
        className="flex flex-1 items-center justify-between gap-2 px-3 py-3 sm:px-4 text-white"
        style={{ backgroundColor: meta.color }}
      >
        <span className="min-w-0">
          <span className="block text-sm sm:text-base font-semibold leading-tight">{category.name}</span>
          {category.name_ur && (
            <span lang="ur" className="font-urdu block text-xs text-gold-light sm:text-sm">
              {category.name_ur}
            </span>
          )}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export const stagger = (i: number) => ({ "--d": i }) as React.CSSProperties;

const railClass =
  "-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0";

export function ProductRail({
  products,
  railRef,
}: {
  products: any[];
  railRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = railRef || internalRef;

  // overflow-x-auto alone also makes the y-axis scrollable, so a hover lift on a card turns the rail
  // into a vertical scroller that captures the mouse wheel; overflow-y-hidden lets the wheel reach the page.
  return (
    <div
      ref={ref}
      className="-mx-4 flex snap-x snap-mandatory sm:snap-none scroll-pl-4 gap-3 overflow-x-auto overflow-y-hidden px-4 pb-2 pt-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-5 sm:px-0"
    >
      {products.map((item, i) => (
        <div
          key={item.id}
          className="w-[72%] shrink-0 snap-start sm:w-[46%] md:w-[31%] lg:w-[23.5%]"
          style={stagger(i)}
        >
          <ModernProductCard product={item} />
        </div>
      ))}
    </div>
  );
}

export const categoryTint = (color: string) => `color-mix(in srgb, ${color} 14%, #f8f4ea)`;

export function CategorySection({ category, items }: { category: any; items: any[] }) {
  const meta = getCategoryMeta(category.name);
  const railRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    railRef.current?.scrollBy({ left: -340, behavior: "smooth" });
  };
  const scrollRight = () => {
    railRef.current?.scrollBy({ left: 340, behavior: "smooth" });
  };

  return (
    <section
      className="stack-section sticky top-14 py-10 sm:top-16 sm:py-14"
      style={{ backgroundColor: categoryTint(meta.color) }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          title={category.name}
          subtitle={meta.tagline}
          href={`/category/${category.id}`}
          accent={meta.color}
          showSwipeHint
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
        />
        <ProductRail products={items} railRef={railRef} />
      </div>
    </section>
  );
}

export function CategoryRail({ categories }: { categories: any[] }) {
  return (
    <div className={`${railClass} lg:grid-cols-3`}>
      {categories.map((cat, i) => (
        <div key={cat.id} className="flex w-[40%] shrink-0 snap-start sm:w-auto" style={stagger(i)}>
          <CategoryTile category={cat} />
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  href,
  accent,
  showSwipeHint,
  onScrollLeft,
  onScrollRight,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  accent?: string;
  showSwipeHint?: boolean;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
}) {
  return (
    <div data-reveal className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h2 className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl" style={{ color: accent }}>
            {title}
          </h2>
          {showSwipeHint && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide sm:text-sm shadow-2xs border"
              style={{
                backgroundColor: accent ? `color-mix(in srgb, ${accent} 12%, #ffffff)` : "rgba(0,0,0,0.05)",
                borderColor: accent ? `color-mix(in srgb, ${accent} 25%, transparent)` : "rgba(0,0,0,0.1)",
                color: accent || "inherit",
              }}
            >
              <span>Swipe left</span>
              <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0 pb-1">
        {(onScrollLeft || onScrollRight) && (
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={onScrollLeft}
              aria-label="Scroll left"
              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/80 backdrop-blur text-foreground shadow-2xs hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onScrollRight}
              aria-label="Scroll right"
              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/80 backdrop-blur text-foreground shadow-2xs hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {href && (
          <Link
            to={href as any}
            className="text-sm font-semibold underline underline-offset-4"
            style={{ color: accent }}
          >
            See All
          </Link>
        )}
      </div>
    </div>
  );
}

export function StoreLayout({
  children,
  categories = DEFAULT_CATEGORIES,
  products = DEFAULT_PRODUCTS,
  currentUser = null,
  storeSettings: propSettings,
}: {
  children: ReactNode;
  categories?: any[];
  products?: any[];
  currentUser?: any;
  storeSettings?: StoreSettings;
}) {
  const cart = useCart();
  const [settings, setSettings] = useState<StoreSettings>(propSettings ?? cachedStoreSettings);
  const whatsappNumber = sanitizeWhatsappNumber(settings.whatsapp_number);

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
      return;
    }
    const onSettings = (next: StoreSettings) => setSettings(next);
    storeSettingsListeners.add(onSettings);
    loadStoreSettingsOnce();
    return () => {
      storeSettingsListeners.delete(onSettings);
    };
  }, [propSettings]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubCart = subscribeCartDrawer((open) => setIsCartOpen(open));
    const unsubCheckout = subscribeCheckoutModal((open) => setIsCheckoutOpen(open));
    return () => {
      unsubCart();
      unsubCheckout();
    };
  }, []);

  useEffect(() => {
    if (isCartOpen) track("cart_viewed", { items: cart.length });
  }, [isCartOpen]);

  useEffect(() => {
    if (isCheckoutOpen) track("checkout_started", { items: cart.length });
  }, [isCheckoutOpen]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [bagBump, setBagBump] = useState(0);
  useEffect(() => {
    const onAdd = () => setBagBump((n) => n + 1);
    window.addEventListener("bag:add", onAdd);
    return () => window.removeEventListener("bag:add", onAdd);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("reveal-on");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "60px", threshold: 0.01 },
    );
    document.querySelectorAll("[data-reveal]:not(.revealed)").forEach((el) => {
      io.observe(el);
    });
    return () => {
      io.disconnect();
      root.classList.remove("reveal-on");
    };
  }, []);

  const searchResults = searchQuery.trim()
    ? products
        .filter((item) => {
          const q = searchQuery.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            (item.name_ur && item.name_ur.includes(searchQuery.trim())) ||
            (item.category_name && item.category_name.toLowerCase().includes(q))
          );
        })
        .slice(0, 6)
    : [];

  const [checkoutForm, setCheckoutForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone_number || "",
    address: "",
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const lastCheckoutField = useRef<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percent: number;
    discount_amount: number;
  } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setCheckoutForm((prev) => ({
      ...prev,
      name: prev.name || currentUser.name || "",
      email: prev.email || currentUser.email || "",
      phone: prev.phone || currentUser.phone_number || "",
    }));
    getUserAddresses()
      .then((addrs) => {
        const def = addrs.find((a: any) => a.is_default) || addrs[0];
        if (def) {
          const fullAddr = `${def.address_line1}, ${def.address_line2 ? def.address_line2 + ", " : ""}${def.city}, ${def.state} - ${def.postal_code}`;
          setCheckoutForm((prev) => ({ ...prev, address: prev.address || fullAddr }));
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const deliveryFee = calculateDeliveryFee(subtotal, settings);
  const finalTotal = Math.max(0, subtotal - discountAmount) + deliveryFee;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsCheckingCoupon(true);
    try {
      const res = await validateCoupon({
        data: { code: couponInput.trim(), items: cart.map((item) => ({ product_id: item.id, variant: item.variant, quantity: item.quantity })) },
      });
      track(res.valid ? "coupon_applied" : "coupon_rejected", {
        code: couponInput.trim().toUpperCase(),
        discount: res.valid ? res.discount_amount : null,
        reason: res.valid ? null : res.message,
      });
      if (res.valid) {
        setAppliedCoupon({
          code: res.code!,
          discount_percent: res.discount_percent!,
          discount_amount: res.discount_amount!,
        });
        toast.success(res.message);
      } else {
        toast.error(res.message || "Invalid coupon code");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to validate coupon");
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsSubmittingOrder(true);
    track("checkout_submitted", { items: cart.length, coupon: appliedCoupon?.code ?? null });
    try {
      const result = await createOrder({
        data: {
          customer_name: checkoutForm.name,
          customer_email: checkoutForm.email,
          customer_phone: checkoutForm.phone,
          shipping_address: checkoutForm.address,
          coupon_code: appliedCoupon?.code,
          items: cart.map((item) => ({ product_id: item.id, variant: item.variant, quantity: item.quantity })),
        },
      });
      setCreatedOrderId(result.id);
      track("order_placed", {
        order_id: result.id,
        items: cart.length,
        total: result.total_amount ?? finalTotal,
        products: cart.map((item) => ({ id: item.id, name: item.name, variant: item.variant, quantity: item.quantity, price: item.price })),
      });
      clearCartDb().catch(() => {});
      cartStore.clearCartLocal();
      setAppliedCoupon(null);
      setCouponInput("");
    } catch (err) {
      console.error(err);
      track("order_failed", { reason: err instanceof Error ? err.message : "unknown" });
      toast.error(err instanceof Error && err.message ? err.message : "Order nahi ho saka. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  // Records which field a shopper left the checkout on; values are never sent, only whether each was filled.
  const checkoutAbandoned = (how: string) =>
    track("checkout_abandoned", {
      how,
      last_field: lastCheckoutField.current,
      filled_name: !!checkoutForm.name.trim(),
      filled_phone: !!checkoutForm.phone.trim(),
      filled_email: !!checkoutForm.email.trim(),
      filled_address: !!checkoutForm.address.trim(),
      items: cart.length,
    });

  useEffect(() => {
    if (!isCheckoutOpen || createdOrderId) return;
    const onLeave = () => checkoutAbandoned("left_page");
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  });

  const closeCheckout = () => {
    if (!createdOrderId) checkoutAbandoned("closed");
    lastCheckoutField.current = null;
    setIsCheckoutOpen(false);
    setCreatedOrderId(null);
  };

  const inputClass =
    "mt-1.5 w-full border border-border bg-card px-3 py-3 text-base sm:text-sm focus:border-foreground focus:outline-none";

  return (
    <StoreSettingsContext.Provider value={settings}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {settings.announcement_text?.trim() && (
          <div className="bg-emerald-deep px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-gold-light">
            {settings.announcement_text}
          </div>
        )}
        <header
        className={`sticky top-0 z-40 border-b border-gold/25 bg-primary text-primary-foreground transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_28px_-14px_rgba(7,46,34,0.6)]" : ""
        }`}
      >
        <div className="scroll-progress absolute inset-x-0 -bottom-px h-0.5 bg-gold" aria-hidden="true" />
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center gap-2 px-3 sm:px-6">
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen(true)}
            className="grid h-10 w-10 place-items-center lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src="/LOGO.png" alt="" className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0" />
            <span className="font-display text-xl sm:text-2xl font-semibold leading-none whitespace-nowrap">
              Nadeem Traders
            </span>
          </Link>

          <nav className="ml-10 hidden items-center gap-7 text-sm lg:flex">
            <Link to="/categories" className="transition-colors hover:text-gold-light">
              Categories
            </Link>
            <Link to="/shop" className="transition-colors hover:text-gold-light">
              All products
            </Link>
            <Link to="/contact" className="transition-colors hover:text-gold-light">
              Contact
            </Link>
          </nav>

          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="grid h-10 w-10 place-items-center"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative grid h-10 w-10 place-items-center"
              aria-label={`Bag, ${totalItems} items`}
            >
              <ShoppingBag key={bagBump} className={`h-5 w-5 ${bagBump ? "animate-bump" : ""}`} />
              {totalItems > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-gold-foreground">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="border-t border-gold/20 bg-emerald-deep px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-2xl">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border-b border-gold pb-2">
                <Search className="h-4 w-4 shrink-0 text-gold-light" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kya Dhoond Rahe Ho? Badaam, Zeera, Chia…"
                  className="w-full bg-transparent text-base placeholder:text-primary-foreground/55 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>

              {searchQuery.trim() && (
                <div className="mt-2 divide-y divide-border">
                  {searchResults.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">"{searchQuery}" nahi mila.</p>
                  ) : (
                    searchResults.map((item) => (
                      <Link
                        key={item.id}
                        to={`/product/${item.id}` as any}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden bg-muted">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[item.origin, item.weight].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">
                          {item.price != null ? `Rs. ${Number(item.price).toLocaleString()}` : "Rate Poochein"}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setIsNavDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col overflow-y-auto bg-background animate-slide-in-left">
            <div className="flex h-14 items-center justify-between bg-primary px-4 text-primary-foreground">
              <span className="font-display text-xl font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(false)}
                className="grid h-10 w-10 place-items-center"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
              <ul className="mt-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/category/${c.id}` as any}
                      onClick={() => setIsNavDrawerOpen(false)}
                      className="flex items-center gap-3 py-3 text-base"
                    >
                      <span className="h-3 w-3 shrink-0" style={{ backgroundColor: getCategoryMeta(c.name).color }} />
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-4 py-5">
              <ul className="space-y-1 text-base">
                <li>
                  <Link to="/" onClick={() => setIsNavDrawerOpen(false)} className="block py-2.5">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/shop" onClick={() => setIsNavDrawerOpen(false)} className="block py-2.5">
                    All products
                  </Link>
                </li>
                <li>
                  <Link to="/contact" onClick={() => setIsNavDrawerOpen(false)} className="block py-2.5">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="relative border-t-2 border-gold bg-emerald-deep text-[#E9E4D6]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img src="/LOGO.png" alt="" className="h-9 w-9 object-contain" />
                <span className="font-display text-2xl font-semibold text-white">Nadeem Traders</span>
              </div>
              <p className="mt-2 text-sm text-gold">Apka Trusted Stop</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#A8BDB2]">
                Duniya Bhar Se Chun Kar, Aapke Kitchen Tak. Asli Maal, Sahi Daam.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Shop</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#A8BDB2]">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.id}` as any} className="hover:text-white">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Help</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#A8BDB2]">
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/delivery-info" className="hover:text-white">Delivery Info</Link></li>
                <li><Link to="/help" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white">Refunds</Link></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="text-sm font-semibold text-white">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#A8BDB2]">
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms-of-use" className="hover:text-white">Terms Of Use</Link></li>
                <li><Link to="/shipping-policy" className="hover:text-white">Shipping Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5 text-xs text-[#7C978A]">
            © {new Date().getFullYear()} Nadeem Traders. Cash On Delivery Across Pakistan.
          </div>
        </div>
      </footer>

      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background animate-slide-in-right">
            <div className="flex h-14 sm:h-16 items-center justify-between border-b border-border px-4 sm:px-6">
              <h2 className="font-display text-2xl font-semibold">
                Your Bag <span className="text-base font-normal text-muted-foreground">({totalItems})</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="grid h-10 w-10 place-items-center"
                aria-label="Close bag"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6">
              {cart.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center text-center">
                  <p className="font-display text-2xl">Bag Khaali Hai</p>
                  <p className="mt-1 text-sm text-muted-foreground">Kuch Acha Sa Daal Do.</p>
                  <Link
                    to="/shop"
                    onClick={() => setIsCartOpen(false)}
                    className="btn-gold mt-5 px-6 py-3 text-sm font-semibold"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.key} className="flex gap-3 border-b border-border py-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden bg-muted">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-medium">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.weight}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cartStore.removeFromCart(item.key)}
                          className="-mr-2 -mt-1 grid h-8 w-8 shrink-0 place-items-center text-muted-foreground"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center border border-border">
                          <button
                            type="button"
                            onClick={() => cartStore.updateQuantity(item.key, -1)}
                            className="grid h-9 w-9 place-items-center"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => cartStore.updateQuantity(item.key, 1)}
                            className="grid h-9 w-9 place-items-center"
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t border-border p-4 sm:p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="btn-gold w-full py-3.5 text-sm font-semibold"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={closeCheckout} />
          <div className="relative max-h-[92svh] w-full overflow-y-auto bg-background p-5 sm:max-w-lg sm:p-8 animate-scale-in">
            <button
              type="button"
              onClick={closeCheckout}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center"
              aria-label="Close checkout"
            >
              <X className="h-5 w-5" />
            </button>

            {createdOrderId ? (
              <div className="py-6 text-center">
                <h3 className="font-display text-3xl font-semibold">Order #{createdOrderId} confirmed</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                  Shukriya! Confirmation <strong className="text-foreground">{checkoutForm.email}</strong> pe bhej di
                  hai. Dispatch hote hi tracking SMS aa jayega.
                </p>
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="btn-gold mt-6 w-full py-3.5 text-sm font-semibold sm:w-auto sm:px-10"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-semibold">Checkout</h3>
                <form
                  onSubmit={handlePlaceOrder}
                  onFocus={(e) => {
                    const el = e.target as Element as HTMLInputElement;
                    lastCheckoutField.current =
                      el.tagName === "TEXTAREA" ? "address" : el.type === "tel" ? "phone" : el.type === "email" ? "email" : /SAVE10/.test(el.placeholder) ? "coupon" : el.type === "text" ? "name" : el.type;
                  }}
                  className="mt-5 space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Full name
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Phone
                      <input
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="03XX XXXXXXX"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="block text-sm font-medium">
                    Email
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Address
                    <textarea
                      required
                      rows={3}
                      autoComplete="street-address"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="House #, street, area, city"
                      className={`${inputClass} resize-none`}
                    />
                  </label>

                  {/* Promo / Discount Coupon */}
                  <div className="rounded-lg border border-border bg-card p-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Discount Coupon Code
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-emerald-700/80 dark:text-emerald-300/80">
                            ({appliedCoupon.discount_percent}% OFF · -Rs. {appliedCoupon.discount_amount.toLocaleString()})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs text-red-600 hover:underline font-semibold"
                        >
                          Hatao
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Code darj karein (e.g. SAVE10)"
                          className="flex-1 border border-border bg-background px-3 py-2 text-xs uppercase placeholder:normal-case focus:border-foreground focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isCheckingCoupon || !couponInput.trim()}
                          className="bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-40"
                        >
                          {isCheckingCoupon ? "Checking…" : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <strong className="font-semibold text-foreground">Cash On Delivery:</strong> Pay At Doorstep.
                    </p>
                    <p>Across Pakistan via PostEx Courier with SMS Tracking.</p>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground">In Faisalabad:</span> Doorstep Delivery via inDrive &amp; Yango.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-4">
                    <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span>Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-baseline justify-between text-sm text-emerald-600 font-medium">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>- Rs. {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                      <span>Delivery</span>
                      <span>{deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee.toLocaleString()}`}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-sm font-semibold">Total (Cash on Delivery)</span>
                      <span className="text-xl font-bold">Rs. {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="btn-gold w-full py-3.5 text-sm font-semibold disabled:opacity-50"
                  >
                    {isSubmittingOrder ? "Placing order…" : "Place Order"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Assalam o Alaikum Nadeem Traders, I need help with an order.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="wa-pulse fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:px-5 sm:py-3.5"
      >
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden text-sm font-semibold sm:inline">WhatsApp us</span>
      </a>
      </div>
    </StoreSettingsContext.Provider>
  );
}
