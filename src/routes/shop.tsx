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
      { title: "Product Catalog | Nadeem Traders" },
      {
        name: "description",
        content: "Browse retail and wholesale groceries, spices, rice, pulses, and dry fruits.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { categories, products, brands, currentUser, wishlist, toggleWishlist } = useStoreData();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>("default");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const brandParam = params.get("brand");
      const queryParam = params.get("q");
      const catParam = params.get("category");

      if (tabParam && ["retail", "wholesale"].includes(tabParam)) {
        setSelectedChannel(tabParam);
      }
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
    setSelectedChannel("all");
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

      const matchesChannel =
        selectedChannel === "wholesale" ? !!p.wholesale_price : true;

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(p.category_id);

      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(p.brand);

      const matchesStock = !inStockOnly || p.stock;

      return matchesSearch && matchesChannel && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchQuery, selectedChannel, selectedCategories, selectedBrands, inStockOnly]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA =
        selectedChannel === "wholesale" && a.wholesale_price ? a.wholesale_price : a.price;
      const priceB =
        selectedChannel === "wholesale" && b.wholesale_price ? b.wholesale_price : b.price;

      if (sortOption === "price-asc") return priceA - priceB;
      if (sortOption === "price-desc") return priceB - priceA;
      return 0;
    });
  }, [filteredProducts, sortOption, selectedChannel]);

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
              Storefront
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-normal text-foreground">
              All Products
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex border border-border bg-card p-0.5 text-[10px] uppercase tracking-[0.18em]">
              <button
                type="button"
                onClick={() => setSelectedChannel("all")}
                className={`px-3.5 py-1.5 ${
                  selectedChannel !== "wholesale"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Retail
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel("wholesale")}
                className={`px-3.5 py-1.5 ${
                  selectedChannel === "wholesale"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Wholesale
              </button>
            </div>

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
              showWholesalePrimary={selectedChannel === "wholesale"}
            />
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
