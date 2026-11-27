# SEO work: task specs

One PR per task, in this order. Each PR must pass `npx tsc --noEmit -p .` and must not touch files outside its task.

## Read first: repo rules

- **Stack:** TanStack Start 1.169 (React 19, file routes in `src/routes`), Neon Postgres via `postgres`, deployed on Vercel. Pushing to `main` deploys production, so work on branches and open PRs only.
- **`.env.local` points at the PRODUCTION database.** `npm run dev` runs `initDb()` migrations against it. Do not add migrations, seed data or write queries without saying so in the PR description.
- Store data loads client-side through server functions in `src/lib/actions.ts` (`getProducts`, `getCategories`). There are no route loaders yet.
- `src/routeTree.gen.ts` is generated. Commit it **only** when your PR adds a new route file.
- Files use CRLF line endings. Keep them.
- Site URL: `https://nadeemtraders.com` (no `www`; `www` already redirects).
- Catalogue: dry fruits, spices, whole spices, seeds, special items (oats, ispaghol). The store does **not** sell rice, pulses or cooking oil right now.
- Products can have options (`product_variants` table: Cashews Plain/Roasted, Walnuts Cap/Without Cap, Pistachios In-Shell/Without Shell, Garam Masala, Black Pepper, Red Chilli, Turmeric, Cumin). Each option has its own price, weight and image. `getProducts` returns them as `product.variants`. Use `optionView()` / `productOptions()` from `src/lib/catalog.ts` and `cleanProductTitle()` for display names.
- No comments unless the reason is non-obvious. No new dependencies unless the task says so.

---

## PR 1: Per-page titles and descriptions for products and categories

**Problem:** every product page is titled "Product | Nadeem Traders" with the same description, and category pages are titled "Category | …". The `head()` in `src/routes/product.$productId.tsx` and `src/routes/category.$categoryId.tsx` is static.

**Do:**
1. Add a server function `getProductSeo({ id })` in `src/lib/actions.ts`. It returns, for an **active** product: `name`, `name_ur`, `category_name`, `price`, `weight`, `image_url`, `origin`, `description`, and its options (name, price, weight, image_url) ordered by `position`. Return `null` if not found. Add the same for categories: `getCategorySeo({ id })` returns name and product count. Read-only queries only.
2. In both routes, add a `loader` that calls it with the route param, and make `head({ loaderData })` build:
   - **Product title:** `{cleanProductTitle(name)} ({name_ur}) {weight} – Rs {lowest price} | Nadeem Traders`. Lowest price means the cheapest option if there are options, otherwise `price`. Omit the price when it's null (a "Rate Poochein" product).
   - **Product description:** max 155 chars, including origin when present, the option names if any, and "Cash on delivery across Pakistan."
   - **Category title:** `{Category name} – Buy Online in Pakistan | Nadeem Traders`, with a description naming 3–4 of its products.
   - A not-found product or category keeps a generic title and adds `<meta name="robots" content="noindex">`.
3. Keep the existing client-side rendering as it is; the loader is only for `head`.

**Done when:** `curl -s http://localhost:5173/product/2 | grep -o '<title>[^<]*'` shows the cashews title with the price, in the server HTML and not only after hydration. Same for a category. View-source shows a unique description per product.

---

## PR 2: `robots.txt` and a dynamic `sitemap.xml`

**Do:**
1. Add `public/robots.txt`:
   ```
   User-agent: *
   Disallow: /admin
   Disallow: /dashboard
   Disallow: /profile
   Disallow: /login
   Disallow: /*?q=
   Sitemap: https://nadeemtraders.com/sitemap.xml
   ```
2. Add a server route at `src/routes/sitemap[.]xml.ts` using TanStack Start server handlers (`createFileRoute('/sitemap.xml')({ server: { handlers: { GET } } })`; check the installed version's docs for the exact API). It returns `application/xml` listing:
   - static pages: `/`, `/shop`, `/categories`, `/offers`, `/bulk-orders`, `/contact`, `/delivery-info`, and the policy pages
   - every **active** product (`/product/{id}`) and every category (`/category/{id}`), read from the DB, with `lastmod` from `updated_at` if that column exists
3. Cache header: `Cache-Control: public, max-age=3600`.

**Done when:** `/robots.txt` and `/sitemap.xml` return 200 locally, the sitemap validates as XML, and it contains no admin, dashboard or draft products.

---

## PR 3: Structured data (JSON-LD)

**Do:**
1. **Product pages** (in `head`, using PR 1's loader data): a `Product` schema with `name`, `image` (absolute URL), `description`, `brand` (`Nadeem Traders`), `sku` (product id), and `offers`:
   - with options: an `AggregateOffer` (`lowPrice`, `highPrice`, `offerCount`, `priceCurrency: "PKR"`) plus one `Offer` per option
   - without options: a single `Offer`
   - each offer has `availability: https://schema.org/InStock` and `url`
   - no `offers` at all when the price is null
2. **Homepage:** `Organization` (name, url, logo `https://nadeemtraders.com/LOGO.png`) and `WebSite` with a `SearchAction` pointing at `https://nadeemtraders.com/shop?q={search_term_string}`.
3. **Category pages:** `BreadcrumbList` (Home › Category). Product pages get Home › Category › Product.
4. Do **not** add `aggregateRating` or reviews unless real review data exists.

**Done when:** Google's Rich Results Test (https://search.google.com/test/rich-results), run on the page HTML, reports the Product, Organization and Breadcrumb schemas with no errors. Paste the result summary in the PR.

---

## PR 4: Social and WhatsApp preview cards (Open Graph)

**Do:**
1. **Root defaults** in `src/routes/__root.tsx`:
   - `og:site_name`, `og:type=website`, `og:image=https://nadeemtraders.com/BANNER.png` (check it's at least 1200×630; otherwise produce an `og-default.jpg` at 1200×630 from it)
   - `twitter:card=summary_large_image`
   - `og:locale=en_PK`
2. **Product pages:** `og:title`, `og:description` and `og:image` (absolute URL of the product image; for products with options, the first option's image), `og:type=product`, `product:price:amount`, `product:price:currency=PKR`.
3. **Category pages:** `og:image` = the category image.
4. **Every page:** `og:url` and `<link rel="canonical">` with the absolute URL, query string removed.

**Done when:** the Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/), run on a product URL after deploy, shows the product photo, name and price. Locally, check the server HTML with curl.

---

## PR 5: Copy fixes

**Do:**
1. Replace every description that mentions rice, basmati, pulses or cooking oil with copy that matches the real catalogue. Find them with `grep -rni "basmati\|pulses\|cooking oil\|rice" src/routes`. The `/shop` description and the root description are known ones.
2. Homepage `<title>`: `Nadeem Traders – Dry Fruits, Spices & Seeds Online in Pakistan | Cash on Delivery`.
3. Add `<html lang="en">`; the page is mixed English and Roman Urdu, which is fine.

**Done when:** that grep returns nothing customer-facing.

---

## Not for the implementing agent

The site owner does these: the Google Search Console verification tag, creating the Google Business Profile, and the slug URLs (`/product/cashews`), which need a design decision first.

## PR checklist (paste into every PR)

- [ ] `npx tsc --noEmit -p .` passes
- [ ] No DB writes or migrations (or explained)
- [ ] `routeTree.gen.ts` committed only if a route was added
- [ ] Server-rendered HTML checked with curl (paste the output)
- [ ] Only this task's files changed
