import { createFileRoute } from "@tanstack/react-router";
import { sql } from "../lib/db";

const SITE_URL = "https://nadeemtraders.com";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/categories",
  "/bulk-orders",
  "/brands",
  "/sell-with-us",
  "/contact",
  "/help",
  "/delivery-info",
  "/privacy-policy",
  "/terms-of-use",
  "/shipping-policy",
  "/refund-policy",
  "/cookie-policy",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [categories, products] = await Promise.all([
          sql`SELECT id FROM categories ORDER BY position, id`,
          sql`SELECT id FROM products WHERE status = 'active' ORDER BY id`,
        ]);
        const paths = [
          ...STATIC_PATHS,
          ...categories.map((c) => `/category/${c.id}`),
          ...products.map((p) => `/product/${p.id}`),
        ];
        const urls = paths.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n");
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          },
        );
      },
    },
  },
});
