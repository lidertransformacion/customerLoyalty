import { STORES, type StoreId } from "@/src/data/program";

/**
 * Where each house sits, for the arrival promo.
 * Calle 85 was audited against Google in the expansion project (Carrera 13 #85-13).
 * The other three are block-level approximations: confirm them with operations
 * before a pilot. Radius is the arrival perimeter in meters.
 */
export type StoreGeo = {
  id: StoreId;
  lat: number;
  lng: number;
  radius: number;
  address: string;
  approximate: boolean;
};

export const PROMO_RADIUS_METERS = 150;

export const STORE_GEO: readonly StoreGeo[] = [
  {
    id: "zona-g",
    lat: 4.653,
    lng: -74.0565,
    radius: PROMO_RADIUS_METERS,
    address: "Zona G, Chapinero",
    approximate: true,
  },
  {
    id: "calle-93",
    lat: 4.6765,
    lng: -74.0485,
    radius: PROMO_RADIUS_METERS,
    address: "Parque de la 93",
    approximate: true,
  },
  {
    id: "calle-85",
    lat: 4.66953,
    lng: -74.05366,
    radius: PROMO_RADIUS_METERS,
    address: "Carrera 13 #85-13",
    approximate: false,
  },
  {
    id: "usaquen",
    lat: 4.6955,
    lng: -74.031,
    radius: PROMO_RADIUS_METERS,
    address: "Usaquén",
    approximate: true,
  },
];

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS = 6371000;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

export type Nearest = { store: StoreGeo; meters: number; inside: boolean };

export function nearestStore(position: LatLng): Nearest {
  let best: Nearest | null = null;
  for (const store of STORE_GEO) {
    const meters = distanceMeters(position, store);
    if (!best || meters < best.meters) {
      best = { store, meters, inside: meters <= store.radius };
    }
  }
  return best!;
}

export function geoById(id: string): StoreGeo {
  return (
    STORE_GEO.find((store) => store.id === id) ??
    STORE_GEO.find((store) => store.id === STORES[0]!.id)!
  );
}
