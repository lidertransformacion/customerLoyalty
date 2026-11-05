import {
  CAPPUCCINO_POINTS,
  GRAIN_MULTIPLIER,
  LEAL_POINTS_PER_CAPPUCCINO,
  lealToPoints,
  LEVEL_KEEP_DAYS,
  levelFor,
  levelHeld,
  PESOS_PER_POINT,
  pointsFor,
  pointsForPrice,
  pointsStillNeeded,
  REWARDS,
  STAMPS_FOR_ORIGEN,
  STAMPS_FOR_TRAVESIA,
  stampsForNextLevel,
  type StampFamily,
} from "@/src/data/program";
import { describe, expect, it } from "vitest";

function stamps(...families: StampFamily[]) {
  return families.map((family) => ({ family }));
}

describe("cerezas", () => {
  it("one per COP 1.000, floor, double on beans", () => {
    expect(PESOS_PER_POINT).toBe(1000);
    expect(pointsForPrice(12_500)).toBe(12);
    expect(pointsForPrice(999)).toBe(0);
    expect(GRAIN_MULTIPLIER).toBe(2);
    expect(pointsFor(44_100, "coffee")).toBe(88);
    expect(pointsFor(44_100, "filter")).toBe(44);
  });

  it("returns about four percent on the cappuccino and the bag", () => {
    const cappuccino = REWARDS.find((reward) => reward.id === "cappuccino");
    expect(cappuccino?.points).toBe(CAPPUCCINO_POINTS);
    expect((12_500 / (CAPPUCCINO_POINTS * PESOS_PER_POINT)) * 100).toBeCloseTo(4.2, 1);
    expect(pointsStillNeeded(280, 300)).toBe(20);
  });
});

describe("Leal migration", () => {
  it("rounds up for the member: 910 is 300, 771 is 255, 5.000 is 1.649", () => {
    expect(LEAL_POINTS_PER_CAPPUCCINO).toBe(910);
    expect(lealToPoints(910)).toBe(300);
    expect(lealToPoints(771)).toBe(255);
    expect(lealToPoints(5000)).toBe(1649);
    expect(lealToPoints(0)).toBe(0);
    expect(lealToPoints(-50)).toBe(0);
  });
});

describe("levels", () => {
  it("Rumbo until six stamps from two families", () => {
    expect(STAMPS_FOR_TRAVESIA).toBe(6);
    expect(levelFor([])).toBe("rumbo");
    expect(levelFor(stamps("welcome", "welcome", "profile", "profile", "profile", "profile"))).toBe("rumbo");
    expect(levelFor(stamps("welcome", "welcome", "profile", "profile", "profile", "method"))).toBe("travesia");
  });

  it("Origen at twelve stamps with a bag at home and something learned", () => {
    expect(STAMPS_FOR_ORIGEN).toBe(12);
    const twelve = stamps("welcome", "welcome", "profile", "profile", "method", "method", "place", "place", "place", "profile", "method", "home");
    expect(levelFor(twelve)).toBe("travesia");
    expect(levelFor([...twelve.slice(0, 11), { family: "home" }, { family: "learn" }])).toBe("origen");
  });

  it("the welcome stamps count toward the total but not as a family", () => {
    expect(levelFor(stamps("welcome", "welcome", "place", "place", "place", "place"))).toBe("rumbo");
  });

  it("a level holds ninety days and then drops one step, never two", () => {
    expect(LEVEL_KEEP_DAYS).toBe(90);
    const origen = [...stamps("profile", "profile", "method", "method", "place", "place", "place", "profile", "method", "profile"), { family: "home" as const }, { family: "learn" as const }];
    expect(levelFor(origen)).toBe("origen");
    const now = new Date("2026-10-14T10:00:00-05:00");
    const recent = new Date(now.getTime() - 89 * 86_400_000).toISOString();
    const stale = new Date(now.getTime() - 91 * 86_400_000).toISOString();
    expect(levelHeld(origen, recent, now)).toBe("origen");
    expect(levelHeld(origen, stale, now)).toBe("travesia");
    expect(levelHeld(origen, undefined, now)).toBe("origen");
    expect(levelHeld([], stale, now)).toBe("rumbo");
  });

  it("knows how many stamps open the next door", () => {
    expect(stampsForNextLevel("rumbo")).toBe(STAMPS_FOR_TRAVESIA);
    expect(stampsForNextLevel("travesia")).toBe(STAMPS_FOR_ORIGEN);
    expect(stampsForNextLevel("origen")).toBeNull();
  });
});
