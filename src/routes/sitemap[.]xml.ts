import { createFileRoute } from "@tanstack/react-router";
import { sql } from "../lib/db";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS } from "../lib/catalog";

const SITE_URL = "https://nadeemtraders.com";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/categories",
  "/offers",
  "/bulk-orders",
  "/contact",
  "/delivery-info",
  "/privacy-policy",
  "/terms-of-use",
  "/shipping-policy",
  "/refund-policy",
  "/cookie-policy",
];

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function renderUrlset(entries: SitemapEntry[]) {
  const urls = entries
    .map(({ loc, lastmod }) =>
      lastmod
        ? `  <url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`
        : `  <url><loc>${escapeXml(loc)}</loc></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = STATIC_PATHS.map((path) => ({
          loc: `${SITE_URL}${path}`,
        }));

        if (!sql) {
          for (const c of CATALOG_CATEGORIES) {
            entries.push({ loc: `${SITE_URL}/category/${c.id}` });
          }
          for (const p of CATALOG_PRODUCTS) {
            entries.push({ loc: `${SITE_URL}/product/${p.id}` });
          }
        } else {
          const cols = await sql`
            SELECT table_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name IN ('products', 'categories')
              AND column_name = 'updated_at'
          `;
          const hasCatUpdated = cols.some((r) => r.table_name === "categories");
          const hasProdUpdated = cols.some((r) => r.table_name === "products");

          const categoryRows = hasCatUpdated
            ? await sql`SELECT id, updated_at FROM categories ORDER BY position, id`
            : await sql`SELECT id FROM categories ORDER BY position, id`;
          const productRows = hasProdUpdated
            ? await sql`SELECT id, updated_at FROM products WHERE status = 'active' ORDER BY id`
            : await sql`SELECT id FROM products WHERE status = 'active' ORDER BY id`;

          for (const c of categoryRows) {
            entries.push({
              loc: `${SITE_URL}/category/${c.id}`,
              lastmod: hasCatUpdated ? formatLastmod(c.updated_at) : undefined,
            });
          }
          for (const p of productRows) {
            entries.push({
              loc: `${SITE_URL}/product/${p.id}`,
              lastmod: hasProdUpdated ? formatLastmod(p.updated_at) : undefined,
            });
          }
        }

        return new Response(renderUrlset(entries), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
