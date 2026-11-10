// Automatically adapt Nitro preset for Vercel vs Node.js server (PM2)
if (process.env.VERCEL) {
  process.env.NITRO_PRESET = "vercel";
} else {
  process.env.NITRO_PRESET = process.env.NITRO_PRESET || "node-server";
}

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
