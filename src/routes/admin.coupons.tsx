import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Ticket, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { adminListCoupons, adminSaveCoupon, adminDeleteCoupon, adminToggleCoupon } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Button, EmptyState, Field, Modal, PageHeader, errorMessage, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/coupons")({
  component: CouponsPage,
});

type CouponModalData = {
  id?: number;
  code: string;
  discount_percent: number;
  min_order_amount: number;
  active: boolean;
};

function CouponsPage() {
  const qc = useQueryClient();
  const { data: coupons = [], isLoading } = useAdminQuery(["coupons"], () => adminListCoupons());
  const [editing, setEditing] = useState<CouponModalData | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const save = async () => {
    if (!editing) return;
    if (!editing.code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setSaving(true);
    try {
      await adminSaveCoupon({
        data: {
          id: editing.id,
          code: editing.code.trim().toUpperCase(),
          discount_percent: Number(editing.discount_percent) || 5,
          min_order_amount: Number(editing.min_order_amount) || 0,
          active: editing.active,
        },
      });
      toast.success(editing.id ? "Coupon updated" : "Coupon created successfully");
      setEditing(null);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: number, currentActive: boolean) => {
    try {
      await adminToggleCoupon({ data: { id, active: !currentActive } });
      toast.success(!currentActive ? "Coupon activated" : "Coupon deactivated");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (id: number, code: string) => {
    if (!confirm(`Delete coupon code "${code}"?`)) return;
    try {
      await adminDeleteCoupon({ data: { id } });
      toast.success("Coupon deleted");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const list = coupons as any[];

  return (
    <>
      <PageHeader
        title="Discount Coupons"
        actions={
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                code: "",
                discount_percent: 10,
                min_order_amount: 0,
                active: true,
              })
            }
          >
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        {isLoading ? (
          <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-[#616161]" />
        ) : list.length === 0 ? (
          <EmptyState
            title="No coupons yet"
            body="Create promo codes like WELCOME10 or RAMADAN5 for your customers."
          />
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F7F7F7] text-xs font-semibold text-[#616161]">
              <tr>
                <th className="px-4 py-2.5">Promo Code</th>
                <th className="py-2.5 pr-3">Discount</th>
                <th className="py-2.5 pr-3">Minimum Order</th>
                <th className="py-2.5 pr-3 text-center">Times Used</th>
                <th className="py-2.5 pr-3 text-center">Status</th>
                <th className="py-2.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold tracking-wider text-[#1A1A1A] bg-[#F1F1F1] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-semibold text-[#166534]">
                    {c.discount_percent}% OFF
                  </td>
                  <td className="py-3 pr-3 text-xs text-[#616161]">
                    {c.min_order_amount > 0 ? `Rs. ${Number(c.min_order_amount).toLocaleString()}` : "No minimum"}
                  </td>
                  <td className="py-3 pr-3 text-center font-medium text-[#303030]">
                    {c.times_used || 0}
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggle(c.id, c.active)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        c.active
                          ? "bg-[#166534]/10 text-[#166534] hover:bg-[#166534]/20"
                          : "bg-[#8A8A8A]/15 text-[#616161] hover:bg-[#8A8A8A]/25"
                      }`}
                    >
                      {c.active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> Disabled
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            code: c.code,
                            discount_percent: c.discount_percent,
                            min_order_amount: c.min_order_amount || 0,
                            active: c.active,
                          })
                        }
                        className="py-1 px-2.5 text-xs"
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => remove(c.id, c.code)}
                        className="rounded p-1 text-[#8A8A8A] hover:bg-[#FBEAE5] hover:text-[#C70A24]"
                        title="Delete coupon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit Coupon" : "Create New Coupon"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save} loading={saving}>
                {editing.id ? "Save Changes" : "Create Coupon"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Coupon Code" help="Customer will type this code during checkout (e.g. WELCOME10, AZADI)">
              <input
                type="text"
                autoFocus
                placeholder="WELCOME10"
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                className={`${inputClass} font-mono uppercase font-bold`}
              />
            </Field>

            <Field label="Discount Percentage (%)" help="Percentage discount subtracted from order subtotal">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editing.discount_percent}
                  onChange={(e) => setEditing({ ...editing, discount_percent: Number(e.target.value) })}
                  className={`${inputClass} pr-8 font-semibold`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A8A8A]">
                  %
                </span>
              </div>
            </Field>

            <Field label="Minimum Order Amount (PKR)" help="Optional minimum cart value to qualify (0 for none)">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8A8A]">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={editing.min_order_amount}
                  onChange={(e) => setEditing({ ...editing, min_order_amount: Number(e.target.value) })}
                  className={`${inputClass} pl-9 font-semibold`}
                />
              </div>
            </Field>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 rounded border-[#8A8A8A] text-[#1A1A1A] focus:ring-black"
              />
              <span className="text-xs font-semibold text-[#303030]">Coupon is active and ready to use</span>
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
