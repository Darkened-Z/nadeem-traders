import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Plus,
  Minus,
  X,
  Check,
  Menu,
  ArrowRight,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCategories,
  getProducts,
  getBrands,
  createOrder,
  restoreSession,
  toggleWishlistDb,
  getWishlist,
  clearCartDb,
  getUserAddresses,
} from "../lib/actions";
import {
  useCart,
  cartStore,
  subscribeCartDrawer,
  subscribeCheckoutModal,
  openCartDrawer,
  openCheckoutModal,
} from "../lib/cart-store";

export interface CategoryMeta {
  slug: string;
  description: string;
}

export const CATEGORY_METADATA: Record<string, CategoryMeta> = {
  "Dry Fruits": {
    slug: "dry-fruits",
    description: "Premium almonds, cashews, pumpkin seeds, and hand-picked dry fruits from Apka Trusted Stop.",
  },
  Spices: {
    slug: "spices",
    description: "Whole and finely ground aromatic spices including Kashmiri chilli, turmeric, and cumin. 100% pure kiryana.",
  },
  "Pulses & Lentils": {
    slug: "pulses-lentils",
    description: "Triple-cleaned split lentils and chickpeas including masoor dal and chana dal directly from source.",
  },
  "Rice & Grains": {
    slug: "rice-grains",
    description: "Aged Super Kainat basmati rice and staple grains with authentic fragrance and extra-long grain length.",
  },
  "Cooking Oils": {
    slug: "cooking-oils",
    description: "Light, double-refined sunflower cooking oils and pure cooking essentials for every home.",
  },
  "Sugar & Salt": {
    slug: "sugar-salt",
    description: "Pure white granulated sugar and mineral-rich Himalayan pink salt. Clean, unadulterated quality.",
  },
};

export function getCategoryMeta(name: string): CategoryMeta {
  if (CATEGORY_METADATA[name]) return CATEGORY_METADATA[name];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    slug,
    description: `Premium quality ${name.toLowerCase()} from Apka Trusted Stop.`,
  };
}

export const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: "Dry Fruits",
    icon: "🥜",
    image_url: "/categories/dry-fruits.jpg",
  },
  {
    id: 2,
    name: "Spices",
    icon: "🌶️",
    image_url: "/categories/spices.jpg",
  },
  {
    id: 3,
    name: "Pulses & Lentils",
    icon: "🫘",
    image_url: "/categories/pulses-lentils.jpg",
  },
  {
    id: 4,
    name: "Rice & Grains",
    icon: "🌾",
    image_url: "/categories/rice-grains.jpg",
  },
  {
    id: 5,
    name: "Cooking Oils",
    icon: "🫙",
    image_url: "/categories/cooking-oils.jpg",
  },
  {
    id: 6,
    name: "Sugar & Salt",
    icon: "🧂",
    image_url: "/categories/sugar-salt.jpg",
  },
];

export const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Premium Almonds",
    brand: "Nadeem Traders",
    weight: "500g",
    price: 1800,
    old_price: null,
    wholesale_price: 1620,
    wholesale_min_qty: 5,
    rating: 5.0,
    reviews: 120,
    discount: 0,
    emoji: "🥜",
    stock: true,
    category_id: 1,
    category_name: "Dry Fruits",
    image_url: "/products/almonds.jpg",
  },
  {
    id: 2,
    name: "Pumpkin Seeds",
    brand: "Nadeem Traders",
    weight: "250g",
    price: 650,
    old_price: null,
    wholesale_price: 560,
    wholesale_min_qty: 5,
    rating: 4.9,
    reviews: 85,
    discount: 0,
    emoji: "🌱",
    stock: true,
    category_id: 1,
    category_name: "Dry Fruits",
    image_url: "/products/pumpkin-seeds.jpg",
  },
  {
    id: 3,
    name: "Kashmiri Red Chilli",
    brand: "Nadeem Traders",
    weight: "200g",
    price: 320,
    old_price: null,
    wholesale_price: 275,
    wholesale_min_qty: 10,
    rating: 4.8,
    reviews: 200,
    discount: 0,
    emoji: "🌶️",
    stock: true,
    category_id: 2,
    category_name: "Spices",
    image_url: "/products/red-chilli.jpg",
  },
  {
    id: 4,
    name: "Haldi Powder",
    brand: "Nadeem Traders",
    weight: "200g",
    price: 180,
    old_price: null,
    wholesale_price: 150,
    wholesale_min_qty: 10,
    rating: 4.9,
    reviews: 310,
    discount: 0,
    emoji: "🟡",
    stock: true,
    category_id: 2,
    category_name: "Spices",
    image_url: "/products/haldi-powder.jpg",
  },
  {
    id: 5,
    name: "Masoor Dal",
    brand: "Nadeem Traders",
    weight: "1kg",
    price: 280,
    old_price: null,
    wholesale_price: 245,
    wholesale_min_qty: 10,
    rating: 4.7,
    reviews: 95,
    discount: 0,
    emoji: "🫘",
    stock: true,
    category_id: 3,
    category_name: "Pulses & Lentils",
    image_url: "/products/masoor-dal.jpg",
  },
  {
    id: 6,
    name: "Chana Dal",
    brand: "Nadeem Traders",
    weight: "1kg",
    price: 240,
    old_price: null,
    wholesale_price: 210,
    wholesale_min_qty: 10,
    rating: 4.8,
    reviews: 140,
    discount: 0,
    emoji: "🟤",
    stock: true,
    category_id: 3,
    category_name: "Pulses & Lentils",
    image_url: "/products/chana-dal.jpg",
  },
  {
    id: 7,
    name: "Super Kainat Rice",
    brand: "Nadeem Traders",
    weight: "5kg",
    price: 1650,
    old_price: null,
    wholesale_price: 1480,
    wholesale_min_qty: 5,
    rating: 4.9,
    reviews: 275,
    discount: 0,
    emoji: "🌾",
    stock: true,
    category_id: 4,
    category_name: "Rice & Grains",
    image_url: "/products/kainat-rice.jpg",
  },
  {
    id: 8,
    name: "Cashews Premium",
    brand: "Nadeem Traders",
    weight: "250g",
    price: 950,
    old_price: null,
    wholesale_price: 840,
    wholesale_min_qty: 5,
    rating: 5.0,
    reviews: 60,
    discount: 0,
    emoji: "🥜",
    stock: true,
    category_id: 1,
    category_name: "Dry Fruits",
    image_url: "/products/cashews.jpg",
  },
  {
    id: 9,
    name: "Zeera (Cumin)",
    brand: "Nadeem Traders",
    weight: "100g",
    price: 160,
    old_price: null,
    wholesale_price: 135,
    wholesale_min_qty: 10,
    rating: 4.8,
    reviews: 180,
    discount: 0,
    emoji: "🌿",
    stock: true,
    category_id: 2,
    category_name: "Spices",
    image_url: "/products/zeera.jpg",
  },
  {
    id: 10,
    name: "Sunflower Oil",
    brand: "Nadeem Traders",
    weight: "1L",
    price: 480,
    old_price: null,
    wholesale_price: 445,
    wholesale_min_qty: 12,
    rating: 4.7,
    reviews: 90,
    discount: 0,
    emoji: "🫙",
    stock: true,
    category_id: 5,
    category_name: "Cooking Oils",
    image_url: "/products/sunflower-oil.jpg",
  },
  {
    id: 11,
    name: "Pink Salt",
    brand: "Nadeem Traders",
    weight: "800g",
    price: 120,
    old_price: null,
    wholesale_price: 95,
    wholesale_min_qty: 12,
    rating: 4.9,
    reviews: 145,
    discount: 0,
    emoji: "🧂",
    stock: true,
    category_id: 6,
    category_name: "Sugar & Salt",
    image_url: "/products/pink-salt.jpg",
  },
  {
    id: 12,
    name: "White Sugar",
    brand: "Nadeem Traders",
    weight: "1kg",
    price: 155,
    old_price: null,
    wholesale_price: 142,
    wholesale_min_qty: 20,
    rating: 4.8,
    reviews: 210,
    discount: 0,
    emoji: "🧂",
    stock: true,
    category_id: 6,
    category_name: "Sugar & Salt",
    image_url: "/products/white-sugar.jpg",
  },
];

export function useStoreData() {
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<any[]>(DEFAULT_PRODUCTS);
  const [brands, setBrands] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const [cats, prods, brs] = await Promise.all([
          getCategories(),
          getProducts(),
          getBrands(),
        ]);
        if (!mounted) return;
        if (cats && cats.length > 0) setCategories(cats);
        if (prods && prods.length > 0) setProducts(prods);
        if (brs && brs.length > 0) setBrands(brs);
      } catch (e) {
        console.error("Using default catalog:", e);
      } finally {
        if (mounted) setIsLoading(false);
      }

      try {
        const session = await restoreSession();
        let user = null;
        if (session && session.success) {
          user = session.user;
        } else if (typeof window !== "undefined") {
          const localUser = sessionStorage.getItem("nadeem_user");
          if (localUser) user = JSON.parse(localUser);
        }
        if (user && mounted) {
          setCurrentUser(user);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("nadeem_user", JSON.stringify(user));
          }
          try {
            const w = await getWishlist({ data: { userId: user.id } });
            if (mounted) setWishlist(w);
          } catch {}
        }
      } catch {}

      await cartStore.load();
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleWishlist = async (productId: number) => {
    if (!currentUser) {
      toast.error("Please sign in to save items to your wishlist.");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    try {
      const res = await toggleWishlistDb({ data: { userId: currentUser.id, productId } });
      if (res.wishlisted) {
        toast.success("Saved to your wishlist");
      } else {
        toast.info("Removed from wishlist");
      }
      const w = await getWishlist({ data: { userId: currentUser.id } });
      setWishlist(w);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    categories,
    products,
    brands,
    currentUser,
    wishlist,
    toggleWishlist,
    isLoading,
  };
}

export function ModernProductCard({
  product: p,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  wishlist = [],
}: {
  product: any;
  onAddToCart: (p: any, qty?: number) => void;
  onQuickView?: (p: any) => void;
  onToggleWishlist?: (id: number) => void;
  wishlist?: any[];
  showWholesalePrimary?: boolean;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isWishlisted = wishlist.some((item) => item.id === p.id);

  const activePrice = p.price;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.stock) return;
    onAddToCart(p, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.stock) return;
    onAddToCart(p, 1);
    openCartDrawer();
  };

  return (
    <div className="group flex flex-col">
      {/* Tall 4:5 Portrait Image Frame */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F4EFE6] border border-border/70">
        <Link
          to={`/product/${p.id}` as any}
          className="block h-full w-full"
        >
          {p.image_url && !imgError ? (
            <img
              src={p.image_url}
              alt={p.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col h-full w-full items-center justify-center bg-[#F4EFE6] p-4 text-center">
              <img
                src="/LOGO.png"
                alt="Nadeem Traders"
                className="h-16 w-16 object-contain opacity-75 mb-2"
              />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A56E] font-semibold">
                100% Purity Guaranteed
              </span>
            </div>
          )}
        </Link>

        {onToggleWishlist && (
          <div className="pointer-events-none absolute right-3.5 top-3.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(p.id);
              }}
              aria-label="Wishlist"
              className={`pointer-events-auto grid h-8 w-8 place-items-center transition-colors ${
                isWishlisted
                  ? "text-rose-600"
                  : "text-foreground/70 hover:text-foreground bg-background/70 backdrop-blur-xs"
              }`}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          </div>
        )}

        {!p.stock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-[1px]">
            <span className="border border-foreground/30 bg-background px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">
              Out of Stock
            </span>
          </div>
        )}

        {p.stock && (
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 bg-background/95 backdrop-blur-xs border-t border-border">
            <button
              type="button"
              onClick={handleQuickBuy}
              className="flex-1 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
            >
              Quick Buy
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="border-l border-border px-3.5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Added
                </>
              ) : (
                <>+ Bag</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Clean Product Info Below Image */}
      <div className="pt-3.5 flex flex-1 flex-col justify-between">
        <div>
          <Link
            to={`/product/${p.id}` as any}
            className="block font-display text-lg font-medium text-foreground leading-snug hover:text-secondary transition-colors"
          >
            {p.name}
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {p.brand} &nbsp;|&nbsp; {p.weight}
          </p>
        </div>

        <div className="mt-2.5 pt-1 border-t border-border/40">
          <div className="text-xs">
            <span className="text-foreground font-semibold">
              Rs. {Number(activePrice).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreLayout({
  children,
  categories = DEFAULT_CATEGORIES,
  products = DEFAULT_PRODUCTS,
  currentUser = null,
  activeCategoryId = null,
  quickViewProduct = null,
  setQuickViewProduct,
}: {
  children: ReactNode;
  categories?: any[];
  products?: any[];
  currentUser?: any;
  activeCategoryId?: number | null;
  quickViewProduct?: any | null;
  setQuickViewProduct?: (p: any | null) => void;
}) {
  const cart = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [internalQuickView, setInternalQuickView] = useState<any | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  useEffect(() => {
    const unsubCart = subscribeCartDrawer((open) => setIsCartOpen(open));
    const unsubCheckout = subscribeCheckoutModal((open) => setIsCheckoutOpen(open));
    return () => {
      unsubCart();
      unsubCheckout();
    };
  }, []);

  const activeQuickView = quickViewProduct !== undefined ? quickViewProduct : internalQuickView;
  const closeQuickView = () => {
    if (setQuickViewProduct) setQuickViewProduct(null);
    else setInternalQuickView(null);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
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

  useEffect(() => {
    if (currentUser) {
      setCheckoutForm((prev) => ({
        ...prev,
        name: prev.name || currentUser.name || "",
        email: prev.email || currentUser.email || "",
        phone: prev.phone || currentUser.phone_number || "",
      }));
      getUserAddresses({ data: { userId: currentUser.id } })
        .then((addrs) => {
          const def = addrs.find((a: any) => a.is_default) || addrs[0];
          if (def) {
            const fullAddr = `${def.address_line1}, ${def.address_line2 ? def.address_line2 + ", " : ""}${def.city}, ${def.state} - ${def.postal_code}`;
            setCheckoutForm((prev) => ({ ...prev, address: prev.address || fullAddr }));
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  let subtotal = 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  cart.forEach((item) => {
    subtotal += item.price * item.quantity;
  });

  const handleAddToCart = (product: any, qty: number = 1) => {
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty}× ${product.name} to your bag`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderData = {
        user_id: currentUser?.id || null,
        customer_name: checkoutForm.name,
        customer_email: checkoutForm.email,
        customer_phone: checkoutForm.phone,
        shipping_address: checkoutForm.address,
        shipping_carrier: "PostEx Courier",
        payment_method: "Cash on Delivery",
        total_amount: subtotal,
        items: cart.map((item) => {
          return {
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
          };
        }),
      };

      const result = await createOrder({ data: orderData });
      setCreatedOrderId(result.id);
      if (currentUser?.id) {
        try {
          await clearCartDb({ data: { userId: currentUser.id } });
        } catch {}
      }
      cartStore.clearCartLocal();
      toast.success(`Order #${result.id} confirmed via PostEx Courier`);
    } catch (err) {
      console.error(err);
      toast.error("Could not place order. Please try again.");
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Purity & Courier Announcement Bar */}
      <div className="bg-[#141311] py-2 px-4 text-center text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-[#E6E1D6] border-b border-white/10">
        <span>
          100% Purity Guaranteed &nbsp;·&nbsp;{" "}
          <strong className="text-[#C5A56E] font-semibold">Apka Trusted Stop</strong>{" "}
          &nbsp;·&nbsp; Fast Doorstep Delivery via PostEx Courier
        </span>
      </div>

      {/* Single Clean Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          {/* Left: Menu + Search */}
          <div className="flex items-center gap-4 sm:gap-6 w-1/3">
            <button
              type="button"
              onClick={() => setIsNavDrawerOpen(true)}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground hover:text-secondary transition-colors"
              aria-label="Navigation menu"
            >
              <Menu className="h-4 w-4 stroke-[1.5]" />
              <span className="hidden sm:inline">Menu</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-foreground hover:text-secondary transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4 stroke-[1.5]" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>

          {/* Center: Brand Logo + Wordmark + Apka Trusted Stop */}
          <div className="text-center w-1/3 shrink-0">
            <Link to="/" className="inline-flex items-center gap-2.5 sm:gap-3 group justify-center">
              <img
                src="/LOGO.png"
                alt="Nadeem Traders"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0"
              />
              <div className="text-left sm:text-center">
                <span className="font-display text-xl sm:text-2xl lg:text-3xl font-normal tracking-[0.16em] uppercase text-foreground block leading-none">
                  Nadeem Traders
                </span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-[#C5A56E] font-semibold block mt-1">
                  100% Purity · Apka Trusted Stop
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Bag (No Log In button) */}
          <div className="flex items-center justify-end text-xs w-1/3">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 border border-border/80 bg-card px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              aria-label="Your Shopping Bag"
            >
              <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
              <span>Bag ({totalItems})</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation bar: clean, centered, no overlap possible */}
        <nav className="hidden sm:flex items-center justify-center gap-8 py-2.5 border-t border-border/50 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/categories" className="hover:text-foreground transition-colors">
            Categories
          </Link>
          <Link to="/shop" className="hover:text-foreground transition-colors">
            Catalog
          </Link>
          <Link to="/bulk-orders" className="hover:text-foreground transition-colors">
            Bulk Orders
          </Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>

        {/* Expandable Search Bar Overlay */}
        {isSearchOpen && (
          <div className="border-t border-border bg-card px-4 py-6 sm:px-8 animate-fade-in">
            <div className="mx-auto max-w-3xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-foreground pb-2">
                <Search className="h-4 w-4 text-muted-foreground mr-3" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products or categories..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="ml-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </form>

              {searchQuery.trim().length > 0 && (
                <div className="mt-4 divide-y divide-border">
                  {searchResults.length === 0 ? (
                    <p className="py-4 text-xs text-muted-foreground">
                      No matching products found for "{searchQuery}".
                    </p>
                  ) : (
                    searchResults.map((item) => (
                      <Link
                        key={item.id}
                        to={`/product/${item.id}` as any}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-10 bg-muted overflow-hidden shrink-0">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-display text-base text-foreground">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {item.category_name} | {item.weight}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          Rs. {item.price}
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

      {/* Slide-Out Left Navigation Drawer */}
      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setIsNavDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex max-w-full">
            <div className="w-screen max-w-sm bg-background text-foreground border-r border-border flex flex-col justify-between p-8 overflow-y-auto animate-slide-in-left">
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    Menu
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNavDrawerOpen(false)}
                    className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    Close <X className="h-4 w-4 stroke-[1.5]" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">
                    Categories
                  </p>
                  <ul className="space-y-2.5">
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/category/${c.id}` as any}
                          onClick={() => setIsNavDrawerOpen(false)}
                          className="block font-display text-2xl font-normal text-foreground hover:text-secondary transition-colors py-0.5"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                    <li className="pt-2">
                      <Link
                        to="/categories"
                        onClick={() => setIsNavDrawerOpen(false)}
                        className="text-xs uppercase tracking-[0.2em] text-foreground underline underline-offset-4"
                      >
                        View All Categories →
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Catalog */}
                <div className="space-y-3 border-t border-border pt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">
                    Navigation
                  </p>
                  <ul className="space-y-2.5 text-xs uppercase tracking-[0.16em] text-foreground/85">
                    <li>
                      <Link to="/" onClick={() => setIsNavDrawerOpen(false)} className="hover:text-secondary">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link to="/shop" onClick={() => setIsNavDrawerOpen(false)} className="hover:text-secondary">
                        All Products
                      </Link>
                    </li>
                    <li>
                      <Link to="/bulk-orders" onClick={() => setIsNavDrawerOpen(false)} className="hover:text-secondary">
                        Bulk Orders
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact" onClick={() => setIsNavDrawerOpen(false)} className="hover:text-secondary">
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-8 flex items-center gap-3 text-[11px] text-muted-foreground">
                <img src="/LOGO.png" alt="Nadeem Traders" className="h-8 w-8 object-contain" />
                <div>
                  <p className="font-semibold text-foreground tracking-wide">Nadeem Traders</p>
                  <p className="text-[10px] text-[#C5A56E]">100% Purity · Apka Trusted Stop</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-border bg-[#141311] text-[#E6E1D6]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 mb-3">
                <img src="/LOGO.png" alt="Nadeem Traders" className="h-10 w-10 object-contain" />
                <div>
                  <span className="font-display text-2xl tracking-[0.18em] uppercase text-white block leading-none">
                    Nadeem Traders
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A56E] font-semibold block mt-1">
                    Apka Trusted Stop
                  </span>
                </div>
              </Link>
              <p className="text-xs text-[#A39E93] leading-relaxed">
                Pure spices, aromatic grains, unpolished pulses, dry fruits, and cooking essentials. Fast tracked delivery via PostEx Courier.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C5A56E]">
                Categories
              </h4>
              <ul className="mt-4 space-y-2 text-xs text-[#A39E93]">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.id}` as any} className="hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C5A56E]">
                Storefront
              </h4>
              <ul className="mt-4 space-y-2 text-xs text-[#A39E93]">
                <li>
                  <Link to="/categories" className="hover:text-white transition-colors">
                    All Categories
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">
                    Full Catalog
                  </Link>
                </li>
                <li>
                  <Link to="/bulk-orders" className="hover:text-white transition-colors">
                    Bulk Orders
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C5A56E]">
                Legal
              </h4>
              <ul className="mt-4 space-y-2 text-xs text-[#A39E93]">
                <li>
                  <Link to="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-use" className="hover:text-white transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="hover:text-white transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-white transition-colors">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-[11px] text-[#857F74]">
            © {new Date().getFullYear()} Nadeem Traders. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Slide-Over Shopping Bag Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-background text-foreground border-l border-border shadow-2xl flex flex-col justify-between animate-slide-in-right">
              <div className="border-b border-border px-7 py-5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-normal tracking-wide">
                    Your Bag
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {totalItems} {totalItems === 1 ? "Item" : "Items"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Close <X className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                {cart.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-center">
                    <p className="font-display text-2xl text-foreground">Your bag is empty</p>
                    <Link
                      to="/categories"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 border border-foreground px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Browse Categories
                    </Link>
                  </div>
                ) : (
                  cart.map((item) => {
                    const activePrice = item.price;

                    return (
                      <div key={item.id} className="flex gap-4 border-b border-border pb-5">
                        <div className="h-24 w-20 shrink-0 bg-muted overflow-hidden border border-border/60">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center p-2 bg-[#F4EFE6]">
                              <img src="/LOGO.png" alt="Nadeem Traders" className="h-8 w-8 object-contain opacity-75" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-display text-base font-medium text-foreground truncate">
                                {item.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => cartStore.removeFromCart(item.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {item.brand} &nbsp;|&nbsp; {item.weight}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center border border-border bg-card">
                              <button
                                type="button"
                                onClick={() => cartStore.updateQuantity(item.id, -1)}
                                className="px-2.5 py-1 text-muted-foreground hover:text-foreground"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-3 text-xs font-medium">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => cartStore.updateQuantity(item.id, 1)}
                                className="px-2.5 py-1 text-muted-foreground hover:text-foreground"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              Rs. {(activePrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-border bg-card p-7 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Total (PKR)
                    </span>
                    <span className="font-display text-2xl font-medium text-foreground">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-primary py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground hover:opacity-95 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setIsCheckoutOpen(false)}
          />
          <div className="relative w-full max-w-lg border border-border bg-background p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-6 top-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {createdOrderId ? (
              <div className="py-6 text-center space-y-4">
                <h3 className="font-display text-3xl font-normal text-foreground">
                  Order #{createdOrderId} Confirmed
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  We have sent a confirmation to <strong>{checkoutForm.email}</strong>.
                </p>
                <div className="flex gap-3 pt-4 max-w-xs mx-auto">
                  <Link
                    to="/dashboard"
                    className="flex-1 border border-border py-3 text-[11px] uppercase tracking-[0.18em] font-semibold"
                  >
                    View Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedOrderId(null);
                      setIsCheckoutOpen(false);
                    }}
                    className="flex-1 bg-primary py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary-foreground"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-display text-2xl font-normal text-foreground border-b border-border pb-4 mb-6">
                  Checkout
                </h3>
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        className="mt-1.5 w-full border border-border bg-card px-3.5 py-2.5 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        className="mt-1.5 w-full border border-border bg-card px-3.5 py-2.5 text-xs focus:border-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      className="mt-1.5 w-full border border-border bg-card px-3.5 py-2.5 text-xs focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      Address *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="House/Shop #, Street, Area, City"
                      className="mt-1.5 w-full border border-border bg-card px-3.5 py-2.5 text-xs focus:border-foreground focus:outline-none resize-none"
                    />
                  </div>

                  {/* Automatic PostEx Courier Delivery - No delivery selection needed */}
                  <div className="border border-border/80 bg-muted/40 p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-primary" /> Delivery: PostEx Courier
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Dispatched automatically via <strong>PostEx Courier</strong> with real-time SMS tracking directly to your doorstep.
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Total
                    </span>
                    <span className="font-display text-2xl font-medium text-foreground">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full bg-primary py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground hover:opacity-95 disabled:opacity-50"
                  >
                    {isSubmittingOrder ? "Processing..." : "Confirm Order"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick View / Choose Options Modal */}
      {activeQuickView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-fade-in"
            onClick={closeQuickView}
          />
          <div className="relative w-full max-w-2xl border border-border bg-background shadow-2xl grid grid-cols-1 md:grid-cols-2 animate-scale-in">
            <button
              type="button"
              onClick={closeQuickView}
              className="absolute right-4 top-4 z-10 bg-background/80 p-2 text-foreground hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="aspect-[4/5] bg-muted overflow-hidden flex items-center justify-center">
              {activeQuickView.image_url ? (
                <img
                  src={activeQuickView.image_url}
                  alt={activeQuickView.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col h-full w-full items-center justify-center p-6 text-center space-y-3 bg-[#F4EFE6]">
                  <img
                    src="/LOGO.png"
                    alt="Nadeem Traders"
                    className="h-20 w-20 object-contain opacity-75"
                  />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A56E] font-semibold">
                    100% Purity · Apka Trusted Stop
                  </span>
                </div>
              )}
            </div>

            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-secondary">
                    Quick Buy
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {activeQuickView.category_name}
                  </p>
                </div>
                <h3 className="font-display text-3xl font-normal text-foreground leading-tight">
                  {activeQuickView.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeQuickView.brand} &nbsp;|&nbsp; {activeQuickView.weight}
                </p>

                <div className="pt-2">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Price</span>
                  <div className="mt-1 font-display text-3xl font-normal text-foreground">
                    Rs. {Number(activeQuickView.price).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center border border-border bg-card">
                    <button
                      type="button"
                      onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2 text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-4 text-xs font-medium">{quickViewQty}</span>
                    <button
                      type="button"
                      onClick={() => setQuickViewQty((q) => q + 1)}
                      className="px-3.5 py-2 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-display text-2xl font-medium text-foreground">
                    Rs. {(activeQuickView.price * quickViewQty).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(activeQuickView, quickViewQty);
                      closeQuickView();
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-secondary text-secondary-foreground py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] hover:opacity-95 flex items-center justify-center transition"
                  >
                    Quick Buy &amp; Checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(activeQuickView, quickViewQty);
                      closeQuickView();
                      setIsCartOpen(true);
                    }}
                    className="w-full border border-foreground bg-transparent py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground hover:bg-foreground hover:text-background transition"
                  >
                    Add to Bag
                  </button>
                </div>

                <Link
                  to={`/product/${activeQuickView.id}` as any}
                  onClick={closeQuickView}
                  className="text-center text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 flex items-center justify-center gap-1.5 transition-colors pt-1"
                >
                  View Full Product Page &amp; Details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Contact Widget (Apka Trusted Stop) */}
      <aside aria-label="WhatsApp Support" className="fixed bottom-6 right-6 z-40">
        <a
          href="https://wa.me/923000000000?text=Hello%20Nadeem%20Traders,%20I%20am%20shopping%20on%20Apka%20Trusted%20Stop%20and%20need%20assistance."
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
          aria-label="Chat on WhatsApp with Apka Trusted Stop support"
        >
          <svg
            className="h-5 w-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            WhatsApp · Apka Trusted Stop
          </span>
        </a>
      </aside>
    </div>
  );
}
