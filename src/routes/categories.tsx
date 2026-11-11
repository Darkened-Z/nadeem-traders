import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout, CategoryTile, useStoreData } from "../components/store-layout";

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
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">All categories</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kitchen ki har zaroorat, ek jagah.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryTile key={cat.id} category={cat} />
          ))}
        </div>
      </section>
    </StoreLayout>
  );
}
