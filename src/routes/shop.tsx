import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  StoreLayout,
  ModernProductCard,
  CategorySection,
  useStoreData,
  getCategoryMeta,
} from "../components/store-layout";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "All products | Nadeem Traders" },
      {
        name: "description",
        content: "Spices, basmati rice, pulses, dry fruits aur cooking oil. Cash on delivery across Pakistan.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { categories, products, currentUser } = useStoreData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("default");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const brand = params.get("brand");
    if (q) setSearchQuery(q);
    if (cat && !Number.isNaN(Number(cat))) setSelectedCategory(Number(cat));
    if (brand) setSelectedBrand(brand);
  }, []);

  const sortedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (!q ||
          p.name.toLowerCase().includes(q) ||
          (p.category_name && p.category_name.toLowerCase().includes(q))) &&
        (selectedCategory === null || p.category_id === selectedCategory) &&
        (selectedBrand === null || p.brand === selectedBrand),
    );
    if (sortOption === "price-asc") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sortOption === "price-desc") list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return list;
  }, [products, searchQuery, selectedCategory, selectedBrand, sortOption]);

  const isBrowsing = !searchQuery.trim() && selectedCategory === null && selectedBrand === null;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedBrand(null);
  };

  const chipBase = "shrink-0 px-4 py-2 text-sm font-medium transition-colors";

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">All Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sab Kuch, Ek Jagah. Sahi Daam, No Cap.</p>

        <div className="mt-6 flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              className="h-10 w-full border border-border bg-card pl-9 pr-9 text-base sm:text-sm focus:border-foreground focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            aria-label="Sort products"
            className="h-10 shrink-0 border border-border bg-card px-2 text-sm focus:outline-none sm:ml-auto"
          >
            <option value="default">Featured</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
          </select>
        </div>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`${chipBase} ${
              selectedCategory === null ? "bg-foreground text-background" : "border border-border bg-card"
            }`}
          >
            All
          </button>
          {categories.map((c) => {
            const active = selectedCategory === c.id;
            const color = getCategoryMeta(c.name).color;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(active ? null : c.id)}
                className={`${chipBase} ${active ? "text-white" : "border border-border bg-card"}`}
                style={active ? { backgroundColor: color } : undefined}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {!isBrowsing &&
          (sortedProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-2xl">Kuch Nahi Mila</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm font-semibold underline underline-offset-4"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
              {sortedProducts.map((p) => (
                <ModernProductCard key={p.id} product={p} />
              ))}
            </div>
          ))}
      </div>

      {isBrowsing &&
        categories.map((c) => {
          const items = sortedProducts.filter((p) => p.category_id === c.id);
          return items.length > 0 ? <CategorySection key={c.id} category={c} items={items} /> : null;
        })}
    </StoreLayout>
  );
}
