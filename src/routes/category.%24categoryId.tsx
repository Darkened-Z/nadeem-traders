import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import { recordRecentlyViewedDb } from "../lib/actions";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
  getCategoryMeta,
} from "../components/store-layout";

export const Route = createFileRoute("/category/%24categoryId")({
  head: () => ({
    meta: [
      { title: "Category | Nadeem Traders" },
      {
        name: "description",
        content:
          "Browse spices, basmati rice, pulses, dry fruits, and cooking oils by category.",
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
  const [pricingMode, setPricingMode] = useState<"retail" | "wholesale">("retail");
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
      const priceA = pricingMode === "wholesale" && a.wholesale_price ? a.wholesale_price : a.price;
      const priceB = pricingMode === "wholesale" && b.wholesale_price ? b.wholesale_price : b.price;
      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "title-az") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filteredProducts, sortBy, pricingMode]);

  const handleAddToCart = (product: any, qty: number = 1) => {
    if (!currentUser) {
      toast.error("Please sign in to add items to your bag.");
      window.location.href = `/login?redirect=/category/${categoryId}`;
      return;
    }
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
      <section className="border-b border-border bg-[#F1ECE1]">
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

            <h1 className="font-display text-4xl sm:text-5xl font-normal text-foreground leading-none">
              {activeCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              {meta.description}
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[16/9] w-full overflow-hidden border border-border bg-muted">
              {activeCategory.image_url && (
                <img
                  src={activeCategory.image_url}
                  alt={activeCategory.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex border border-border bg-card p-0.5 text-[10px] uppercase tracking-[0.18em]">
              <button
                type="button"
                onClick={() => setPricingMode("retail")}
                className={`px-3 py-1.5 transition ${
                  pricingMode === "retail"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Retail
              </button>
              <button
                type="button"
                onClick={() => setPricingMode("wholesale")}
                className={`px-3 py-1.5 transition ${
                  pricingMode === "wholesale"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Wholesale
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeCategory.name}...`}
                className="border border-border bg-card pl-8 pr-6 py-1.5 text-xs focus:border-foreground focus:outline-none w-44 sm:w-56"
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
              {sortedProducts.length} {sortedProducts.length === 1 ? "Item" : "Items"}
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
              showWholesalePrimary={pricingMode === "wholesale"}
            />
          ))}
        </div>

        <div className="border-t border-border pt-10 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-secondary">
            Other Categories
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
