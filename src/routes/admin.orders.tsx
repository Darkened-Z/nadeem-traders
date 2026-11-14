import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Download, Truck, ExternalLink, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { adminListOrders, adminUpdateOrderTracking } from "../lib/admin";
import { updateOrderStatus } from "../lib/actions";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Button, EmptyState, PageHeader, errorMessage, inputClass } from "../components/admin-ui";

const STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"];
const COURIERS = ["PostEx", "TCS", "M&P", "Leopards", "Trax"];

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

function formatPakPhone(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0")) return "92" + cleaned.slice(1);
  if (cleaned.startsWith("+92")) return cleaned.slice(1);
  return cleaned;
}

function OrdersPage() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useAdminQuery(["orders"], () => adminListOrders());
  const [open, setOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [trackingForm, setTrackingForm] = useState<Record<number, { tracking: string; courier: string }>>({});
  const [savingTracking, setSavingTracking] = useState<number | null>(null);

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

  const saveTracking = async (order: any) => {
    const current = trackingForm[order.id] || { tracking: order.tracking_number || "", courier: order.courier || "PostEx" };
    setSavingTracking(order.id);
    try {
      await adminUpdateOrderTracking({
        data: {
          id: order.id,
          tracking_number: current.tracking,
          courier: current.courier,
          status: order.status === "Pending" && current.tracking.trim() ? "Shipped" : undefined,
        },
      });
      toast.success(`Tracking updated for Order #${order.id}`);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingTracking(null);
    }
  };

  const list = orders as any[];

  const exportCSV = () => {
    if (list.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Shipping Address",
      "Total Amount (PKR)",
      "Status",
      "Courier",
      "Tracking Number",
      "Items Summary",
    ];
    const rows = list.map((o) => {
      const itemsSummary = (o.items || [])
        .map((it: any) => `${it.quantity}x ${it.product_name}`)
        .join(" | ");
      return [
        o.id,
        new Date(o.created_at).toISOString().split("T")[0],
        `"${(o.customer_name || "").replace(/"/g, '""')}"`,
        `"${(o.customer_phone || "").replace(/"/g, '""')}"`,
        `"${(o.customer_email || "").replace(/"/g, '""')}"`,
        `"${(o.shipping_address || "").replace(/"/g, '""')}"`,
        o.total_amount,
        o.status,
        o.courier || "PostEx",
        `"${(o.tracking_number || "").replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nadeem-traders-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to CSV");
  };

  return (
    <>
      <PageHeader
        title="Orders"
        actions={
          <Button variant="secondary" onClick={exportCSV} disabled={list.length === 0}>
            <Download className="h-4 w-4" /> Export CSV (PostEx)
          </Button>
        }
      />
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
                <th className="py-2 pr-3">Courier / Tracking</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {list.map((o) => {
                const phoneForWa = formatPakPhone(o.customer_phone);
                const currentTracking = trackingForm[o.id]?.tracking ?? (o.tracking_number || "");
                const currentCourier = trackingForm[o.id]?.courier ?? (o.courier || "PostEx");

                const confirmMsg = `Assalam-o-Alaikum ${o.customer_name}! Aapka Nadeem Traders order #${o.id} confirm ho chuka hai.\nTotal Bill: Rs. ${Number(o.total_amount).toLocaleString()} (Cash on Delivery via PostEx Courier).\nAddress: ${o.shipping_address}\nShukriya!`;
                const trackUrl = currentTracking && currentCourier.toLowerCase().includes("postex")
                  ? `https://postex.pk/tracking?cn=${encodeURIComponent(currentTracking)}`
                  : null;
                const trackingMsg = `Assalam-o-Alaikum ${o.customer_name}! Aapka Nadeem Traders order #${o.id} dispatch ho gaya hai via ${currentCourier}.\nTracking Number (CN): ${currentTracking || "Pending"}${trackUrl ? `\nTrack karein: ${trackUrl}` : ""}\nShukriya!`;

                return (
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
                      <td className="py-3 pr-3 font-medium text-[#303030]">{o.customer_name}</td>
                      <td className="py-3 pr-3 text-xs text-[#616161]">
                        {o.tracking_number ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[#005BD3]">
                            <Truck className="h-3 w-3" /> {o.courier || "PostEx"}: {o.tracking_number}
                          </span>
                        ) : (
                          <span className="text-[#8A8A8A]">PostEx COD</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge tone={o.status}>{o.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">Rs. {Number(o.total_amount).toLocaleString()}</td>
                    </tr>
                    {open === o.id && (
                      <tr className="bg-[#FAFAFA]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid gap-6 lg:grid-cols-3">
                            {/* Column 1: Order Items & Delivery */}
                            <div className="lg:col-span-1 space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Items ({o.items?.length || 0})</p>
                              <ul className="space-y-1.5 rounded-lg bg-white p-3 ring-1 ring-black/[0.05]">
                                {o.items.map((it: any) => (
                                  <li key={it.id} className="flex justify-between gap-3 text-xs">
                                    <span className="font-medium text-[#303030]">
                                      {it.quantity}× {it.product_name}
                                    </span>
                                    <span className="text-[#616161]">Rs. {(it.price * it.quantity).toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Deliver to</p>
                                <p className="mt-1 whitespace-pre-line text-xs font-medium text-[#303030]">{o.shipping_address}</p>
                                <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-[#616161]">
                                  {o.customer_phone && (
                                    <a href={`tel:${o.customer_phone}`} className="text-[#005BD3] hover:underline font-mono">
                                      {o.customer_phone}
                                    </a>
                                  )}
                                  {o.customer_email && <span>· {o.customer_email}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Column 2: PostEx Courier Tracking */}
                            <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-black/[0.05]">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-[#166534]" />
                                <span className="text-xs font-semibold text-[#303030]">PostEx Courier & Dispatch</span>
                              </div>
                              <div className="space-y-2">
                                <label className="block text-xs text-[#616161]">
                                  Courier
                                  <select
                                    value={currentCourier}
                                    onChange={(e) =>
                                      setTrackingForm((prev) => ({
                                        ...prev,
                                        [o.id]: { tracking: currentTracking, courier: e.target.value },
                                      }))
                                    }
                                    className={`${inputClass} mt-1`}
                                  >
                                    {COURIERS.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block text-xs text-[#616161]">
                                  Tracking Number / CN
                                  <input
                                    type="text"
                                    placeholder="e.g. 240112345678"
                                    value={currentTracking}
                                    onChange={(e) =>
                                      setTrackingForm((prev) => ({
                                        ...prev,
                                        [o.id]: { courier: currentCourier, tracking: e.target.value },
                                      }))
                                    }
                                    className={`${inputClass} mt-1 font-mono`}
                                  />
                                </label>
                                <div className="flex items-center gap-2 pt-1">
                                  <Button
                                    variant="primary"
                                    onClick={() => saveTracking(o)}
                                    loading={savingTracking === o.id}
                                    className="py-1.5 text-xs"
                                  >
                                    <Save className="h-3 w-3" /> Save Tracking
                                  </Button>
                                  {trackUrl && (
                                    <a
                                      href={trackUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-medium text-[#005BD3] hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Track on PostEx
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Column 3: Status & WhatsApp Customer Messenger */}
                            <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-black/[0.05]">
                              <label className="block">
                                <span className="text-xs font-semibold text-[#616161]">Order Status</span>
                                <select
                                  value={o.status}
                                  disabled={updating === o.id}
                                  onChange={(e) => changeStatus(o.id, e.target.value)}
                                  className={`${inputClass} mt-1`}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s}>{s}</option>
                                  ))}
                                </select>
                              </label>

                              {phoneForWa ? (
                                <div className="pt-2 border-t border-[#EBEBEB] space-y-2">
                                  <span className="block text-xs font-semibold text-[#166534]">
                                    One-Click WhatsApp Messenger
                                  </span>
                                  <div className="flex flex-col gap-1.5">
                                    <a
                                      href={`https://wa.me/${phoneForWa}?text=${encodeURIComponent(confirmMsg)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366]/10 px-2.5 py-1.5 text-xs font-medium text-[#075E54] hover:bg-[#25D366]/20 transition-colors"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" /> Confirm Order via WhatsApp
                                    </a>
                                    <a
                                      href={`https://wa.me/${phoneForWa}?text=${encodeURIComponent(trackingMsg)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366]/10 px-2.5 py-1.5 text-xs font-medium text-[#075E54] hover:bg-[#25D366]/20 transition-colors"
                                    >
                                      <Truck className="h-3.5 w-3.5" /> Send Tracking via WhatsApp
                                    </a>
                                    <a
                                      href={`https://wa.me/${phoneForWa}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-center text-[11px] text-[#616161] hover:underline"
                                    >
                                      Direct Chat with Customer ({o.customer_phone}) ↗
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-[#8A8A8A] italic">No phone number provided for WhatsApp.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
