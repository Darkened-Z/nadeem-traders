import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "./admin";
import { getGoogleAccessToken } from "./google-service-auth";

const RANGES = [7, 28, 90] as const;
const SITE = process.env.GSC_SITE_URL || "sc-domain:nadeemtraders.com";
const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(auth: string, startDate: string, endDate: string, dimensions: string[], rowLimit = 25): Promise<Row[]> {
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dataState: "all" }),
  });
  if (res.status === 403) throw new Error("The service account has no access yet. Add its email as a user in Search Console.");
  if (!res.ok) throw new Error(`Search Console query failed (${res.status})`);
  return ((await res.json()) as { rows?: Row[] }).rows ?? [];
}

const metrics = (r: Row) => ({
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: Math.round(r.ctr * 1000) / 10,
  position: Math.round(r.position * 10) / 10,
});

export const adminGetSearchConsole = createServerFn({ method: "GET" })
  .validator((data: { days: number }) => ({
    days: (RANGES as readonly number[]).includes(data.days) ? data.days : 28,
  }))
  .handler(async ({ data }) => {
    await assertAdmin("search");
    if (!process.env.GSC_SERVICE_ACCOUNT) return { configured: false as const };

    const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
    const start = day(data.days);
    const end = day(0);
    const auth = await getGoogleAccessToken(process.env.GSC_SERVICE_ACCOUNT, GSC_SCOPE);
    const [totals, queries, pages, daily, devices] = await Promise.all([
      query(auth, start, end, []),
      query(auth, start, end, ["query"], 25),
      query(auth, start, end, ["page"], 15),
      query(auth, start, end, ["date"], 100),
      query(auth, start, end, ["device"], 5),
    ]);

    const named = (rows: Row[]) => rows.map((r) => ({ name: r.keys?.[0] ?? "", ...metrics(r) }));
    return {
      configured: true as const,
      days: data.days,
      totals: totals[0] ? metrics(totals[0]) : { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      queries: named(queries),
      pages: named(pages).map((p) => ({ ...p, name: p.name.replace(/^https:\/\/(www\.)?nadeemtraders\.com/, "") || "/" })),
      daily: named(daily).map(({ name, clicks, impressions }) => ({ day: name, clicks, impressions })),
      devices: named(devices),
    };
  });
