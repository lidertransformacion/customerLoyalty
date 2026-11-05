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
      // the manifest icons are not pushed into the precache by themselves: the ones the phone needs are in includeAssets
      includeManifestIcons: false,
      includeAssets: ["favicon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/icon-180.png"],
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
        // Install takes only the shell: code, styles, the manifest and the icons. Nothing heavy up front.
        globPatterns: ["**/*.{js,css,html,webmanifest}", "chile/brujula-azul*.webp"],
        // the 1024 px icon is for the install sheet only; the rest of the photographs are kept as they are seen
        globIgnores: ["**/video/*", "**/products/*", "**/menu/**", "**/chile/img/**", "**/chile/pages/**", "icons/icon-1024.png"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // Everything the guest sees is kept once seen: the second visit opens offline, the first downloads only what it shows.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/menu/"),
            handler: "CacheFirst",
            options: { cacheName: "menu-photos-v2", expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/chile/"),
            handler: "CacheFirst",
            options: { cacheName: "chile-print-v1", expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/products/") || url.pathname.startsWith("/brand/") || url.pathname.startsWith("/video/"),
            handler: "CacheFirst",
            options: { cacheName: "house-images-v1", expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: { cacheName: "fonts-v1", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
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
