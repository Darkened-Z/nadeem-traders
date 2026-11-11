import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — Nadeem Traders" },
      { name: "description", content: "Returns and refund policy for grocery products and agricultural commodities." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  const { categories, products, currentUser } = useStoreData();
  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <RotateCcw className="h-3.5 w-3.5" /> Quality Guarantee
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
              Refund & Return Policy
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Effective Date: November 2026</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">1. Inspection Upon Delivery</h3>
            <p>
              Because spices, grains, and dry fruits are agricultural food commodities, we encourage inspecting your parcel upon delivery. Return or replacement requests must be raised within 24 hours of receipt.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">2. Packaging Integrity</h3>
            <p>
              Items eligible for return must remain in their original moisture-resistant packaging. If a batch fails our stated quality or weight specification, we provide a free replacement or full refund via bank transfer / mobile wallet within 3 business days.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
