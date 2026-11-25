/**
 * What this build ships.
 * `menu`: only the menu. A table QR or the link opens the book; nothing else is reachable.
 * `full`: the house account, points, orders, wallet, promos, and the menu.
 * Set in `web/.env` (`VITE_APP_MODE`); `main` ships `menu`, `loyalty` ships `full`.
 */
export type AppMode = "menu" | "full";

const raw = (import.meta.env.VITE_APP_MODE ?? "").toLowerCase();

export const APP_MODE: AppMode = raw === "full" ? "full" : "menu";

export const menuOnly = APP_MODE === "menu";

/**
 * A build for one corporate corner. `sura`: the Sura menu, where a guest can also send an order
 * (core/sura.ts). Set in `web/.env` (`VITE_CORNER`); only the `sura` branch sets it.
 */
export const suraBuild = (import.meta.env.VITE_CORNER ?? "").toLowerCase() === "sura";

/**
 * Whether the guest sees prices. Sura pays for what its people order, so its menu shows none;
 * the price still travels with the order to the sheet.
 */
export const showPrices = !suraBuild;
