import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileSpreadsheet, Send, Building2, Truck, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/bulk-orders")({
  head: () => ({
    meta: [
      { title: "Bulk & Corporate Wholesale Orders — Nadeem Traders" },
      {
        name: "description",
        content:
          "Request commercial quotes for 25kg–50kg sacks of basmati rice, pulses, spices, and edible oils for hotels, restaurants, and retail stores.",
      },
    ],
  }),
  component: BulkOrdersPage,
});

function BulkOrdersPage() {
  const { categories, products, currentUser } = useStoreData();
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    city: "",
    itemsQuery: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Bulk inquiry registered! Our wholesale desk will contact you within 24 hours.");
      setForm({ companyName: "", contactPerson: "", phone: "", city: "", itemsQuery: "" });
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Left Column Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                B2B & HoReCa Desk
              </span>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-foreground">
                Commercial & Bulk Wholesale Orders
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Supplying restaurants, banquet halls, bakeries, hostels, and karyana merchants with 25kg and 50kg mandi sacks at direct mill rates.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Building2,
                  title: "Direct Mandi & Mill Billing",
                  desc: "Volume-tiered quotations for 50kg grain bags, 16kg ghee tins, and bulk spice cartons.",
                },
                {
                  icon: ShieldCheck,
                  title: "Consistent Batch Grading",
                  desc: "Pre-dispatch sample verification for hotels and catering kitchens.",
                },
                {
                  icon: Truck,
                  title: "Dedicated Freight & Bilty Dispatch",
                  desc: "Doorstep delivery across Punjab and nationwide truck bilty dispatch.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column Form */}
          <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft">
            {submitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Wholesale Inquiry Received
                </h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Our commercial sales team has received your requirement list and will share a formal rate sheet via phone/WhatsApp within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-3">
                  Request a Commercial Rate Sheet
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Business / Organization Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="e.g. Al-nakhlah Restaurant & Caterers"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Contact Person *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="Full Name"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0300 1234567"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Delivery City *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Faisalabad, Lahore, Islamabad"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Required Commodities & Estimated Quantities *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.itemsQuery}
                    onChange={(e) => setForm({ ...form, itemsQuery: e.target.value })}
                    placeholder="e.g. 20 bags of 1121 Kainat Basmati Rice (25kg), 10 cartons Sunflower Oil, 15kg Kunri Red Chilli Powder..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />{" "}
                  {submitting ? "Submitting Request..." : "Submit Commercial Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
