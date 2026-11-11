import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronRight, Search, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import { recordRecentlyViewedDb } from "../lib/actions";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
  getCategoryMeta,
} from "../components/store-layout";

interface CategoryTheme {
  bgHero: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  pillBorder: string;
  accentHex: string;
  genzTagline: string;
  vibe: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  "dry-fruits": {
    bgHero: "bg-[#FAF5EC]", // warm almond cream
    borderColor: "border-[#E5D5C0]",
    badgeBg: "bg-[#78350F]/10",
    badgeText: "text-[#78350F]",
    pillBorder: "border-[#78350F]/30",
    accentHex: "#78350F",
    genzTagline: "100% Pure & Fresh Harvest · Apka Trusted Stop",
    vibe: "Handpicked premium almonds, cashews & seeds. Fresh harvest only.",
  },
  spices: {
    bgHero: "bg-[#FFF0F0]", // vibrant paprika / kashmiri red tint
    borderColor: "border-[#FFC9C4]",
    badgeBg: "bg-[#991B1B]/10",
    badgeText: "text-[#991B1B]",
    pillBorder: "border-[#991B1B]/30",
    accentHex: "#991B1B",
    genzTagline: "100% Pure Aroma, Zero Artificial Color · Apka Trusted Stop",
    vibe: "Freshly ground whole spices with authentic color and pungent aroma.",
  },
  "pulses-lentils": {
    bgHero: "bg-[#F0FAF2]", // organic soothing green
    borderColor: "border-[#C5E8CE]",
    badgeBg: "bg-[#166534]/10",
    badgeText: "text-[#166534]",
    pillBorder: "border-[#166534]/30",
    accentHex: "#166534",
    genzTagline: "High Protein, Triple Cleaned · Apka Trusted Stop",
    vibe: "Unpolished, stone-free pulses directly from fertile Punjab plains.",
  },
  "rice-grains": {
    bgHero: "bg-[#FEF8EA]", // golden kainat wheat
    borderColor: "border-[#FDE5A8]",
    badgeBg: "bg-[#92400E]/10",
    badgeText: "text-[#92400E]",
    pillBorder: "border-[#92400E]/30",
    accentHex: "#92400E",
    genzTagline: "Aged Super Kainat 1121 Basmati · Apka Trusted Stop",
    vibe: "Long-grain aromatic basmati that elongates to double its size upon cooking.",
  },
  "cooking-oils": {
    bgHero: "bg-[#FEFCE8]", // sunny sunflower gold
    borderColor: "border-[#FDE047]",
    badgeBg: "bg-[#854D0E]/10",
    badgeText: "text-[#854D0E]",
    pillBorder: "border-[#854D0E]/30",
    accentHex: "#854D0E",
    genzTagline: "Light, Double-Refined Pure Oil · Apka Trusted Stop",
    vibe: "Double-refined premium cooking oil for crisp frying and light digestion.",
  },
  "sugar-salt": {
    bgHero: "bg-[#FDF2F8]", // crystalline himalayan pink rose
    borderColor: "border-[#FBCFE8]",
    badgeBg: "bg-[#9D174D]/10",
    badgeText: "text-[#9D174D]",
    pillBorder: "border-[#9D174D]/30",
    accentHex: "#9D174D",
    genzTagline: "100% Pure Himalayan Pink Salt · Apka Trusted Stop",
    vibe: "Authentic Khewra rock pink salt and pure sulfur-free granulated white sugar.",
  },
};

export const Route = createFileRoute("/category/$categoryId")({
  head: () => ({
    meta: [
      { title: "Category | Nadeem Traders — Apka Trusted Stop" },
      {
        name: "description",
        content:
          "Browse spices, basmati rice, pulses, dry fruits, and cooking oils. Fast PostEx Courier delivery across Pakistan.",
      },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useParams() as any;
  const { categories, products, currentUser, wishlist, toggleWishlist, isLoading } = useStoreData();

  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const category = useMemo(() => {
    const raw = String(categoryId || "").trim().toLowerCase();
    const numId = Number(raw);
    return (
      categories.find((c) => !Number.isNaN(numId) && c.id === numId) ||
      categories.find(
        (c) =>
          c.name.toLowerCase() === raw ||
          getCategoryMeta(c.name).slug === raw ||
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === raw
      ) ||
      null
    );
  }, [categories, categoryId]);

  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return products.filter(
      (p) =>
        p.category_id === category.id ||
        (p.category_name && p.category_name.toLowerCase() === category.name.toLowerCase())
    );
  }, [products, category]);

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter((p) => {
      return (
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [categoryProducts, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = a.price;
      const priceB = b.price;
      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "title-az") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const handleAddToCart = (product: any, qty: number = 1) => {
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty}× ${product.name} to your bag`);
  };

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  };

  if (!category && !isLoading) {
    return (
      <StoreLayout categories={categories} products={products} currentUser={currentUser}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
          <h1 className="font-display text-4xl font-normal text-foreground">Category Not Found</h1>
          <div className="pt-4">
            <Link
              to="/categories"
              className="bg-primary px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const activeCategory = category || categories[0];
  const meta = getCategoryMeta(activeCategory.name);
  const theme = CATEGORY_THEMES[meta.slug] || {
    bgHero: "bg-[#F1ECE1]",
    borderColor: "border-[#E5DEC9]",
    badgeBg: "bg-[#C5A56E]/15",
    badgeText: "text-[#8C6D37]",
    pillBorder: "border-[#C5A56E]/40",
    accentHex: "#8C6D37",
    genzTagline: "Apka Trusted Stop — 100% Asli Kiryana",
    vibe: meta.description,
  };
  const otherCategories = categories.filter((c) => c.id !== activeCategory.id);

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      activeCategoryId={activeCategory.id}
      quickViewProduct={quickViewProduct}
      setQuickViewProduct={setQuickViewProduct}
    >
      {/* Category Hero with Bespoke Color Palette */}
      <section className={`border-b ${theme.borderColor} ${theme.bgHero} transition-colors duration-500`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 grid gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-4 animate-fade-up">
            <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/categories" className="hover:text-foreground">
                Categories
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-semibold">{activeCategory.name}</span>
            </nav>

            <div className="inline-flex items-center gap-2 border px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ borderColor: theme.accentHex + "40", backgroundColor: theme.accentHex + "12", color: theme.accentHex }}>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{theme.genzTagline}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-normal text-foreground leading-none">
              {activeCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              {theme.vibe}
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className={`aspect-[16/9] w-full overflow-hidden border ${theme.borderColor} bg-muted shadow-sm`}>
              {activeCategory.image_url && (
                <img
                  src={activeCategory.image_url}
                  alt={activeCategory.name}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sub-bar with Search & Sorting (Clean, No Wholesale/Retail Switcher) */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${activeCategory.name}...`}
                className="border border-border bg-card pl-8 pr-6 py-1.5 text-xs focus:border-foreground focus:outline-none w-52 sm:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {sortedProducts.length} {sortedProducts.length === 1 ? "Product" : "Products"}
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-border bg-card px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-foreground focus:outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title-az">Alphabetical</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 space-y-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {sortedProducts.map((p) => (
            <ModernProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
              onToggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>

        <div className="border-t border-border pt-10 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-secondary">
            Other Collections · Apka Trusted Stop
          </p>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}` as any}
                className="border border-border bg-card px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-foreground hover:border-foreground transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
