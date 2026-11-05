import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { catalogFor, cityById, translateCatalog } from "./catalog";
import { LINES_OF } from "./chile";
import { CHILE_CHAPTERS, CHILE_RECOMMENDED, CHILE_SOURCE } from "./chile-data";
import { retina } from "../motion/living-photo";
import { CHILE_COVERS } from "./chile-covers";
import { CHILE_PHOTOS } from "./chile-photos";
import { CHILE_PACKS } from "./photos";
import { photoSpec } from "./photos";
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
    expect(price("cl-paz-200")).toBe(14990);
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

  it("gives every product its studio photograph, published at both sizes, and keeps the print cut where it has one", () => {
    for (const item of santiago.items) {
      expect(item.studio, item.id).toBeDefined();
      const visual = visualFor(item);
      expect(visual.kind, item.id).toBe("photo");
      if (visual.kind === "photo") {
        expect(visual.photo.studio, item.id).toBe(true);
        expect(existsSync(publicFile(visual.photo.src)), item.id).toBe(true);
        expect(existsSync(publicFile(retina(visual.photo.src))), item.id).toBe(true);
      }
      if (item.photo) expect(existsSync(publicFile(photoSpec(item.photo).src)), item.id).toBe(true);
    }
    for (const chapter of CHILE_CHAPTERS.filter((c) => c.id !== "cl-coffee")) expect(existsSync(publicFile(photoSpec(chapter.photo).src)), chapter.photo).toBe(true);
  });

  it("floats a cut-out cover on every chapter card, and the real Chile bags", () => {
    for (const chapter of CHILE_CHAPTERS) {
      if (chapter.id === "cl-coffee" || chapter.id === "cl-formats") continue;
      const cover = CHILE_COVERS[chapter.id];
      expect(cover?.cutout, chapter.id).toBe(true);
      expect(existsSync(publicFile(cover!.src)), chapter.id).toBe(true);
      expect(existsSync(publicFile(retina(cover!.src))), chapter.id).toBe(true);
    }
    for (const src of Object.values(CHILE_PACKS)) expect(existsSync(publicFile(src)), src).toBe(true);
    expect(santiago.categories[1]?.id).toBe("cl-formats");
    expect(santiago.items.filter((item) => item.category === "cl-formats").every((item) => item.price === 0)).toBe(true);
  });

  it("recommends real products, each with its studio photograph", () => {
    expect(CHILE_RECOMMENDED.length).toBeGreaterThanOrEqual(8);
    for (const id of CHILE_RECOMMENDED) {
      expect(CHILE_SOURCE.some((entry) => entry.id === id), id).toBe(true);
      const first = santiago.items.find((item) => item.id === LINES_OF[id]?.[0]);
      expect(first?.studio, id).toBeDefined();
    }
  });

  it("carries the print's motion onto the cut photographs", () => {
    expect(CHILE_PHOTOS["cl-filter"]!.pours?.length).toBeGreaterThan(0);
    expect(CHILE_PHOTOS["cl-espresso"]!.steam?.length).toBeGreaterThan(2);
    expect(CHILE_PHOTOS["cl-signature"]!.fizz?.length).toBeGreaterThan(0);
    expect(CHILE_PHOTOS["cl-matcha"]!.sweat?.length).toBeGreaterThan(0);
  });
});
