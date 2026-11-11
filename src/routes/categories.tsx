import { createFileRoute } from "@tanstack/react-router";
import {
  StoreLayout,
  CategoryRail,
  ProductRail,
  SectionHeader,
  useStoreData,
  getCategoryMeta,
} from "../components/store-layout";

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
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12">
        <section>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">All categories</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Kitchen ki har zaroorat, ek jagah.</p>
          <CategoryRail categories={categories} />
        </section>

        {categories.map((c) => {
          const items = products.filter((p) => p.category_id === c.id);
          if (items.length === 0) return null;
          const meta = getCategoryMeta(c.name);
          return (
            <section key={c.id}>
              <SectionHeader title={c.name} subtitle={meta.tagline} href={`/category/${c.id}`} color={meta.color} />
              <ProductRail products={items} />
            </section>
          );
        })}
      </div>
    </StoreLayout>
  );
}
