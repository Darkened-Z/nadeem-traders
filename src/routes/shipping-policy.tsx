import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — Nadeem Traders" },
      { name: "description", content: "Details on wholesale shipping schedules and logistics networks." },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  const { categories, products, currentUser } = useStoreData();
  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Truck className="h-3.5 w-3.5" /> Fulfillment Terms
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Shipping Policy</h1>
            <p className="mt-1 text-xs text-muted-foreground">Effective Date: November 2026</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">1. PostEx Courier Dispatch</h3>
            <p>
              All orders are packed and handed over to our official courier partner, <strong>PostEx Courier</strong>, within 24 hours. Tracked Cash on Delivery (COD) is available nationwide with SMS order alerts.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">2. Bulk & Freight Bilty</h3>
            <p>
              Wholesale orders involving 25kg–50kg sacks or multiple oil cartons are dispatched via registered goods transport (bilty) or dedicated commercial vehicles from our Punjab hub.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
