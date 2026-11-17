import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-secondary">
          404 · Page Not Found
        </p>
        <h1 className="mt-3 font-display text-4xl font-normal tracking-tight text-foreground">
          This collection has moved
        </h1>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          The page you are looking for does not exist. Explore our curated commodity collections below.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
          >
            Return Home
          </Link>
          <Link
            to="/categories"
            className="inline-flex items-center justify-center border border-foreground/30 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground transition hover:border-foreground"
          >
            Explore Collections
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-fade-up">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
          Unable to load this view
        </h1>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Something went wrong while loading the catalog. Please refresh or return to the storefront.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center bg-primary px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center border border-border bg-card px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nadeem Traders — Apka Trusted Stop" },
      {
        name: "description",
        content:
          "Born from the earth, refined by craft. Direct-from-source culinary spices, aged basmati rice, orchard dry fruits, and pulses across Pakistan.",
      },
      { name: "author", content: "Nadeem Traders" },
      {
        property: "og:title",
        content: "Nadeem Traders — Apka Trusted Stop",
      },
      {
        property: "og:description",
        content:
          "Dry fruits, seeds aur masalay — duniya bhar se chun kar aapke kitchen tak. Cash on delivery across Pakistan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/LOGO.png", type: "image/png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/LOGO.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
