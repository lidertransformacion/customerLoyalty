import { describe, expect, it } from "vitest";

import {
  dayKey,
  formatCountdown,
  isLive,
  PROMO_MINUTES,
  PROMO_POINTS,
  promoForMoment,
  promoId,
  remainingMs,
  startPromo,
  type PromoKind,
} from "./promo";

/** A local-time moment on 14 October 2026. */
function at(hour: number, minute = 0): Date {
  return new Date(2026, 9, 14, hour, minute);
}

const MINUTE = 60_000;

describe("promoForMoment", () => {
  const cases: [number, PromoKind][] = [
    [0, "filterCroissant"],
    [9, "filterCroissant"],
    [11, "filterCroissant"],
    [12, "doubleCup"],
    [13, "doubleCup"],
    [14, "afternoon"],
    [18, "afternoon"],
    [23, "afternoon"],
  ];

  it.each(cases)("at %i:00 offers %s", (hour, kind) => {
    expect(promoForMoment(at(hour))).toBe(kind);
  });

  it("switches on the hour, not the minute", () => {
    expect(promoForMoment(at(11, 59))).toBe("filterCroissant");
    expect(promoForMoment(at(13, 59))).toBe("doubleCup");
  });

  it("reads the clock in the house's zone (America/Bogota)", () => {
    expect(promoForMoment(new Date("2026-10-14T10:00:00-05:00"))).toBe("filterCroissant");
    expect(promoForMoment(new Date("2026-10-14T15:30:00-05:00"))).toBe("afternoon");
  });
});

describe("dayKey and promoId", () => {
  it("pads month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayKey(at(23, 59))).toBe("2026-10-14");
  });

  it("names one promo per house per day", () => {
    expect(promoId("zona-g", at(8))).toBe("zona-g:2026-10-14");
    expect(promoId("zona-g", at(20))).toBe(promoId("zona-g", at(8)));
    expect(promoId("usaquen", at(8))).not.toBe(promoId("zona-g", at(8)));
  });
});

describe("startPromo", () => {
  it("opens an unclaimed promo that expires ten minutes later", () => {
    const now = at(9, 30);
    const promo = startPromo("calle-93", now);
    expect(PROMO_MINUTES).toBe(10);
    expect(promo).toEqual({
      id: "calle-93:2026-10-14",
      kind: "filterCroissant",
      storeId: "calle-93",
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + PROMO_MINUTES * MINUTE).toISOString(),
      claimed: false,
    });
  });

  it("picks the promo of the moment", () => {
    expect(startPromo("zona-g", at(12, 15)).kind).toBe("doubleCup");
    expect(startPromo("zona-g", at(16)).kind).toBe("afternoon");
  });
});

describe("remainingMs and isLive", () => {
  const start = at(10);
  const promo = startPromo("zona-g", start);
  const after = (ms: number) => new Date(start.getTime() + ms);

  it("counts down from the full window", () => {
    expect(remainingMs(promo, start)).toBe(PROMO_MINUTES * MINUTE);
    expect(remainingMs(promo, after(4 * MINUTE))).toBe(6 * MINUTE);
  });

  it("never goes below zero", () => {
    expect(remainingMs(promo, after(PROMO_MINUTES * MINUTE))).toBe(0);
    expect(remainingMs(promo, after(60 * MINUTE))).toBe(0);
  });

  it("is live only while unclaimed and inside the window", () => {
    expect(isLive(null, start)).toBe(false);
    expect(isLive(promo, start)).toBe(true);
    expect(isLive(promo, after(PROMO_MINUTES * MINUTE - 1))).toBe(true);
    expect(isLive(promo, after(PROMO_MINUTES * MINUTE))).toBe(false);
    expect(isLive({ ...promo, claimed: true }, start)).toBe(false);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(599_000)).toBe("9:59");
    expect(formatCountdown(600_000)).toBe("10:00");
    expect(formatCountdown(61_000)).toBe("1:01");
  });

  it("rounds partial seconds up so the clock never shows 0:00 early", () => {
    expect(formatCountdown(1)).toBe("0:01");
    expect(formatCountdown(500)).toBe("0:01");
    expect(formatCountdown(59_001)).toBe("1:00");
  });
});

describe("PROMO_POINTS", () => {
  it("rewards every kind the moment can offer", () => {
    expect(Object.keys(PROMO_POINTS).sort()).toEqual(["afternoon", "doubleCup", "filterCroissant"]);
    for (const points of Object.values(PROMO_POINTS)) expect(points).toBeGreaterThan(0);
  });
});
