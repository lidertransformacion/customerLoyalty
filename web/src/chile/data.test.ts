import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CHILE_INDEX, CHILE_ITEMS, CHILE_SPREADS, pairingTarget, printedToSpread } from "./data";
import { EFFECTS, FLOW } from "./effects";
import hotspots from "./hotspots.json";

const spots = hotspots as Record<string, { spread: number; x: number; y: number; w: number; h: number }>;
const page = (n: number) => JSON.parse(readFileSync(new URL(`../../public/chile/pages/p${n}.json`, import.meta.url), "utf8")) as { photos: { key: string }[] };

describe("chile menu data", () => {
  it("maps printed pages to their spread and side", () => {
    expect(printedToSpread(6)).toEqual({ spread: 4, side: "left" });
    expect(printedToSpread(9)).toEqual({ spread: 5, side: "right" });
    expect(printedToSpread(34)).toEqual({ spread: 18, side: "left" });
  });

  it("keeps every item id unique and priced", () => {
    const ids = CHILE_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of CHILE_ITEMS) {
      expect(item.prices.length).toBeGreaterThan(0);
      for (const price of item.prices) expect(price.value).toMatch(/^\$\d{1,3}(,\d{3})*$/);
    }
  });

  it("gives every item a tap area on its own spread, inside the trim", () => {
    for (const item of CHILE_ITEMS) {
      const spot = spots[item.id];
      expect(spot, item.id).toBeDefined();
      expect(spot!.spread).toBe(item.spread);
      expect(spot!.x).toBeGreaterThan(40);
      expect(spot!.x + spot!.w).toBeLessThan(1330);
      expect(spot!.h).toBeGreaterThan(10);
    }
  });

  it("points every photo focus at a spread that exists", () => {
    for (const item of CHILE_ITEMS) if (item.focus) expect(item.focus.spread).toBeLessThanOrEqual(CHILE_SPREADS);
  });

  it("sends the index to real pages", () => {
    for (const entry of CHILE_INDEX) {
      const { spread } = printedToSpread(entry.page);
      expect(existsSync(new URL(`../../public/chile/pages/p${spread}.json`, import.meta.url))).toBe(true);
    }
  });

  it("opens the drink a pairing names", () => {
    expect(pairingTarget("FILTRADO ROCK")?.id).toBe("fil-rock");
    expect(pairingTarget("ESPRESSO NARANJA")?.id).toBe("espresso-naranja");
    expect(pairingTarget("LATTE PAZ")?.id).toBe("latte");
    expect(pairingTarget("COLD BREW DE INVIERNO")?.id).toBe("cold-brew-invierno");
    expect(pairingTarget("AEROCANO")?.id).toBe("aerocano");
  });

  it("only animates photos the pages actually have", () => {
    const keys = new Set(Array.from({ length: CHILE_SPREADS }, (_, i) => page(i + 1).photos.map((photo) => photo.key)).flat());
    for (const key of [...Object.keys(EFFECTS).filter((k) => !/^s\d+$/.test(k)), ...Object.keys(FLOW)]) expect(keys.has(key), key).toBe(true);
  });
});
