import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, ArrowRight } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center & FAQs — Nadeem Traders" },
      { name: "description", content: "Frequently asked questions about ordering, bulk wholesale rates, and accounts." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { categories, products, currentUser } = useStoreData();
  const faqs = [
    {
      q: "How do wholesale bulk rates work in the shopping cart?",
      a: "Every eligible product displays both a retail pack price and a minimum bulk quantity (typically 5 to 12 units). As soon as your quantity in the cart reaches that threshold, the unit price automatically switches to the lower wholesale mandi rate.",
    },
    {
      q: "How is my session secured when signing in?",
      a: "We support Google OAuth 2.0 and 6-digit Email OTP verification. Your session token is stored in an HTTP-only cookie and backed by our PostgreSQL sessions ledger so you can manage active devices from your dashboard.",
    },
    {
      q: "Do you ship bulk wholesale sacks to all cities in Pakistan?",
      a: "Yes. Retail parcels and wholesale cartons/sacks are dispatched daily from our central Punjab warehouse via courier and truck bilty logistics across Punjab, Sindh, KPK, and Balochistan.",
    },
    {
      q: "What payment methods are accepted?",
      a: "All retail orders placed on the storefront support Cash on Delivery (COD) so you can inspect your items at your doorstep. Commercial bulk orders can also be settled via bank transfer.",
    },
    {
      q: "How do welcome reward points work?",
      a: "New accounts receive 100 welcome reward points upon verification. You can track your points balance and active discount coupons inside your customer dashboard.",
    },
  ];

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <HelpCircle className="h-3.5 w-3.5" /> Support Center
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Answers regarding wholesale tier pricing, shipping timelines, and account security.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-2">
              <h3 className="font-display text-base font-bold text-foreground">{item.q}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/60 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-display text-base font-bold text-foreground">Still have questions?</h4>
            <p className="text-xs text-muted-foreground">
              Our support team is available Monday through Saturday.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Contact Support <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
