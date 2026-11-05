import { itemById } from "@/src/data/menu";
import { describe, expect, it } from "vitest";

import { baseName, fromPrice, groupLines } from "./lines";

function item(id: string) {
  const found = itemById(id);
  if (!found) throw new Error(`fixture ${id} is not on the menu`);
  return found;
}

describe("baseName", () => {
  it("drops the size", () => {
    expect(baseName("Filtrado PAZ 12 oz")).toBe("Filtrado PAZ");
    expect(baseName("PAZ 340 g")).toBe("PAZ");
    expect(baseName("Cold brew 250 ml")).toBe("Cold brew");
  });

  it("drops the blend", () => {
    expect(baseName("Cappuccino blend")).toBe("Cappuccino");
    expect(baseName("Cappuccino single origin")).toBe("Cappuccino");
  });

  it("leaves a plain name alone", () => {
    expect(baseName("Croissant de almendra")).toBe("Croissant de almendra");
    expect(baseName("Bowl de granola")).toBe("Bowl de granola");
  });
});

describe("groupLines", () => {
  it("folds sizes and blends into one product, in menu order, and knows the price it starts from", () => {
    const groups = groupLines([item("fil-paz-8"), item("cap-blend"), item("fil-paz-12"), item("croix")]);
    expect(groups.map((group) => group.name)).toEqual(["Filtrado PAZ", "Cappuccino", "Croissant sencillo"]);
    expect(groups[0]?.lines.map((line) => line.id)).toEqual(["fil-paz-8", "fil-paz-12"]);
    expect(fromPrice(groups[0]!)).toBe(Math.min(item("fil-paz-8").price, item("fil-paz-12").price));
  });

  it("is empty for nothing", () => {
    expect(groupLines([])).toEqual([]);
  });
});
