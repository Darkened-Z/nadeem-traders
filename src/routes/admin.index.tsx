import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Loader2, Coins, Truck, Users, Settings } from "lucide-react";
import { adminOverview } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Card, EmptyState, PageHeader } from "../components/admin-ui";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data, isLoading } = useAdminQuery(["overview"], () => adminOverview());

  if (isLoading || !data) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-[#616161]" />;
  }

  const { counts, recentOrders } = data;
  const stats = [
    { label: "Products", value: counts.products, to: "/admin/products" },
    { label: "Active", value: counts.active, to: "/admin/products" },
    { label: "Drafts", value: counts.drafts, to: "/admin/products" },
    { label: "Pending orders", value: counts.pending, to: "/admin/orders" },
  ];

  return (
    <>
      <PageHeader title="Home" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to as any}
            className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] transition-colors hover:bg-[#FAFAFA]"
          >
            <p className="text-[13px] font-medium text-[#616161]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#303030]">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          to={"/admin/rates" as any}
          className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D97706]/10 text-[#D97706]">
            <Coins className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#303030]">Daily Rates Sheet</p>
            <p className="text-[11px] text-[#616161]">Quick update commodity prices</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#8A8A8A]" />
        </Link>

        <Link
          to={"/admin/orders" as any}
          className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#166534]/10 text-[#166534]">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#303030]">PostEx Dispatch</p>
            <p className="text-[11px] text-[#616161]">Tracking & WhatsApp messenger</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#8A8A8A]" />
        </Link>

        <Link
          to={"/admin/customers" as any}
          className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#005BD3]/10 text-[#005BD3]">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#303030]">Customer Directory</p>
            <p className="text-[11px] text-[#616161]">View buyer profiles & history</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#8A8A8A]" />
        </Link>
      </div>

      {counts.unpriced > 0 && (
        <Link
          to={"/admin/rates" as any}
          className="mt-4 flex items-center gap-3 rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] hover:bg-[#FAFAFA]"
        >
          <Badge tone="warning">Rate Inquiry</Badge>
          <p className="flex-1 text-[13px] text-[#303030]">
            <strong className="font-semibold">{counts.unpriced} commodities in inquiry mode.</strong> Customers see “Rate
            Poochein” on WhatsApp. Click to adjust on Daily Rates Sheet.
          </p>
          <ChevronRight className="h-4 w-4 text-[#8A8A8A]" />
        </Link>
      )}

      <Card title="Recent orders" className="mt-4" action={<Link to={"/admin/orders" as any} className="text-[13px] font-medium text-[#005BD3] hover:underline">View all</Link>}>
        {recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" body="Orders placed on the store will show up here." />
        ) : (
          <ul className="-mx-4 -mb-4 divide-y divide-[#EBEBEB] border-t border-[#EBEBEB]">
            {recentOrders.map((o: any) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                <span className="w-14 font-semibold">#{o.id}</span>
                <span className="min-w-0 flex-1 truncate">{o.customer_name}</span>
                <Badge tone={o.status}>{o.status}</Badge>
                <span className="w-24 text-right font-medium">Rs. {Number(o.total_amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
