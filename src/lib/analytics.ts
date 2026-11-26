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
  });
}

// Funnel: $pageview → product_viewed → added_to_cart → checkout_started → checkout_submitted → order_placed
export function track(event: string, properties?: Record<string, unknown>) {
  if (!started) return;
  posthog.capture(event, properties);
}
