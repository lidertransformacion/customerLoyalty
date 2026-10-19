/**
 * What this build ships.
 * `menu`: only the menu. A table QR or the link opens the book; nothing else is reachable.
 * `corner`: only the corners. Each corner's QR opens its own book; the root shows no menu at all,
 *   so a guest at one corner never sees another corner's prices.
 * `full`: the house account, points, orders, wallet, promos, and the menu.
 * Set in `web/.env` (`VITE_APP_MODE`); `main` ships `menu`, `corners` ships `corner`, `loyalty` ships `full`.
 */
export type AppMode = "menu" | "corner" | "full";

const raw = (import.meta.env.VITE_APP_MODE ?? "").toLowerCase();

export const APP_MODE: AppMode = raw === "full" ? "full" : raw === "corner" ? "corner" : "menu";

/** No account, no orders: the menu-only and corner-only builds. */
export const menuOnly = APP_MODE !== "full";

export const cornerOnly = APP_MODE === "corner";
