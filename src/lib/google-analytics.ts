import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "./admin";
import { getGoogleAccessToken } from "./google-service-auth";

const RANGES = [7, 28, 90] as const;
const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

type GaRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type GaReportResponse = {
  rows?: GaRow[];
};

type GaBatchResponse = {
  reports?: GaReportResponse[];
};

function numMetric(row: GaRow | undefined, index: number): number {
  const val = Number(row?.metricValues?.[index]?.value ?? 0);
  return Number.isFinite(val) ? val : 0;
}

function dimVal(row: GaRow, index = 0): string {
  return String(row.dimensionValues?.[index]?.value ?? "");
}

function formatGaDate(raw: string): string {
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
}

async function parseGoogleError(res: Response, propertyId: string): Promise<Error> {
  if (res.status === 403) {
    return new Error(
      `The service account does not have Viewer access to GA4 property ${propertyId} yet. Add its email in Google Analytics -> Admin -> Property Access Management.`,
    );
  }
  let detail = `Google Analytics query failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) detail = body.error.message;
  } catch {
    // keep status fallback
  }
  return new Error(detail);
}

async function gaRequest<T>(auth: string, propertyId: string, action: string, body: object): Promise<T> {
  const res = await fetch(`${GA4_API_BASE}/properties/${propertyId}:${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseGoogleError(res, propertyId);
  return (await res.json()) as T;
}

function normalizePropertyId(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/^properties\//, "");
}

/** Query GA4 Data API v1beta for traffic KPIs, trends, pages, sources, cities, devices, and realtime users. */
export const adminGetGoogleAnalytics = createServerFn({ method: "GET" })
  .validator((data: { days: number }) => ({
    days: (RANGES as readonly number[]).includes(data.days) ? data.days : 28,
  }))
  .handler(async ({ data }) => {
    await assertAdmin("google_analytics");

    const serviceAccount = process.env.GA4_SERVICE_ACCOUNT || process.env.GSC_SERVICE_ACCOUNT || "";
    const propertyId = normalizePropertyId(process.env.GA4_PROPERTY_ID);
    const hasValidPropertyId = /^\d+$/.test(propertyId);
    const hasMeasurementId = Boolean(import.meta.env.VITE_GA_MEASUREMENT_ID || process.env.VITE_GA_MEASUREMENT_ID);

    if (!serviceAccount || !hasValidPropertyId) {
      return {
        configured: false as const,
        hasServiceAccount: Boolean(serviceAccount),
        hasPropertyId: Boolean(propertyId),
        hasValidPropertyId,
        hasMeasurementId,
        propertyId: propertyId || null,
      };
    }

    const auth = await getGoogleAccessToken(serviceAccount, GA4_SCOPE);
    const dateRanges = [{ startDate: `${data.days}daysAgo`, endDate: "today" }];

    const [batch, deviceReport, realtimeReport] = await Promise.all([
      gaRequest<GaBatchResponse>(auth, propertyId, "batchRunReports", {
        requests: [
          {
            dateRanges,
            metrics: [
              { name: "activeUsers" },
              { name: "newUsers" },
              { name: "sessions" },
              { name: "screenPageViews" },
              { name: "engagementRate" },
              { name: "averageSessionDuration" },
            ],
          },
          {
            dateRanges,
            dimensions: [{ name: "date" }],
            metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
            orderBys: [{ dimension: { dimensionName: "date", orderType: "ALPHANUMERIC" } }],
            limit: 100,
          },
          {
            dateRanges,
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "averageSessionDuration" }],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 15,
          },
          {
            dateRanges,
            dimensions: [{ name: "sessionSourceMedium" }],
            metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "engagementRate" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 12,
          },
          {
            dateRanges,
            dimensions: [{ name: "city" }],
            metrics: [{ name: "activeUsers" }, { name: "sessions" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 10,
          },
        ],
      }),
      gaRequest<GaReportResponse>(auth, propertyId, "runReport", {
        dateRanges,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 5,
      }),
      gaRequest<GaReportResponse>(auth, propertyId, "runRealtimeReport", {
        metrics: [{ name: "activeUsers" }],
      }).catch(() => null),
    ]);

    const [totalsReport, dailyReport, pagesReport, sourcesReport, citiesReport] = batch.reports ?? [];
    const totalRow = totalsReport?.rows?.[0];

    const totals = {
      activeUsers: Math.round(numMetric(totalRow, 0)),
      newUsers: Math.round(numMetric(totalRow, 1)),
      sessions: Math.round(numMetric(totalRow, 2)),
      pageviews: Math.round(numMetric(totalRow, 3)),
      engagementRate: Math.round(numMetric(totalRow, 4) * 1000) / 10,
      avgSessionDuration: Math.round(numMetric(totalRow, 5)),
    };

    const daily = (dailyReport?.rows ?? []).map((r) => ({
      day: formatGaDate(dimVal(r)),
      users: Math.round(numMetric(r, 0)),
      sessions: Math.round(numMetric(r, 1)),
      pageviews: Math.round(numMetric(r, 2)),
    }));

    const pages = (pagesReport?.rows ?? []).map((r) => ({
      path: dimVal(r) || "/",
      views: Math.round(numMetric(r, 0)),
      users: Math.round(numMetric(r, 1)),
      avgDuration: Math.round(numMetric(r, 2)),
    }));

    const sources = (sourcesReport?.rows ?? []).map((r) => ({
      name: dimVal(r) || "(direct) / (none)",
      sessions: Math.round(numMetric(r, 0)),
      users: Math.round(numMetric(r, 1)),
      engagementRate: Math.round(numMetric(r, 2) * 1000) / 10,
    }));

    const cities = (citiesReport?.rows ?? []).map((r) => {
      const city = dimVal(r);
      return {
        name: !city || city === "(not set)" ? "Unknown location" : city,
        users: Math.round(numMetric(r, 0)),
        sessions: Math.round(numMetric(r, 1)),
      };
    });

    const devices = (deviceReport.rows ?? []).map((r) => {
      const dev = dimVal(r);
      return {
        name: dev ? dev.charAt(0).toUpperCase() + dev.slice(1).toLowerCase() : "Unknown",
        users: Math.round(numMetric(r, 0)),
        sessions: Math.round(numMetric(r, 1)),
      };
    });

    const realtimeActiveUsers = realtimeReport ? Math.round(numMetric(realtimeReport.rows?.[0], 0)) : null;

    return {
      configured: true as const,
      hasMeasurementId,
      propertyId,
      days: data.days,
      realtimeActiveUsers,
      totals,
      daily,
      pages,
      sources,
      cities,
      devices,
    };
  });
