import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Settings, Phone, Truck, ShieldCheck, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { adminGetSettings, adminSaveSettings } from "../lib/admin";
import { DEFAULT_STORE_SETTINGS } from "../lib/store-settings";
import { useAdminQuery } from "../components/admin-shell";
import { Button, Card, Field, PageHeader, errorMessage, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useAdminQuery(["settings"], () => adminGetSettings());
  const [form, setForm] = useState<Record<string, string>>(DEFAULT_STORE_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const update = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminSaveSettings({ data: form });
      toast.success("Store settings updated and published!");
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !settings) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-[#616161]" />;
  }

  return (
    <form onSubmit={handleSave}>
      <PageHeader
        title="Store Settings"
        actions={
          <Button type="submit" variant="primary" loading={saving}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        }
      />

      <div className="space-y-6">
        {/* WhatsApp & Customer Communication */}
        <Card title="WhatsApp & Live Inquiry Configuration">
          <div className="space-y-4">
            <Field
              label="WhatsApp Business Number (Primary)"
              help="Enter international digits without '+' or spaces (e.g. 923001234567). Powers the floating WhatsApp chat and all 'Rate Poochein' mandi quote buttons across the storefront."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#166534]">
                  wa.me/
                </span>
                <input
                  type="text"
                  required
                  placeholder="923001234567"
                  value={form.whatsapp_number ?? ""}
                  onChange={(e) => update("whatsapp_number", e.target.value.replace(/[^\d]/g, ""))}
                  className={`${inputClass} pl-16 font-mono text-xs`}
                />
              </div>
            </Field>

            <Field
              label="Top Announcement Bar Text"
              help="Displayed prominently at the very top of the website on both mobile and desktop."
            >
              <input
                type="text"
                required
                placeholder="100% Purity Guaranteed · Apka Trusted Stop · Fast Doorstep Delivery via PostEx Courier"
                value={form.announcement_text ?? ""}
                onChange={(e) => update("announcement_text", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        {/* PostEx Courier & Delivery Fees */}
        <Card title="PostEx Courier & Delivery Fees">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Standard Cash on Delivery (COD) Fee (PKR)"
              help="Default shipping fee charged for orders via PostEx Courier."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8A8A]">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="250"
                  value={form.delivery_fee ?? "250"}
                  onChange={(e) => update("delivery_fee", e.target.value)}
                  className={`${inputClass} pl-9 font-semibold text-xs`}
                />
              </div>
            </Field>

            <Field
              label="Free Delivery Minimum Order (PKR)"
              help="Orders above this amount qualify for free shipping. Enter 0 to disable."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8A8A]">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="3000"
                  value={form.free_delivery_threshold ?? "3000"}
                  onChange={(e) => update("free_delivery_threshold", e.target.value)}
                  className={`${inputClass} pl-9 font-semibold text-xs`}
                />
              </div>
            </Field>
          </div>
        </Card>

        {/* Store Profile & Contact Details */}
        <Card title="Store Contact & Location Details">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer Support Phone">
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={form.store_phone ?? ""}
                  onChange={(e) => update("store_phone", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Support Email Address">
                <input
                  type="email"
                  placeholder="info@nadeemtraders.pk"
                  value={form.store_email ?? ""}
                  onChange={(e) => update("store_email", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Physical Store / Trading Location">
              <input
                type="text"
                placeholder="Gala Mandi, Pakistan"
                value={form.store_address ?? ""}
                onChange={(e) => update("store_address", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" loading={saving} className="px-6 py-2.5">
            <Save className="h-4 w-4" /> Save Store Settings
          </Button>
        </div>
      </div>
    </form>
  );
}
