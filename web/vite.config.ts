import { realpathSync } from "node:fs";
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

/**
 * Local stand-in for the orders sheet's web app (web/sura/Code.gs): it numbers the orders, keeps them in memory
 * and answers the bar's board (login with barra / barra, list, deliver, return, cancel, printed), so the Sura flow and
 * the board run end to end in development without writing to the sheet.
 */
function devSuraOrders() {
  type Row = { number: number; at: string; cedula: string; name: string; area: string; items: unknown[]; delivered: boolean; deliveredAt: string; printedAt: string };
  const rows: Row[] = [];
  const TOKEN = "dev-token";
  const answer = (body: Record<string, unknown>): Record<string, unknown> => {
    if (body.action === undefined) {
      // one order per ID number a day, as the sheet does
      if (rows.some((entry) => entry.cedula === String(body.cedula ?? "") && entry.at.slice(0, 10) === new Date().toISOString().slice(0, 10))) return { ok: false, error: "ya pidió hoy" };
      const row: Row = { number: rows.length + 1, at: new Date().toISOString(), cedula: String(body.cedula ?? ""), name: String(body.nombre ?? ""), area: String(body.area ?? ""), items: Array.isArray(body.items) ? body.items : [], delivered: false, deliveredAt: "", printedAt: "" };
      rows.push(row);
      console.log(`[sura] pedido #${row.number} ${JSON.stringify(body)}`);
      return { ok: true, number: row.number };
    }
    if (body.action === "login") return body.user === "barra" && body.password === "barra" ? { ok: true, token: TOKEN, name: "Barra Calle 100" } : { ok: false, error: "credenciales" };
    if (body.token !== TOKEN) return { ok: false, error: "sesion" };
    if (body.action === "list") return { ok: true, orders: rows };
    const row = rows.find((entry) => entry.number === Number(body.number));
    if (!row) return { ok: false, error: "no existe" };
    if (body.action === "deliver") Object.assign(row, { delivered: true, deliveredAt: new Date().toISOString() });
    else if (body.action === "return") Object.assign(row, { delivered: false, deliveredAt: "" });
    else if (body.action === "cancel") rows.splice(rows.indexOf(row), 1);
    else if (body.action === "printed") {
      if (row.printedAt && body.force !== true) return { ok: true, claimed: false };
      row.printedAt = new Date().toISOString();
      return { ok: true, claimed: true };
    } else if (body.action === "unprinted") row.printedAt = "";
    else return { ok: false, error: "acción desconocida" };
    return { ok: true };
  };
  return {
    name: "dev-sura-orders",
    configureServer(server: { middlewares: { use: (path: string, handler: (req: { on: (event: string, listener: (chunk?: unknown) => void) => void }, res: { setHeader: (k: string, v: string) => void; end: (body: string) => void }) => void) => void } }) {
      server.middlewares.use("/api/sura-order", (req, res) => {
        let body = "";
        req.on("data", (chunk) => {
          body += String(chunk);
        });
        req.on("end", () => {
          res.setHeader("content-type", "application/json; charset=utf-8");
          try {
            res.end(JSON.stringify(answer(JSON.parse(body) as Record<string, unknown>)));
          } catch {
            res.end(JSON.stringify({ ok: false, error: "pedido vacío" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    devWhere(),
    devSuraOrders(),
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
    // a worktree links node_modules to the main checkout: the fonts live there
    fs: { allow: [root, realpathSync(fileURLToPath(new URL("./node_modules", import.meta.url)))] },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
