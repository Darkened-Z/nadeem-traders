import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, Search, X } from "lucide-react";
import { getCategorySeo, truncateWords, type CategorySeoData } from "../lib/actions";
import { breadcrumbJsonLd, toAbsoluteUrl } from "../lib/structured-data";
import { track } from "../lib/analytics";
import {
  StoreLayout,
  ModernProductCard,
  useStoreData,
  getCategoryMeta,
  categoryTint,
} from "../components/store-layout";

function buildCategoryHead(category: CategorySeoData | null | undefined) {
  if (!category) {
    const meta = [
      { title: "Category | Nadeem Traders" },
      {
        name: "description",
        content: "Dry fruits, spices, whole spices and seeds. Cash on delivery across Pakistan.",
      },
    ];
    if (category === null) meta.push({ name: "robots", content: "noindex" });
    return { meta };
  }
  const title = `${category.name} – Buy Online in Pakistan | Nadeem Traders`;
  const names = category.productNames.slice(0, 4);
  const full =
    names.length > 0
      ? `Shop ${category.name} online in Pakistan including ${names.join(", ")}. ${category.productCount} products · Cash on delivery.`
      : `Shop fresh ${category.name} online in Pakistan at Nadeem Traders. Cash on delivery across Pakistan.`;
  const description =
    full.length <= 155
      ? full
      : `${truncateWords(`Shop ${category.name} online in Pakistan: ${names.slice(0, 3).join(", ")}. Cash on delivery at Nadeem Traders`, 154)}.`;
  const ogImage = toAbsoluteUrl(category.image_url);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
      {
        "script:ld+json": breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: category.name, path: `/category/${category.id}` },
        ]),
      },
    ],
  };
}

export const Route = createFileRoute("/category/$categoryId")({
  loader: ({ params }) => getCategorySeo({ data: { id: params.categoryId } }).catch(() => undefined),
  staleTime: 5 * 60_000,
  head: ({ loaderData }) => buildCategoryHead(loaderData),
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useParams() as any;
  const { categories, products, currentUser, isLoading } = useStoreData();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const category = useMemo(() => {
    const raw = String(categoryId || "").trim().toLowerCase();
    const numId = Number(raw);
    return (
      categories.find((c) => !Number.isNaN(numId) && c.id === numId) ||
      categories.find(
        (c) => c.name.toLowerCase() === raw || getCategoryMeta(c.name).slug === raw,
      ) ||
      null
    );
  }, [categories, categoryId]);

  useEffect(() => {
    if (category) track("category_viewed", { category_id: category.id, category_name: category.name });
  }, [category?.id]);

  const sortedProducts = useMemo(() => {
    if (!category) return [];
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (p.category_id === category.id ||
          (p.category_name && p.category_name.toLowerCase() === category.name.toLowerCase())) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
    if (sortBy === "price-low") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sortBy === "price-high") list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    if (sortBy === "title-az") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, searchQuery, sortBy]);

  if (!category && !isLoading) {
    return (
      <StoreLayout categories={categories} products={products} currentUser={currentUser}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="font-display text-4xl font-semibold">Category Nahi Mili</h1>
          <Link
            to="/categories"
            className="btn-gold mt-6 inline-block px-7 py-3 text-sm font-semibold"
          >
            All categories
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const activeCategory = category || categories[0];
  const meta = getCategoryMeta(activeCategory.name);
  const otherCategories = categories.filter((c) => c.id !== activeCategory.id);

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <section style={{ backgroundColor: categoryTint(meta.color) }}>
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-2">
          <div>
            <Link
              to="/categories"
              className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Categories
            </Link>
            <h1
              className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl"
              style={{ color: meta.color }}
            >
              {activeCategory.name}
            </h1>
            {activeCategory.name_ur && (
              <p lang="ur" className="font-urdu mt-2 text-2xl" style={{ color: meta.color }}>
                {activeCategory.name_ur}
              </p>
            )}
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{meta.tagline}</p>
          </div>
          {activeCategory.image_url && (
            <div className="hidden aspect-[16/10] overflow-hidden md:block">
              <img src={activeCategory.image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCategory.name}`}
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="h-10 shrink-0 border border-border bg-card px-2 text-sm focus:outline-none sm:ml-auto"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low → high</option>
            <option value="price-high">Price: high → low</option>
            <option value="title-az">A → Z</option>
          </select>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="mb-5 text-sm text-muted-foreground">
          {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
        </p>
        {sortedProducts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Kuch Nahi Mila. Search Badal Ke Dekho.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {sortedProducts.map((p) => (
              <ModernProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-14 border-t border-border pt-8">
          <h2 className="text-sm font-semibold">Aur Dekho</h2>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}` as any}
                className="shrink-0 px-4 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: getCategoryMeta(c.name).color }}
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
