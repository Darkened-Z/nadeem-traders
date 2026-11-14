import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Loader2, Search, Users, MessageCircle, MapPin, ShoppingBag } from "lucide-react";
import { adminListCustomers } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, EmptyState, PageHeader, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

function formatPakPhone(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0")) return "92" + cleaned.slice(1);
  if (cleaned.startsWith("+92")) return cleaned.slice(1);
  return cleaned;
}

function CustomersPage() {
  const { data: customers = [], isLoading } = useAdminQuery(["customers"], () => adminListCustomers());
  const [search, setSearch] = useState("");

  const list = customers as any[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      return (
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.last_address ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, search]);

  const stats = useMemo(() => {
    const total = list.length;
    const repeat = list.filter((c) => c.orders_count > 1).length;
    const totalRev = list.reduce((acc, c) => acc + (Number(c.total_spent) || 0), 0);
    return { total, repeat, totalRev };
  }, [list]);

  return (
    <>
      <PageHeader title="Customer Directory" />

      {/* Metrics Row */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <p className="text-[13px] font-medium text-[#616161]">Total Customers</p>
          <p className="mt-1 text-2xl font-bold text-[#303030]">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <p className="text-[13px] font-medium text-[#616161]">Repeat Buyers</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#303030]">{stats.repeat}</span>
            {stats.total > 0 && (
              <span className="text-xs text-[#166534] font-medium">
                ({Math.round((stats.repeat / stats.total) * 100)}% repeat rate)
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
          <p className="text-[13px] font-medium text-[#616161]">Total Customer Spend</p>
          <p className="mt-1 text-2xl font-bold text-[#303030]">Rs. {stats.totalRev.toLocaleString()}</p>
        </div>
      </div>

      {/* Search Header */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search by customer name, phone, city, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-8 text-xs`}
          />
        </div>
        <p className="text-xs text-[#616161]">Showing {filtered.length} customers</p>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        {isLoading ? (
          <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-[#616161]" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No customers found" body="When customers place orders, their contact directory builds here." />
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F7F7F7] text-xs font-semibold text-[#616161]">
              <tr>
                <th className="px-4 py-2.5">Customer</th>
                <th className="py-2.5 pr-3">Phone / Contact</th>
                <th className="hidden py-2.5 pr-3 sm:table-cell">Shipping City / Address</th>
                <th className="py-2.5 pr-3 text-center">Orders</th>
                <th className="py-2.5 pr-3 text-right">Total Spent</th>
                <th className="py-2.5 pr-4 text-center">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {filtered.map((c, i) => {
                const phoneForWa = formatPakPhone(c.phone);
                const isRepeat = c.orders_count > 1;

                return (
                  <tr key={c.customer_key || i} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1A1A1A] text-xs font-semibold text-white">
                          {(c.name || "C")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#303030]">{c.name || "Guest Customer"}</p>
                          {c.email && <p className="text-[11px] text-[#8A8A8A]">{c.email}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-3 font-mono text-xs text-[#303030]">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="text-[#005BD3] hover:underline">
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-[#8A8A8A]">—</span>
                      )}
                    </td>

                    <td className="hidden py-3 pr-3 text-xs text-[#616161] sm:table-cell max-w-xs truncate">
                      {c.last_address ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-[#8A8A8A]" />
                          <span className="truncate">{c.last_address}</span>
                        </span>
                      ) : (
                        <span className="text-[#8A8A8A]">—</span>
                      )}
                    </td>

                    <td className="py-3 pr-3 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#303030]">
                        <ShoppingBag className="h-3 w-3 text-[#616161]" /> {c.orders_count}
                      </span>
                      {isRepeat && (
                        <span className="ml-1.5 rounded bg-[#166534]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#166534]">
                          Repeat
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-3 text-right font-medium text-[#303030]">
                      Rs. {Number(c.total_spent || 0).toLocaleString()}
                    </td>

                    <td className="py-3 pr-4 text-center">
                      {phoneForWa ? (
                        <a
                          href={`https://wa.me/${phoneForWa}?text=${encodeURIComponent(`Assalam-o-Alaikum ${c.name || ""}! Nadeem Traders ki janib se rabita kar rahe hain.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/15 px-2.5 py-1 text-xs font-semibold text-[#075E54] hover:bg-[#25D366]/25 transition-colors"
                          title="Open WhatsApp chat with customer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Chat
                        </a>
                      ) : (
                        <span className="text-xs text-[#8A8A8A]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
