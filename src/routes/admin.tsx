import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "../components/admin-shell";
import { adminSession } from "../lib/admin";

export const Route = createFileRoute("/admin")({
  loader: () => adminSession(),
  staleTime: 0,
  headers: () => ({
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  }),
  head: () => ({
    meta: [{ title: "Admin — Nadeem Traders" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  const initialSession = Route.useLoaderData();
  return <AdminShell initialSession={initialSession} />;
}
