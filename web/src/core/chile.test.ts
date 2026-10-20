import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { catalogFor, cityById, translateCatalog } from "./catalog";
import "./chile";
import { CHILE_CHAPTERS, CHILE_SOURCE } from "./chile-data";
import { CHILE_PHOTOS } from "./chile-photos";
import { visualFor } from "./visuals";

const santiago = catalogFor("santiago");
const publicFile = (src: string) => new URL(`../../public${src}`, import.meta.url);

describe("Santiago, the Chile menu", () => {
  it("is a Chilean city with its own menu, not the Colombian base", () => {
    expect(cityById("santiago").market).toBe("CL");
    expect(santiago.items.some((item) => item.id === "fil-paz-8")).toBe(false);
    expect(santiago.categories.map((category) => category.id)).toEqual(CHILE_CHAPTERS.map((chapter) => chapter.id));
  });

  it("prints each size and blend as its own line, priced as in the print", () => {
    const price = (id: string) => santiago.items.find((item) => item.id === id)?.price;
    expect(price("cl-paz-200")).toBe(15990);
    expect(price("cl-paz-decaf-454")).toBe(39000);
    expect(price("cl-fil-rock-3")).toBe(17100);
    expect(price("cl-cappuccino")).toBe(4590);
    expect(price("cl-cappuccino-so")).toBe(5000);
    expect(price("cl-cold-brew")).toBe(4890);
    expect(price("cl-cacerola-salmon")).toBe(8990);
    expect(price("cl-bowl-salmon")).toBe(12290);
  });

  it("keeps ids unique and every chapter served", () => {
    const ids = santiago.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const chapter of CHILE_CHAPTERS) expect(santiago.items.some((item) => item.category === chapter.id), chapter.id).toBe(true);
    expect(CHILE_SOURCE.length).toBeGreaterThan(90);
  });

  it("writes the pairing into the description, in both languages", () => {
    const palta = santiago.items.find((item) => item.id === "cl-cacerola-palta")!;
    expect(palta.description).toMatch(/Maridaje: ESPRESSO NARANJA\.$/);
    const english = translateCatalog(santiago, "en").items.find((item) => item.id === "cl-cacerola-palta")!;
    expect(english.name).toBe("Eggs skillet with avocado");
    expect(english.description).toMatch(/Pairing: orange espresso\.$/);
  });

  it("has English for the chapters and the menu", () => {
    const english = translateCatalog(santiago, "en");
    english.categories.forEach((category, i) => expect(category.intro, category.id).not.toBe(santiago.categories[i]!.intro));
    // names like Kombucha or Latte stay the same; descriptions change everywhere
    const changed = english.items.filter((item, i) => item.description !== santiago.items[i]!.description);
    expect(changed.length).toBeGreaterThan(santiago.items.length * 0.95);
  });

  it("gives every product a photograph that exists, and bags their 3D pack", () => {
    for (const item of santiago.items) {
      const visual = visualFor(item);
      if (item.category === "cl-coffee") expect(visual.kind).toBe("product");
      else if (visual.kind === "photo") expect(existsSync(publicFile(visual.photo.src)), item.id).toBe(true);
    }
    for (const chapter of CHILE_CHAPTERS.filter((c) => c.id !== "cl-coffee")) expect(CHILE_PHOTOS[chapter.photo], chapter.photo).toBeDefined();
  });

  it("carries the print's motion onto the cut photographs", () => {
    expect(CHILE_PHOTOS["cl-filter"]!.pours?.length).toBeGreaterThan(0);
    expect(CHILE_PHOTOS["cl-espresso"]!.steam?.length).toBeGreaterThan(2);
    expect(CHILE_PHOTOS["cl-signature"]!.fizz?.length).toBeGreaterThan(0);
    expect(CHILE_PHOTOS["cl-matcha"]!.sweat?.length).toBeGreaterThan(0);
  });
});
