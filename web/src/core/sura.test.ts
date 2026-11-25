import { describe, expect, it } from "vitest";

import { catalogFor, translateCatalog } from "./catalog";
import { groupsOf } from "./chile";
import { addToCart, areaById, areasBySite, chapterOf, cleanName, menuFor, buildOrder, cartCount, cartLines, removeFromCart, cleanCart, cleanCedula, comboById, lineKey, linesTotal, MAX_PRODUCTS, MAX_QUANTITY, orderProblem, picksComplete, quantityOf, sendOrder, SURA_AREAS, SURA_COMBOS, validCedula, type Cart } from "./sura";

const catalog = catalogFor("sura");
const snack = comboById("su-refrigerio-galleta")!;
const arepa = comboById("su-refrigerio-arepa")!;
const executive = comboById("su-ejecutivo")!;
const eggs = comboById("su-completo-huevos")!;

describe("the Sura menu", () => {
  it("serves every combo at the agreed price, each as one card", () => {
    expect(catalog.items.map((item) => [item.id, item.price])).toEqual([
      ["su-refrigerio-galleta", 12000],
      ["su-refrigerio-arepa", 12000],
      ["su-refrigerio-pandeyuca", 12000],
      ["su-ejecutivo", 25000],
      ["su-ejecutivo-granola", 33000],
      ["su-completo-huevos", 28000],
      ["su-completo-croissant", 31000],
    ]);
    const groups = catalog.categories.flatMap((category) => groupsOf(catalog, category.id));
    expect(groups).toHaveLength(SURA_COMBOS.length);
    for (const group of groups) expect(group.lines).toHaveLength(1);
  });

  it("shows each service only what it may order: breakfasts or refrigerios, in one chapter", () => {
    const menus = SURA_AREAS.map((area) => [area.id, menuFor(catalog, area).categories.map((c) => c.id).join(), menuFor(catalog, area).items.length]);
    expect(menus).toEqual([
      ["c100-ejecutivos", "co-su-desayunos", 4],
      ["c100-ensayos", "co-su-desayunos", 4],
      ["c100-muestras", "co-su-refrigerios", 3],
      ["usaquen-arl", "co-su-desayunos", 4],
      ["usaquen-muestras", "co-su-refrigerios", 3],
    ]);
    expect(menuFor(catalog, null).categories).toHaveLength(2);
    expect(chapterOf(SURA_AREAS[2]!)).toBe("co-su-refrigerios");
  });

  it("gives every combo and option a photograph, and reads in English", () => {
    for (const combo of SURA_COMBOS) {
      expect(combo.photo).toMatch(/^(co|su)-p-/);
      for (const choice of combo.choices) for (const option of choice.options) expect(option.photo).toMatch(/^(co|su)-p-/);
    }
    expect(translateCatalog(catalog, "en").items[0]!.name).toBe("Cookie");
  });
});

describe("the cart", () => {
  const coffee = { bebida: "americano" };

  it("asks for every choice before a combo goes in", () => {
    expect(picksComplete(snack, {})).toBe(false);
    expect(picksComplete(snack, { bebida: "sopa" })).toBe(false);
    expect(picksComplete(eggs, { bebida: "jugo" })).toBe(false);
    expect(picksComplete(executive, {})).toBe(true);
    expect(addToCart([], snack, {})).toEqual([]);
  });

  it("holds one combo, once: adding again or adding another replaces it", () => {
    let cart: Cart = addToCart([], snack, coffee);
    cart = addToCart(cart, snack, coffee);
    expect(cart.map((line) => [line.key, line.quantity])).toEqual([["su-refrigerio-galleta|americano", 1]]);
    cart = addToCart(cart, arepa, { bebida: "infusion" });
    expect(cart.map((line) => line.key)).toEqual(["su-refrigerio-arepa|infusion"]);
    expect(cartCount(cart)).toBe(MAX_PRODUCTS * MAX_QUANTITY);
    expect(quantityOf(cart, "su-refrigerio-arepa")).toBe(1);
    expect(quantityOf(cart, "su-refrigerio-galleta")).toBe(0);
    // a combo that is missing a choice leaves the order as it was
    expect(addToCart(cart, eggs, { bebida: "jugo" })).toBe(cart);
    expect(removeFromCart(cart, lineKey(arepa, { bebida: "infusion" }))).toEqual([]);
  });

  it("reads the line with everything in it, in Spanish, and its total", () => {
    const lines = cartLines(addToCart([], eggs, { bebida: "jugo", huevos: "revueltos" }));
    expect(lines.map((line) => [line.name, line.detail])).toEqual([["Desayuno con huevos", "Croissant + Parfait + Jugo de naranja + Huevos revueltos"]]);
    expect(linesTotal(lines)).toBe(28000);
    expect(cartLines(addToCart([], snack, coffee))[0]).toMatchObject({ name: "Refrigerio", detail: "Galleta + Americano", quantity: 1, price: 12000 });
    expect(cartLines(addToCart([], executive, {}))[0]!.detail).toBe("Sándwich de jamón serrano + Jugo de naranja");
  });

  it("cleans what storage hands back", () => {
    const stored = [{ comboId: "gone", picks: {}, quantity: 1 }, { comboId: "su-refrigerio-arepa", picks: {}, quantity: 1 }, { comboId: "su-refrigerio-galleta", picks: coffee, quantity: 40 }, { comboId: "su-ejecutivo", picks: {}, quantity: 2 }, null];
    expect(cleanCart(stored)).toEqual([{ key: "su-refrigerio-galleta|americano", comboId: "su-refrigerio-galleta", picks: coffee, quantity: 1 }]);
    expect(cleanCart({ a: 1 })).toEqual([]);
  });
});

describe("the order", () => {
  const lines = cartLines(addToCart([], arepa, { bebida: "latte-deslactosado" }));
  const area = SURA_AREAS[0]!;

  it("takes only digits for the cédula, six to fifteen", () => {
    expect(cleanCedula("1.032-456 789abc")).toBe("1032456789");
    expect(cleanCedula("12345678901234567")).toBe("123456789012345");
    expect(validCedula("123456789012345")).toBe(true);
    expect(validCedula("12345")).toBe(false);
  });

  it("says what is missing, in order", () => {
    expect(orderProblem([], null, "", "")).toBe("empty");
    expect(orderProblem(lines, null, "", "")).toBe("area");
    expect(orderProblem(lines, area, " a ", "1032456789")).toBe("name");
    expect(orderProblem(lines, area, "Ana Ruiz", "123")).toBe("cedula");
    expect(cleanName("  Ana   María  Ruiz")).toBe("Ana María Ruiz");
    expect(orderProblem(lines, area, "Ana Ruiz", "1032456789")).toBeNull();
  });

  it("finds an area by what the QR carries", () => {
    expect(areaById(" C100-Muestras ")?.name).toBe("Calle 100 · Toma de muestras");
    expect(areaById("otra")).toBeNull();
    expect(areasBySite().map((group) => [group.site, group.areas.length])).toEqual([["Salud Sura Calle 100", 3], ["Salud Sura Usaquén", 2]]);
  });

  it("builds what the sheet receives", () => {
    const order = buildOrder(lines, area, " Ana Ruiz ", "1032456789", "abc", new Date("2026-11-24T12:00:00Z"));
    expect(order).toEqual({ clientId: "abc", nombre: "Ana Ruiz", cedula: "1032456789", area: "Calle 100 · Chequeos ejecutivos", items: [{ id: "su-refrigerio-arepa", name: "Refrigerio", detail: "Arepa de queso + Latte Paz deslactosado", quantity: 1, price: 12000 }], total: 12000, sentAt: "2026-11-24T12:00:00.000Z" });
  });

  it("sends as plain text and reads the number back", async () => {
    const order = buildOrder(lines, area, " Ana Ruiz ", "1032456789", "abc", new Date(0));
    let seen: RequestInit | undefined;
    const post = (async (_url: unknown, init?: RequestInit) => {
      seen = init;
      return new Response(JSON.stringify({ ok: true, number: 27 }));
    }) as typeof fetch;
    expect(await sendOrder(order, "https://example.test", post)).toEqual({ ok: true, number: 27 });
    expect((seen?.headers as Record<string, string>)["Content-Type"]).toContain("text/plain");
    expect(JSON.parse(String(seen?.body))).toEqual(order);
  });

  it("fails quietly without an address, on a refusal and when the network drops", async () => {
    const order = buildOrder(lines, area, " Ana Ruiz ", "1032456789", "abc", new Date(0));
    const refuse = (async () => new Response(JSON.stringify({ ok: false }))) as typeof fetch;
    const drop = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    expect(await sendOrder(order, "", refuse)).toEqual({ ok: false });
    expect(await sendOrder(order, "https://example.test", refuse)).toEqual({ ok: false });
    expect(await sendOrder(order, "https://example.test", drop)).toEqual({ ok: false });
  });
});
