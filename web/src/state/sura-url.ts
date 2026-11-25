/** The sheet's web app. In development Vite answers this path itself (vite.config.ts), so every flow runs without the sheet. */
export const ORDERS_URL: string = import.meta.env.VITE_SURA_ORDERS_URL || (import.meta.env.DEV ? "/api/sura-order" : "");
