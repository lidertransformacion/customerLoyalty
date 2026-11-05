import { itemById, pointsForItem, type MenuItem } from "@/src/data/menu";
import {
  INITIAL_STORE,
  isCup,
  isGrain,
  lealToPoints,
  levelFor,
  pointsStillNeeded,
  PREPAID_MULTIPLIER,
  REWARDS,
  STAMP_BONUS,
  STAMP_MONTHS,
  storeLedgerName,
  storeName,
  WELCOME_BONUS,
  WELCOME_STAMPS,
  type StampFamily,
  type StoreId,
} from "@/src/data/program";
import { copy } from "@/src/i18n/strings";

/** The copy the reducer writes notes and ledger labels with. Defaults to Spanish. */
export type Text = typeof copy;

import type { Courtesy } from "./courtesy";
import type { MarketId } from "./market";

/**
 * The house account, as a pure reducer. Brújula: cerezas for what you buy, stamps for what you explore.
 * Same storage key and base shape as the Expo app, so a phone that installs
 * the native build later finds its account. Time and randomness are injected.
 */
export const STORAGE_KEY = "libertario-home-v1";

export type Movement = {
  id: string;
  date: string;
  label: string;
  store: string | null;
  points: number;
};

export type TableLine = {
  itemId: string;
  quantity: number;
};

export type OrderMode = "pickup" | "table";

export type PaidWith = "register" | "balance";

export type PlacedOrder = {
  code: string;
  mode: OrderMode;
  table: string;
  storeId: string;
  at: string;
  lines: TableLine[];
  points: number;
  paidWith?: PaidWith;
};

export type Consent = {
  adult: boolean;
  data: boolean;
  terms: boolean;
  marketing: boolean;
  at: string;
};

export type Provider = "google" | "email";

export type Channel = "whatsapp" | "email" | "sms";

/** One permission per channel, each with the date of its last change. */
export type Permission = { on: boolean; at: string };

export type Permissions = Record<Channel, Permission>;

/** A first time in the logbook. Stamps are never spent and never erased. */
export type Stamp = {
  family: StampFamily;
  key: string;
  label: string;
  at: string;
  store: string | null;
};

/** A cappuccino bought for somebody else, carried by a code they show at the counter. */
export type Invitation = {
  code: string;
  points: number;
  at: string;
};

/** The Leal balance the guest brought over. Those cerezas do not expire for a year. */
export type Migration = {
  lealPoints: number;
  points: number;
  at: string;
};

/** A prepaid-balance entry: a top-up or a payment taken from the balance. Amounts in COP. */
export type WalletMovement = {
  id: string;
  date: string;
  label: string;
  amount: number;
  reference: string;
};

export type TopUpMethod = "pse" | "register";

export type Account = {
  version: 1;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  code: string;
  points: number;
  stamps: number;
  storeId: string;
  table: string;
  order: TableLine[];
  movements: Movement[];
  birthday?: string;
  consent?: Consent;
  provider?: Provider;
  picture?: string;
  market?: MarketId;
  lastOrder?: PlacedOrder;
  createdAt?: string;
  balance?: number;
  walletMovements?: WalletMovement[];
  stampLog?: Stamp[];
  visits?: number;
  lastPurchaseAt?: string;
  permissions?: Permissions;
  invitations?: Invitation[];
  migratedFrom?: Migration;
};

export type Signup = {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  birthday: string;
  consent: { adult: boolean; data: boolean; terms: boolean; marketing: boolean };
  channels?: { whatsapp: boolean; email: boolean; sms: boolean };
  provider: Provider;
  picture?: string;
  market: MarketId;
};

export type Action =
  | { type: "signUp"; signup: Signup }
  | { type: "chooseStore"; storeId: StoreId }
  | { type: "setTable"; table: string }
  | { type: "postItem"; itemId: string }
  | { type: "addToTable"; itemId: string }
  | { type: "removeFromTable"; itemId: string }
  | { type: "postOrder"; mode: OrderMode; payWith?: PaidWith }
  | { type: "clearLastOrder" }
  | { type: "redeem"; rewardId: string }
  | { type: "claimCourtesy"; courtesy: Courtesy }
  | { type: "topUp"; amount: number; method: TopUpMethod; reference: string; bank?: string; storeId?: string }
  | { type: "payWithBalance"; amount: number; label: string }
  | { type: "migrateLeal"; lealPoints: number }
  | { type: "setPermission"; channel: Channel; on: boolean }
  | { type: "forget" };

/** What the interface should do after a change: say something, pour, celebrate. */
export type Effect = {
  note?: string;
  roast?: "cup" | "level";
  celebrate?: boolean;
  warn?: boolean;
};

export type Clock = { now: () => Date; random: () => number };

export const systemClock: Clock = { now: () => new Date(), random: Math.random };

export function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<Account>;
  return (
    account.version === 1 &&
    typeof account.code === "string" &&
    typeof account.points === "number" &&
    Array.isArray(account.movements)
  );
}

function movement(clock: Clock, label: string, points: number, store: string | null): Movement {
  return {
    id: `${clock.now().getTime()}-${clock.random().toString(36).slice(2, 7)}`,
    date: clock.now().toISOString(),
    label,
    store,
    points,
  };
}

function walletMovement(clock: Clock, label: string, amount: number, reference: string): WalletMovement {
  return {
    id: `${clock.now().getTime()}-${clock.random().toString(36).slice(2, 7)}`,
    date: clock.now().toISOString(),
    label,
    amount,
    reference,
  };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function letters(count: number, clock: Clock): string {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    out += ALPHABET[Math.floor(clock.random() * ALPHABET.length)] ?? "L";
  }
  return out;
}

/** The counter code comes from the phone, never from the ID number. */
function codeFor(phone: string, clock: Clock): string {
  return `LBT-${phone.replace(/\D/g, "").slice(-4).padStart(4, "0")}-${letters(3, clock)}`;
}

function permissionsFrom(signup: Signup, at: string): Permissions {
  const channels = signup.channels ?? { whatsapp: false, email: signup.consent.marketing, sms: false };
  return {
    whatsapp: { on: channels.whatsapp, at },
    email: { on: channels.email, at },
    sms: { on: channels.sms, at },
  };
}

export function createAccount(signup: Signup, clock: Clock, text: Text = copy): Account {
  const phone = signup.phone.trim();
  const now = clock.now().toISOString();
  const stampLog: Stamp[] = Array.from({ length: WELCOME_STAMPS }, (_, index) => ({
    family: "welcome",
    key: `welcome:${index + 1}`,
    label: text.logbook.welcomeStamp(index + 1),
    at: now,
    store: null,
  }));
  return {
    version: 1,
    name: signup.name.trim(),
    phone,
    email: signup.email.trim(),
    idNumber: signup.idNumber.trim(),
    code: codeFor(phone, clock),
    points: WELCOME_BONUS,
    stamps: stampLog.length,
    storeId: INITIAL_STORE,
    table: "",
    order: [],
    movements: [movement(clock, text.ledger.welcome, WELCOME_BONUS, null)],
    birthday: signup.birthday,
    consent: { ...signup.consent, at: now },
    provider: signup.provider,
    ...(signup.picture ? { picture: signup.picture } : {}),
    market: signup.market,
    createdAt: now,
    stampLog,
    visits: 0,
    permissions: permissionsFrom(signup, now),
  };
}

type Candidate = Omit<Stamp, "at" | "store">;

/** The first times one piece can leave: its profile, its method, the house, and the bag for the kitchen. */
function stampCandidates(item: MenuItem, storeId: string, text: Text): Candidate[] {
  const out: Candidate[] = [];
  const cup = isCup(item.category);
  const grain = isGrain(item.category);
  if (item.profile && (cup || grain)) {
    out.push({ family: "profile", key: `profile:${item.profile}`, label: item.profile });
  }
  const method = (text.logbook.methods as Record<string, string | undefined>)[item.category];
  if (cup && method) {
    out.push({ family: "method", key: `method:${item.category}`, label: method });
  }
  if (grain && item.profile) {
    out.push({ family: "home", key: `home:${item.profile}`, label: text.logbook.bag(item.profile) });
  }
  out.push({ family: "place", key: `place:${storeId}`, label: storeName(storeId) });
  return out;
}

/** A stamp still counts as "already seen" for twelve months. */
function stillFresh(stamp: Stamp, now: Date): boolean {
  const again = new Date(stamp.at);
  again.setMonth(again.getMonth() + STAMP_MONTHS);
  return now < again;
}

function closePurchase(
  account: Account,
  purchased: MenuItem[],
  order: TableLine[],
  clock: Clock,
  text: Text,
  paidWith: PaidWith = "register",
): { account: Account; effect: Effect; earned: number } {
  const store = storeLedgerName(account.storeId);
  const now = clock.now();
  const nowIso = now.toISOString();
  const multiplier = paidWith === "balance" ? PREPAID_MULTIPLIER : 1;
  let points = account.points;
  let earned = 0;
  const movements = [...account.movements];
  const log = [...(account.stampLog ?? [])];
  const seen = new Set(log.filter((stamp) => stillFresh(stamp, now)).map((stamp) => stamp.key));
  let cups = 0;
  for (const item of purchased) {
    const gained = pointsForItem(item) * multiplier;
    points += gained;
    earned += gained;
    movements.unshift(movement(clock, item.name, gained, store));
    if (isCup(item.category)) cups += 1;
    for (const candidate of stampCandidates(item, account.storeId, text)) {
      if (seen.has(candidate.key)) continue;
      seen.add(candidate.key);
      log.push({ ...candidate, at: nowIso, store });
      points += STAMP_BONUS;
      earned += STAMP_BONUS;
      movements.unshift(movement(clock, text.ledger.stamp(candidate.label), STAMP_BONUS, store));
    }
  }
  const before = levelFor(account.stampLog ?? []);
  const after = levelFor(log);
  const effect: Effect = {};
  if (after !== before) {
    effect.roast = "level";
    effect.celebrate = true;
    effect.note = text.notes.levelUp(text.levels[after].name);
  } else if (cups > 0) {
    effect.roast = "cup";
  }
  return {
    account: {
      ...account,
      points,
      stamps: log.length,
      stampLog: log,
      movements,
      order,
      visits: (account.visits ?? 0) + 1,
      lastPurchaseAt: nowIso,
    },
    effect,
    earned,
  };
}

export type Result = { account: Account | null; effect: Effect };

export function orderTotal(order: TableLine[]): { price: number; points: number; count: number } {
  let price = 0;
  let points = 0;
  let count = 0;
  for (const line of order) {
    const item = itemById(line.itemId);
    if (!item) continue;
    price += item.price * line.quantity;
    points += pointsForItem(item) * line.quantity;
    count += line.quantity;
  }
  return { price, points, count };
}

export function reduce(account: Account | null, action: Action, clock: Clock, text: Text = copy): Result {
  if (action.type === "signUp") {
    return {
      account: createAccount(action.signup, clock, text),
      effect: { note: text.signup.welcomeNote, celebrate: true },
    };
  }
  if (action.type === "forget") return { account: null, effect: {} };
  if (!account) return { account, effect: {} };

  switch (action.type) {
    case "chooseStore":
      return { account: { ...account, storeId: action.storeId }, effect: {} };

    case "setTable":
      return {
        account: { ...account, table: action.table.replace(/\D/g, "").slice(0, 3) },
        effect: {},
      };

    case "postItem": {
      const item = itemById(action.itemId);
      if (!item) return { account, effect: {} };
      const closed = closePurchase(account, [item], account.order, clock, text);
      return {
        account: closed.account,
        effect: { ...closed.effect, note: closed.effect.note ?? text.notes.postedItem(item.name) },
      };
    }

    case "addToTable": {
      const order = account.order.map((line) => ({ ...line }));
      const line = order.find((entry) => entry.itemId === action.itemId);
      if (line) line.quantity += 1;
      else order.push({ itemId: action.itemId, quantity: 1 });
      return { account: { ...account, order }, effect: {} };
    }

    case "removeFromTable": {
      const order = account.order
        .map((line) =>
          line.itemId === action.itemId ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0);
      return { account: { ...account, order }, effect: {} };
    }

    case "postOrder": {
      const purchased = account.order.flatMap((line) => {
        const item = itemById(line.itemId);
        if (!item) return [];
        return Array.from({ length: line.quantity }, () => item);
      });
      if (purchased.length === 0) {
        return { account, effect: { note: text.notes.emptyTable, warn: true } };
      }
      const paidWith: PaidWith = action.payWith ?? "register";
      const total = orderTotal(account.order).price;
      const balance = account.balance ?? 0;
      if (paidWith === "balance" && balance < total) {
        return { account, effect: { note: text.wallet.notes.insufficient(total - balance), warn: true } };
      }
      const code = `P-${letters(4, clock)}`;
      const closed = closePurchase(account, purchased, [], clock, text, paidWith);
      const placed: PlacedOrder = {
        code,
        mode: action.mode,
        table: account.table,
        storeId: account.storeId,
        at: clock.now().toISOString(),
        lines: account.order,
        points: closed.earned,
        paidWith,
      };
      const paid =
        paidWith === "balance"
          ? {
              balance: balance - total,
              walletMovements: [
                walletMovement(clock, text.wallet.ledger.order(code), -total, code),
                ...(account.walletMovements ?? []),
              ],
            }
          : {};
      return {
        account: { ...closed.account, ...paid, lastOrder: placed },
        effect: {
          ...closed.effect,
          ...(paidWith === "balance" && !closed.effect.note ? { note: text.wallet.notes.paidOrder(total) } : {}),
          celebrate: true,
        },
      };
    }

    case "clearLastOrder": {
      const { lastOrder: _dropped, ...rest } = account;
      return { account: rest, effect: {} };
    }

    case "redeem": {
      const reward = REWARDS.find((item) => item.id === action.rewardId);
      if (!reward) return { account, effect: {} };
      const name = text.rewards[reward.id].name;
      const missing = pointsStillNeeded(account.points, reward.points);
      if (missing > 0) {
        return { account, effect: { note: text.notes.cannotRedeem(missing, name), warn: true } };
      }
      const store = storeLedgerName(account.storeId);
      if (reward.id === "invite") {
        const code = `INV-${letters(4, clock)}`;
        const invitation: Invitation = { code, points: reward.points, at: clock.now().toISOString() };
        return {
          account: {
            ...account,
            points: account.points - reward.points,
            invitations: [invitation, ...(account.invitations ?? [])],
            movements: [movement(clock, text.ledger.invitation(code), -reward.points, store), ...account.movements],
          },
          effect: { note: text.notes.invited(code), celebrate: true },
        };
      }
      return {
        account: {
          ...account,
          points: account.points - reward.points,
          movements: [
            movement(clock, text.ledger.redemption(name), -reward.points, store),
            ...account.movements,
          ],
        },
        effect: { note: text.notes.redeemed(name, reward.points), celebrate: true },
      };
    }

    case "claimCourtesy": {
      // A courtesy is a product on the house, with a reason. It never adds cerezas.
      const store = storeLedgerName(action.courtesy.storeId);
      const title = text.courtesy.catalog[action.courtesy.kind].title(storeName(action.courtesy.storeId));
      return {
        account: {
          ...account,
          movements: [movement(clock, text.ledger.courtesy(title), 0, store), ...account.movements],
        },
        effect: { note: text.courtesy.activated(title), celebrate: true },
      };
    }

    case "topUp": {
      // Simulated. The reference comes from the interface; nothing was charged. Loading earns nothing: spending does.
      const amount = Math.round(action.amount);
      if (!Number.isFinite(amount) || amount <= 0) return { account, effect: {} };
      const label =
        action.method === "register"
          ? text.wallet.ledger.topUpAtRegister(storeName(action.storeId ?? account.storeId))
          : text.wallet.ledger.topUp(action.bank ?? "PSE");
      const entry = walletMovement(clock, label, amount, action.reference);
      return {
        account: {
          ...account,
          balance: (account.balance ?? 0) + amount,
          walletMovements: [entry, ...(account.walletMovements ?? [])],
        },
        effect: { note: text.wallet.notes.toppedUp(amount), celebrate: true },
      };
    }

    case "payWithBalance": {
      const amount = Math.round(action.amount);
      if (!Number.isFinite(amount) || amount <= 0) return { account, effect: {} };
      const balance = account.balance ?? 0;
      if (balance < amount) {
        return { account, effect: { note: text.wallet.notes.insufficient(amount - balance), warn: true } };
      }
      const entry = walletMovement(clock, action.label, -amount, `WLT-${letters(6, clock)}`);
      return {
        account: {
          ...account,
          balance: balance - amount,
          walletMovements: [entry, ...(account.walletMovements ?? [])],
        },
        effect: { note: text.wallet.notes.paid(action.label, amount) },
      };
    }

    case "migrateLeal": {
      // Nobody loses what they have: 910 Leal points are the cappuccino 300 cerezas buy.
      if (account.migratedFrom) {
        return { account, effect: { note: text.notes.alreadyMigrated, warn: true } };
      }
      const lealPoints = Math.round(action.lealPoints);
      if (!Number.isFinite(lealPoints) || lealPoints <= 0) return { account, effect: {} };
      const points = lealToPoints(lealPoints);
      const at = clock.now().toISOString();
      return {
        account: {
          ...account,
          points: account.points + points,
          migratedFrom: { lealPoints, points, at },
          movements: [movement(clock, text.ledger.migrated(lealPoints, points), points, null), ...account.movements],
        },
        effect: { note: text.notes.migrated(lealPoints, points), celebrate: true },
      };
    }

    case "setPermission": {
      const at = clock.now().toISOString();
      const current = account.permissions ?? {
        whatsapp: { on: false, at },
        email: { on: account.consent?.marketing ?? false, at },
        sms: { on: false, at },
      };
      const permissions: Permissions = { ...current, [action.channel]: { on: action.on, at } };
      const consent = account.consent && action.channel === "email" ? { ...account.consent, marketing: action.on } : account.consent;
      return {
        account: { ...account, permissions, ...(consent ? { consent } : {}) },
        effect: { note: text.notes.permissionSaved },
      };
    }

    default:
      return { account, effect: {} };
  }
}
