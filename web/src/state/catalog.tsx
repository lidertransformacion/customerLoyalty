import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { catalogFor, cityById, translateCatalog, type Catalog, type CityId } from "../core/catalog";
import { cityFromHint, cityFromPosition, fetchIpHint } from "../core/geo";
import type { LatLng } from "../core/stores";
import { useLocale } from "../i18n";

const CITY_KEY = "libertario-city-v1";

/** Which city each house belongs to, so a table QR with `?sede=` also picks the menu. */
const STORE_CITY: Record<string, CityId> = {
  "zona-g": "bogota",
  "calle-93": "bogota",
  "calle-85": "bogota",
  usaquen: "bogota",
  bogota: "bogota",
  medellin: "medellin",
  provenza: "medellin",
  laureles: "medellin",
  cartagena: "cartagena",
  getsemani: "cartagena",
};

export type CitySource = "url" | "chosen" | "gps" | "ip" | "default";

type Api = {
  catalog: Catalog;
  source: CitySource;
  setCity: (id: CityId, source?: CitySource) => void;
  /** Called by the presence layer when a GPS fix arrives. */
  placeFromPosition: (position: LatLng) => void;
};

const CatalogContext = createContext<Api | null>(null);

type Stored = { id: CityId; source: CitySource };

function readStored(): Stored | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const onChilePath = window.location.pathname.replace(/\/+$/, "") === "/chile";
    const fromUrl = params.get("ciudad") ?? STORE_CITY[params.get("sede") ?? ""] ?? (onChilePath ? "santiago" : null);
    if (fromUrl) {
      const city = cityById(fromUrl);
      const stored: Stored = { id: city.id, source: "url" };
      window.localStorage.setItem(CITY_KEY, JSON.stringify(stored));
      return stored;
    }
    const raw = window.localStorage.getItem(CITY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      const stored = parsed as Stored;
      return { id: cityById(stored.id).id, source: stored.source ?? "chosen" };
    }
    return null;
  } catch {
    return null;
  }
}

/** Precedence: the guest's own choice or a QR beats GPS, which beats the IP hint, which beats the default. */
const RANK: Record<CitySource, number> = { chosen: 4, url: 4, gps: 3, ip: 2, default: 1 };

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { market, setMarket, lang } = useLocale();
  const [state, setState] = useState<Stored>(() => readStored() ?? { id: "bogota", source: "default" });

  const setCity = useCallback((id: CityId, source: CitySource = "chosen") => {
    setState((current) => {
      if (RANK[source] < RANK[current.source] && current.id !== id) return current;
      const next: Stored = { id, source };
      try {
        window.localStorage.setItem(CITY_KEY, JSON.stringify(next));
      } catch {
        /* nothing */
      }
      return next;
    });
  }, []);

  const placeFromPosition = useCallback(
    (position: LatLng) => {
      const city = cityFromPosition(position);
      if (city) setCity(city.id, "gps");
    },
    [setCity],
  );

  // Without a choice, a QR or a GPS fix, ask the edge where the request came from.
  useEffect(() => {
    if (state.source !== "default") return;
    let alive = true;
    void fetchIpHint().then((hint) => {
      if (!alive || !hint) return;
      const city = cityFromHint(hint);
      if (city) setCity(city.id, "ip");
      if (hint.country === "CL" && market.id !== "CL") setMarket("CL");
    });
    return () => {
      alive = false;
    };
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The menu belongs to the country: a guest in Chile never gets a Colombian city, and the other way round.
  const chosen = cityById(state.id);
  const cityId: CityId = chosen.market === market.id ? chosen.id : market.id === "CL" ? "santiago" : "bogota";

  // a QR or a choice of a Chilean city also switches the money and the legal text to Chile
  useEffect(() => {
    if (chosen.market !== market.id && (state.source === "url" || state.source === "chosen")) setMarket(chosen.market);
  }, [chosen.market, market.id, setMarket, state.source]);

  const value = useMemo<Api>(
    () => ({ catalog: translateCatalog(catalogFor(cityId), lang), source: state.source, setCity, placeFromPosition }),
    [cityId, state.source, lang, setCity, placeFromPosition],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("Catalog provider is missing.");
  return value.catalog;
}

export function useCity(): Api {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("Catalog provider is missing.");
  return value;
}
