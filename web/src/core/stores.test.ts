import { STORES } from "@/src/data/program";
import { describe, expect, it } from "vitest";

import { distanceMeters, geoById, nearestStore, PROMO_RADIUS_METERS, STORE_GEO, type StoreGeo } from "./stores";

/** Meters per degree of arc on the 6 371 km sphere the haversine uses. */
const DEGREE = (6_371_000 * Math.PI) / 180;

function geo(id: string): StoreGeo {
  const found = STORE_GEO.find((store) => store.id === id);
  if (!found) throw new Error(`no geo for ${id}`);
  return found;
}

describe("distanceMeters", () => {
  it("is zero between a point and itself", () => {
    expect(distanceMeters(geo("zona-g"), geo("zona-g"))).toBe(0);
  });

  it("measures one degree of latitude as the sphere's arc length", () => {
    expect(distanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(DEGREE, 2);
    expect(distanceMeters({ lat: 4, lng: -74 }, { lat: 5, lng: -74 })).toBeCloseTo(DEGREE, 2);
  });

  it("shrinks a degree of longitude away from the equator", () => {
    expect(distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(DEGREE, 2);
    const atSixty = distanceMeters({ lat: 60, lng: 0 }, { lat: 60, lng: 1 });
    expect(Math.abs(atSixty - DEGREE / 2)).toBeLessThan(1);
  });

  it("is symmetric", () => {
    const a = geo("zona-g");
    const b = geo("usaquen");
    expect(distanceMeters(a, b)).toBe(distanceMeters(b, a));
  });

  it("puts the Bogotá houses a few kilometers apart", () => {
    const meters = distanceMeters(geo("zona-g"), geo("calle-93"));
    expect(meters).toBeGreaterThan(2_000);
    expect(meters).toBeLessThan(4_000);
  });
});

describe("nearestStore", () => {
  const calle85 = geo("calle-85");
  const north = (meters: number) => ({ lat: calle85.lat + meters / DEGREE, lng: calle85.lng });

  it("finds the house the guest is standing in", () => {
    expect(nearestStore(calle85)).toEqual({ store: calle85, meters: 0, inside: true });
  });

  it("is inside within the arrival radius", () => {
    const near = nearestStore(north(PROMO_RADIUS_METERS - 50));
    expect(near.store.id).toBe("calle-85");
    expect(near.meters).toBeCloseTo(PROMO_RADIUS_METERS - 50, 0);
    expect(near.inside).toBe(true);
  });

  it("is outside just past the radius while still the nearest house", () => {
    const near = nearestStore(north(PROMO_RADIUS_METERS + 50));
    expect(near.store.id).toBe("calle-85");
    expect(near.inside).toBe(false);
  });

  it("still answers far from every house", () => {
    const cartagena = nearestStore({ lat: 10.3997, lng: -75.5144 });
    expect(STORE_GEO).toContain(cartagena.store);
    expect(cartagena.inside).toBe(false);
    expect(cartagena.meters).toBeGreaterThan(500_000);
  });
});

describe("STORE_GEO and geoById", () => {
  it("covers every house in the program with the same radius", () => {
    expect(STORE_GEO.map((store) => store.id).sort()).toEqual(STORES.map((store) => store.id).sort());
    for (const store of STORE_GEO) expect(store.radius).toBe(PROMO_RADIUS_METERS);
  });

  it("falls back to the first house of the program for an unknown id", () => {
    expect(geoById("calle-85")).toBe(geo("calle-85"));
    expect(geoById("nowhere")).toBe(geo(STORES[0]!.id));
  });
});
