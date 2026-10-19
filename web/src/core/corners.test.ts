import { describe, expect, it } from "vitest";

import { catalogFor } from "./catalog";
import "./cities";
import { CORNER_ITEMS, CORNERS, cornerById, cornerCatalog, cornerIdFromPath } from "./corners";

describe("corners", () => {
  it("lists only items that exist, each at its own price", () => {
    const base = catalogFor("bogota");
    const known = new Set([...base.items.map((item) => item.id), ...CORNER_ITEMS.map((item) => item.id)]);
    for (const corner of CORNERS) {
      const ids = Object.keys(corner.items);
      const missing = ids.filter((id) => !known.has(id));
      expect(missing, `${corner.id} unknown ids`).toEqual([]);
      const menu = cornerCatalog(base, corner);
      expect(menu.items.length).toBe(ids.length);
      for (const item of menu.items) expect(item.price).toBe(corner.items[item.id]);
    }
  });

  it("prices the sheet's samples", () => {
    const base = catalogFor("bogota");
    const sura = cornerCatalog(base, cornerById("sura")!);
    const meli = cornerCatalog(base, cornerById("meli")!);
    const bavaria = cornerCatalog(base, cornerById("bavaria")!);
    expect(sura.items.find((i) => i.id === "cap-blend")?.price).toBe(11900);
    expect(meli.items.find((i) => i.id === "cap-blend")?.price).toBe(8100);
    expect(bavaria.items.find((i) => i.id === "ctr-drip-paz")?.price).toBe(24000);
    expect(sura.items.find((i) => i.id === "pandebono")).toBeUndefined();
    expect(sura.items.find((i) => i.id === "ctr-fil-pazlibre-1")).toBeUndefined();
    expect(meli.items.find((i) => i.id === "ctr-fil-pazlibre-1")?.price).toBe(9100);
  });

  it("tells milk drinks what plant milk costs at that corner", () => {
    const base = catalogFor("bogota");
    const sura = cornerCatalog(base, cornerById("sura")!);
    const meli = cornerCatalog(base, cornerById("meli")!);
    expect(sura.items.find((i) => i.id === "cap-blend")?.description).toContain("Vegetal de almendra, +$4.000.");
    expect(meli.items.find((i) => i.id === "lat-blend")?.description).toContain("Vegetal de almendra, +$2.000.");
    expect(meli.items.find((i) => i.id === "esp-blend")?.description).toContain("Perfil PAZ.");
  });

  it("orders chapters the way a bar reads them and drops empty ones", () => {
    const menu = cornerCatalog(catalogFor("bogota"), cornerById("bavaria")!);
    const ids = menu.categories.map((c) => c.id);
    expect(ids[0]).toBe("espresso");
    expect(ids.indexOf("coffee")).toBeGreaterThan(ids.indexOf("bakery"));
    expect(ids).not.toContain("bowls");
  });

  it("reads the corner from dashed shortcuts", () => {
    expect(cornerIdFromPath("/corner-sura")).toBe("sura");
    expect(cornerIdFromPath("/corners-meli/")).toBe("meli");
    expect(cornerIdFromPath("/corner/bavaria")).toBe("bavaria");
    expect(cornerIdFromPath("/menu")).toBeNull();
  });
});
