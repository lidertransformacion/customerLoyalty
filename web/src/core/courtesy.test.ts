import { describe, expect, it } from "vitest";

import { BIRTHDAY_WINDOW_DAYS, birthdayWindow, courtesyFor } from "./courtesy";

/** A local-time moment. */
function at(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 10);
}

describe("birthdayWindow", () => {
  it("opens on the day and stays open fifteen days", () => {
    expect(BIRTHDAY_WINDOW_DAYS).toBe(15);
    expect(birthdayWindow("1990-05-20", at(2026, 5, 19))).toBeNull();
    expect(birthdayWindow("1990-05-20", at(2026, 5, 20))).toBe(2026);
    expect(birthdayWindow("1990-05-20", at(2026, 6, 4))).toBe(2026);
    expect(birthdayWindow("1990-05-20", at(2026, 6, 5))).toBeNull();
  });

  it("a December birthday still counts in January, under the year it started", () => {
    expect(birthdayWindow("1990-12-28", at(2027, 1, 5))).toBe(2026);
  });

  it("is closed without a date or with a broken one", () => {
    expect(birthdayWindow(undefined, at(2026, 5, 20))).toBeNull();
    expect(birthdayWindow("nope", at(2026, 5, 20))).toBeNull();
  });
});

describe("courtesyFor", () => {
  const now = at(2026, 10, 14);

  it("offers the first time at a house the guest has never bought in", () => {
    const courtesy = courtesyFor({ visits: 3, stampLog: [{ key: "place:zona-g" }] }, "usaquen", now, []);
    expect(courtesy).toMatchObject({ id: "first:usaquen", kind: "firstVisit", storeId: "usaquen", claimed: false });
    expect(courtesyFor({ visits: 3, stampLog: [{ key: "place:usaquen" }] }, "usaquen", now, [])).toBeNull();
  });

  it("the second visit comes before a new house, and the birthday before both", () => {
    expect(courtesyFor({ visits: 1 }, "usaquen", now, [])?.kind).toBe("secondVisit");
    expect(courtesyFor({ visits: 1, birthday: "1990-10-10" }, "usaquen", now, [])?.kind).toBe("birthday");
    expect(courtesyFor({ visits: 1, birthday: "1990-10-10" }, "usaquen", now, [])?.id).toBe("birthday:2026");
  });

  it("never offers what was already activated or closed", () => {
    expect(courtesyFor({ visits: 1 }, "usaquen", now, ["second"])?.kind).toBe("firstVisit");
    expect(courtesyFor({ visits: 1 }, "usaquen", now, ["second", "first:usaquen"])).toBeNull();
    expect(courtesyFor({ visits: 0, birthday: "1990-10-10" }, "zona-g", now, ["birthday:2026", "first:zona-g"])).toBeNull();
  });
});
