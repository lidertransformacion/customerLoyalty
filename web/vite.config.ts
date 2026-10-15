import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * `@` points at the repository root so the web app imports the same
 * program rules, menu catalog and Spanish copy the Expo app uses:
 * `@/src/data/program`, `@/src/data/menu`, `@/src/i18n/strings`, `@/src/format`.
 */
const root = fileURLToPath(new URL("..", import.meta.url));

/** Local stand-in for the Cloudflare function in functions/api/where.ts. Set VITE_DEV_CITY=Cartagena to fake it. */
function devWhere() {
  return {
    name: "dev-where",
    configureServer(server: { middlewares: { use: (path: string, handler: (req: unknown, res: { setHeader: (k: string, v: string) => void; end: (body: string) => void }) => void) => void } }) {
      server.middlewares.use("/api/where", (_req, res) => {
        const city = process.env.VITE_DEV_CITY ?? null;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ city, region: null, country: process.env.VITE_DEV_COUNTRY ?? "CO", lat: null, lng: null, timezone: null, source: "dev" }));
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    devWhere(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/*.png", "menu/*.jpg"],
      manifest: {
        name: "Libertario",
        short_name: "Libertario",
        description: "La casa Libertario: puntos, tazas y la carta.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#122136",
        theme_color: "#122136",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,woff2}"],
        navigateFallback: "/index.html",
      },
      devOptions: { enabled: false },
    }),
  ],
  // The shared program module reads `process.env.EXPO_PUBLIC_ODOO_URL` (Expo style).
  define: {
    "process.env.EXPO_PUBLIC_ODOO_URL": JSON.stringify(process.env.EXPO_PUBLIC_ODOO_URL ?? ""),
  },
  resolve: {
    alias: { "@": root },
  },
  server: {
    fs: { allow: [root] },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
