import { itemById } from "@/src/data/menu";
import {
  INITIAL_STORE,
  lealToPoints,
  PREPAID_MULTIPLIER,
  REWARDS,
  STAMP_BONUS,
  STAMPS_FOR_TRAVESIA,
  storeLedgerName,
  storeName,
  WELCOME_BONUS,
  WELCOME_STAMPS,
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
  type Stamp,
} from "./account";
import type { Courtesy } from "./courtesy";

const FIXED = new Date("2026-10-14T10:00:00-05:00");
const ISO = FIXED.toISOString();
const clock: Clock = { now: () => new Date(FIXED), random: () => 0.5 };

/** Letters the code generator may use: no 0/O/1/I look-alikes. */
const CODE_LETTER = "[A-HJ-NP-Z2-9]";

const signup: Signup = {
  name: "  Ana María  ",
  phone: " 3001234567 ",
  email: " ana@example.com ",
  idNumber: "",
  birthday: "1990-05-20",
  consent: { adult: true, data: true, terms: true, marketing: true },
  channels: { whatsapp: true, email: true, sms: false },
  provider: "email",
  market: "CO",
};

// Fixtures from the shared menu: an espresso, a PAZ filter, a croissant and a bag of PAZ beans.
const ESPRESSO = "esp-blend";
const FILTER = "fil-paz-8";
const CROISSANT = "croix";
const BAG = "paz-340";

function menuItem(id: string) {
  const item = itemById(id);
  if (!item) throw new Error(`fixture ${id} is not on the menu`);
  return item;
}

/** The program rule under test: one cereza per COP 1.000, double on beans. */
function pointsOf(id: string): number {
  const item = menuItem(id);
  return Math.floor(item.price / 1000) * (item.category === "coffee" ? 2 : 1);
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

function keys(account: Account): string[] {
  return (account.stampLog ?? []).map((stamp) => stamp.key);
}

function stamp(family: Stamp["family"], key: string, at = ISO): Stamp {
  return { family, key, label: key, at, store: null };
}

describe("menu fixtures", () => {
  it("are what the tests assume", () => {
    expect(menuItem(ESPRESSO).category).toBe("espresso");
    expect(menuItem(FILTER)).toMatchObject({ category: "filter", profile: "PAZ" });
    expect(menuItem(CROISSANT).category).toBe("bakery");
    expect(menuItem(BAG)).toMatchObject({ category: "coffee", profile: "PAZ" });
  });
});

describe("createAccount", () => {
  it("grants 100 cerezas and two welcome stamps", () => {
    const account = createAccount(signup, clock);
    expect(WELCOME_BONUS).toBe(100);
    expect(WELCOME_STAMPS).toBe(2);
    expect(account.points).toBe(WELCOME_BONUS);
    expect(account.stamps).toBe(2);
    expect(account.stampLog?.map((entry) => entry.family)).toEqual(["welcome", "welcome"]);
    expect(account.movements).toHaveLength(1);
    expect(account.movements[0]).toMatchObject({
      label: copy.ledger.welcome,
      points: WELCOME_BONUS,
      store: null,
      date: ISO,
    });
  });

  it("trims the guest's details and derives the counter code from the phone, never the ID", () => {
    const account = createAccount(signup, clock);
    expect(account.name).toBe("Ana María");
    expect(account.phone).toBe("3001234567");
    expect(account.email).toBe("ana@example.com");
    expect(account.idNumber).toBe("");
    expect(account.code).toMatch(new RegExp(`^LBT-4567-${CODE_LETTER}{3}$`));
    expect(createAccount({ ...signup, idNumber: "1032451234" }, clock).code).toBe(account.code);
  });

  it("keeps one dated permission per channel", () => {
    const account = createAccount(signup, clock);
    expect(account.permissions).toEqual({
      whatsapp: { on: true, at: ISO },
      email: { on: true, at: ISO },
      sms: { on: false, at: ISO },
    });
  });

  it("falls back to the email consent when no channels were given", () => {
    const { channels: _none, ...bare } = signup;
    const account = createAccount({ ...bare, consent: { ...bare.consent, marketing: false } }, clock);
    expect(account.permissions?.email.on).toBe(false);
    expect(account.permissions?.whatsapp.on).toBe(false);
  });

  it("starts at the initial store with nothing on the table and no visits", () => {
    const account = createAccount(signup, clock);
    expect(account).toMatchObject({
      version: 1,
      storeId: INITIAL_STORE,
      table: "",
      order: [],
      visits: 0,
      birthday: "1990-05-20",
      provider: "email",
      market: "CO",
      createdAt: ISO,
      consent: { adult: true, data: true, terms: true, marketing: true, at: ISO },
    });
    expect(account).not.toHaveProperty("lastOrder");
    expect(account).not.toHaveProperty("lastPurchaseAt");
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
    expect(isAccount({})).toBe(false);
    expect(isAccount({ version: 2, code: "x", points: 0, movements: [] })).toBe(false);
    expect(isAccount({ version: 1, code: "x", points: "0", movements: [] })).toBe(false);
  });
});

describe("orderTotal", () => {
  it("is zero for an empty order", () => {
    expect(orderTotal([])).toEqual({ price: 0, points: 0, count: 0 });
  });

  it("sums price, cerezas and units per line, doubles beans and skips unknown items", () => {
    const total = orderTotal([
      { itemId: ESPRESSO, quantity: 2 },
      { itemId: BAG, quantity: 1 },
      { itemId: "not-on-the-menu", quantity: 5 },
    ]);
    expect(total).toEqual({
      price: menuItem(ESPRESSO).price * 2 + menuItem(BAG).price,
      points: pointsOf(ESPRESSO) * 2 + pointsOf(BAG),
      count: 3,
    });
    expect(pointsOf(BAG)).toBe(Math.floor(menuItem(BAG).price / 1000) * 2);
  });
});

describe("reduce: lifecycle", () => {
  it("signUp creates the account and celebrates the welcome", () => {
    const result = reduce(null, { type: "signUp", signup }, clock);
    expect(result.account).toEqual(createAccount(signup, clock));
    expect(result.effect).toEqual({ note: copy.signup.welcomeNote, celebrate: true });
  });

  it("forget drops the account", () => {
    expect(reduce(fresh(), { type: "forget" }, clock)).toEqual({ account: null, effect: {} });
  });

  it("ignores every other action without an account", () => {
    expect(reduce(null, { type: "addToTable", itemId: ESPRESSO }, clock)).toEqual({ account: null, effect: {} });
  });

  it("chooseStore moves the guest to another house", () => {
    expect(must(reduce(fresh(), { type: "chooseStore", storeId: "usaquen" }, clock)).storeId).toBe("usaquen");
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
  });

  it("removeFromTable lowers the quantity and drops the line at zero", () => {
    const account = fresh({ order: [{ itemId: ESPRESSO, quantity: 2 }, { itemId: CROISSANT, quantity: 1 }] });
    const fewer = must(reduce(account, { type: "removeFromTable", itemId: ESPRESSO }, clock));
    expect(fewer.order).toEqual([{ itemId: ESPRESSO, quantity: 1 }, { itemId: CROISSANT, quantity: 1 }]);
    const gone = must(reduce(fewer, { type: "removeFromTable", itemId: CROISSANT }, clock));
    expect(gone.order).toEqual([{ itemId: ESPRESSO, quantity: 1 }]);
  });
});

describe("reduce: cerezas and stamps on a purchase", () => {
  it("warns and changes nothing when the table is empty", () => {
    const account = fresh();
    const result = reduce(account, { type: "postOrder", mode: "table" }, clock);
    expect(result.account).toBe(account);
    expect(result.effect).toEqual({ note: copy.notes.emptyTable, warn: true });
  });

  it("a first PAZ filter leaves three stamps: the profile, the method and the house", () => {
    const account = fresh({ order: [{ itemId: FILTER, quantity: 1 }], storeId: "zona-g" });
    const result = reduce(account, { type: "postOrder", mode: "table" }, clock);
    const next = must(result);
    expect(keys(next)).toEqual(["welcome:1", "welcome:2", "profile:PAZ", "method:filter", "place:zona-g"]);
    expect(next.stamps).toBe(5);
    expect(next.points).toBe(WELCOME_BONUS + pointsOf(FILTER) + 3 * STAMP_BONUS);
    expect(next.visits).toBe(1);
    expect(next.lastPurchaseAt).toBe(ISO);
    expect(next.order).toEqual([]);
    const store = storeLedgerName("zona-g");
    expect(next.movements.map((entry) => entry.label)).toEqual([
      copy.ledger.stamp(storeName("zona-g")),
      copy.ledger.stamp(copy.logbook.methods.filter),
      copy.ledger.stamp("PAZ"),
      menuItem(FILTER).name,
      copy.ledger.welcome,
    ]);
    expect(next.movements.slice(0, 3).every((entry) => entry.points === STAMP_BONUS && entry.store === store)).toBe(true);
    expect(next.lastOrder).toMatchObject({ mode: "table", storeId: "zona-g", at: ISO, points: pointsOf(FILTER) + 3 * STAMP_BONUS, paidWith: "register" });
    expect(next.lastOrder?.code).toMatch(new RegExp(`^P-${CODE_LETTER}{4}$`));
    expect(result.effect).toEqual({ roast: "cup", celebrate: true });
  });

  it("the same first times do not stamp twice, and a pastry only stamps the house", () => {
    const first = must(reduce(fresh({ order: [{ itemId: FILTER, quantity: 1 }] }), { type: "postOrder", mode: "pickup" }, clock));
    const again = must(reduce({ ...first, order: [{ itemId: FILTER, quantity: 2 }] }, { type: "postOrder", mode: "pickup" }, clock));
    expect(again.stamps).toBe(first.stamps);
    expect(again.points).toBe(first.points + 2 * pointsOf(FILTER));

    const pastry = reduce(fresh({ order: [{ itemId: CROISSANT, quantity: 1 }] }), { type: "postOrder", mode: "table" }, clock);
    expect(keys(must(pastry))).toEqual(["welcome:1", "welcome:2", `place:${INITIAL_STORE}`]);
    expect(pastry.effect).toEqual({ celebrate: true });
  });

  it("another house is another stamp", () => {
    const home = must(reduce(fresh({ order: [{ itemId: ESPRESSO, quantity: 1 }] }), { type: "postOrder", mode: "pickup" }, clock));
    const away = must(reduce({ ...home, storeId: "usaquen", order: [{ itemId: ESPRESSO, quantity: 1 }] }, { type: "postOrder", mode: "pickup" }, clock));
    expect(keys(away)).toContain("place:usaquen");
    expect(away.stamps).toBe(home.stamps + 1);
  });

  it("a bag of beans earns double and stamps the home family", () => {
    const next = must(reduce(fresh({ order: [{ itemId: BAG, quantity: 1 }] }), { type: "postOrder", mode: "pickup" }, clock));
    expect(keys(next)).toContain("home:PAZ");
    expect(keys(next)).toContain("profile:PAZ");
    expect(keys(next)).not.toContain("method:coffee");
    expect(next.movements.find((entry) => entry.label === menuItem(BAG).name)?.points).toBe(pointsOf(BAG));
    expect(pointsOf(BAG)).toBe(2 * Math.floor(menuItem(BAG).price / 1000));
  });

  it("a first time counts again after twelve months", () => {
    const old = new Date(FIXED);
    old.setMonth(old.getMonth() - 13);
    const account = fresh({
      stampLog: [stamp("welcome", "welcome:1"), stamp("welcome", "welcome:2"), stamp("place", `place:${INITIAL_STORE}`, old.toISOString())],
      stamps: 3,
      order: [{ itemId: CROISSANT, quantity: 1 }],
    });
    const next = must(reduce(account, { type: "postOrder", mode: "pickup" }, clock));
    expect(keys(next).filter((key) => key === `place:${INITIAL_STORE}`)).toHaveLength(2);
    expect(next.stamps).toBe(4);
  });

  it("the sixth stamp from two families opens Travesía and pours for the level", () => {
    const log = [
      stamp("welcome", "welcome:1"),
      stamp("welcome", "welcome:2"),
      stamp("profile", "profile:ROCK"),
      stamp("method", "method:espresso"),
      stamp("place", `place:${INITIAL_STORE}`),
    ];
    expect(log).toHaveLength(STAMPS_FOR_TRAVESIA - 1);
    const account = fresh({ stampLog: log, stamps: log.length, order: [{ itemId: FILTER, quantity: 1 }] });
    const result = reduce(account, { type: "postOrder", mode: "table" }, clock);
    expect(must(result).stamps).toBeGreaterThanOrEqual(STAMPS_FOR_TRAVESIA);
    expect(result.effect).toEqual({ roast: "level", celebrate: true, note: copy.notes.levelUp(copy.levels.travesia.name) });
  });

  it("postItem posts a single item without touching the table", () => {
    const account = fresh({ order: [{ itemId: CROISSANT, quantity: 1 }] });
    const result = reduce(account, { type: "postItem", itemId: ESPRESSO }, clock);
    const next = must(result);
    // The method and the house always stamp; the profile only when the piece has one.
    const firstTimes = 2 + (menuItem(ESPRESSO).profile ? 1 : 0);
    expect(next.stamps).toBe(WELCOME_STAMPS + firstTimes);
    expect(next.points).toBe(WELCOME_BONUS + pointsOf(ESPRESSO) + firstTimes * STAMP_BONUS);
    expect(next.order).toEqual(account.order);
    expect(result.effect).toEqual({ roast: "cup", note: copy.notes.postedItem(menuItem(ESPRESSO).name) });
  });

  it("clearLastOrder removes the placed order and keeps everything else", () => {
    const placed = must(reduce(fresh({ order: [{ itemId: ESPRESSO, quantity: 1 }] }), { type: "postOrder", mode: "table" }, clock));
    const { lastOrder: _dropped, ...rest } = placed;
    expect(must(reduce(placed, { type: "clearLastOrder" }, clock))).toEqual(rest);
  });
});

describe("reduce: paying with the balance", () => {
  const order = [{ itemId: ESPRESSO, quantity: 2 }];
  const price = menuItem(ESPRESSO).price * 2;

  it("refuses when the balance is short and changes nothing", () => {
    const account = fresh({ order, balance: price - 1 });
    const result = reduce(account, { type: "postOrder", mode: "pickup", payWith: "balance" }, clock);
    expect(result.account).toBe(account);
    expect(result.effect).toEqual({ note: copy.wallet.notes.insufficient(1), warn: true });
  });

  it("takes the money from the balance and earns double on the pieces, like a registered card", () => {
    const atRegister = must(reduce(fresh({ order, balance: price }), { type: "postOrder", mode: "pickup" }, clock));
    const result = reduce(fresh({ order, balance: price }), { type: "postOrder", mode: "pickup", payWith: "balance" }, clock);
    const next = must(result);
    expect(PREPAID_MULTIPLIER).toBe(2);
    expect(next.balance).toBe(0);
    // Two espressos: each piece earns double. The stamp bonuses stay the same, so the account ends two pieces ahead.
    const pieces = next.movements.filter((entry) => entry.label === menuItem(ESPRESSO).name);
    expect(pieces).toHaveLength(2);
    expect(pieces.every((entry) => entry.points === PREPAID_MULTIPLIER * pointsOf(ESPRESSO))).toBe(true);
    expect(next.points).toBe(atRegister.points + 2 * pointsOf(ESPRESSO));
    expect(next.walletMovements?.[0]).toMatchObject({ amount: -price, label: copy.wallet.ledger.order(next.lastOrder?.code ?? "") });
    expect(next.lastOrder?.paidWith).toBe("balance");
    expect(result.effect).toEqual({ roast: "cup", celebrate: true, note: copy.wallet.notes.paidOrder(price) });
  });

  it("loading the balance earns nothing by itself, at the counter or through PSE", () => {
    const account = fresh();
    const pse = must(reduce(account, { type: "topUp", amount: 50_000, method: "pse", bank: "Nequi", reference: "PSE-ABC" }, clock));
    expect(pse.points).toBe(account.points);
    expect(pse.balance).toBe(50_000);
    expect(pse.walletMovements?.[0]).toMatchObject({ label: copy.wallet.ledger.topUp("Nequi"), amount: 50_000, reference: "PSE-ABC" });

    const register = must(reduce(pse, { type: "topUp", amount: 20_000, method: "register", storeId: "zona-g", reference: "CAJA-1234" }, clock));
    expect(register.balance).toBe(70_000);
    expect(register.walletMovements?.[0]).toMatchObject({ label: copy.wallet.ledger.topUpAtRegister(storeName("zona-g")), amount: 20_000 });
    expect(reduce(account, { type: "topUp", amount: 0, method: "pse", reference: "x" }, clock).account).toBe(account);
  });
});

describe("reduce: redeem", () => {
  const cappuccino = reward("cappuccino");
  const invite = reward("invite");
  const bag = reward("bagPaz");

  it("the carta de canje is 300, 150 and 1.000", () => {
    expect(cappuccino.points).toBe(300);
    expect(invite.points).toBe(150);
    expect(bag.points).toBe(1000);
  });

  it("warns with the missing cerezas when the balance is short", () => {
    const account = fresh({ points: bag.points - 1 });
    const result = reduce(account, { type: "redeem", rewardId: bag.id }, clock);
    expect(result.account).toBe(account);
    expect(result.effect).toEqual({ note: copy.notes.cannotRedeem(1, copy.rewards.bagPaz.name), warn: true });
  });

  it("subtracts the cappuccino and writes a negative movement", () => {
    const account = fresh({ points: cappuccino.points + 5 });
    const result = reduce(account, { type: "redeem", rewardId: cappuccino.id }, clock);
    const next = must(result);
    expect(next.points).toBe(5);
    expect(next.movements[0]).toMatchObject({
      label: copy.ledger.redemption(copy.rewards.cappuccino.name),
      points: -cappuccino.points,
      store: storeLedgerName(INITIAL_STORE),
    });
    expect(result.effect).toEqual({ note: copy.notes.redeemed(copy.rewards.cappuccino.name, cappuccino.points), celebrate: true });
  });

  it("inviting someone costs half a cappuccino and leaves a code for them", () => {
    const result = reduce(fresh({ points: invite.points }), { type: "redeem", rewardId: invite.id }, clock);
    const next = must(result);
    expect(next.points).toBe(0);
    const code = next.invitations?.[0]?.code ?? "";
    expect(code).toMatch(new RegExp(`^INV-${CODE_LETTER}{4}$`));
    expect(next.invitations?.[0]).toMatchObject({ points: invite.points, at: ISO });
    expect(next.movements[0]).toMatchObject({ label: copy.ledger.invitation(code), points: -invite.points });
    expect(result.effect).toEqual({ note: copy.notes.invited(code), celebrate: true });
  });

  it("ignores an unknown reward", () => {
    const account = fresh();
    expect(reduce(account, { type: "redeem", rewardId: "latte" }, clock)).toEqual({ account, effect: {} });
  });
});

describe("reduce: claimCourtesy", () => {
  const courtesy: Courtesy = { id: "first:calle-85", kind: "firstVisit", storeId: "calle-85", at: ISO, claimed: false };

  it("writes the courtesy at that house with zero cerezas", () => {
    const result = reduce(fresh({ storeId: "zona-g" }), { type: "claimCourtesy", courtesy }, clock);
    const next = must(result);
    const title = copy.courtesy.catalog.firstVisit.title(storeName("calle-85"));
    expect(next.points).toBe(WELCOME_BONUS);
    expect(next.movements[0]).toMatchObject({ label: copy.ledger.courtesy(title), points: 0, store: storeLedgerName("calle-85") });
    expect(result.effect).toEqual({ note: copy.courtesy.activated(title), celebrate: true });
  });
});

describe("reduce: migrateLeal", () => {
  it("turns 910 Leal points into the cappuccino 300 cerezas buy, once", () => {
    expect(lealToPoints(910)).toBe(300);
    const result = reduce(fresh(), { type: "migrateLeal", lealPoints: 910 }, clock);
    const next = must(result);
    expect(next.points).toBe(WELCOME_BONUS + 300);
    expect(next.migratedFrom).toEqual({ lealPoints: 910, points: 300, at: ISO });
    expect(next.movements[0]).toMatchObject({ label: copy.ledger.migrated(910, 300), points: 300, store: null });
    expect(result.effect).toEqual({ note: copy.notes.migrated(910, 300), celebrate: true });

    const twice = reduce(next, { type: "migrateLeal", lealPoints: 910 }, clock);
    expect(twice.account).toBe(next);
    expect(twice.effect).toEqual({ note: copy.notes.alreadyMigrated, warn: true });
  });

  it("ignores an empty balance", () => {
    const account = fresh();
    expect(reduce(account, { type: "migrateLeal", lealPoints: 0 }, clock).account).toBe(account);
  });
});

describe("reduce: setPermission", () => {
  it("changes one channel, dates it, and keeps the email consent in step", () => {
    const later: Clock = { now: () => new Date("2026-11-04T09:00:00-05:00"), random: () => 0.5 };
    const result = reduce(fresh(), { type: "setPermission", channel: "email", on: false }, later);
    const next = must(result);
    expect(next.permissions?.email).toEqual({ on: false, at: later.now().toISOString() });
    expect(next.permissions?.whatsapp).toEqual({ on: true, at: ISO });
    expect(next.consent?.marketing).toBe(false);
    expect(result.effect).toEqual({ note: copy.notes.permissionSaved });
  });

  it("builds the permissions from the consent when an older account has none", () => {
    const { permissions: _none, ...older } = fresh();
    const next = must(reduce(older, { type: "setPermission", channel: "sms", on: true }, clock));
    expect(next.permissions?.sms.on).toBe(true);
    expect(next.permissions?.email.on).toBe(true);
  });
});
