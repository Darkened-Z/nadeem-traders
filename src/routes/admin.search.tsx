import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Eye, Loader2, MousePointerClick, Percent, TrendingUp } from "lucide-react";
import { adminGetSearchConsole } from "../lib/search-console";
import { useAdminQuery } from "../components/admin-shell";
import { Card, EmptyState, PageHeader } from "../components/admin-ui";

export const Route = createFileRoute("/admin/search")({
  component: SearchPage,
});

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

type MetricRow = { name: string; clicks: number; impressions: number; ctr: number; position: number };

function MetricTable({ rows, label, empty }: { rows: MetricRow[]; label: string; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-xs text-[#8A8A8A]">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
          <tr>
            <th className="py-2">{label}</th>
            <th className="py-2 text-right">Clicks</th>
            <th className="py-2 text-right">Shown</th>
            <th className="py-2 text-right">CTR</th>
            <th className="py-2 text-right">Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EBEBEB]">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="max-w-[16rem] truncate py-2 font-medium text-[#303030]" title={r.name}>
                {r.name}
              </td>
              <td className="py-2 text-right tabular-nums">{r.clicks}</td>
              <td className="py-2 text-right tabular-nums">{r.impressions.toLocaleString()}</td>
              <td className="py-2 text-right tabular-nums">{r.ctr}%</td>
              <td className={`py-2 text-right tabular-nums ${r.position <= 10 ? "font-semibold text-[#16A34A]" : ""}`}>{r.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchPage() {
  const [days, setDays] = useState(28);
  const { data, isLoading, error, refetch } = useAdminQuery(["search-console", days], () => adminGetSearchConsole({ data: { days } }));

  const header = (
    <PageHeader
      title="Google Search"
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
            href="https://search.google.com/search-console?resource_id=sc-domain:nadeemtraders.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#303030] ring-1 ring-black/10 hover:bg-[#FAFAFA]"
          >
            Open Search Console <ExternalLink className="h-3 w-3" />
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
          title="Couldn't load Google data"
          body={error instanceof Error ? error.message : "Try again in a minute."}
          action={
            <button type="button" onClick={() => refetch()} className="rounded-lg bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-white">
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
        <EmptyState title="Search Console not connected" body="Set GSC_SERVICE_ACCOUNT on the server (the service account's JSON key)." />
      </>
    );
  }

  const { totals, queries, pages, daily, devices } = data;
  const opportunities = queries.filter((q) => q.position > 5 && q.position <= 20 && q.impressions >= 10);
  const maxDaily = Math.max(...daily.map((d) => d.impressions), 1);
  const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Clicks from Google", value: totals.clicks.toLocaleString(), icon: MousePointerClick },
          { label: "Times shown", value: totals.impressions.toLocaleString(), icon: Eye },
          { label: "Click rate", value: `${totals.ctr}%`, icon: Percent },
          { label: "Average position", value: totals.position ? String(totals.position) : "–", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
            <div className="flex items-center justify-between text-[#616161]">
              <p className="text-[13px] font-medium">{s.label}</p>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#1A1A1A]">{s.value}</p>
          </div>
        ))}
      </div>

      {totals.impressions === 0 && (
        <p className="mt-4 rounded-lg bg-[#FFF8E6] px-4 py-3 text-xs text-[#6B4E00]">
          No Google data yet. Search Console takes 2–3 days after verification to start reporting.
        </p>
      )}

      <Card title="Daily: times shown and clicks" className="mt-6">
        {daily.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#8A8A8A]">No data in this period.</p>
        ) : (
          <>
            <div className="flex h-40 items-end justify-center gap-1">
              {daily.map((d) => (
                <div
                  key={d.day}
                  className="relative flex h-full max-w-8 flex-1 flex-col justify-end"
                  title={`${shortDate(d.day)}: shown ${d.impressions}, ${d.clicks} clicks`}
                >
                  <div className="rounded-t bg-[#303030]" style={{ height: `${(d.impressions / maxDaily) * 100}%` }} />
                  {d.clicks > 0 && (
                    <div className="absolute inset-x-0 bottom-0 rounded-t bg-[#16A34A]" style={{ height: `${Math.max((d.clicks / maxDaily) * 100, 2)}%` }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-[#8A8A8A]">
              <span>{shortDate(daily[0].day)}</span>
              <span>{shortDate(daily[daily.length - 1].day)}</span>
            </div>
            <p className="mt-3 flex gap-4 text-[11px] text-[#616161]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#303030]" /> Times shown</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#16A34A]" /> Clicks</span>
            </p>
          </>
        )}
      </Card>

      {opportunities.length > 0 && (
        <Card title="Almost on page 1: worth improving" className="mt-6">
          <MetricTable rows={opportunities} label="Search" empty="" />
          <p className="mt-3 text-[11px] text-[#8A8A8A]">
            People search these and you show up at position 6–20. Better product copy or photos for them can move you up.
          </p>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="What people searched on Google">
          <MetricTable rows={queries} label="Search" empty="No searches yet." />
        </Card>
        <Card title="Pages that show up">
          <MetricTable rows={pages} label="Page" empty="No pages yet." />
        </Card>
      </div>

      <Card title="Devices" className="mt-6">
        <MetricTable rows={devices.map((d) => ({ ...d, name: d.name.charAt(0) + d.name.slice(1).toLowerCase() }))} label="Device" empty="No data yet." />
      </Card>
    </>
  );
}
