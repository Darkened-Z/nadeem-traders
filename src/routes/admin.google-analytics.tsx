import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  MapPin,
  Percent,
  Users,
} from "lucide-react";
import { adminGetGoogleAnalytics } from "../lib/google-analytics";
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

  const { totals, daily, pages, sources, cities, devices, realtimeActiveUsers, hasMeasurementId } = data;
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
            sub: `${totals.engagementRate}% engaged`,
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
    </>
  );
}
