import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Nadeem Traders" },
      { name: "description", content: "Reach out to Nadeem Traders for orders and inquiries." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { categories, products, currentUser } = useStoreData();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message received. Our customer desk will get back to you shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 600);
  };

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Customer Support
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Contact Us</h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Questions about bulk freight across Pakistan, commercial pricing, or an existing order? Reach out to our warehouse team directly.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: MapPin,
                title: "Central Grain & Spice Hub",
                desc: "Commercial Mandi Road, Punjab, Pakistan",
              },
              {
                icon: Phone,
                title: "Direct Sales & Dispatch Desk",
                desc: "+92 300 1234567 (Mon–Sat, 9:00 AM – 8:00 PM)",
              },
              {
                icon: Mail,
                title: "Email Inquiries",
                desc: "support@nadeemtraders.pk",
              },
              {
                icon: Clock,
                title: "Same-Day Dispatch Cutoff",
                desc: "Orders placed before 2:00 PM PKT dispatch the same business day.",
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
                    <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft">
          <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-3 mb-5">
            Send a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Your Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Subject *</label>
              <input
                required
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Message *</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </StoreLayout>
  );
}
