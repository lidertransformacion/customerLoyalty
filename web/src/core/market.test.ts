import { describe, expect, it } from "vitest";

import { formatMoney, isAdult, MARKETS } from "./market";

/** 14 October 2026, 10:00 local (America/Bogota under the test config). */
const TODAY = new Date(2026, 9, 14, 10);

describe("isAdult", () => {
  it("accepts a guest well past eighteen", () => {
    expect(isAdult("1990-05-20", TODAY)).toBe(true);
    expect(isAdult("2000-01-01", TODAY)).toBe(true);
  });

  it("accepts a guest on their eighteenth birthday and the day after", () => {
    expect(isAdult("2008-10-14", TODAY)).toBe(true);
    expect(isAdult("2008-10-13", TODAY)).toBe(true);
  });

  it("rejects a guest who is still seventeen", () => {
    expect(isAdult("2008-11-14", TODAY)).toBe(false);
    expect(isAdult("2009-10-14", TODAY)).toBe(false);
    expect(isAdult("2020-01-01", TODAY)).toBe(false);
  });

  it("rejects a guest whose eighteenth birthday is tomorrow", () => {
    // Known bug: `new Date("YYYY-MM-DD")` parses as UTC midnight, so in a
    // zone west of Greenwich (Colombia, Chile) the birthday reads one day
    // early and this guest is accepted a day before turning eighteen.
    expect(isAdult("2008-10-15", TODAY)).toBe(false);
  });

  it("rejects an unreadable birthday", () => {
    expect(isAdult("", TODAY)).toBe(false);
    expect(isAdult("not-a-date", TODAY)).toBe(false);
    expect(isAdult("2008-13-45", TODAY)).toBe(false);
  });
});

describe("formatMoney", () => {
  it("prints pesos with a dot for thousands and no decimals", () => {
    expect(formatMoney(7500, MARKETS.CO)).toBe("$7.500");
    expect(formatMoney(12500, MARKETS.CO)).toBe("$12.500");
    expect(formatMoney(1_234_567, MARKETS.CO)).toBe("$1.234.567");
    expect(formatMoney(0, MARKETS.CO)).toBe("$0");
  });

  it("rounds fractions away", () => {
    expect(formatMoney(1_234_567.6, MARKETS.CO)).toBe("$1.234.568");
    expect(formatMoney(99.4, MARKETS.CO)).toBe("$99");
  });

  it("formats Chilean pesos with the Chilean locale", () => {
    expect(formatMoney(4990, MARKETS.CL)).toBe("$4.990");
  });
});

describe("MARKETS", () => {
  it("has Colombia live and Chile configured but closed", () => {
    expect(MARKETS.CO).toMatchObject({ id: "CO", currency: "COP", locale: "es-CO", live: true });
    expect(MARKETS.CL).toMatchObject({ id: "CL", currency: "CLP", locale: "es-CL", live: false });
  });

  it("validates Colombian phones and id numbers", () => {
    expect(MARKETS.CO.phonePattern.test("3001234567")).toBe(true);
    expect(MARKETS.CO.phonePattern.test("6012345678")).toBe(false);
    expect(MARKETS.CO.phonePattern.test("300123456")).toBe(false);
    expect(MARKETS.CO.idPattern.test("1032451234")).toBe(true);
    expect(MARKETS.CO.idPattern.test("12345")).toBe(false);
    expect(MARKETS.CO.idPattern.test("12345678901")).toBe(false);
  });

  it("validates Chilean phones and RUT-style ids", () => {
    expect(MARKETS.CL.phonePattern.test("912345678")).toBe(true);
    expect(MARKETS.CL.phonePattern.test("812345678")).toBe(false);
    expect(MARKETS.CL.idPattern.test("12345678-K")).toBe(true);
    expect(MARKETS.CL.idPattern.test("12345678k")).toBe(true);
    expect(MARKETS.CL.idPattern.test("1234567-9")).toBe(true);
    expect(MARKETS.CL.idPattern.test("123456-9")).toBe(false);
  });
});
