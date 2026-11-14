import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Loader2 } from "lucide-react";
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

      {counts.unpriced > 0 && (
        <Link
          to={"/admin/products" as any}
          search={{ view: "unpriced" } as any}
          className="mt-4 flex items-center gap-3 rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] hover:bg-[#FAFAFA]"
        >
          <Badge tone="warning">To do</Badge>
          <p className="flex-1 text-[13px] text-[#303030]">
            <strong className="font-semibold">{counts.unpriced} products have no price.</strong> Customers see “Rate
            Poochein” instead of Add to Bag.
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
