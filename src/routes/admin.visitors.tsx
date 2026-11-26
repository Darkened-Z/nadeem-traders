import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Loader2, Percent, Search, Smartphone, Globe, Users } from "lucide-react";
import { adminGetVisitorAnalytics } from "../lib/visitor-analytics";
import { useAdminQuery } from "../components/admin-shell";
import { Card, EmptyState, PageHeader } from "../components/admin-ui";

export const Route = createFileRoute("/admin/visitors")({
  component: VisitorsPage,
});

const RANGES = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  phone: "Phone number",
  email: "Email",
  address: "Address",
  coupon: "Coupon code",
  "never typed": "Closed without typing",
};

const SOURCE_LABELS: Record<string, string> = {
  $direct: "Direct / WhatsApp / typed URL",
  "l.instagram.com": "Instagram",
  "www.instagram.com": "Instagram",
  "lm.facebook.com": "Facebook",
  "l.facebook.com": "Facebook",
  "m.facebook.com": "Facebook",
  "www.google.com": "Google",
  "www.google.com.pk": "Google",
};

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

function BarList({ rows, empty }: { rows: { name: string; count: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-xs text-[#8A8A8A]">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-[#303030]">{r.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-[#303030]">{r.count.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[#F1F1F1]">
            <div className="h-full rounded-full bg-[#303030]" style={{ width: `${pct(r.count, max)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function VisitorsPage() {
  const [days, setDays] = useState(7);
  const { data, isLoading, error, refetch } = useAdminQuery(["visitors", days], () => adminGetVisitorAnalytics({ data: { days } }));

  const rangePicker = (
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
  );

  const header = (
    <PageHeader
      title="Visitors & Funnel"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {rangePicker}
          <a
            href="https://us.posthog.com/replay/home"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#303030] ring-1 ring-black/10 hover:bg-[#FAFAFA]"
          >
            Watch recordings <ExternalLink className="h-3 w-3" />
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
          title="Couldn't load visitor data"
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
        <EmptyState title="PostHog not connected" body="Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID on the server." />
      </>
    );
  }

  const { totals, funnel, abandoned, sources, devices, whatsapp, searches, products, daily } = data;
  const top = funnel[0].count;
  const ordered = funnel[funnel.length - 1].count;
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const chartDays = Array.from({ length: data.days }, (_, i) => {
    const date = new Date(Date.now() - (data.days - 1 - i) * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
    return byDay.get(date) ?? { day: date, visitors: 0, orders: 0 };
  });
  const maxDaily = Math.max(...chartDays.map((d) => d.visitors), 1);
  const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Visitors", value: totals.visitors, icon: Users },
          { label: "Sessions", value: totals.sessions, icon: Globe },
          { label: "Page views", value: totals.pageviews, icon: Smartphone },
          { label: "Conversion rate", value: `${top > 0 ? ((ordered / top) * 100).toFixed(1) : "0.0"}%`, icon: Percent },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
            <div className="flex items-center justify-between text-[#616161]">
              <p className="text-[13px] font-medium">{s.label}</p>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#1A1A1A]">
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </p>
          </div>
        ))}
      </div>

      <Card title="Funnel: where visitors drop off" className="mt-6">
        {top === 0 ? (
          <EmptyState title="No visitors yet" body="Numbers appear here as people browse the store." />
        ) : (
          <ol className="space-y-3">
            {funnel.map((s, i) => {
              const prev = i === 0 ? s.count : funnel[i - 1].count;
              const lost = prev - s.count;
              return (
                <li key={s.step}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="font-medium text-[#303030]">
                      <span className="mr-2 text-[#8A8A8A]">{i + 1}.</span>
                      {s.step}
                    </span>
                    <span className="flex shrink-0 items-baseline gap-3">
                      {i > 0 && lost > 0 && (
                        <span className="text-[11px] font-medium text-[#B42318]">
                          −{lost.toLocaleString()} ({100 - pct(s.count, prev)}% dropped off)
                        </span>
                      )}
                      <span className="font-bold tabular-nums text-[#1A1A1A]">{s.count.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 rounded bg-[#F1F1F1]">
                    <div className="h-full rounded bg-[#1A1A1A]" style={{ width: `${Math.max(pct(s.count, top), s.count > 0 ? 1 : 0)}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-[11px] text-[#8A8A8A]">
          Unique visitors who reached each step. Orders that come through WhatsApp instead of checkout are counted below.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Checkout: field they left on">
          <BarList
            rows={abandoned.map((r) => ({ ...r, name: FIELD_LABELS[r.name] ?? r.name }))}
            empty="Nobody has abandoned checkout in this period."
          />
        </Card>
        <Card title="WhatsApp clicks">
          <BarList rows={whatsapp} empty="No WhatsApp clicks in this period." />
        </Card>
        <Card title="Where visitors come from">
          <BarList rows={sources.map((r) => ({ ...r, name: SOURCE_LABELS[r.name] ?? r.name }))} empty="No visits yet." />
        </Card>
        <Card title="Devices">
          <BarList rows={devices} empty="No visits yet." />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Most viewed products">
          {products.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#8A8A8A]">No product views in this period.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
                <tr>
                  <th className="py-2">Product</th>
                  <th className="py-2 text-right">Views</th>
                  <th className="py-2 text-right">Added to bag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {products.map((p) => (
                  <tr key={p.name}>
                    <td className="py-2 font-medium text-[#303030]">{p.name}</td>
                    <td className="py-2 text-right tabular-nums">{p.views}</td>
                    <td className="py-2 text-right tabular-nums">
                      {p.adds} <span className="text-[#8A8A8A]">({pct(p.adds, p.views)}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="What people searched for">
          {searches.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#8A8A8A]">No searches in this period.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
                <tr>
                  <th className="py-2">Search</th>
                  <th className="py-2 text-right">Times</th>
                  <th className="py-2 text-right">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {searches.map((s) => (
                  <tr key={s.query}>
                    <td className="py-2 font-medium text-[#303030]">
                      <Search className="mr-1.5 inline h-3 w-3 text-[#8A8A8A]" />
                      {s.query}
                    </td>
                    <td className="py-2 text-right tabular-nums">{s.count}</td>
                    <td className={`py-2 text-right tabular-nums ${s.results === 0 ? "font-semibold text-[#B42318]" : ""}`}>
                      {s.results === 0 ? "None, not stocked?" : s.results}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="Daily visitors and orders" className="mt-6">
        <div className="flex h-40 items-end justify-center gap-1">
          {chartDays.map((d) => (
            <div
              key={d.day}
              className="relative flex h-full max-w-8 flex-1 flex-col justify-end"
              title={`${shortDate(d.day)}: ${d.visitors} visitors, ${d.orders} orders`}
            >
              {d.visitors > 0 && <div className="rounded-t bg-[#303030]" style={{ height: `${pct(d.visitors, maxDaily)}%` }} />}
              {d.orders > 0 && <div className="absolute inset-x-0 bottom-0 rounded-t bg-[#16A34A]" style={{ height: `${pct(d.orders, maxDaily)}%` }} />}
              {d.visitors === 0 && <div className="h-0.5 rounded bg-[#EBEBEB]" />}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-[#8A8A8A]">
          <span>{shortDate(chartDays[0].day)}</span>
          <span>Peak: {maxDaily} visitors/day</span>
          <span>{shortDate(chartDays[chartDays.length - 1].day)}</span>
        </div>
        <p className="mt-3 flex gap-4 text-[11px] text-[#616161]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#303030]" /> Visitors</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#16A34A]" /> Orders</span>
          <span className="ml-auto">Hover a bar for exact numbers</span>
        </p>
      </Card>
    </>
  );
}
