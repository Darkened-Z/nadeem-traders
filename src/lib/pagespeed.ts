import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "./admin";
import { SITE_URL } from "./structured-data";

const STRATEGIES = ["mobile", "desktop"] as const;
type Strategy = (typeof STRATEGIES)[number];

type Audit = {
  title?: string;
  score?: number | null;
  displayValue?: string;
  numericValue?: number;
  details?: { type?: string; overallSavingsMs?: number };
};

type FieldMetric = { percentile?: number; category?: string };

type PsiResponse = {
  error?: { message?: string };
  loadingExperience?: { overall_category?: string; metrics?: Record<string, FieldMetric> };
  lighthouseResult?: {
    categories?: { performance?: { score?: number | null } };
    audits?: Record<string, Audit>;
  };
};

const LAB = [
  { key: "largest-contentful-paint", label: "Largest Contentful Paint", short: "LCP", good: 2500, poor: 4000 },
  { key: "total-blocking-time", label: "Total Blocking Time", short: "TBT", good: 200, poor: 600 },
  { key: "cumulative-layout-shift", label: "Cumulative Layout Shift", short: "CLS", good: 0.1, poor: 0.25 },
  { key: "first-contentful-paint", label: "First Contentful Paint", short: "FCP", good: 1800, poor: 3000 },
  { key: "speed-index", label: "Speed Index", short: "SI", good: 3400, poor: 5800 },
] as const;

const FIELD = [
  { key: "LARGEST_CONTENTFUL_PAINT_MS", short: "LCP", unit: "ms" },
  { key: "INTERACTION_TO_NEXT_PAINT", short: "INP", unit: "ms" },
  { key: "CUMULATIVE_LAYOUT_SHIFT_SCORE", short: "CLS", unit: "cls" },
  { key: "FIRST_CONTENTFUL_PAINT_MS", short: "FCP", unit: "ms" },
] as const;

const CACHE_MS = 15 * 60_000;

function rate(value: number, good: number, poor: number) {
  return value <= good ? "good" : value <= poor ? "average" : "poor";
}

async function runPageSpeed(path: string, strategy: Strategy, key: string) {
  const url = `${SITE_URL}${path}`;
  const params = new URLSearchParams({ url, strategy, category: "performance", key });
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  const body = (await res.json()) as PsiResponse;
  if (!res.ok || !body.lighthouseResult) {
    throw new Error(body.error?.message?.replace(/key=[^&\s]+/g, "key=***") || `PageSpeed test failed (${res.status})`);
  }

  const audits = body.lighthouseResult.audits ?? {};
  const lab = LAB.map((m) => {
    const a = audits[m.key];
    const value = a?.numericValue ?? 0;
    return { short: m.short, label: m.label, display: a?.displayValue ?? "–", rating: rate(value, m.good, m.poor) };
  });

  const fieldMetrics = body.loadingExperience?.metrics;
  const field = fieldMetrics
    ? FIELD.flatMap((m) => {
        const f = fieldMetrics[m.key];
        if (!f || f.percentile == null) return [];
        const display = m.unit === "cls" ? (f.percentile / 100).toFixed(2) : `${(f.percentile / 1000).toFixed(1)} s`;
        const rating = f.category === "FAST" ? "good" : f.category === "AVERAGE" ? "average" : "poor";
        return [{ short: m.short, display, rating }];
      })
    : [];

  const opportunities = Object.values(audits)
    .filter((a) => a.details?.type === "opportunity" && a.score != null && a.score < 0.9 && (a.details.overallSavingsMs ?? 0) > 0)
    .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
    .slice(0, 6)
    .map((a) => ({ title: a.title ?? "", savings: a.displayValue ?? "" }));

  const result = {
    configured: true as const,
    url,
    strategy,
    testedAt: new Date().toISOString(),
    score: Math.round((body.lighthouseResult.categories?.performance?.score ?? 0) * 100),
    lab,
    field,
    opportunities,
  };
  return result;
}

const cache = new Map<string, { at: number; value: Awaited<ReturnType<typeof runPageSpeed>> }>();

export const adminGetPageSpeed = createServerFn({ method: "POST" })
  .validator((data: { path: string; strategy: string; refresh?: boolean }) => {
    const path = typeof data.path === "string" && /^\/[a-z0-9\-/]{0,80}$/i.test(data.path) ? data.path : "/";
    const strategy: Strategy = (STRATEGIES as readonly string[]).includes(data.strategy) ? (data.strategy as Strategy) : "mobile";
    return { path, strategy, refresh: data.refresh === true };
  })
  .handler(async ({ data }) => {
    await assertAdmin("google_analytics");
    const key = process.env.PAGESPEED_API_KEY;
    if (!key) return { configured: false as const };

    const cacheKey = `${data.strategy}:${data.path}`;
    const hit = cache.get(cacheKey);
    if (!data.refresh && hit && Date.now() - hit.at < CACHE_MS) return hit.value;

    const result = await runPageSpeed(data.path, data.strategy, key);
    cache.set(cacheKey, { at: Date.now(), value: result });
    return result;
  });
