import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/terms-of-use")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Nadeem Traders" },
      { name: "description", content: "Terms of service and commercial ordering conditions." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { categories, products, currentUser } = useStoreData();
  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <FileText className="h-3.5 w-3.5" /> Legal Terms
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Terms of Use</h1>
            <p className="mt-1 text-xs text-muted-foreground">Effective Date: November 2026</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">1. Acceptance of Terms</h3>
            <p>
              By browsing and placing orders on Nadeem Traders (Apka Trusted Stop), you agree to these terms. All orders are subject to stock availability and commodity quality inspection.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">2. Transparent Pricing</h3>
            <p>
              All prices shown on the store are genuine, single-tier direct commodity prices with no hidden markup or deceptive markdowns.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">3. PostEx Courier Cash on Delivery</h3>
            <p>
              Orders are dispatched via PostEx Courier. Customers must provide an accurate street address and active mobile number for SMS tracking. Payment is collected upon doorstep receipt.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
