import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Clock,
  ExternalLink,
  Eye,
  Gauge,
  Globe,
  Loader2,
  MapPin,
  Percent,
  RefreshCw,
  ShoppingBag,
  Users,
} from "lucide-react";
import { adminGetGoogleAnalytics } from "../lib/google-analytics";
import { adminGetPageSpeed } from "../lib/pagespeed";
import { useAdminQuery } from "../components/admin-shell";
import { Card, EmptyState, PageHeader } from "../components/admin-ui";

export const Route = createFileRoute("/admin/google-analytics")({
  component: GoogleAnalyticsPage,
});

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function pct(n: number, of: number): number {
  return of > 0 ? Math.round((n / of) * 100) : 0;
}

function BarBreakdown({
  rows,
  empty,
}: {
  rows: { name: string; primary: number; secondary?: string }[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-xs text-[#8A8A8A]">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.primary), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-[#303030]" title={r.name}>
              {r.name}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-[#303030]">
              {r.primary.toLocaleString()}
              {r.secondary && <span className="ml-1.5 font-normal text-[#8A8A8A]">{r.secondary}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[#F1F1F1]">
            <div className="h-full rounded-full bg-[#0B4A36]" style={{ width: `${pct(r.primary, max)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page views",
  view_item: "Product views",
  add_to_cart: "Added to cart",
  begin_checkout: "Checkout started",
  checkout_submitted: "Checkout submitted",
  purchase: "Orders placed",
  order_failed: "Order failed",
  checkout_abandoned: "Checkout abandoned",
  whatsapp_clicked: "WhatsApp clicks",
  phone_clicked: "Phone clicks",
  search: "Searches",
  option_selected: "Pack size picked",
  cart_viewed: "Cart opened",
  category_viewed: "Category views",
  scroll: "Scrolled to bottom",
  click: "Outbound link clicks",
  form_start: "Form started",
  form_submit: "Form submitted",
  user_engagement: "Engaged visits",
};
const HIDDEN_EVENTS = new Set(["session_start", "first_visit"]);

const rs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: typeof Users }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
      <div className="flex items-center justify-between text-[#616161]">
        <p className="text-[13px] font-medium">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#1A1A1A]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[#616161]">{sub}</p>}
    </div>
  );
}

function Funnel({ steps }: { steps: { step: string; users: number }[] }) {
  const top = Math.max(steps[0]?.users ?? 0, 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].users : 0;
        const kept = i > 0 && prev > 0 ? pct(s.users, prev) : null;
        return (
          <li key={s.step}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-medium text-[#303030]">
                {i + 1}. {s.step}
              </span>
              <span className="shrink-0 tabular-nums">
                <strong className="text-[#1A1A1A]">{s.users.toLocaleString()}</strong>
                {kept !== null && <span className="ml-1.5 text-[#8A8A8A]">({kept}% of previous)</span>}
              </span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-[#F1F1F1]">
              <div className="h-full rounded-full bg-[#C9A24A]" style={{ width: `${Math.max(pct(s.users, top), s.users > 0 ? 2 : 0)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const RATING_STYLE: Record<string, string> = {
  good: "bg-[#DCFCE7] text-[#166534]",
  average: "bg-[#FEF3C7] text-[#92400E]",
  poor: "bg-[#FEE2E2] text-[#B42318]",
};

function scoreColor(score: number) {
  return score >= 90 ? "#16A34A" : score >= 50 ? "#D97706" : "#DC2626";
}

function SiteSpeed({ productPath }: { productPath: string | null }) {
  const pages = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    ...(productPath ? [{ path: productPath, label: "Top product" }] : []),
  ];
  const [path, setPath] = useState("/");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [nonce, setNonce] = useState(0);
  const { data, isFetching, error } = useAdminQuery(["pagespeed", path, strategy, nonce], () =>
    adminGetPageSpeed({ data: { path, strategy, refresh: nonce > 0 } }),
  );

  const toggle = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#616161] hover:text-[#1A1A1A]"}`;

  return (
    <Card
      title="Site speed (Google PageSpeed)"
      className="mt-6"
      action={
        data?.configured && (
          <button
            type="button"
            disabled={isFetching}
            onClick={() => setNonce((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#303030] ring-1 ring-black/10 hover:bg-[#FAFAFA] disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} /> Re-test
          </button>
        )
      }
    >
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-lg bg-[#F1F1F1] p-0.5">
          {pages.map((p) => (
            <button key={p.path} type="button" onClick={() => setPath(p.path)} className={toggle(path === p.path)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-[#F1F1F1] p-0.5">
          {(["mobile", "desktop"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStrategy(s)} className={toggle(strategy === s)}>
              {s === "mobile" ? "Mobile" : "Desktop"}
            </button>
          ))}
        </div>
      </div>

      {isFetching && !data ? (
        <div className="flex items-center gap-2 py-10 text-xs text-[#616161]">
          <Loader2 className="h-4 w-4 animate-spin" /> Google is testing the page, this takes 15–30 seconds…
        </div>
      ) : error ? (
        <p className="mt-4 rounded-lg bg-[#FEE2E2] px-4 py-3 text-xs text-[#B42318]">{error instanceof Error ? error.message : "Test failed."}</p>
      ) : !data ? null : !data.configured ? (
        <p className="mt-4 rounded-lg bg-[#FFF8E6] px-4 py-3 text-xs text-[#6B4E00]">
          Set <code className="font-mono">PAGESPEED_API_KEY</code> on the server (Google Cloud → APIs &amp; Services → Credentials → API key, restricted to
          the PageSpeed Insights API) to test site speed from here.
        </p>
      ) : (
        <div className={`mt-4 ${isFetching ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center gap-5">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(${scoreColor(data.score)} ${data.score * 3.6}deg, #F1F1F1 0deg)` }}
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
                <span className="text-xl font-bold tabular-nums" style={{ color: scoreColor(data.score) }}>
                  {data.score}
                </span>
              </div>
            </div>
            <div className="text-xs text-[#616161]">
              <p className="font-semibold text-[#303030]">Performance score ({data.strategy})</p>
              <p className="mt-0.5">90+ is good, 50–89 needs work, under 50 is slow.</p>
              <p className="mt-0.5 text-[11px] text-[#8A8A8A]">Tested {new Date(data.testedAt).toLocaleString("en-PK")}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {data.lab.map((m) => (
              <div key={m.short} className="rounded-lg bg-[#F7F7F7] p-3" title={m.label}>
                <p className="text-[11px] font-semibold text-[#616161]">{m.short}</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-[#1A1A1A]">{m.display}</p>
                <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${RATING_STYLE[m.rating]}`}>{m.rating}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-[#303030]">Real visitors (Chrome users, last 28 days)</p>
            {data.field.length === 0 ? (
              <p className="mt-1 text-[11px] text-[#8A8A8A]">
                Not enough Chrome visitors yet for Google to report real-world speed. This fills in as traffic grows.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {data.field.map((m) => (
                  <span key={m.short} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${RATING_STYLE[m.rating]}`}>
                    {m.short} {m.display}
                  </span>
                ))}
              </div>
            )}
          </div>

          {data.opportunities.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[#303030]">Biggest speed fixes</p>
              <ul className="mt-2 divide-y divide-[#EBEBEB] text-xs">
                {data.opportunities.map((o) => (
                  <li key={o.title} className="flex justify-between gap-3 py-2">
                    <span className="text-[#303030]">{o.title}</span>
                    <span className="shrink-0 text-[#8A8A8A]">{o.savings}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function GoogleAnalyticsPage() {
  const [days, setDays] = useState(28);
  const { data, isLoading, error, refetch } = useAdminQuery(["google-analytics", days], () =>
    adminGetGoogleAnalytics({ data: { days } }),
  );

  const propertyUrl =
    data && "propertyId" in data && data.propertyId
      ? `https://analytics.google.com/analytics/web/#/p${data.propertyId}/reports/intelligenthome`
      : "https://analytics.google.com/";

  const header = (
    <PageHeader
      title="Google Analytics (GA4)"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-[#F1F1F1] p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  days === r.days ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#616161] hover:text-[#1A1A1A]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <a
            href={propertyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#303030] ring-1 ring-black/10 hover:bg-[#FAFAFA]"
          >
            Open Google Analytics <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      }
    />
  );

  if (isLoading) {
    return (
      <>
        {header}
        <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-[#616161]" />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        {header}
        <EmptyState
          title="Couldn't load Google Analytics data"
          body={error instanceof Error ? error.message : "Try again in a minute."}
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Try again
            </button>
          }
        />
      </>
    );
  }

  if (!data.configured) {
    return (
      <>
        {header}
        <Card title="Connect Google Analytics 4">
          <div className="space-y-3 text-xs text-[#616161]">
            <p>
              Set the server environment variables below to stream GA4 traffic, top pages, sources, and city reports directly into Admin:
            </p>
            <ul className="space-y-2 rounded-lg bg-[#F7F7F7] p-3.5 text-[#303030]">
              <li className="flex items-start justify-between gap-3">
                <div>
                  <code className="font-mono font-semibold">GA4_PROPERTY_ID</code>
                  <p className="text-[11px] text-[#616161]">
                    Numeric property ID from GA4 Admin → Property Settings (not the <code className="font-mono">G-...</code> tag).
                  </p>
                </div>
                <span className={`shrink-0 font-semibold ${data.hasValidPropertyId ? "text-[#166534]" : "text-[#B42318]"}`}>
                  {data.hasValidPropertyId ? "Configured" : data.hasPropertyId ? "Must be digits" : "Missing"}
                </span>
              </li>
              <li className="flex items-start justify-between gap-3">
                <div>
                  <code className="font-mono font-semibold">GA4_SERVICE_ACCOUNT</code>
                  <p className="text-[11px] text-[#616161]">
                    Service-account JSON key with Viewer access in GA4 (falls back to <code className="font-mono">GSC_SERVICE_ACCOUNT</code> automatically).
                  </p>
                </div>
                <span className={`shrink-0 font-semibold ${data.hasServiceAccount ? "text-[#166534]" : "text-[#B42318]"}`}>
                  {data.hasServiceAccount ? "Configured" : "Missing"}
                </span>
              </li>
              <li className="flex items-start justify-between gap-3">
                <div>
                  <code className="font-mono font-semibold">VITE_GA_MEASUREMENT_ID</code>
                  <p className="text-[11px] text-[#616161]">
                    Storefront tracking tag (<code className="font-mono">G-XXXXXXXXXX</code>) to send page views &amp; ecommerce events from the site.
                  </p>
                </div>
                <span className={`shrink-0 font-semibold ${data.hasMeasurementId ? "text-[#166534]" : "text-[#616161]"}`}>
                  {data.hasMeasurementId ? "Configured" : "Optional"}
                </span>
              </li>
            </ul>
          </div>
        </Card>
      </>
    );
  }

  const { totals, daily, pages, sources, cities, devices, realtimeActiveUsers, hasMeasurementId, sales, funnel, events, products, landingPages, audience } =
    data;
  const topProductPath = pages.find((p) => p.path.startsWith("/product/"))?.path ?? null;
  const keyEvents = events.filter((e) => !HIDDEN_EVENTS.has(e.name));
  const maxDailyUsers = Math.max(...daily.map((d) => d.users), 1);
  const shortDate = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

  return (
    <>
      {header}

      {realtimeActiveUsers !== null && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-xs shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <div className="flex items-center gap-2 font-medium text-[#303030]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
            <span>
              <strong className="tabular-nums text-[#1A1A1A]">{realtimeActiveUsers.toLocaleString()}</strong> active users in the last 30 minutes
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#616161]">
            <Activity className="h-3.5 w-3.5" /> GA4 Realtime
          </span>
        </div>
      )}

      {!hasMeasurementId && (
        <p className="mb-4 rounded-lg bg-[#FFF8E6] px-4 py-3 text-xs text-[#6B4E00]">
          Tip: <code className="font-mono">VITE_GA_MEASUREMENT_ID</code> is not set in the build environment. If you haven&apos;t added Google Tag via GTM, set <code className="font-mono">VITE_GA_MEASUREMENT_ID</code> so storefront visits &amp; orders stream to GA4 automatically.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Active Users",
            value: totals.activeUsers.toLocaleString(),
            sub: `${totals.newUsers.toLocaleString()} new users`,
            icon: Users,
          },
          {
            label: "Sessions",
            value: totals.sessions.toLocaleString(),
            sub: `${totals.engagementRate}% engagement rate`,
            icon: Globe,
          },
          {
            label: "Page Views",
            value: totals.pageviews.toLocaleString(),
            sub: `${totals.sessions > 0 ? (totals.pageviews / totals.sessions).toFixed(1) : "0.0"} views / session`,
            icon: Eye,
          },
          {
            label: "Avg. Session Duration",
            value: formatDuration(totals.avgSessionDuration),
            sub: `${totals.bounceRate}% bounce rate`,
            icon: Clock,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
            <div className="flex items-center justify-between text-[#616161]">
              <p className="text-[13px] font-medium">{s.label}</p>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#1A1A1A]">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-[#616161]">{s.sub}</p>
          </div>
        ))}
      </div>

      {totals.activeUsers === 0 && (
        <p className="mt-4 rounded-lg bg-[#FFF8E6] px-4 py-3 text-xs text-[#6B4E00]">
          No GA4 traffic recorded in this period yet. Standard GA4 reports update every few hours after setup.
        </p>
      )}

      <Card title="Daily active users and page views" className="mt-6">
        {daily.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#8A8A8A]">No data in this period.</p>
        ) : (
          <>
            <div className="flex h-40 items-end justify-center gap-1">
              {daily.map((d) => (
                <div
                  key={d.day}
                  className="relative flex h-full max-w-8 flex-1 flex-col justify-end"
                  title={`${shortDate(d.day)}: ${d.users} users, ${d.sessions} sessions, ${d.pageviews} views`}
                >
                  {d.users > 0 ? (
                    <div className="rounded-t bg-[#0B4A36]" style={{ height: `${pct(d.users, maxDailyUsers)}%` }} />
                  ) : (
                    <div className="h-0.5 rounded bg-[#EBEBEB]" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-[#8A8A8A]">
              <span>{shortDate(daily[0].day)}</span>
              <span>Peak: {maxDailyUsers.toLocaleString()} users/day</span>
              <span>{shortDate(daily[daily.length - 1].day)}</span>
            </div>
          </>
        )}
      </Card>

      <h2 className="mt-8 text-base font-semibold text-[#1A1A1A]">Sales performance</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={rs(sales.revenue)} sub="from tracked orders" icon={ShoppingBag} />
        <Stat
          label="Orders"
          value={sales.purchases.toLocaleString()}
          sub={`${totals.sessions > 0 ? ((sales.purchases / totals.sessions) * 100).toFixed(1) : "0.0"}% of sessions`}
          icon={ShoppingBag}
        />
        <Stat label="Added to cart" value={sales.addToCarts.toLocaleString()} sub={`${sales.itemsViewed.toLocaleString()} product views`} icon={ShoppingBag} />
        <Stat
          label="Checkouts"
          value={sales.checkouts.toLocaleString()}
          sub={sales.purchases > 0 ? `${rs(Math.round(sales.revenue / sales.purchases))} avg order` : "no orders yet"}
          icon={ShoppingBag}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Shopping funnel (visitors)">
          <Funnel steps={funnel} />
          <p className="mt-3 text-[11px] text-[#8A8A8A]">The biggest drop between two steps is where customers give up.</p>
        </Card>

        <Card title="Product performance">
          {products.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#8A8A8A]">No product views recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2 text-right">Views</th>
                    <th className="py-2 text-right">Carted</th>
                    <th className="py-2 text-right">Sold</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {products.map((p) => (
                    <tr key={p.name}>
                      <td className="max-w-[12rem] truncate py-2 font-medium text-[#303030]" title={p.name}>
                        {p.name}
                      </td>
                      <td className="py-2 text-right tabular-nums">{p.views}</td>
                      <td className="py-2 text-right tabular-nums">{p.addedToCart}</td>
                      <td className="py-2 text-right tabular-nums">{p.purchased}</td>
                      <td className="py-2 text-right tabular-nums">{p.revenue ? rs(p.revenue) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <h2 className="mt-8 text-base font-semibold text-[#1A1A1A]">Traffic</h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        <Card title="Most visited pages">
          {pages.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#8A8A8A]">No page views recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
                  <tr>
                    <th className="py-2">Page</th>
                    <th className="py-2 text-right">Views</th>
                    <th className="py-2 text-right">Users</th>
                    <th className="py-2 text-right">Avg time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {pages.map((p) => (
                    <tr key={p.path}>
                      <td className="max-w-[14rem] truncate py-2 font-medium text-[#303030]" title={p.path}>
                        {p.path}
                      </td>
                      <td className="py-2 text-right tabular-nums">{p.views.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums">{p.users.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums text-[#616161]">{formatDuration(p.avgDuration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Traffic sources (source / medium)">
          <BarBreakdown
            rows={sources.map((s) => ({
              name: s.name,
              primary: s.sessions,
              secondary: `(${s.users} users · ${s.engagementRate}% eng)`,
            }))}
            empty="No traffic sources recorded yet."
          />
        </Card>

        <Card title="Top cities">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#616161]">
            <MapPin className="h-3.5 w-3.5" /> Visitor locations for regional demand &amp; COD reach
          </div>
          <BarBreakdown
            rows={cities.map((c) => ({
              name: c.name,
              primary: c.users,
              secondary: `(${c.sessions} sessions)`,
            }))}
            empty="No location data yet."
          />
        </Card>

        <Card title="Devices">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#616161]">
            <Percent className="h-3.5 w-3.5" /> Share of active users by device category
          </div>
          <BarBreakdown
            rows={devices.map((d) => ({
              name: d.name,
              primary: d.users,
              secondary: `(${pct(d.users, totals.activeUsers)}%)`,
            }))}
            empty="No device data yet."
          />
        </Card>
      </div>

      <h2 className="mt-8 text-base font-semibold text-[#1A1A1A]">Engagement</h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        <Card title="Landing pages (where visits start)">
          {landingPages.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#8A8A8A]">No landing pages recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
                  <tr>
                    <th className="py-2">Page</th>
                    <th className="py-2 text-right">Visits</th>
                    <th className="py-2 text-right">Bounce</th>
                    <th className="py-2 text-right">Avg time</th>
                    <th className="py-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {landingPages.map((p) => (
                    <tr key={p.path}>
                      <td className="max-w-[12rem] truncate py-2 font-medium text-[#303030]" title={p.path}>
                        {p.path}
                      </td>
                      <td className="py-2 text-right tabular-nums">{p.sessions}</td>
                      <td className={`py-2 text-right tabular-nums ${p.bounceRate >= 70 ? "text-[#B42318]" : ""}`}>{p.bounceRate}%</td>
                      <td className="py-2 text-right tabular-nums text-[#616161]">{formatDuration(p.avgDuration)}</td>
                      <td className="py-2 text-right tabular-nums">{p.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Customer actions">
          <BarBreakdown
            rows={keyEvents.map((e) => ({
              name: EVENT_LABELS[e.name] ?? e.name.replace(/_/g, " "),
              primary: e.count,
              secondary: `(${e.users} people)`,
            }))}
            empty="No actions recorded yet."
          />
        </Card>

        <Card title="New vs returning visitors">
          <BarBreakdown
            rows={audience.map((a) => ({
              name: a.name,
              primary: a.users,
              secondary: `(${a.sessions} visits · ${a.engagementRate}% engaged)`,
            }))}
            empty="No visitor data yet."
          />
        </Card>
      </div>

      <SiteSpeed productPath={topProductPath} />
    </>
  );
}
