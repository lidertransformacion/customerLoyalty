import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { catalogFor, cityById, type Catalog, type CityId } from "../core/catalog";
import { cityFromHint, cityFromPosition, fetchIpHint } from "../core/geo";
import type { LatLng } from "../core/stores";
import { useLocale } from "../i18n";

const CITY_KEY = "libertario-city-v1";

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
    const fromUrl = new URLSearchParams(window.location.search).get("ciudad");
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
  const { market, setMarket } = useLocale();
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

  const value = useMemo<Api>(
    () => ({ catalog: catalogFor(state.id), source: state.source, setCity, placeFromPosition }),
    [state, setCity, placeFromPosition],
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
