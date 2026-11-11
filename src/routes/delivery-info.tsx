import { createFileRoute } from "@tanstack/react-router";
import { Truck, ShieldCheck, MapPin, Clock } from "lucide-react";
import { StoreLayout, useStoreData } from "../components/store-layout";

export const Route = createFileRoute("/delivery-info")({
  head: () => ({
    meta: [
      { title: "Delivery Information — Nadeem Traders" },
      { name: "description", content: "Details about shipping rates, timelines, and delivery areas in Pakistan." },
    ],
  }),
  component: DeliveryInfoPage,
});

function DeliveryInfoPage() {
  const { categories, products, currentUser } = useStoreData();

  return (
    <StoreLayout categories={categories} products={products} currentUser={currentUser}>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-10">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Delivery
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Delivery via PostEx Courier
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Nadeem Traders partners with <strong>PostEx Courier</strong> to provide fast, tracked Cash on Delivery (COD) across every city and town in Pakistan. No delivery selection required — automated doorstep dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              icon: Truck,
              title: "PostEx Courier Logistics",
              desc: "Automated booking and door-to-door tracking with instant SMS notifications upon dispatch.",
            },
            {
              icon: MapPin,
              title: "Faisalabad Local Delivery",
              desc: "Within Faisalabad we deliver through InDrive or Yango — straight from our shop to your door.",
            },
            {
              icon: Clock,
              title: "Dispatch Timelines",
              desc: "Orders confirmed before 2:00 PM ship same day. Punjab deliveries in 24–48 hours; nationwide in 2–4 business days.",
            },
            {
              icon: ShieldCheck,
              title: "Moisture-Sealed Packing",
              desc: "Spices and dry fruits are heat-sealed in food-grade pouches; grains and pulses ship in durable woven sacks.",
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{c.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="border-b border-border bg-muted/50 px-6 py-4">
            <h3 className="font-display text-base font-bold text-foreground">
              Standard Shipping Tariff Schedule
            </h3>
          </div>
          <div className="divide-y divide-border text-xs">
            <div className="grid grid-cols-3 px-6 py-3.5 font-semibold text-muted-foreground">
              <span>Order Tier</span>
              <span>Delivery Window</span>
              <span>Shipping Fee</span>
            </div>
            <div className="grid grid-cols-3 px-6 py-3.5">
              <span className="font-semibold text-foreground">Orders Above Rs. 2,000</span>
              <span>1–3 Business Days</span>
              <span className="font-mono font-bold text-primary">FREE</span>
            </div>
            <div className="grid grid-cols-3 px-6 py-3.5">
              <span className="font-semibold text-foreground">Standard Retail (Under Rs. 2,000)</span>
              <span>1–3 Business Days</span>
              <span className="font-mono font-semibold">Rs. 180</span>
            </div>
            <div className="grid grid-cols-3 px-6 py-3.5">
              <span className="font-semibold text-foreground">Bulk Mandi Sacks (25kg–50kg+)</span>
              <span>2–5 Business Days (Bilty / Freight)</span>
              <span className="font-mono font-semibold">Calculated by Weight & City</span>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
