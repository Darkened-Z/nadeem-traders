import { createFileRoute } from "@tanstack/react-router";
import { Loader2, TrendingUp, ShoppingCart, DollarSign, CheckCircle2, Package, Clock } from "lucide-react";
import { adminGetAnalytics } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Card, EmptyState, PageHeader } from "../components/admin-ui";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isLoading } = useAdminQuery(["analytics"], () => adminGetAnalytics());

  if (isLoading || !data) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-[#616161]" />;
  }

  const { rev, topProducts, statusCounts, recentDaily } = data;

  const totalSalesAll = topProducts.reduce((acc: number, p: any) => acc + (Number(p.total_sales) || 0), 0) || 1;

  return (
    <>
      <PageHeader title="Analytics &amp; Performance" />

      {/* Top 4 Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between text-[#616161]">
            <p className="text-[13px] font-medium">Total Revenue</p>
            <DollarSign className="h-4 w-4 text-[#166534]" />
          </div>
          <p className="mt-1 text-2xl font-bold text-[#303030]">
            Rs. {Number(rev.total_revenue || 0).toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-[#616161]">Gross sales across all orders</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between text-[#616161]">
            <p className="text-[13px] font-medium">Total Orders</p>
            <ShoppingCart className="h-4 w-4 text-[#005BD3]" />
          </div>
          <p className="mt-1 text-2xl font-bold text-[#303030]">{rev.total_orders}</p>
          <p className="mt-0.5 text-[11px] text-[#616161]">{rev.pending_orders} pending dispatch</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between text-[#616161]">
            <p className="text-[13px] font-medium">Average Order Value</p>
            <TrendingUp className="h-4 w-4 text-[#D97706]" />
          </div>
          <p className="mt-1 text-2xl font-bold text-[#303030]">
            Rs. {Number(rev.avg_order_value || 0).toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-[#616161]">Average cart size</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between text-[#616161]">
            <p className="text-[13px] font-medium">Fulfillment Rate</p>
            <CheckCircle2 className="h-4 w-4 text-[#166534]" />
          </div>
          <p className="mt-1 text-2xl font-bold text-[#303030]">
            {rev.total_orders > 0 ? Math.round((rev.delivered_orders / rev.total_orders) * 100) : 0}%
          </p>
          <p className="mt-0.5 text-[11px] text-[#616161]">{rev.delivered_orders} delivered parcels</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top-Selling Commodities Leaderboard */}
        <Card title="Top-Selling Commodities (By Revenue)">
          {topProducts.length === 0 ? (
            <EmptyState title="No sales data yet" body="Top commodities will appear once orders are placed." />
          ) : (
            <div className="space-y-3.5 pt-2">
              {topProducts.map((p: any) => {
                const pct = Math.round(((Number(p.total_sales) || 0) / totalSalesAll) * 100);
                return (
                  <div key={p.product_name} className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs font-semibold">
                      <span className="text-[#303030]">{p.product_name}</span>
                      <span className="text-[#1A1A1A]">Rs. {Number(p.total_sales).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#616161]">
                      <span>{p.total_qty} units / packs sold</span>
                      <span>{pct}% of sales</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBEBEB]">
                      <div className="h-full rounded-full bg-[#1A1A1A]" style={{ width: `${Math.max(5, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Order Status Pipeline */}
        <Card title="Order Pipeline &amp; Fulfillment">
          {statusCounts.length === 0 ? (
            <EmptyState title="No orders" body="Fulfillment status will show as orders arrive." />
          ) : (
            <div className="space-y-3 pt-2">
              {statusCounts.map((sc: any) => (
                <div
                  key={sc.status}
                  className="flex items-center justify-between rounded-lg border border-[#EBEBEB] p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={sc.status}>{sc.status}</Badge>
                    <span className="text-[#616161]">orders</span>
                  </div>
                  <span className="text-sm font-bold text-[#303030]">{sc.count}</span>
                </div>
              ))}

              <div className="rounded-lg bg-[#F7F7F7] p-3 text-xs text-[#616161] space-y-1 mt-4">
                <p className="font-semibold text-[#303030]">PostEx Courier Integration</p>
                <p>
                  Orders marked as <em>Shipped</em> with a PostEx tracking number allow customers to track their COD parcels directly.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 30-Day Daily Sales Activity Table */}
      <Card title="30-Day Daily Sales Activity" className="mt-6">
        {recentDaily.length === 0 ? (
          <EmptyState title="No recent activity" body="Daily volume will appear as sales occur." />
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EBEBEB] text-[#616161] font-semibold">
              <tr>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-center">Orders Placed</th>
                <th className="py-2.5 text-right">Daily Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {recentDaily.map((d: any) => (
                <tr key={d.day} className="hover:bg-[#FAFAFA]">
                  <td className="py-2.5 font-medium text-[#303030]">
                    {new Date(d.day).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}
                  </td>
                  <td className="py-2.5 text-center font-bold text-[#303030]">{d.orders}</td>
                  <td className="py-2.5 text-right font-semibold text-[#166534]">
                    Rs. {Number(d.revenue).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
