import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "./admin";

const RANGES = [1, 7, 30, 90] as const;
export type VisitorRange = (typeof RANGES)[number];

async function hogql(query: string): Promise<any[][]> {
  const res = await fetch(`https://us.posthog.com/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!res.ok) throw new Error(`PostHog query failed (${res.status})`);
  return (await res.json()).results ?? [];
}

export const adminGetVisitorAnalytics = createServerFn({ method: "GET" })
  .validator((data: { days: number }) => ({
    days: (RANGES as readonly number[]).includes(data.days) ? data.days : 7,
  }))
  .handler(async ({ data }) => {
    await assertAdmin();
    if (!process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID) return { configured: false as const };

    const since = `timestamp >= now() - INTERVAL ${data.days} DAY`;
    const [funnel, abandoned, sources, devices, searches, whatsapp, products, daily] = await Promise.all([
      hogql(`
        SELECT
          uniqIf(distinct_id, event = '$pageview'),
          uniqIf(distinct_id, event = 'product_viewed'),
          uniqIf(distinct_id, event = 'added_to_cart'),
          uniqIf(distinct_id, event = 'checkout_started'),
          uniqIf(distinct_id, event = 'checkout_submitted'),
          uniqIf(distinct_id, event = 'order_placed'),
          countIf(event = '$pageview'),
          uniqIf(properties.$session_id, event = '$pageview')
        FROM events WHERE ${since}`),
      hogql(`
        SELECT coalesce(properties.last_field, 'never typed') AS field, count()
        FROM events WHERE event = 'checkout_abandoned' AND ${since}
        GROUP BY field ORDER BY count() DESC`),
      hogql(`
        SELECT if(notEmpty(coalesce(properties.utm_source, '')), properties.utm_source, properties.$referring_domain) AS source,
               uniq(distinct_id)
        FROM events WHERE event = '$pageview' AND ${since}
        GROUP BY source ORDER BY uniq(distinct_id) DESC LIMIT 8`),
      hogql(`
        SELECT properties.$device_type AS device, uniq(distinct_id)
        FROM events WHERE event = '$pageview' AND ${since}
        GROUP BY device ORDER BY uniq(distinct_id) DESC`),
      hogql(`
        SELECT lower(properties.query) AS q, count(), min(toInt(properties.results))
        FROM events WHERE event = 'searched' AND ${since}
        GROUP BY q ORDER BY count() DESC LIMIT 10`),
      hogql(`
        SELECT coalesce(nullIf(properties.label, ''), 'WhatsApp link') AS label, count()
        FROM events WHERE event = 'whatsapp_clicked' AND ${since}
        GROUP BY label ORDER BY count() DESC LIMIT 8`),
      hogql(`
        SELECT properties.product_name AS product, countIf(event = 'product_viewed'), countIf(event = 'added_to_cart')
        FROM events WHERE event IN ('product_viewed', 'added_to_cart') AND ${since}
        GROUP BY product ORDER BY countIf(event = 'product_viewed') DESC LIMIT 10`),
      hogql(`
        SELECT toDate(toTimeZone(timestamp, 'Asia/Karachi')) AS day, uniqIf(distinct_id, event = '$pageview'), uniqIf(distinct_id, event = 'order_placed')
        FROM events WHERE event IN ('$pageview', 'order_placed') AND ${since}
        GROUP BY day ORDER BY day`),
    ]);

    const [visitors, viewed, added, checkout, submitted, ordered, pageviews, sessions] = (funnel[0] ?? []).map(Number);
    const pairs = (rows: any[][]) => rows.map(([name, count]) => ({ name: String(name ?? "Unknown"), count: Number(count) }));
    return {
      configured: true as const,
      days: data.days,
      totals: { visitors, sessions, pageviews },
      funnel: [
        { step: "Visited the site", count: visitors },
        { step: "Viewed a product", count: viewed },
        { step: "Added to bag", count: added },
        { step: "Opened checkout", count: checkout },
        { step: "Pressed Place Order", count: submitted },
        { step: "Order placed", count: ordered },
      ],
      abandoned: pairs(abandoned),
      sources: pairs(sources),
      devices: pairs(devices),
      whatsapp: pairs(whatsapp),
      searches: searches.map(([q, count, results]) => ({ query: String(q), count: Number(count), results: Number(results) })),
      products: products.map(([name, views, adds]) => ({ name: String(name ?? "Unknown"), views: Number(views), adds: Number(adds) })),
      daily: daily.map(([day, v, o]) => ({ day: String(day), visitors: Number(v), orders: Number(o) })),
    };
  });
