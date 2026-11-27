import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, ArrowRight } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center & FAQs — Nadeem Traders" },
      { name: "description", content: "Frequently asked questions about ordering, delivery, and payments." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { categories, products, currentUser } = useStoreData();
  const faqs = [
    {
      q: "How does delivery via PostEx Courier work?",
      a: "All orders placed on Nadeem Traders are dispatched via PostEx Courier. You receive tracking updates via SMS, and pay in cash only when your order arrives safely at your doorstep (Cash on Delivery).",
    },
    {
      q: "Do I need to create an account or log in to place an order?",
      a: "No! You can shop and checkout directly as a guest in just 30 seconds. Just enter your name, phone number, and address.",
    },
    {
      q: "Do you deliver to all cities in Pakistan?",
      a: "Yes. Parcels are dispatched daily from our Punjab hub via PostEx Courier across Punjab, Sindh, KPK, Islamabad, and Balochistan.",
    },
    {
      q: "Can I place or track orders on WhatsApp?",
      a: "Absolutely! Tap our WhatsApp widget at the bottom-right corner to speak directly with our team, verify stock, or get personalized assistance.",
    },
    {
      q: "How do you ensure 100% pure kiryana without adulteration?",
      a: "We source every item from verified growers and importers, and list its origin on the product page. Every batch of dry fruits, seeds, and spices is cleaned and sealed in food-grade packaging before dispatch.",
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
            Ordering, delivery aur payments — sab ke jawab.
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
            className="rounded inline-flex items-center gap-1.5 btn-gold px-5 py-2.5 text-xs font-semibold"
          >
            Contact Support <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
