import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/outfit";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/glass.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { registerSW } from "virtual:pwa-register";

import { App } from "./app";
import "./core/cities";
import { LocaleProvider } from "./i18n";
import { AccountProvider } from "./state/account";
import { CatalogProvider } from "./state/catalog";
import { PresenceProvider } from "./state/presence";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <CatalogProvider>
          <AccountProvider>
            <PresenceProvider>
              <App />
            </PresenceProvider>
          </AccountProvider>
        </CatalogProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);
