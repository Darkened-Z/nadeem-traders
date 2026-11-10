import { createFileRoute } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Nadeem Traders" },
      { name: "description", content: "Details on how session tokens and cookies are used on the portal." },
    ],
  }),
  component: CookiePage,
});

function CookiePage() {
  const { categories, products, currentUser } = useStoreData();
  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-soft space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Cookie className="h-3.5 w-3.5" /> Browser Storage
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Cookie Policy</h1>
            <p className="mt-1 text-xs text-muted-foreground">Effective Date: November 2026</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">1. Essential Authentication Cookies</h3>
            <p>
              We use HTTP-only, SameSite=Lax cookies (`nadeem_session_token` and `nadeem_guest_token`) strictly to preserve your signed-in session and merge your guest shopping cart upon login.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-foreground">2. Zero Third-Party Ad Trackers</h3>
            <p>
              Nadeem Traders does not embed invasive third-party advertising trackers. Any client caching is used solely to accelerate catalog navigation.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
