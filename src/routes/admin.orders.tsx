import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminListOrders } from "../lib/admin";
import { updateOrderStatus } from "../lib/actions";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, EmptyState, PageHeader, errorMessage } from "../components/admin-ui";

const STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"];

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useAdminQuery(["orders"], () => adminListOrders());
  const [open, setOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const changeStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await updateOrderStatus({ data: { id, status } });
      toast.success(`Order #${id} marked ${status}`);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  const list = orders as any[];

  return (
    <>
      <PageHeader title="Orders" />
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        {isLoading ? (
          <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-[#616161]" />
        ) : list.length === 0 ? (
          <EmptyState title="No orders yet" body="When customers check out, their orders appear here." />
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="hidden bg-[#F7F7F7] text-xs font-semibold text-[#616161] sm:table-header-group">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {list.map((o) => (
                <Fragment key={o.id}>
                  <tr onClick={() => setOpen(open === o.id ? null : o.id)} className="cursor-pointer hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <ChevronDown className={`h-3.5 w-3.5 text-[#8A8A8A] transition-transform ${open === o.id ? "rotate-180" : ""}`} />#{o.id}
                      </span>
                    </td>
                    <td className="hidden py-3 pr-3 text-[#616161] sm:table-cell">
                      {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 pr-3">{o.customer_name}</td>
                    <td className="py-3 pr-3">
                      <Badge tone={o.status}>{o.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">Rs. {Number(o.total_amount).toLocaleString()}</td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-[#FAFAFA]">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
                          <div>
                            <p className="text-xs font-semibold text-[#616161]">Items</p>
                            <ul className="mt-1 space-y-1">
                              {o.items.map((it: any) => (
                                <li key={it.id} className="flex justify-between gap-3">
                                  <span>
                                    {it.quantity}× {it.product_name}
                                  </span>
                                  <span className="text-[#616161]">Rs. {(it.price * it.quantity).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-3 text-xs font-semibold text-[#616161]">Deliver to</p>
                            <p className="mt-1 whitespace-pre-line">{o.shipping_address}</p>
                            <p className="mt-1 text-[#616161]">
                              {o.customer_phone && (
                                <a href={`tel:${o.customer_phone}`} className="text-[#005BD3] hover:underline">
                                  {o.customer_phone}
                                </a>
                              )}
                              {o.customer_phone && o.customer_email ? " · " : ""}
                              {o.customer_email}
                            </p>
                          </div>
                          <label className="block">
                            <span className="text-xs font-semibold text-[#616161]">Status</span>
                            <select
                              value={o.status}
                              disabled={updating === o.id}
                              onChange={(e) => changeStatus(o.id, e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#8A8A8A] bg-white px-3 py-1.5 text-[16px] sm:text-[13px]"
                            >
                              {STATUSES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
