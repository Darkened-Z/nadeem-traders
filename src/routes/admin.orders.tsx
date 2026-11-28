import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Download, Truck, ExternalLink, MessageCircle, Save, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { adminListOrders, adminUpdateOrderTracking, adminGetSettings } from "../lib/admin";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "../lib/store-settings";
import { updateOrderStatus } from "../lib/actions";
import { ORDER_STATUSES as STATUSES } from "../lib/order-status";
import { useAdminInfiniteQuery, useAdminQuery } from "../components/admin-shell";
import { Badge, Button, EmptyState, PageHeader, errorMessage, inputClass } from "../components/admin-ui";

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
  const { data: settingsData } = useAdminQuery(["settings"], () => adminGetSettings());
  const storeSettings = settingsData ?? DEFAULT_STORE_SETTINGS;
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useAdminInfiniteQuery(
    ["orders"],
    (beforeId: number | undefined) => adminListOrders({ data: { beforeId } }),
    (last) => last.nextBeforeId,
  );
  const [open, setOpen] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [trackingForm, setTrackingForm] = useState<Record<number, { tracking: string; courier: string }>>({});
  const [savingTracking, setSavingTracking] = useState<number | null>(null);
  const [printOrder, setPrintOrder] = useState<any | null>(null);

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

  const list = (data?.pages.flatMap((p) => p.orders) ?? []) as any[];

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
                <th className="py-2 pr-3 text-right">Total</th>
                <th className="py-2 pr-4 text-center">Print Slip</th>
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
                      <td className="py-3 pr-3 text-right font-medium">Rs. {Number(o.total_amount).toLocaleString()}</td>
                      <td className="py-3 pr-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintOrder(o);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#8A8A8A]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#303030] hover:bg-[#FAFAFA] transition-colors"
                          title="Print PostEx Packing Slip / Invoice"
                        >
                          <Printer className="h-3 w-3 text-[#616161]" /> Slip
                        </button>
                      </td>
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
                                    <button
                                      type="button"
                                      onClick={() => setPrintOrder(o)}
                                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#8A8A8A]/40 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#303030] hover:bg-[#F1F1F1] transition-colors"
                                    >
                                      <Printer className="h-3.5 w-3.5" /> Print PostEx Packing Slip / Invoice
                                    </button>
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
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => setPrintOrder(o)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#8A8A8A]/40 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#303030] hover:bg-[#F1F1F1] transition-colors"
                                  >
                                    <Printer className="h-3.5 w-3.5" /> Print PostEx Packing Slip / Invoice
                                  </button>
                                  <p className="text-xs text-[#8A8A8A] italic">No phone number provided for WhatsApp.</p>
                                </div>
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
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            Load older orders
          </Button>
        </div>
      )}

      {printOrder && (
        <PrintInvoiceModal
          order={printOrder}
          settings={storeSettings}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </>
  );
}

function PrintInvoiceModal({
  order,
  settings,
  onClose,
}: {
  order: any;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-[system-ui,-apple-system,'Segoe_UI',sans-serif]">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Modal Controls - Hidden during print */}
        <div className="print:hidden flex items-center justify-between border-b border-[#EBEBEB] bg-[#F7F7F7] px-5 py-3">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-[#166534]" />
            <span className="text-sm font-semibold text-[#303030]">Print Dispatch Slip &amp; Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={handlePrint} className="py-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print Now (A4 / Thermal)
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#EBEBEB] text-[#616161]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 text-[#1A1A1A] print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-5">
            <div className="flex items-center gap-3">
              <img src="/LOGO.png" alt="Nadeem Traders" className="h-14 w-14 object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-tight uppercase text-black">Nadeem Traders</h1>
                <p className="text-xs font-semibold text-[#78350F]">100% PURITY GUARANTEED · APKA TRUSTED STOP</p>
                <p className="text-[11px] text-[#4A4A4A]">
                  {settings.store_address} · WhatsApp / Support: {settings.store_phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-black px-2 py-0.5 text-xs font-bold uppercase text-white">
                Cash on Delivery
              </span>
              <p className="mt-1 text-base font-bold">Order #{order.id}</p>
              <p className="text-xs text-[#4A4A4A]">
                Date: {new Date(order.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Courier Banner */}
          <div className="mt-4 flex items-center justify-between rounded border border-black/20 bg-[#F9F9F9] p-3 text-xs">
            <div>
              <span className="font-semibold text-black">Courier:</span> {order.courier || "PostEx Courier"}
            </div>
            <div>
              <span className="font-semibold text-black">Consignment # (CN):</span>{" "}
              <span className="font-mono font-bold">{order.tracking_number || "To be assigned"}</span>
            </div>
          </div>

          {/* Sender & Receiver Boxes */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded border border-black/20 p-3">
              <p className="font-bold uppercase tracking-wider text-[#616161]">Shipper (Sender)</p>
              <p className="mt-1 font-semibold text-black">Nadeem Traders</p>
              <p className="text-[#4A4A4A]">{settings.store_address}</p>
              <p className="text-[#4A4A4A]">Verified Kiryana &amp; Dry Fruits Source</p>
            </div>
            <div className="rounded border-2 border-black p-3 bg-yellow-50/30">
              <p className="font-bold uppercase tracking-wider text-black">Deliver To (Customer)</p>
              <p className="mt-1 text-sm font-bold text-black">{order.customer_name}</p>
              <p className="font-mono font-bold text-black">{order.customer_phone || "No phone"}</p>
              <p className="mt-1 whitespace-pre-line text-[#1A1A1A]">{order.shipping_address}</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="mt-5 w-full text-left text-xs border border-black/20">
            <thead className="bg-[#EBEBEB] font-bold text-black">
              <tr>
                <th className="p-2 border-b border-black/20">Item</th>
                <th className="p-2 text-center border-b border-black/20">Qty</th>
                <th className="p-2 text-right border-b border-black/20">Rate</th>
                <th className="p-2 text-right border-b border-black/20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {(order.items || []).map((it: any) => (
                <tr key={it.id}>
                  <td className="p-2">
                    <span className="font-semibold">{it.product_name}</span>
                  </td>
                  <td className="p-2 text-center font-bold">{it.quantity}</td>
                  <td className="p-2 text-right">Rs. {Number(it.price).toLocaleString()}</td>
                  <td className="p-2 text-right font-medium">Rs. {(it.price * it.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total COD Amount Box */}
          {(() => {
            const itemsSum = (order.items || []).reduce(
              (s: number, it: any) => s + Number(it.price) * Number(it.quantity),
              0,
            );
            const deliveryCharge = Math.max(
              0,
              Number(order.total_amount) + Number(order.discount_amount || 0) - itemsSum,
            );
            return (
              <div className="mt-4 flex justify-end">
                <div className="w-64 rounded border-2 border-black p-3 bg-white text-right space-y-1">
                  <div className="flex justify-between text-xs text-[#4A4A4A]">
                    <span>Delivery (PostEx):</span>
                    <span>{deliveryCharge === 0 ? "FREE" : `Rs. ${deliveryCharge.toLocaleString()}`}</span>
                  </div>
                  <div className="border-t border-black pt-1.5 flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase text-black">Total COD to Collect:</span>
                    <span className="text-lg font-black text-black">Rs. {Number(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Courier Instructions Footer */}
          <div className="mt-5 rounded border border-dashed border-black/40 p-2.5 text-center text-[10px] text-[#4A4A4A]">
            <p className="font-bold uppercase text-black">Instructions for Courier Rider</p>
            <p>Please collect exact cash on delivery before handover. For customer queries, call Nadeem Traders.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
