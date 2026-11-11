import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout, CategoryRail, CategorySection, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories | Nadeem Traders" },
      {
        name: "description",
        content:
          "Dry Fruits, Spices, Pulses & Lentils, Rice & Grains, Cooking Oils, Sugar & Salt — Nadeem Traders.",
      },
    ],
  }),
  component: CategoriesDirectoryPage,
});

function CategoriesDirectoryPage() {
  const { categories, products, currentUser } = useStoreData();

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">All Categories</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Kitchen Ki Har Zaroorat, Ek Jagah.</p>
        <CategoryRail categories={categories} />
      </section>

      {categories.map((c) => {
        const items = products.filter((p) => p.category_id === c.id);
        return items.length > 0 ? <CategorySection key={c.id} category={c} items={items} /> : null;
      })}
    </StoreLayout>
  );
}
