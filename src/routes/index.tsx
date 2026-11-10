import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShoppingCart, Heart, User,
  Star, Headphones, Wallet, Clock,
  ChevronRight, Facebook, Instagram, Youtube, Mail, MessageCircle,
  Plus, Minus, Zap, Package, Award, TrendingUp, ArrowRight, X,
  ShoppingBag, Check, Loader2
} from "lucide-react";
import { toast } from "sonner";
import spicesBgImg from "@/assets/spices_background.png";
import spicesAppImg from "@/assets/spices_app_mockup.png";

// Import server functions
import {
  getCategories,
  getProducts,
  getBrands,
  createOrder,
  restoreSession,
  toggleWishlistDb,
  getWishlist,
  clearCartDb
} from "../lib/actions";
import { useCart, cartStore } from "../lib/cart-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nadeem Traders — Pakistan's Leading Digital Wholesale & Retail Marketplace" },
      { name: "description", content: "Premium spices, rice, flour, oil, ghee, and wholesale rates delivered across Pakistan." },
    ],
  }),
  component: Home,
});

interface CartItem {
  id: number;
  name: string;
  brand: string;
  weight: string;
  price: number;
  wholesale_price?: number | null;
  wholesale_min_qty: number;
  emoji: string;
  quantity: number;
  image_url?: string | null;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  picture?: string;
}

const CATEGORY_GRADIENTS = [
  { from: "from-amber-500", to: "to-orange-600" },
  { from: "from-red-600", to: "to-rose-700" },
  { from: "from-yellow-500", to: "to-amber-600" },
  { from: "from-green-600", to: "to-emerald-700" },
  { from: "from-purple-600", to: "to-violet-700" },
  { from: "from-blue-500", to: "to-indigo-600" },
  { from: "from-pink-500", to: "to-rose-600" },
  { from: "from-teal-500", to: "to-cyan-600" },
];

const reasons = [
  { icon: Zap, title: "2–4 Hour City Delivery", desc: "Order before 2pm, get it by evening across Lahore, Karachi & Islamabad." },
  { icon: TrendingUp, title: "50,000+ Orders Delivered", desc: "Trusted by thousands of homes and businesses across Pakistan." },
  { icon: Package, title: "Zero Middlemen", desc: "Direct from farms and producers — you get the real price, not inflated retail." },
  { icon: Award, title: "Quality Inspected", desc: "Every batch is hand-graded before packing. No second-grade maal, period." },
  { icon: Wallet, title: "Up to 40% Cheaper", desc: "Wholesale pricing unlocked for retail buyers. Beats any sabzi mandi." },
  { icon: Headphones, title: "WhatsApp Support 24/7", desc: "Real humans, quick responses. Hit us up anytime — we reply fast." },
];


const getClientDataCache = () => {
  if (typeof window === "undefined") {
    return { categories: null, products: null, brands: null };
  }
  if (!(window as any).__clientDataCache) {
    (window as any).__clientDataCache = {
      categories: null,
      products: null,
      brands: null,
    };
  }
  return (window as any).__clientDataCache;
};

function Home() {
  const router = useRouter();

  // DB loaded states
  const [categories, setCategories] = useState<any[]>(() => getClientDataCache().categories || []);
  const [products, setProducts] = useState<any[]>(() => getClientDataCache().products || []);
  const [brands, setBrands] = useState<any[]>(() => getClientDataCache().brands || []);
  
  // Showcase rows
  const [bestSellers, setBestSellers] = useState<any[]>(() => {
    const cache = getClientDataCache();
    if (!cache.products) return [];
    return cache.products.filter((p: any) => p.rating >= 4.7).slice(0, 6);
  });
  const [newArrivals, setNewArrivals] = useState<any[]>(() => {
    const cache = getClientDataCache();
    if (!cache.products) return [];
    return [...cache.products].sort((a, b) => b.id - a.id).slice(0, 6);
  });
  const [seasonalProducts, setSeasonalProducts] = useState<any[]>(() => {
    const cache = getClientDataCache();
    if (!cache.products) return [];
    return cache.products.filter((p: any) => p.category_id === 1 || p.category_id === 5).slice(0, 6);
  });
  
  // App interactivity states
  const cart = useCart();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Authentication & Dialogs
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  
  // (location picker removed)

  // Checkout details
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    const cache = getClientDataCache();
    return !(cache.categories && cache.products && cache.brands);
  });

  // Load search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
    setSuggestions(filtered);
  }, [searchQuery, products]);

  // Load initial data & check session
  const fetchAllData = async (forceSpinner = false) => {
    const cache = getClientDataCache();
    if (forceSpinner || !(cache.categories && cache.products && cache.brands)) {
      setIsLoading(true);
    }
    try {
      const [cats, prods, brs] = await Promise.all([
        getCategories(),
        getProducts(),
        getBrands()
      ]);
      
      // Update cache
      cache.categories = cats;
      cache.products = prods;
      cache.brands = brs;

      setCategories(cats);
      setProducts(prods);
      setBrands(brs);

      // Filter rows
      setBestSellers(prods.filter((p: any) => p.rating >= 4.7).slice(0, 6));
      setNewArrivals([...prods].sort((a, b) => b.id - a.id).slice(0, 6));
      setSeasonalProducts(prods.filter((p: any) => p.category_id === 1 || p.category_id === 5).slice(0, 6));
    } catch (err) {
      console.error("Failed to load store data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      await fetchAllData();
      
      try {
        const session = await restoreSession();
        let user = null;
        if (session && session.success) {
          user = session.user;
        } else {
          const localUser = sessionStorage.getItem("nadeem_user");
          if (localUser) {
            user = JSON.parse(localUser);
          }
        }
        if (user) {
          setCurrentUser(user as any);
          sessionStorage.setItem("nadeem_user", JSON.stringify(user));
          setCheckoutForm(prev => ({
            ...prev,
            name: user.name,
            email: user.email
          }));
          
          // Load wishlist
          const w = await getWishlist({ data: { userId: user.id } });
          setWishlist(w);
        }
      } catch (e) {
        console.error("Failed to restore session:", e);
      }

      // Check if checkout redirect was requested
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "true") {
        setTimeout(() => {
          setIsCheckoutOpen(true);
        }, 500);
      }

      // Load DB cart
      await cartStore.load();
    };

    initializeSession();
  }, []);



  // Cart operations
  const addToCart = async (product: any, qty: number = 1) => {
    if (!currentUser) {
      toast.error("Please sign in with Google to start shopping!");
      window.location.href = `/login?redirect=/`;
      return;
    }
    cartStore.addToCart(product, qty);
    toast.success(`Added ${product.name} to cart!`);
  };

  const updateQuantity = async (id: number, delta: number) => {
    cartStore.updateQuantity(id, delta);
  };

  const removeFromCart = async (id: number) => {
    cartStore.removeFromCart(id);
    toast.info("Item removed from cart");
  };

  const handleToggleWishlist = async (productId: number) => {
    if (!currentUser) {
      toast.error("Please sign in with Google to manage your wishlist!");
      window.location.href = `/login?redirect=/?wishlist=${productId}`;
      return;
    }
    try {
      const res = await toggleWishlistDb({ data: { userId: currentUser.id, productId } });
      if (res.wishlisted) {
        toast.success("Added to wishlist!");
      } else {
        toast.info("Removed from wishlist.");
      }
      const w = await getWishlist({ data: { userId: currentUser.id } });
      setWishlist(w);
    } catch (err) {
      console.error(err);
    }
  };

  // Pricing calculations
  const calculateCartTotals = () => {
    let subtotal = 0;
    let savings = 0;

    cart.forEach((item) => {
      const retailCost = item.price * item.quantity;
      const actualPrice =
        item.wholesale_price && item.quantity >= item.wholesale_min_qty
          ? item.wholesale_price
          : item.price;
      const actualCost = actualPrice * item.quantity;

      subtotal += actualCost;
      savings += retailCost - actualCost;
    });

    return { subtotal, savings };
  };

  const { subtotal, savings } = calculateCartTotals();

  // Checkout submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!currentUser) {
      toast.error("Please sign up to checkout.");
      window.location.href = "/login?mode=signup&redirect=/?checkout=true";
      return;
    }
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderData = {
        user_id: currentUser.id,
        customer_name: checkoutForm.name,
        customer_email: checkoutForm.email,
        customer_phone: checkoutForm.phone,
        shipping_address: checkoutForm.address,
        total_amount: subtotal,
        items: cart.map((item) => {
          const appliedPrice =
            item.wholesale_price && item.quantity >= item.wholesale_min_qty
              ? item.wholesale_price
              : item.price;
          return {
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: appliedPrice
          };
        })
      };

      const result = await createOrder({ data: orderData });
      setCreatedOrderId(result.id);
      try {
        await clearCartDb({ data: { userId: currentUser.id } });
      } catch (err) {
        console.error("Failed to clear database cart:", err);
      }
      cartStore.clearCartLocal();
      toast.success("Order Placed Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Filter products by category & search
  const filteredFeatured = products.filter(p => {
    const matchesCat = !selectedCategory || p.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });


  // Track product view in DB
  const handleProductClick = async (p: any) => {
    setQuickViewProduct(p);
    try {
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* 1. Header & Navigation */}
      <div className="sticky top-0 z-40 shadow-sm">
        <Header
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
          currentUser={currentUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
        />
      </div>
      
      {/* 2. Main Storefront */}
      <Hero />
      
      {/* Dynamic categories */}
      <CategoriesSection
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Dynamic Products Grid */}
      <FeaturedProductsSection
        products={filteredFeatured}
        onAddToCart={addToCart}
        onProductClick={handleProductClick}
        onToggleWishlist={handleToggleWishlist}
        wishlist={wishlist}
        isLoading={isLoading}
      />

      {/* Showcase Rows */}
      <section className="mx-auto max-w-7xl px-4 py-10 space-y-16">
        {/* Best Sellers */}
        <div>
          <SectionHead title="Best Sellers" subtitle="Highly-rated items purchased most frequently by local households." />
          <div className="mt-8">
            {isLoading ? <SkeletonLoader /> : (
              <ProductSlider 
                products={bestSellers} 
                onAddToCart={addToCart} 
                onProductClick={handleProductClick}
                onToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
              />
            )}
          </div>
        </div>

        {/* New Arrivals */}
        <div>
          <SectionHead title="New Arrivals" subtitle="Recently cataloged items fresh from the latest crops." />
          <div className="mt-8">
            {isLoading ? <SkeletonLoader /> : (
              <ProductSlider 
                products={newArrivals} 
                onAddToCart={addToCart} 
                onProductClick={handleProductClick}
                onToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
              />
            )}
          </div>
        </div>

        {/* Seasonal Products */}
        <div>
          <SectionHead title="Seasonal Products" subtitle="Hand-picked seasonal grains and spices selected for summer recipes." />
          <div className="mt-8">
            {isLoading ? <SkeletonLoader /> : (
              <ProductSlider 
                products={seasonalProducts} 
                onAddToCart={addToCart} 
                onProductClick={handleProductClick}
                onToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
              />
            )}
          </div>
        </div>

      </section>

      <FlashSale />
      
      <BrandPromiseBanner />

      {/* Dynamic Brands Marquee */}
      <BrandsSection brands={brands} />

      <WhyUs />
      <AppPromo />
      <Footer />

      {/* 3. Sliding Shopping Cart Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform bg-card text-foreground shadow-2xl transition duration-300 ease-in-out flex flex-col justify-between">
              <div className="border-b border-border p-6 flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Your Cart
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="rounded-xl p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <ShoppingBag className="h-16 w-16 mb-4 text-primary/30" />
                    <p className="font-semibold text-sm">Your cart is empty.</p>
                    <p className="text-xs mt-1">Add items from the store to see them here.</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const isWholesaleApplied =
                      item.wholesale_price && item.quantity >= item.wholesale_min_qty;
                    const activePrice = isWholesaleApplied ? item.wholesale_price! : item.price;

                    return (
                      <div key={item.id} className="flex gap-4 p-3 rounded-2xl border border-border bg-accent/30 hover:border-primary/20 transition">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-mint text-3xl overflow-hidden border border-slate-100">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.emoji
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                            <span>{item.brand}</span> • <span>{item.weight}</span>
                          </div>
                          
                          {item.wholesale_price && !isWholesaleApplied && (
                            <div className="text-[9px] text-amber-500 font-bold mt-1">
                              Add {item.wholesale_min_qty - item.quantity} more for wholesale (Rs. {item.wholesale_price}/kg)
                            </div>
                          )}

                          {isWholesaleApplied && (
                            <span className="inline-block mt-1 text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              Bulk Rate Applied
                            </span>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden">
                              <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-accent text-muted-foreground"><Minus className="h-3 w-3" /></button>
                              <span className="px-3 py-1 text-xs font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-accent text-muted-foreground"><Plus className="h-3 w-3" /></button>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-sm text-primary">Rs. {(activePrice * item.quantity).toLocaleString()}</span>
                              {isWholesaleApplied && (
                                <div className="text-[9px] line-through text-muted-foreground">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-rose-500 transition self-start p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-border p-6 bg-card">
                  {savings > 0 && (
                    <div className="flex justify-between items-center mb-3 text-xs bg-amber-100/50 border border-amber-200 text-amber-800 p-2.5 rounded-xl font-bold">
                      <span>Bulk Savings Applied:</span>
                      <span>Rs. {savings.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-muted-foreground text-sm">Grand Total</span>
                    <span className="font-black text-xl text-primary">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      if (!currentUser) {
                        toast.info("Please sign up to checkout.");
                        window.location.href = "/login?mode=signup&redirect=/?checkout=true";
                      } else {
                        setIsCheckoutOpen(true);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow transition"
                  >
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Checkout Dialog / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          <div className="relative w-full max-w-lg bg-card text-foreground rounded-3xl border border-border p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute right-4 top-4 rounded-xl p-2 hover:bg-accent text-muted-foreground">
              <X className="h-5 w-5" />
            </button>

            {createdOrderId ? (
              <div className="text-center py-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-800 mb-6">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Order Placed!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you for shopping at Nadeem Traders. Your order has been registered under:
                </p>
                <div className="bg-accent/40 rounded-2xl p-4 my-6 border border-border inline-block">
                  <span className="text-xs text-muted-foreground uppercase font-bold block tracking-wider">Your Order ID</span>
                  <span className="text-2xl font-black text-primary block mt-1">#{createdOrderId}</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We have sent an order status confirmation email to <span className="font-semibold text-slate-700">{checkoutForm.email}</span>. You can view your account profile dashboard to see your orders details.
                </p>
                <div className="flex gap-4 mt-8 max-w-xs mx-auto">
                  <Link
                    to="/dashboard"
                    className="flex-1 py-3 text-xs font-bold text-center border border-border rounded-xl hover:bg-accent transition"
                  >
                    View Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setCreatedOrderId(null);
                      setIsCheckoutOpen(false);
                    }}
                    className="flex-1 py-3 text-xs font-bold text-white bg-gradient-primary rounded-xl hover:brightness-105 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-slate-800 border-b border-border pb-3 mb-6">Ration Details Checkout</h3>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="Your Full Name"
                        className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                      <input
                        type="email"
                        required
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        placeholder="name@example.com"
                        className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      placeholder="e.g. 03001234567"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Shipping Address</label>
                    <textarea
                      required
                      rows={3}
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="House No, Street Name, Area name, City (e.g. Lahore, Karachi)"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4 flex gap-3 mt-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-800">Cash on Delivery</h4>
                      <p className="text-[10px] text-amber-700/80 leading-relaxed mt-0.5">
                        Paying cash on delivery is the only method available. Please verify order total amount at your door.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-6 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">Order Subtotal</span>
                    <span className="font-extrabold text-primary">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow disabled:opacity-50 transition mt-6"
                  >
                    {isSubmittingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirm COD Purchase (Rs. {subtotal.toLocaleString()})
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuickViewProduct(null)} />
          <div className="relative w-full max-w-2xl bg-card text-foreground rounded-3xl border border-border p-6 shadow-2xl flex flex-col md:flex-row gap-6">
            <button onClick={() => setQuickViewProduct(null)} className="absolute right-4 top-4 rounded-xl p-2 hover:bg-accent text-muted-foreground">
              <X className="h-5 w-5" />
            </button>

            {/* Image/Emoji */}
            <div className="w-full md:w-1/2 h-60 bg-gradient-mint rounded-2xl flex items-center justify-center border border-border overflow-hidden shrink-0">
              {quickViewProduct.image_url ? (
                <img src={quickViewProduct.image_url} alt={quickViewProduct.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-9xl">{quickViewProduct.emoji || "🌾"}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{quickViewProduct.brand}</span>
                <h3 className="text-xl font-black text-slate-800 mt-1">{quickViewProduct.name}</h3>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span>Weight: <strong>{quickViewProduct.weight}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold text-gold" /> {quickViewProduct.rating}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Premium sourced product from verified agricultural producers across Pakistan. Hand-graded, high nutritional retention, vacuum sealed for complete moisture control and hygiene.
                </p>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-2xl font-black text-primary">Rs. {quickViewProduct.price}</span>
                  {quickViewProduct.old_price && <span className="text-xs text-muted-foreground line-through">Rs. {quickViewProduct.old_price}</span>}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="flex-1 py-3 bg-gradient-primary text-primary-foreground text-xs font-bold rounded-xl text-center shadow-soft hover:shadow-glow"
                >
                  Add to Basket
                </button>
                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                    if (!currentUser) {
                      toast.info("Please sign up to checkout.");
                      window.location.href = "/login?mode=signup&redirect=/?checkout=true";
                    } else {
                      setIsCheckoutOpen(true);
                    }
                  }}
                  className="flex-1 py-3 bg-amber-950 text-white text-xs font-bold rounded-xl text-center border border-amber-900"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Floating Widget */}
      <a
        href="https://wa.me/923001234567"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition hover:scale-110"
        style={{ backgroundColor: "#25D366" }}
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

function ProductCard({ p, onAddToCart, onProductClick, onToggleWishlist, wishlist }: { p: any; onAddToCart: (p: any) => void; onProductClick: (p: any) => void; onToggleWishlist: (id: number) => void; wishlist: any[] }) {
  const isWishlisted = wishlist.some((item) => item.id === p.id);
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-elegant h-[340px]">
      <div onClick={() => onProductClick(p)} className="absolute inset-0 w-full h-full cursor-pointer">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-103" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#d1fae5]/35 to-[#d1fae5]/10 flex items-center justify-center">
            <span className="text-7xl drop-shadow-md select-none">{p.emoji || "🌾"}</span>
          </div>
        )}
      </div>

      <div className="relative p-3.5 flex justify-between items-start z-10 pointer-events-none">
        <div />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(p.id);
          }}
          className={`grid h-8.5 w-8.5 place-items-center rounded-full shadow-soft backdrop-blur transition pointer-events-auto ${
            isWishlisted ? "bg-rose-500 text-white" : "bg-card/90 text-slate-400 hover:text-rose-500"
          }`}
          aria-label="Wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {!p.stock && (
        <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center pointer-events-none">
          <span className="rounded-xl bg-destructive px-3.5 py-1 text-center text-xs font-semibold text-white">Out of stock</span>
        </div>
      )}

      {/* Action panel sliding up on hover */}
      <div className="absolute top-[40%] left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-300 z-20">
        <button
          onClick={() => onProductClick(p)}
          className="rounded-xl bg-slate-900/90 text-white border border-slate-800 px-3.5 py-2 text-[10px] font-bold shadow-elegant hover:bg-slate-900"
        >
          Quick View
        </button>
      </div>

      <div className="mt-auto relative z-10 p-4 pt-12 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent text-white">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span className="text-amber-400">{p.brand}</span>
          <span>{p.weight}</span>
        </div>
        <div onClick={() => onProductClick(p)} className="hover:text-amber-400 transition mt-1.5 block cursor-pointer">
          <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-100">{p.name}</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] mt-1.5 text-slate-300">
          <Star className="h-3 w-3 fill-gold text-gold" />
          <span className="font-bold text-white">{p.rating}</span>
          <span>({p.reviews})</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-amber-950/40">
          <div>
            <div className="text-sm font-black text-amber-400">Rs. {p.price}</div>
            {p.old_price && <div className="text-[10px] text-slate-400 line-through">Rs. {p.old_price}</div>}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (p.stock) onAddToCart(p);
            }}
            disabled={!p.stock}
            className="grid h-8.5 w-8.5 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50 pointer-events-auto transition"
            aria-label="Add to cart"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductSlider({ products, onAddToCart, onProductClick, onToggleWishlist, wishlist }: { products: any[]; onAddToCart: (p: any) => void; onProductClick: (p: any) => void; onToggleWishlist: (id: number) => void; wishlist: any[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
      {products.map((p) => (
        <div key={p.id} className="snap-start shrink-0 w-[180px] sm:w-[220px]">
          <ProductCard p={p} onAddToCart={onAddToCart} onProductClick={onProductClick} onToggleWishlist={onToggleWishlist} wishlist={wishlist} />
        </div>
      ))}
    </div>
  );
}

const SkeletonLoader = () => (
  <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="shrink-0 w-[200px] h-[340px] rounded-3xl border border-amber-950/20 bg-slate-900/10 animate-pulse p-4 space-y-4">
        <div className="h-40 bg-slate-800 rounded-2xl" />
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-8 w-8 bg-slate-800 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

function Header({
  cartCount,
  onCartClick,
  currentUser,
  searchQuery,
  setSearchQuery,
  suggestions,
  setSuggestions,
}: {
  cartCount: number;
  onCartClick: () => void;
  currentUser: UserProfile | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  suggestions: any[];
  setSuggestions: (s: any[]) => void;
}) {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-glow overflow-hidden">
            <img src="/LOGO.png" alt="Nadeem Traders" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">Nadeem<span className="text-primary">Traders</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Trusted Stop</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">
          <Link to="/shop" className="hover:text-primary transition">Shop</Link>
          <a href="/shop?tab=offers" className="hover:text-primary transition">Special Offers</a>
          <Link to="/bulk-orders" className="hover:text-primary transition">Bulk Orders</Link>
        </nav>

        <div className="flex items-center gap-2">
          {currentUser && (
            <Link
              to="/dashboard"
              className="relative rounded-xl p-2.5 transition flex items-center gap-1 hover:bg-accent text-slate-700"
              title="Dashboard"
            >
              <User className="h-5 w-5 text-slate-700 hover:text-primary transition" />
              <span className="hidden sm:inline text-xs font-bold text-slate-600 truncate max-w-[80px]">{currentUser.name.split(" ")[0]}</span>
            </Link>
          )}

          <button
            onClick={onCartClick}
            className="group relative flex items-center gap-2 rounded-2xl bg-gradient-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-glow"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Basket</span>
            {cartCount > 0 && (
              <span className="ml-1 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-gold-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation links */}
      <div className="md:hidden border-t border-border/50 px-4 py-2.5 overflow-x-auto scrollbar-none flex gap-5 text-xs font-extrabold uppercase tracking-wider text-slate-600 whitespace-nowrap">
        <Link to="/shop" className="hover:text-primary transition">Shop</Link>
        <a href="/shop?tab=offers" className="hover:text-primary transition">Special Offers</a>
        <Link to="/bulk-orders" className="hover:text-primary transition">Bulk Orders</Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[500px] lg:min-h-[600px] overflow-hidden flex items-center bg-black text-white py-14">
      <video
        src="/promo.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-85"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/20" />
      <div className="relative mx-auto grid max-w-7xl w-full items-center gap-10 px-4 lg:grid-cols-2 z-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-semibold text-amber-300">
            <Zap className="h-3.5 w-3.5 text-primary" /> ✦ Apka Trusted Stop
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl text-white">
            Pakistan's Most Trusted{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Grocery & Spice</span>{" "}
            Marketplace
          </h1>
          <p className="mt-5 max-w-xl text-base text-gray-200 sm:text-lg">
            Farm-fresh maal, real prices, aur doorstep delivery — sab kuch ek jagah. No middlemen, no bakwaas. Period.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#products" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold px-6 py-3.5 text-sm shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40 hover:-translate-y-0.5">
              Shop Now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a href="#categories" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur px-6 py-3.5 text-sm font-semibold hover:border-primary hover:text-primary transition">
              Explore Categories
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({
  categories,
  selectedCategory,
  setSelectedCategory
}: {
  categories: any[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
}) {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16">
      <SectionHead eyebrow="Shop by need" title="Explore Categories" subtitle="From daily spices to premium dry fruits — everything in one basket." />
      <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {categories.map((c, idx) => {
          const grad = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
          const isSelected = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(isSelected ? null : c.id)}
              className={`group relative overflow-hidden rounded-2xl border text-center shadow-soft transition hover:-translate-y-1 hover:shadow-elegant min-h-[100px] flex flex-col items-center justify-center ${
                isSelected ? "border-primary shadow-glow" : "border-border"
              }`}
            >
              {c.image_url ? (
                <>
                  <img src={c.image_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${grad.from}/70 ${grad.to}/40 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-95'}`} />
                  <div className="relative text-white z-10 text-xs font-bold px-2 drop-shadow-lg">{c.name}</div>
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${grad.from} ${grad.to} opacity-90`} />
              )}
              {!c.image_url && (
                <div className="relative z-10 flex flex-col items-center gap-1.5 p-3">
                  <div className="text-2xl">{c.icon || "📦"}</div>
                  <div className="text-xs font-bold text-white drop-shadow">{c.name}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedProductsSection({
  products,
  onAddToCart,
  onProductClick,
  onToggleWishlist,
  wishlist,
  isLoading
}: {
  products: any[];
  onAddToCart: (p: any) => void;
  onProductClick: (p: any) => void;
  onToggleWishlist: (id: number) => void;
  wishlist: any[];
  isLoading: boolean;
}) {
  const displayedProducts = products.slice(0, 5);
  const hasMore = products.length > 5;

  return (
    <section id="products" className="bg-gradient-to-b from-transparent via-mint/30 to-transparent py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead eyebrow="Best sellers" title="Featured Products" subtitle="Hand-picked essentials your ghar can't run out of." />
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No products found matching your active filter.
          </div>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {displayedProducts.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={onAddToCart} onProductClick={onProductClick} onToggleWishlist={onToggleWishlist} wishlist={wishlist} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:shadow-glow hover:-translate-y-0.5 duration-200"
                >
                  Explore More Products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function FlashSale() {
  const [t, setT] = useState({ h: 5, m: 42, s: 18 });
  useEffect(() => {
    const id = setInterval(() => {
      setT(({ h, m, s }) => {
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-elegant sm:p-12">
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">
              <Zap className="h-3.5 w-3.5" /> FLASH SALE
            </span>
            <h3 className="mt-4 text-3xl font-extrabold sm:text-4xl">Save up to 40% on daily essentials</h3>
            <p className="mt-2 max-w-md text-primary-foreground/85">Premium spices, cooking oil, atta and more — but only for the next few hours.</p>
          </div>
          <div className="flex gap-3">
            {[
              { l: "Hours", v: pad(t.h) },
              { l: "Minutes", v: pad(t.m) },
              { l: "Seconds", v: pad(t.s) },
            ].map((u) => (
              <div key={u.l} className="w-20 rounded-2xl bg-white/15 p-4 text-center backdrop-blur sm:w-24">
                <div className="text-3xl font-extrabold tabular-nums sm:text-4xl">{u.v}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">{u.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandPromiseBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="relative overflow-hidden rounded-[32px] border border-amber-100/30 bg-card shadow-elegant h-[320px] sm:h-[400px] flex items-center">
        <img
          src="/BANNER.png"
          alt="Nadeem Traders Premium Quality Spices"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-102"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent md:bg-gradient-to-r md:from-black/95 md:via-black/60 md:to-transparent" />
        <div className="relative p-8 sm:p-12 text-white max-w-xl text-left z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
            Premium Quality Promise
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pure, Natural & Premium Spices
          </h3>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium">
            From hand-picked organic spices and clean grains to premium dry fruits, we bring top quality commercial products directly to your doorstep.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-black text-amber-400">
            <span>✓ 100% Organic Spices</span>
            <span>✓ Premium Quality Grains</span>
            <span>✓ Direct Sourcing</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandsSection({ brands }: { brands: any[] }) {
  const finalBrands = brands.length > 0 ? brands : [
    { id: 1, name: "Shan" }, { id: 2, name: "National" }, { id: 3, name: "Tapal" }, { id: 4, name: "Dalda" }, { id: 5, name: "Sufi" }, { id: 6, name: "Guard" }
  ];
  const minItemsRequired = 18;
  const copiesCount = Math.ceil(minItemsRequired / finalBrands.length);
  const repeatedBrands: any[] = [];
  
  for (let c = 0; c < copiesCount * 2; c++) {
    repeatedBrands.push(...finalBrands);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHead eyebrow="You know & trust" title="Popular Brands" subtitle="Authentic Pakistani brands, direct from authorized distributors." />
      <div className="mt-8 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        
        <div className="flex w-max animate-marquee gap-4">
          {repeatedBrands.map((b, i) => (
            <div key={i} className="grid h-24 w-40 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:border-primary hover:shadow-elegant overflow-hidden">
              {b.image_url ? (
                <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-extrabold tracking-tight text-primary">{b.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  return (
    <section className="relative overflow-hidden py-20 text-white">
      <img
        src={spicesBgImg}
        alt="Premium organic spices selection"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" />

      <div className="relative mx-auto max-w-7xl px-4 z-10">
        <div className="text-center md:text-left">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Why Nadeem Traders</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">Built for Pakistani kitchens & businesses</h2>
        </div>
        
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-elegant transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 backdrop-blur-md">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition group-hover:scale-110">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{r.title}</h3>
              <p className="mt-1 text-sm text-gray-200 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppPromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-elegant">
        <div className="absolute inset-0 bg-gradient-mint" />
        <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Clock className="h-3.5 w-3.5" /> Grocery in your pocket
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Get the Nadeem Traders app</h2>
            <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">Track orders, get flash-sale alerts, and save your favourite ration list — right from your phone.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#" className="flex items-center gap-3 rounded-2xl bg-foreground px-5 py-3 text-background shadow-soft transition hover:opacity-90">
                <div className="text-2xl">📱</div>
                <div className="leading-tight text-left">
                  <div className="text-[10px] uppercase opacity-80">Download on</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 rounded-2xl bg-gradient-primary px-5 py-3 text-primary-foreground shadow-soft transition hover:shadow-glow">
                <div className="text-2xl">🤖</div>
                <div className="leading-tight text-left">
                  <div className="text-[10px] uppercase opacity-90">Get it on</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] flex items-center justify-center">
            <div className="absolute h-[250px] w-[250px] rounded-full bg-primary/30 blur-3xl" />
            <img
              src={spicesAppImg}
              alt="Nadeem Traders Smartphone App Spices Mockup"
              className="relative h-full w-auto object-contain rounded-2xl shadow-elegant border border-border/50"
            />
          </div>
        </div>
      </div>
    </section>
  );
}



function Footer() {
  return (
    <footer className="border-t border-amber-900 bg-[#1a0a00] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white overflow-hidden">
                <img src="/LOGO.png" alt="Nadeem Traders" className="w-full h-full object-contain" />
              </div>
              <div className="text-lg font-extrabold text-white">Nadeem<span className="text-primary">Traders</span></div>
            </div>
            <p className="mt-4 text-sm text-amber-100/80 leading-relaxed">Pakistan's most trusted grocery & spice marketplace — fresh, affordable, and delivered fast.</p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Youtube, MessageCircle, Mail].map((I, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-xl border border-amber-800/80 text-amber-100 transition hover:border-gold hover:text-gold">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold">Quick Links</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-amber-100/70">
              <li><Link to="/" className="hover:text-gold transition">Home</Link></li>
              <li><Link to="/shop" className="hover:text-gold transition">Shop</Link></li>
              <li><a href="/shop?tab=offers" className="hover:text-gold transition">Special Offers</a></li>
              <li><Link to="/bulk-orders" className="hover:text-gold transition">Bulk Orders</Link></li>
              <li><Link to="/dashboard" className="hover:text-gold transition">Profile Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold">Customer Care</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-amber-100/70">
              <li><Link to="/contact" className="hover:text-gold transition">Contact Us</Link></li>
              <li><Link to="/help" className="hover:text-gold transition">Help Center & FAQ</Link></li>
              <li><Link to="/delivery-info" className="hover:text-gold transition">Delivery Info</Link></li>
              <li><Link to="/sell-with-us" className="hover:text-gold transition">Sell With Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold">Policies</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-amber-100/70">
              <li><Link to="/privacy-policy" className="hover:text-gold transition">Privacy Policy</Link></li>
              <li><Link to="/terms-of-use" className="hover:text-gold transition">Terms of Use</Link></li>
              <li><Link to="/refund-policy" className="hover:text-gold transition">Refund Policy</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-gold transition">Shipping Policy</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-gold transition">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-amber-800/50 pt-6 text-xs text-amber-300/80">
          <div>© {new Date().getFullYear()} Nadeem Traders. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-3">
            <span>We accept:</span>
            {["COD", "EasyPaisa", "JazzCash", "Postex", "Visa", "Master", "Bank"].map((p) => (
              <span key={p} className="rounded-lg border border-amber-800 bg-amber-950/50 px-2 py-1 font-semibold text-amber-100">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SectionHead({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <a href="#" className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">
          {action} <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
