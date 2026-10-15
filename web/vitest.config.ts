import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Same `@` alias as `vite.config.ts`: the repository root, so the core
 * modules resolve the program rules, menu and copy shared with the Expo app.
 * The clock is pinned to the Colombian zone so hour- and day-based rules
 * read the same on every machine.
 */
const root = fileURLToPath(new URL("..", import.meta.url));

process.env.TZ = "America/Bogota";

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
