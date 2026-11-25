/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APP_MODE?: string;
  readonly VITE_MARKET?: string;
  readonly VITE_CORNER?: string;
  readonly VITE_SURA_ORDERS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
