import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Nadeem Traders" },
      { name: "description", content: "Understand how your personal credentials and session data are managed securely." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { categories, products, currentUser } = useStoreData();
  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Shield className="h-3.5 w-3.5" /> Data Protection
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="mt-1 text-xs text-muted-foreground">Effective Date: November 2026</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">1. Information Collection</h3>
            <p>
              We collect only the account details required to process and deliver your orders: your name, verified email address, delivery address, and phone number. When signing in via Google OAuth, we receive your basic profile identifier and verified email without accessing or storing your password.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">2. Session & Cookie Security</h3>
            <p>
              Active sessions are maintained using HTTP-only cookies backed by our encrypted database session store. You can review your login history or sign out active devices at any time from your account dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">3. Order & Logistics Sharing</h3>
            <p>
              Your delivery address and contact phone number are shared strictly with our dispatch couriers and freight partners to fulfill your order. We never sell or rent customer data to third-party marketers.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
