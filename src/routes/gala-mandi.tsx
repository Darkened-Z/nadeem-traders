import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gala-mandi")({
  beforeLoad: () => {
    throw redirect({
      to: "/shop",
    });
  },
  component: () => null,
});
