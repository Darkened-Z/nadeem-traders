import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Store, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { submitInquiry } from "../lib/actions";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/sell-with-us")({
  head: () => ({
    meta: [
      { title: "Supplier Onboarding — Nadeem Traders" },
      { name: "description", content: "Partner with Nadeem Traders as an agricultural grower or mill." },
    ],
  }),
  component: SellWithUsPage,
});

function SellWithUsPage() {
  const { categories, products, currentUser } = useStoreData();
  const [form, setForm] = useState({ supplierName: "", city: "", phone: "", catalogType: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitInquiry({ data: { kind: "supplier", ...form } });
      toast.success("Partner application submitted! Our procurement team will review and reach out.");
      setForm({ supplierName: "", city: "", phone: "", catalogType: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Partner as a Verified Supplier
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Are you a spice processor, seed supplier, or orchard grower? Supply your commodities directly through Nadeem Traders.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-foreground">
              Mill / Grower / Company Name *
            </label>
            <input
              required
              type="text"
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              placeholder="e.g. Chenab Agro Mills"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground">Origin City *</label>
              <input
                required
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Hafizabad, Sargodha"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Contact Phone *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0300 1234567"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">
              Commodities & Monthly Capacity *
            </label>
            <textarea
              required
              rows={4}
              value={form.catalogType}
              onChange={(e) => setForm({ ...form, catalogType: e.target.value })}
              placeholder="Describe the products you supply, grading standards, and minimum dispatch quantities..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded w-full inline-flex items-center justify-center gap-2 btn-gold py-3 text-xs font-semibold disabled:opacity-50"
          >
            <Send className="h-4 w-4" />{" "}
            {submitting ? "Submitting Application..." : "Submit Supplier Application"}
          </button>
        </form>
      </div>
    </StoreLayout>
  );
}
