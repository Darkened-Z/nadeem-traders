import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";
const RAW_GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
const GA_ID = RAW_GA_ID && /^G-[A-Z0-9]{4,20}$/i.test(RAW_GA_ID) ? RAW_GA_ID : undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let posthogStarted = false;
let gaStarted = false;
let listenersAttached = false;

function isAdminPath(pathname?: string): boolean {
  if (typeof window === "undefined") return false;
  const p = pathname ?? window.location.pathname;
  return p.startsWith("/admin");
}

function initGa4() {
  if (gaStarted || !GA_ID || typeof window === "undefined" || isAdminPath()) return;
  gaStarted = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

function attachLinkListeners() {
  if (listenersAttached || typeof document === "undefined") return;
  listenersAttached = true;

  // WhatsApp is a second checkout here, so every wa.me / tel: link counts, wherever it sits on the page.
  document.addEventListener(
    "click",
    (e) => {
      if (isAdminPath()) return;
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

export function initAnalytics() {
  if (typeof window === "undefined") return;

  if (!posthogStarted && KEY) {
    posthogStarted = true;
    posthog.init(KEY, {
      api_host: HOST,
      defaults: "2025-05-24",
      person_profiles: "identified_only",
      // The admin panel is staff-only and would skew the storefront funnel.
      before_send: (event) => (window.location.pathname.startsWith("/admin") ? null : event),
      session_recording: { maskAllInputs: true },
      enable_heatmaps: true,
    });
  }

  initGa4();
  attachLinkListeners();
}

export function trackPageView(pathname: string) {
  if (typeof window === "undefined" || isAdminPath(pathname)) return;
  if (!gaStarted) initGa4();
  if (gaStarted && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
}

function forwardToGa4(event: string, properties?: Record<string, unknown>) {
  if (!gaStarted || !window.gtag || isAdminPath()) return;
  const p = properties ?? {};

  switch (event) {
    case "product_viewed":
      window.gtag("event", "view_item", {
        items: [{ item_id: String(p.product_id ?? ""), item_name: String(p.product_name ?? ""), item_category: String(p.category ?? "") }],
      });
      return;
    case "added_to_cart": {
      const price = Number(p.price ?? 0);
      const qty = Number(p.quantity ?? 1);
      window.gtag("event", "add_to_cart", {
        currency: "PKR",
        value: Number.isFinite(price * qty) ? price * qty : 0,
        items: [{ item_id: String(p.product_id ?? ""), item_name: String(p.product_name ?? ""), item_variant: String(p.variant ?? ""), quantity: qty, price }],
      });
      return;
    }
    case "checkout_started":
      window.gtag("event", "begin_checkout", { items_count: Number(p.items ?? 0) });
      return;
    case "order_placed":
      window.gtag("event", "purchase", {
        transaction_id: String(p.order_id ?? ""),
        currency: "PKR",
        value: Number(p.total ?? 0),
      });
      return;
    case "searched":
      window.gtag("event", "search", { search_term: String(p.query ?? "") });
      return;
    default:
      window.gtag("event", event, p);
  }
}

// Funnel: $pageview → product_viewed → added_to_cart → checkout_started → checkout_submitted → order_placed
export function track(event: string, properties?: Record<string, unknown>) {
  if (posthogStarted) posthog.capture(event, properties);
  forwardToGa4(event, properties);
}

export function identifyCustomer(user: Record<string, unknown> | null) {
  if (!posthogStarted || !user?.id) return;
  posthog.identify(String(user.id), {
    name: typeof user.name === "string" ? user.name : undefined,
    email: typeof user.email === "string" ? user.email : undefined,
  });
}

export function resetCustomer() {
  if (posthogStarted) posthog.reset();
}
