import { itemById } from "@/src/data/menu";
import {
  CUPS_FOR_FILTER,
  INITIAL_STORE,
  REWARDS,
  storeLedgerName,
  WELCOME_BONUS,
  type Reward,
  type RewardId,
} from "@/src/data/program";
import { copy } from "@/src/i18n/strings";
import { describe, expect, it } from "vitest";

import {
  createAccount,
  isAccount,
  orderTotal,
  reduce,
  type Account,
  type Clock,
  type Result,
  type Signup,
} from "./account";
import { PROMO_POINTS, startPromo, type ActivePromo, type PromoKind } from "./promo";

const FIXED = new Date("2026-10-14T10:00:00-05:00");
const ISO = FIXED.toISOString();
const clock: Clock = { now: () => new Date(FIXED), random: () => 0.5 };

/** Letters the code generator may use: no 0/O/1/I look-alikes. */
const CODE_LETTER = "[A-HJ-NP-Z2-9]";

const signup: Signup = {
  name: "  Ana María  ",
  phone: " 3001234567 ",
  email: " ana@example.com ",
  idNumber: " 1032451234 ",
  birthday: "1990-05-20",
  consent: { adult: true, data: true, terms: true, marketing: false },
  provider: "email",
  market: "CO",
};

// Fixtures from the shared menu: two cups and one pastry.
const ESPRESSO = "esp-blend";
const FILTER = "fil-paz-8";
const CROISSANT = "croix";

function menuItem(id: string) {
  const item = itemById(id);
  if (!item) throw new Error(`fixture ${id} is not on the menu`);
  return item;
}

/** The program rule under test: one point per $100 at the register. */
function pointsOf(id: string): number {
  return Math.floor(menuItem(id).price / 100);
}

function reward(id: RewardId): Reward {
  const found = REWARDS.find((entry) => entry.id === id);
  if (!found) throw new Error(`reward ${id} is not in the program`);
  return found;
}

function fresh(overrides: Partial<Account> = {}): Account {
  return { ...createAccount(signup, clock), ...overrides };
}

function must(result: Result): Account {
  if (!result.account) throw new Error("expected the reducer to keep an account");
  return result.account;
}

describe("menu fixtures", () => {
  it("are cups and non-cups as the tests assume", () => {
    expect(menuItem(ESPRESSO).category).toBe("espresso");
    expect(menuItem(FILTER).category).toBe("filter");
    expect(menuItem(CROISSANT).category).toBe("bakery");
  });
});

describe("createAccount", () => {
  it("grants the welcome bonus as the only movement", () => {
    const account = createAccount(signup, clock);
    expect(account.points).toBe(WELCOME_BONUS);
    expect(account.movements).toHaveLength(1);
    expect(account.movements[0]).toMatchObject({
      label: copy.ledger.welcome,
      points: WELCOME_BONUS,
      store: null,
      date: ISO,
    });
    expect(account.movements[0]?.id).toMatch(new RegExp(`^${FIXED.getTime()}-`));
  });

  it("trims the guest's details and derives the counter code from the id number", () => {
    const account = createAccount(signup, clock);
    expect(account.name).toBe("Ana María");
    expect(account.phone).toBe("3001234567");
    expect(account.email).toBe("ana@example.com");
    expect(account.idNumber).toBe("1032451234");
    expect(account.code).toMatch(new RegExp(`^LBT-1234-${CODE_LETTER}{3}$`));
    expect(createAccount(signup, clock).code).toBe(account.code);
  });

  it("pads a short id number and ignores non-digits in it", () => {
    const account = createAccount({ ...signup, idNumber: "CC 4-2" }, clock);
    expect(account.code).toMatch(/^LBT-0042-/);
  });

  it("starts at the initial store with nothing on the table", () => {
    const account = createAccount(signup, clock);
    expect(account).toMatchObject({
      version: 1,
      stamps: 0,
      storeId: INITIAL_STORE,
      table: "",
      order: [],
      birthday: "1990-05-20",
      provider: "email",
      market: "CO",
      createdAt: ISO,
      consent: { adult: true, data: true, terms: true, marketing: false, at: ISO },
    });
    expect(account).not.toHaveProperty("lastOrder");
  });

  it("stores the picture only when the provider gave one", () => {
    expect(createAccount(signup, clock)).not.toHaveProperty("picture");
    expect(createAccount({ ...signup, picture: "https://example.com/a.png" }, clock).picture).toBe(
      "https://example.com/a.png",
    );
  });
});

describe("isAccount", () => {
  it("accepts a created account and the minimal stored shape", () => {
    expect(isAccount(createAccount(signup, clock))).toBe(true);
    expect(isAccount({ version: 1, code: "LBT-0000-AAA", points: 0, movements: [] })).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAccount(null)).toBe(false);
    expect(isAccount(undefined)).toBe(false);
    expect(isAccount("account")).toBe(false);
    expect(isAccount({})).toBe(false);
    expect(isAccount({ version: 2, code: "x", points: 0, movements: [] })).toBe(false);
    expect(isAccount({ version: 1, code: "x", points: "0", movements: [] })).toBe(false);
    expect(isAccount({ version: 1, code: "x", points: 0 })).toBe(false);
  });
});

describe("orderTotal", () => {
  it("is zero for an empty order", () => {
    expect(orderTotal([])).toEqual({ price: 0, points: 0, count: 0 });
  });

  it("sums price, points and units per line and skips unknown items", () => {
    const total = orderTotal([
      { itemId: ESPRESSO, quantity: 2 },
      { itemId: CROISSANT, quantity: 1 },
      { itemId: "not-on-the-menu", quantity: 5 },
    ]);
    expect(total).toEqual({
      price: menuItem(ESPRESSO).price * 2 + menuItem(CROISSANT).price,
      points: pointsOf(ESPRESSO) * 2 + pointsOf(CROISSANT),
      count: 3,
    });
  });
});

describe("reduce: lifecycle", () => {
  it("signUp creates the account and celebrates the welcome bonus", () => {
    const result = reduce(null, { type: "signUp", signup }, clock);
    expect(result.account).toEqual(createAccount(signup, clock));
    expect(result.effect).toEqual({ note: copy.signup.welcomeNote, celebrate: true });
  });

  it("forget drops the account", () => {
    expect(reduce(fresh(), { type: "forget" }, clock)).toEqual({ account: null, effect: {} });
  });

  it("ignores every other action without an account", () => {
    expect(reduce(null, { type: "addToTable", itemId: ESPRESSO }, clock)).toEqual({
      account: null,
      effect: {},
    });
  });

  it("chooseStore moves the guest to another house", () => {
    const next = must(reduce(fresh(), { type: "chooseStore", storeId: "usaquen" }, clock));
    expect(next.storeId).toBe("usaquen");
  });

  it("setTable keeps at most three digits", () => {
    expect(must(reduce(fresh(), { type: "setTable", table: "Mesa 12b" }, clock)).table).toBe("12");
    expect(must(reduce(fresh(), { type: "setTable", table: "12345" }, clock)).table).toBe("123");
  });
});

describe("reduce: the table", () => {
  it("addToTable adds a line and then raises its quantity", () => {
    const once = must(reduce(fresh(), { type: "addToTable", itemId: ESPRESSO }, clock));
    expect(once.order).toEqual([{ itemId: ESPRESSO, quantity: 1 }]);
    const twice = must(reduce(once, { type: "addToTable", itemId: ESPRESSO }, clock));
    expect(twice.order).toEqual([{ itemId: ESPRESSO, quantity: 2 }]);
    const mixed = must(reduce(twice, { type: "addToTable", itemId: CROISSANT }, clock));
    expect(mixed.order).toEqual([
      { itemId: ESPRESSO, quantity: 2 },
      { itemId: CROISSANT, quantity: 1 },
    ]);
  });

  it("addToTable leaves the previous order untouched", () => {
    const account = fresh({ order: [{ itemId: ESPRESSO, quantity: 1 }] });
    must(reduce(account, { type: "addToTable", itemId: ESPRESSO }, clock));
    expect(account.order).toEqual([{ itemId: ESPRESSO, quantity: 1 }]);
  });

  it("removeFromTable lowers the quantity and drops the line at zero", () => {
    const account = fresh({
      order: [
        { itemId: ESPRESSO, quantity: 2 },
        { itemId: CROISSANT, quantity: 1 },
      ],
    });
    const fewer = must(reduce(account, { type: "removeFromTable", itemId: ESPRESSO }, clock));
    expect(fewer.order).toEqual([
      { itemId: ESPRESSO, quantity: 1 },
      { itemId: CROISSANT, quantity: 1 },
    ]);
    const gone = must(reduce(fewer, { type: "removeFromTable", itemId: CROISSANT }, clock));
    expect(gone.order).toEqual([{ itemId: ESPRESSO, quantity: 1 }]);
  });

  it("removeFromTable ignores an item that is not on the table", () => {
    const account = fresh({ order: [{ itemId: ESPRESSO, quantity: 1 }] });
    const next = must(reduce(account, { type: "removeFromTable", itemId: CROISSANT }, clock));
    expect(next.order).toEqual(account.order);
  });
});

describe("reduce: postOrder", () => {
  const order = [
    { itemId: ESPRESSO, quantity: 2 },
    { itemId: CROISSANT, quantity: 1 },
  ];
  const earned = pointsOf(ESPRESSO) * 2 + pointsOf(CROISSANT);

  it("warns and changes nothing when the table is empty", () => {
    const account = fresh();
    const result = reduce(account, { type: "postOrder", mode: "table" }, clock);
    expect(result.account).toBe(account);
    expect(result.effect).toEqual({ note: copy.notes.emptyTable, warn: true });
  });

  it("earns one point per $100 for every unit and clears the table", () => {
    const account = fresh({ order, table: "4", storeId: "zona-g" });
    const result = reduce(account, { type: "postOrder", mode: "table" }, clock);
    const next = must(result);
    expect(next.points).toBe(WELCOME_BONUS + earned);
    expect(next.order).toEqual([]);
    expect(next.lastOrder).toEqual({
      code: expect.stringMatching(new RegExp(`^P-${CODE_LETTER}{4}$`)),
      mode: "table",
      table: "4",
      storeId: "zona-g",
      at: ISO,
      lines: order,
      points: earned,
    });
    expect(result.effect).toEqual({ roast: "cup", celebrate: true });
  });

  it("writes one movement per unit at the current house, newest first", () => {
    const next = must(reduce(fresh({ order, storeId: "zona-g" }), { type: "postOrder", mode: "pickup" }, clock));
    const store = storeLedgerName("zona-g");
    expect(next.movements.map((entry) => entry.label)).toEqual([
      menuItem(CROISSANT).name,
      menuItem(ESPRESSO).name,
      menuItem(ESPRESSO).name,
      copy.ledger.welcome,
    ]);
    expect(next.movements.slice(0, 3).map((entry) => entry.points)).toEqual([
      pointsOf(CROISSANT),
      pointsOf(ESPRESSO),
      pointsOf(ESPRESSO),
    ]);
    expect(next.movements.slice(0, 3).every((entry) => entry.store === store)).toBe(true);
    expect(next.lastOrder?.mode).toBe("pickup");
  });

  it("counts only cups as stamps", () => {
    const withCups = must(reduce(fresh({ order }), { type: "postOrder", mode: "table" }, clock));
    expect(withCups.stamps).toBe(2);

    const pastryOnly = reduce(
      fresh({ order: [{ itemId: CROISSANT, quantity: 1 }] }),
      { type: "postOrder", mode: "table" },
      clock,
    );
    expect(must(pastryOnly).stamps).toBe(0);
    expect(pastryOnly.effect).toEqual({ celebrate: true });
  });

  it("the eighth cup resets the stamps and goes to the ledger", () => {
    const account = fresh({ stamps: CUPS_FOR_FILTER - 1, order: [{ itemId: ESPRESSO, quantity: 1 }] });
    const result = reduce(account, { type: "postOrder", mode: "table" }, clock);
    const next = must(result);
    expect(next.stamps).toBe(0);
    expect(next.movements[0]).toMatchObject({
      label: copy.ledger.eighthCup,
      points: 0,
      store: storeLedgerName(account.storeId),
    });
    expect(next.movements[1]?.label).toBe(menuItem(ESPRESSO).name);
    expect(result.effect).toEqual({ roast: "eighth", celebrate: true });
  });

  it("keeps counting after the eighth cup inside the same order", () => {
    const account = fresh({ stamps: CUPS_FOR_FILTER - 2, order: [{ itemId: ESPRESSO, quantity: 3 }] });
    const next = must(reduce(account, { type: "postOrder", mode: "table" }, clock));
    expect(next.stamps).toBe(1);
    expect(next.movements.filter((entry) => entry.label === copy.ledger.eighthCup)).toHaveLength(1);
  });

  it("can complete two cards in one order", () => {
    const account = fresh({ stamps: 0, order: [{ itemId: FILTER, quantity: CUPS_FOR_FILTER * 2 }] });
    const next = must(reduce(account, { type: "postOrder", mode: "table" }, clock));
    expect(next.stamps).toBe(0);
    expect(next.movements.filter((entry) => entry.label === copy.ledger.eighthCup)).toHaveLength(2);
  });
});

describe("reduce: postItem", () => {
  it("posts a single item without touching the table", () => {
    const account = fresh({ order: [{ itemId: CROISSANT, quantity: 1 }] });
    const result = reduce(account, { type: "postItem", itemId: FILTER }, clock);
    const next = must(result);
    expect(next.points).toBe(WELCOME_BONUS + pointsOf(FILTER));
    expect(next.stamps).toBe(1);
    expect(next.order).toEqual(account.order);
    expect(next.movements[0]).toMatchObject({ label: menuItem(FILTER).name, points: pointsOf(FILTER) });
    expect(result.effect).toEqual({ roast: "cup", note: copy.notes.postedItem(menuItem(FILTER).name) });
  });

  it("ignores an item that is not on the menu", () => {
    const account = fresh();
    expect(reduce(account, { type: "postItem", itemId: "nope" }, clock)).toEqual({ account, effect: {} });
  });
});

describe("reduce: clearLastOrder", () => {
  it("removes the placed order and keeps everything else", () => {
    const placed = must(
      reduce(fresh({ order: [{ itemId: ESPRESSO, quantity: 1 }] }), { type: "postOrder", mode: "table" }, clock),
    );
    expect(placed).toHaveProperty("lastOrder");
    const { lastOrder: _dropped, ...rest } = placed;
    const cleared = must(reduce(placed, { type: "clearLastOrder" }, clock));
    expect(cleared).not.toHaveProperty("lastOrder");
    expect(cleared).toEqual(rest);
  });
});

describe("reduce: redeem", () => {
  const americano = reward("americano");
  const croissant = reward("croissant");

  it("warns with the missing points when the balance is short", () => {
    const account = fresh({ points: croissant.points - 1 });
    const result = reduce(account, { type: "redeem", rewardId: croissant.id }, clock);
    expect(result.account).toBe(account);
    expect(result.effect).toEqual({
      note: copy.notes.cannotRedeem(1, copy.rewards.croissant.name),
      warn: true,
    });
  });

  it("subtracts the reward and writes a negative movement", () => {
    const account = fresh({ points: americano.points + 5 });
    const result = reduce(account, { type: "redeem", rewardId: americano.id }, clock);
    const next = must(result);
    const name = copy.rewards.americano.name;
    expect(next.points).toBe(5);
    expect(next.movements).toHaveLength(2);
    expect(next.movements[0]).toMatchObject({
      label: copy.ledger.redemption(name),
      points: -americano.points,
      store: storeLedgerName(INITIAL_STORE),
      date: ISO,
    });
    expect(result.effect).toEqual({ note: copy.notes.redeemed(name, americano.points), celebrate: true });
  });

  it("allows redeeming with the exact balance", () => {
    const next = must(reduce(fresh({ points: americano.points }), { type: "redeem", rewardId: americano.id }, clock));
    expect(next.points).toBe(0);
  });

  it("ignores an unknown reward", () => {
    const account = fresh();
    expect(reduce(account, { type: "redeem", rewardId: "latte" }, clock)).toEqual({ account, effect: {} });
  });
});

describe("reduce: claimPromo", () => {
  const kinds = Object.keys(PROMO_POINTS) as PromoKind[];

  function promoOf(kind: PromoKind): ActivePromo {
    return { ...startPromo("calle-85", FIXED), kind };
  }

  it.each(kinds)("adds the points of the %s promo at the promo's house", (kind) => {
    const result = reduce(fresh(), { type: "claimPromo", promo: promoOf(kind) }, clock);
    const next = must(result);
    const store = storeLedgerName("calle-85");
    expect(next.points).toBe(WELCOME_BONUS + PROMO_POINTS[kind]);
    expect(next.movements[0]).toMatchObject({
      label: copy.promo.ledger(store),
      points: PROMO_POINTS[kind],
      store,
    });
    expect(result.effect).toEqual({
      note: copy.promo.activated(copy.promo.catalog[kind].title, PROMO_POINTS[kind]),
      celebrate: true,
    });
  });

  it("credits the promo's house even when the guest is signed into another", () => {
    const next = must(reduce(fresh({ storeId: "zona-g" }), { type: "claimPromo", promo: promoOf("doubleCup") }, clock));
    expect(next.storeId).toBe("zona-g");
    expect(next.movements[0]?.store).toBe(storeLedgerName("calle-85"));
  });
});
