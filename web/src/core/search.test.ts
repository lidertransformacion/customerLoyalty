import { describe, expect, it } from "vitest";

import { catalogFor, translateCatalog } from "./catalog";
import { groupsOf } from "./chile";
import { searchGroups } from "./search";

const santiago = catalogFor("santiago");
const all = santiago.categories.flatMap((category) => groupsOf(santiago, category.id));
const ids = (query: string, groups = all) => searchGroups(groups, query).map((group) => group.id);
const chapters = (query: string) => new Set(searchGroups(all, query).map((group) => group.chapterId));

describe("searchGroups", () => {
  it("is empty for nothing", () => {
    expect(ids("")).toEqual([]);
    expect(ids("   ")).toEqual([]);
  });

  it("finds a product by its name, exact first, then by a start of a word, ignoring accents", () => {
    expect(ids("cappuccino")[0]).toBe("cappuccino");
    expect(ids("cappu")).toContain("cappuccino");
    expect(ids("sin")).not.toContain("espresso");
    expect(ids("tiramisu")[0]).toBe("tiramisu");
    expect(ids("salmón")).toEqual(expect.arrayContaining(["cacerola-salmon", "bowl-salmon", "croissant-salmon"]));
  });

  it("reads breakfast as the eggs, the parfaits, the toasts and the bakery", () => {
    const found = chapters("desayunos");
    expect(found).toEqual(new Set(["cl-eggs", "cl-parfait", "cl-toast", "cl-bakery"]));
    expect(chapters("algo para el desayuno")).toEqual(found);
  });

  it("reads cold drinks as the iced coffee, the sodas, the juices and the cold infusions, never the hot cups", () => {
    const found = ids("bebidas frías");
    expect(found).toEqual(expect.arrayContaining(["iced-latte", "cold-brew", "soda-frutos-rojos", "jugo-naranja", "limonada", "kombucha", "te-de-flores"]));
    expect(found).not.toContain("cappuccino");
    expect(found).not.toContain("chocolate");
    expect(ids("fria")).toEqual(found);
  });

  it("reads hot as the cups, the filters and the hot drinks without coffee", () => {
    const found = ids("caliente");
    expect(found).toEqual(expect.arrayContaining(["cappuccino", "fil-paz", "chocolate", "chai", "matcha"]));
    expect(found).not.toContain("iced-latte");
  });

  it("reads without coffee as the matcha, the teas, the chocolate and the decaf", () => {
    const found = ids("sin café");
    expect(found).toEqual(expect.arrayContaining(["matcha", "te-jazmin", "chocolate", "paz-decaf", "kombucha"]));
    expect(found).not.toContain("espresso");
    expect(found).not.toContain("cold-brew");
  });

  it("reads sweet and savoury", () => {
    expect(chapters("dulce")).toEqual(expect.any(Set));
    expect(ids("postre")).toEqual(expect.arrayContaining(["pie-limon", "brownie", "galletas", "waffle"]));
    expect(ids("salado")).toEqual(expect.arrayContaining(["sandwich-pollo", "bowl-salmon", "cacerola-criollos", "tostada-serrano"]));
    expect(ids("salado")).not.toContain("pie-limon");
  });

  it("reads what to take home", () => {
    expect(chapters("para llevar")).toEqual(new Set(["cl-coffee", "cl-formats"]));
    expect(ids("cápsulas")).toContain("capsulas");
  });

  it("narrows with every word, and loosens only when nothing answers all of them", () => {
    const narrow = ids("jugo naranja");
    expect(narrow[0]).toBe("jugo-naranja");
    expect(narrow).not.toContain("jugo-frutilla");
    expect(ids("vegetariano frio").length).toBeGreaterThan(0);
  });

  it("answers in English on the English menu", () => {
    const english = translateCatalog(santiago, "en");
    const groups = english.categories.flatMap((category) => groupsOf(english, category.id));
    expect(new Set(searchGroups(groups, "breakfast").map((group) => group.chapterId))).toEqual(new Set(["cl-eggs", "cl-parfait", "cl-toast", "cl-bakery"]));
    expect(ids("iced", groups)).toEqual(expect.arrayContaining(["iced-latte", "iced-cappuccino"]));
    expect(ids("avocado", groups)).toContain("adicion-palta");
  });
});
