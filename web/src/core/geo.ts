import type { CityId } from "./catalog";
import type { MarketId } from "./market";
import { distanceMeters, type LatLng } from "./stores";

/**
 * Where the guest is, as a city.
 *
 * Three sources, from most to least precise:
 * 1. The table QR (`?sede=` / `?ciudad=`): the guest is in that house.
 * 2. GPS (`navigator.geolocation`): needs HTTPS and the guest's permission,
 *    works in every modern browser. The nearest city center within
 *    `CITY_RADIUS_METERS` wins.
 * 3. The visitor's IP, resolved at the edge (`/api/where`, see
 *    `functions/api/where.ts`): no prompt, every browser, city-level accuracy.
 * Timezone and language only tell the country, so they are the last resort.
 */
export type CityCenter = { id: CityId; market: MarketId; lat: number; lng: number; names: string[] };

export const CITY_CENTERS: readonly CityCenter[] = [
  { id: "bogota", market: "CO", lat: 4.711, lng: -74.0721, names: ["bogota", "bogotá", "bogota d.c.", "soacha", "chia", "chía"] },
  { id: "medellin", market: "CO", lat: 6.2442, lng: -75.5812, names: ["medellin", "medellín", "envigado", "sabaneta", "itagui", "itagüí", "bello"] },
  { id: "cartagena", market: "CO", lat: 10.391, lng: -75.4794, names: ["cartagena", "cartagena de indias"] },
  { id: "santiago", market: "CL", lat: -33.4489, lng: -70.6693, names: ["santiago", "santiago de chile", "providencia", "las condes", "vitacura", "nunoa", "ñuñoa", "lo barnechea", "la reina", "recoleta", "independencia", "estacion central", "macul", "san miguel"] },
];

export const CITY_RADIUS_METERS = 60_000;

export function cityFromPosition(position: LatLng): CityCenter | null {
  let best: { city: CityCenter; meters: number } | null = null;
  for (const city of CITY_CENTERS) {
    const meters = distanceMeters(position, city);
    if (!best || meters < best.meters) best = { city, meters };
  }
  return best && best.meters <= CITY_RADIUS_METERS ? best.city : null;
}

export function cityFromName(name: string | null | undefined): CityCenter | null {
  if (!name) return null;
  const folded = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  return CITY_CENTERS.find((city) => city.names.some((alias) => alias.normalize("NFD").replace(/[̀-ͯ]/g, "") === folded)) ?? null;
}

export type IpHint = {
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  source: string;
};

function isIpHint(value: unknown): value is IpHint {
  return !!value && typeof value === "object" && "city" in value && "country" in value;
}

/** Asks the edge where the request came from. Resolves null when there is no edge (local dev) or it is slow. */
export async function fetchIpHint(timeoutMs = 1800): Promise<IpHint | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch("/api/where", { signal: controller.signal, headers: { accept: "application/json" } });
    window.clearTimeout(timer);
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) return null;
    const body: unknown = await response.json();
    return isIpHint(body) ? body : null;
  } catch {
    return null;
  }
}

/** A city from an IP hint: by name first, by coordinates second. */
export function cityFromHint(hint: IpHint | null): CityCenter | null {
  if (!hint) return null;
  const byName = cityFromName(hint.city);
  if (byName) return byName;
  if (hint.lat !== null && hint.lng !== null) return cityFromPosition({ lat: hint.lat, lng: hint.lng });
  return null;
}
