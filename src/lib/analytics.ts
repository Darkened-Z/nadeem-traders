import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";

let started = false;

export function initAnalytics() {
  if (started || !KEY || typeof window === "undefined") return;
  started = true;
  posthog.init(KEY, {
    api_host: HOST,
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    // The admin panel is staff-only and would skew the storefront funnel.
    before_send: (event) => (window.location.pathname.startsWith("/admin") ? null : event),
    session_recording: { maskAllInputs: true },
    enable_heatmaps: true,
  });

  // WhatsApp is a second checkout here, so every wa.me / tel: link counts, wherever it sits on the page.
  document.addEventListener(
    "click",
    (e) => {
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.href;
      if (href.includes("wa.me/") || href.includes("api.whatsapp.com")) {
        const text = new URL(href).searchParams.get("text") ?? "";
        track("whatsapp_clicked", { label: link.innerText.trim().slice(0, 60), message: text.slice(0, 120) });
      } else if (href.startsWith("tel:")) {
        track("phone_clicked", { label: link.innerText.trim().slice(0, 60) });
      }
    },
    { capture: true },
  );
}

// Funnel: $pageview → product_viewed → added_to_cart → checkout_started → checkout_submitted → order_placed
export function track(event: string, properties?: Record<string, unknown>) {
  if (!started) return;
  posthog.capture(event, properties);
}

export function identifyCustomer(user: Record<string, any> | null) {
  if (!started || !user?.id) return;
  posthog.identify(String(user.id), { name: user.name ?? undefined, email: user.email ?? undefined });
}

export function resetCustomer() {
  if (started) posthog.reset();
}
