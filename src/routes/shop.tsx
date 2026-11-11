import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  Check,
  ShoppingBag,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { recordRecentlyViewedDb } from "../lib/actions";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
} from "../components/store-layout";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "All Products | Nadeem Traders — Apka Trusted Stop" },
      {
        name: "description",
        content: "Explore 100% pure spices, aged basmati rice, pulses, and dry fruits from Apka Trusted Stop. Delivered via PostEx Courier.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { categories, products, brands, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>("default");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const brandParam = params.get("brand");
      const queryParam = params.get("q");
      const catParam = params.get("category");

      if (brandParam) setSelectedBrands([brandParam]);
      if (queryParam) setSearchQuery(queryParam);
      if (catParam && !Number.isNaN(Number(catParam))) {
        setSelectedCategories([Number(catParam)]);
      }
    }
  }, []);

  const handleCategoryToggle = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSortOption("default");
    setInStockOnly(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(p.category_id);

      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(p.brand);

      const matchesStock = !inStockOnly || p.stock;

      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchQuery, selectedCategories, selectedBrands, inStockOnly]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = a.price;
      const priceB = b.price;

      if (sortOption === "price-asc") return priceA - priceB;
      if (sortOption === "price-desc") return priceB - priceA;
      return 0;
    });
  }, [filteredProducts, sortOption]);

  const handleAddToCart = (product: any, qty: number = 1) => {
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty}× ${product.name} to your bag`);
  };

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    recordRecentlyViewedDb({ data: { productId: product.id } }).catch(() => {});
  };

  return (
    <StoreLayout
      categories={categories}
      products={products}
      currentUser={currentUser}
      quickViewProduct={quickViewProduct}
      setQuickViewProduct={setQuickViewProduct}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">
              Apka Trusted Stop
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-normal text-foreground">
              All Products
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              100% pure kiryana, sahi daam, fast PostEx Courier delivery across Pakistan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-border bg-card px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-foreground focus:outline-none"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border transition ${
              selectedCategories.length === 0
                ? "border-foreground bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoryToggle(c.id)}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border transition ${
                selectedCategories.includes(c.id)
                  ? "border-foreground bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
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
      </div>
    </StoreLayout>
  );
}
