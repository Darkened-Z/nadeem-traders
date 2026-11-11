import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { StoreLayout, ModernProductCard, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Brands | Nadeem Traders" },
      { name: "description", content: "Shop products by brand." },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const { categories, products, brands, currentUser } = useStoreData();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const brandNames = useMemo(
    () => Array.from(new Set([...brands.map((b) => b.name), ...products.map((p) => p.brand)])),
    [brands, products],
  );

  const filteredProducts = selectedBrand ? products.filter((p) => p.brand === selectedBrand) : products;
  const chip = (active: boolean) =>
    `shrink-0 px-4 py-2 text-sm font-medium ${active ? "bg-foreground text-background" : "border border-border bg-card"}`;

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Shop by brand</h1>

        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" onClick={() => setSelectedBrand(null)} className={chip(selectedBrand === null)}>
            All
          </button>
          {brandNames.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBrand(selectedBrand === b ? null : b)}
              className={chip(selectedBrand === b)}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <ModernProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
