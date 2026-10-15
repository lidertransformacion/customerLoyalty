import { categories as baseCategories, items as baseItems, itemById } from "@/src/data/menu";
import { describe, expect, it } from "vitest";

import { catalogFor, CITIES, cityById, filterCatalog, itemIn, type MenuFilter } from "./catalog";
// Registers the Cartagena menu on import, as the app does.
import "./cities";

const everything: MenuFilter = { text: "", category: null, ceiling: null, plant: false, noNuts: false };

function base(id: string) {
  const item = itemById(id);
  if (!item) throw new Error(`${id} is not on the base menu`);
  return item;
}

describe("cityById", () => {
  it("finds a city by id and falls back to Bogotá", () => {
    expect(cityById("cartagena")).toEqual({ id: "cartagena", name: "Cartagena", market: "CO" });
    expect(cityById("paris")).toBe(CITIES[0]);
    expect(cityById(null)).toBe(CITIES[0]);
    expect(cityById(undefined)).toBe(CITIES[0]);
    expect(CITIES[0]?.id).toBe("bogota");
  });
});

describe("catalogFor: the base cities", () => {
  it("serves Bogotá the base menu untouched", () => {
    const catalog = catalogFor("bogota");
    expect(catalog.city.id).toBe("bogota");
    expect(catalog.categories).toBe(baseCategories);
    expect(catalog.items).toBe(baseItems);
  });

  it("serves Medellín the same base menu", () => {
    const catalog = catalogFor("medellin");
    expect(catalog.city.id).toBe("medellin");
    expect(catalog.items).toBe(baseItems);
  });
});

describe("catalogFor: Cartagena", () => {
  const catalog = catalogFor("cartagena");

  it("hides what the coast does not serve", () => {
    for (const id of ["cb-lata", "bruma", "pandebono", "martini", "add-burrata"]) {
      expect(base(id)).toBeDefined();
      expect(itemIn(catalog, id)).toBeUndefined();
    }
  });

  it("reprices the shared products and keeps everything else about them", () => {
    const espresso = itemIn(catalog, "esp-blend");
    expect(espresso).toEqual({ ...base("esp-blend"), price: 8800 });
    expect(espresso?.price).not.toBe(base("esp-blend").price);
    expect(itemIn(catalog, "croix")).toEqual({ ...base("croix"), price: 10000 });
    expect(itemIn(catalog, "fil-paz-8")?.price).toBe(12500);
  });

  it("adds products only Cartagena serves", () => {
    expect(itemById("ctg-alquimia")).toBeUndefined();
    expect(itemIn(catalog, "ctg-alquimia")).toMatchObject({
      name: "Alquimia",
      category: "signature",
      price: 14500,
      vegan: false,
      nuts: false,
      extra: false,
    });
    expect(itemIn(catalog, "ctg-cb-copa")).toMatchObject({ category: "cold-brew", vegan: true });
    expect(itemIn(catalog, "ctg-bow-pastrami")).toMatchObject({ category: "bowls", nuts: true });
    expect(itemIn(catalog, "ctg-add-shot")).toMatchObject({ category: "extras", extra: true });
  });

  it("keeps the base order first and appends the extras", () => {
    const kept = baseItems.filter((item) => itemIn(catalog, item.id));
    const extras = catalog.items.filter((item) => !itemById(item.id));
    expect(kept.length).toBeLessThan(baseItems.length);
    expect(extras.length).toBeGreaterThan(0);
    expect(catalog.items).toHaveLength(kept.length + extras.length);
    expect(catalog.items.slice(0, kept.length).map((item) => item.id)).toEqual(kept.map((item) => item.id));
    expect(extras.every((item) => item.id.startsWith("ctg-"))).toBe(true);
  });

  it("uses the same chapters as the base menu", () => {
    expect(catalog.categories).toEqual(baseCategories);
    const chapters = new Set(baseCategories.map((category) => category.id));
    expect(catalog.items.every((item) => chapters.has(item.category))).toBe(true);
  });

  it("leaves the base menu untouched", () => {
    expect(itemById("cb-lata")).toBeDefined();
    expect(itemById("esp-blend")).not.toBe(itemIn(catalog, "esp-blend"));
    expect(catalogFor("bogota").items).toBe(baseItems);
  });
});

describe("filterCatalog", () => {
  const catalog = catalogFor("bogota");

  it("never lists the extras", () => {
    expect(baseItems.some((item) => item.extra)).toBe(true);
    const listed = filterCatalog(catalog, everything);
    expect(listed).toHaveLength(baseItems.filter((item) => !item.extra).length);
    expect(listed.every((item) => !item.extra)).toBe(true);
  });

  it("narrows by chapter, price ceiling, plant-based and no nuts", () => {
    const espresso = filterCatalog(catalog, { ...everything, category: "espresso" });
    expect(espresso.length).toBeGreaterThan(0);
    expect(espresso.every((item) => item.category === "espresso")).toBe(true);

    const cheap = filterCatalog(catalog, { ...everything, ceiling: 10_000 });
    expect(cheap.length).toBeGreaterThan(0);
    expect(cheap.every((item) => item.price <= 10_000)).toBe(true);

    const plant = filterCatalog(catalog, { ...everything, plant: true });
    expect(plant.length).toBeGreaterThan(0);
    expect(plant.every((item) => item.vegan)).toBe(true);

    const noNuts = filterCatalog(catalog, { ...everything, noNuts: true });
    expect(noNuts.every((item) => !item.nuts)).toBe(true);
    expect(noNuts.length).toBeLessThan(filterCatalog(catalog, everything).length);
  });

  it("searches names ignoring case, accents and surrounding spaces", () => {
    const ids = (text: string) => filterCatalog(catalog, { ...everything, text }).map((item) => item.id);
    expect(ids("croissant")).toContain("croix");
    expect(ids("  CROISSANT ")).toContain("croix");
    expect(ids("arandanos")).toContain("gal-arandanos");
    expect(ids("ARÁNDANOS")).toContain("gal-arandanos");
    expect(ids("zzzz-nothing")).toEqual([]);
  });

  it("searches the chapter name too", () => {
    const chapter = baseCategories.find((category) => category.id === "filter");
    if (!chapter) throw new Error("no filter chapter");
    const found = filterCatalog(catalog, { ...everything, text: chapter.name });
    const filters = baseItems.filter((item) => item.category === "filter" && !item.extra);
    expect(filters.length).toBeGreaterThan(0);
    for (const item of filters) expect(found).toContain(item);
  });

  it("searches the city's own items in Cartagena", () => {
    const cartagena = catalogFor("cartagena");
    const ids = filterCatalog(cartagena, { ...everything, text: "alquimia" }).map((item) => item.id);
    expect(ids).toEqual(["ctg-alquimia"]);
  });
});

describe("itemIn", () => {
  it("looks up an item in the given catalog only", () => {
    expect(itemIn(catalogFor("bogota"), "esp-blend")).toBe(base("esp-blend"));
    expect(itemIn(catalogFor("bogota"), "ctg-alquimia")).toBeUndefined();
    expect(itemIn(catalogFor("cartagena"), "nope")).toBeUndefined();
  });
});
