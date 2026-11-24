import { describe, expect, it } from "vitest";

import { catalogFor, translateCatalog } from "./catalog";
import { groupsOf } from "./chile";
import { chileKey, CO_RECOMMENDED, colombiaGroups, coverOf, kindOf } from "./colombia";
import { CO_PRODUCTS } from "./colombia-menu";
import { CO_STUDIO_PHOTOS } from "./colombia-studio";
import { photoSpec } from "./photos";

const line = (city: "bogota" | "medellin" | "cartagena", id: string) => catalogFor(city).items.find((item) => item.id === id);

describe("the new Colombian menu (29-oct-2026) in Bogotá and Medellín", () => {
  it("prices every size of a bag as printed", () => {
    const coffee = colombiaGroups(catalogFor("bogota"), "co-coffee");
    const paz = coffee.find((group) => group.id === "co-paz")!;
    expect(paz.lines.map((l) => [l.name, l.price])).toEqual([["PAZ · 200 g", 34200], ["PAZ · 340 g", 46200], ["PAZ · 454 g", 63200]]);
    expect(kindOf(paz.lines[0]!.id)).toEqual({ trait: "Balanceado & Acaramelado", origin: "Signature Blend" });
    expect(kindOf("co-impacto")).toEqual({ trait: "Cultivos Sostenibles", origin: "Single Origin" });
    expect(kindOf("co-filtrado-rock-1-taza")?.origin).toBe("Single Origin");
    expect(kindOf("co-cappuccino")).toBeUndefined();
  });

  it("sells filter coffee by the cup", () => {
    const rock = colombiaGroups(catalogFor("medellin"), "co-filter").find((group) => group.id === "co-filtrado-rock")!;
    expect(rock.lines.map((l) => [l.name, l.price])).toEqual([["Filtrado ROCK · 1 taza", 13200], ["Filtrado ROCK · 2 tazas", 23500], ["Filtrado ROCK · 3 tazas", 31200]]);
    expect(rock.lines[0]!.profile).toBe("ROCK");
  });

  it("keeps blend and single origin as two lines of one product", () => {
    const cappuccino = groupsOf(catalogFor("bogota"), "co-espresso").find((group) => group.id === "co-cappuccino")!;
    expect(cappuccino.lines.map((l) => [l.id, l.name, l.price])).toEqual([["co-cappuccino", "Cappuccino", 12800], ["co-cappuccino-so", "Cappuccino single origin", 13800]]);
  });

  it("carries the new products and their pairings", () => {
    expect(line("bogota", "co-matcha-bloom")!.price).toBe(15900);
    expect(line("bogota", "co-pistacho-crush")!.category).toBe("co-signature");
    expect(line("bogota", "co-huevos-con-chilaquiles")!.price).toBe(27200);
    expect(line("bogota", "co-crema-de-tomate")!.category).toBe("co-soup");
    expect(line("bogota", "co-huevos-turcos")!.description).toMatch(/Maridaje: ESPRESSO PAZ\.$/);
    expect(line("bogota", "co-capsulas")!.price).toBe(0);
  });

  it("lists each add-on once, though the print repeats it under several dishes", () => {
    const extras = colombiaGroups(catalogFor("bogota"), "co-extras").map((group) => group.id);
    expect(extras.filter((id) => id === "co-adicion-aguacate")).toHaveLength(1);
    expect(new Set(CO_PRODUCTS.map((p) => p.id)).size).toBe(CO_PRODUCTS.length);
  });

  it("finds a published photograph for every product that names one; without one it has none", () => {
    for (const city of ["bogota"] as const) {
      for (const item of catalogFor(city).items) {
        if (!item.studio?.startsWith("co-p-")) continue;
        expect(CO_STUDIO_PHOTOS[item.studio], item.id).toBeDefined();
        expect(photoSpec(item.studio).src, item.id).toBe(`/menu/co/${item.studio}.webp`);
      }
    }
    expect(line("bogota", "co-huevos-turcos")!.studio).toBe("co-p-huevos-turcos");
    expect(line("bogota", "co-bruma")!.studio).toBe("co-p-bruma");
    expect(line("bogota", "co-three-pack-cold-brew")!.studio).toBeUndefined();
  });

  it("speaks English with the same groups, so a favourite survives the language", () => {
    const en = translateCatalog(catalogFor("bogota"), "en");
    const eggs = groupsOf(en, "co-eggs");
    const turkish = eggs.find((group) => group.id === "co-huevos-turcos")!;
    expect(turkish.lines[0]!.name).toBe("Turkish eggs");
    expect(groupsOf(en, "co-filter").find((g) => g.id === "co-filtrado-paz")!.lines[0]!.name).toBe("Filtrado PAZ · 1 cup");
  });

  it("floats a cut-out cover on every chapter that has a photograph", () => {
    const fs = require("node:fs") as typeof import("node:fs");
    for (const chapter of catalogFor("bogota").categories) {
      if (["co-coffee", "co-formats"].includes(chapter.id)) continue;
      const cover = coverOf(chapter.id);
      expect(cover?.cutout, chapter.id).toBe(true);
      expect(fs.existsSync(`public${cover!.src}`), cover!.src).toBe(true);
    }
    expect(coverOf("cl-espresso")?.src).toContain("/menu/cl/");
  });

  it("recommends products that exist", () => {
    const catalog = catalogFor("bogota");
    const ids = new Set(catalog.categories.flatMap((category) => colombiaGroups(catalog, category.id).map((group) => group.id)));
    for (const id of CO_RECOMMENDED) expect(ids.has(id), id).toBe(true);
    expect(chileKey("co-espresso")).toBe("cl-espresso");
  });
});

describe("Cartagena serves the new menu too", () => {
  it("has exactly the new menu's products, at its prices", () => {
    const ids = (city: "bogota" | "cartagena") => catalogFor(city).items.map((item) => item.id);
    expect(ids("cartagena")).toEqual(ids("bogota"));
    expect(line("cartagena", "co-cappuccino")!.price).toBe(12800);
    expect(line("cartagena", "ctg-alquimia")).toBeUndefined();
  });
});
