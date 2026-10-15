import { itemById, type MenuItem } from "@/src/data/menu";
import {
  CUPS_FOR_FILTER,
  INITIAL_STORE,
  isCup,
  pointsForPrice,
  pointsStillNeeded,
  REWARDS,
  storeLedgerName,
  WELCOME_BONUS,
  type StoreId,
} from "@/src/data/program";
import { copy } from "@/src/i18n/strings";

/** The copy the reducer writes notes and ledger labels with. Defaults to Spanish. */
export type Text = typeof copy;

import type { MarketId } from "./market";
import { PROMO_POINTS, type ActivePromo } from "./promo";

/**
 * The house account, as a pure reducer.
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

export type PlacedOrder = {
  code: string;
  mode: OrderMode;
  table: string;
  storeId: string;
  at: string;
  lines: TableLine[];
  points: number;
};

export type Consent = {
  adult: boolean;
  data: boolean;
  terms: boolean;
  marketing: boolean;
  at: string;
};

export type Provider = "google" | "email";

/** A prepaid-balance entry: a PSE top-up or a payment taken from the balance. Amounts in COP. */
export type WalletMovement = {
  id: string;
  date: string;
  label: string;
  amount: number;
  reference: string;
};

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
};

export type Signup = {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  birthday: string;
  consent: { adult: boolean; data: boolean; terms: boolean; marketing: boolean };
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
  | { type: "postOrder"; mode: OrderMode }
  | { type: "clearLastOrder" }
  | { type: "redeem"; rewardId: string }
  | { type: "claimPromo"; promo: ActivePromo }
  | { type: "topUp"; amount: number; bank: string; reference: string }
  | { type: "payWithBalance"; amount: number; label: string }
  | { type: "forget" };

/** What the interface should do after a change: say something, pour, celebrate. */
export type Effect = {
  note?: string;
  roast?: "cup" | "eighth";
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

function codeFor(idNumber: string, clock: Clock): string {
  return `LBT-${idNumber.replace(/\D/g, "").slice(-4).padStart(4, "0")}-${letters(3, clock)}`;
}

export function createAccount(signup: Signup, clock: Clock, text: Text = copy): Account {
  const idNumber = signup.idNumber.trim();
  const now = clock.now().toISOString();
  return {
    version: 1,
    name: signup.name.trim(),
    phone: signup.phone.trim(),
    email: signup.email.trim(),
    idNumber,
    code: codeFor(idNumber, clock),
    points: WELCOME_BONUS,
    stamps: 0,
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
  };
}

function applyCups(stamps: number, cups: number): { stamps: number; eighths: number } {
  let count = stamps;
  let eighths = 0;
  for (let i = 0; i < cups; i += 1) {
    count += 1;
    if (count >= CUPS_FOR_FILTER) {
      eighths += 1;
      count = 0;
    }
  }
  return { stamps: count, eighths };
}

function closePurchase(
  account: Account,
  purchased: MenuItem[],
  order: TableLine[],
  clock: Clock,
  text: Text,
): { account: Account; effect: Effect; earned: number } {
  const store = storeLedgerName(account.storeId);
  let points = account.points;
  let earned = 0;
  const movements = [...account.movements];
  let cups = 0;
  for (const item of purchased) {
    const gained = pointsForPrice(item.price);
    points += gained;
    earned += gained;
    movements.unshift(movement(clock, item.name, gained, store));
    if (isCup(item.category)) cups += 1;
  }
  const applied = applyCups(account.stamps, cups);
  for (let i = 0; i < applied.eighths; i += 1) {
    movements.unshift(movement(clock, text.ledger.eighthCup, 0, store));
  }
  const effect: Effect = {};
  if (applied.eighths > 0) {
    effect.roast = "eighth";
    effect.celebrate = true;
  } else if (cups > 0) {
    effect.roast = "cup";
  }
  return {
    account: { ...account, points, stamps: applied.stamps, movements, order },
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
    points += pointsForPrice(item.price) * line.quantity;
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
        effect: { ...closed.effect, note: text.notes.postedItem(item.name) },
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
      const closed = closePurchase(account, purchased, [], clock, text);
      const placed: PlacedOrder = {
        code: `P-${letters(4, clock)}`,
        mode: action.mode,
        table: account.table,
        storeId: account.storeId,
        at: clock.now().toISOString(),
        lines: account.order,
        points: closed.earned,
      };
      return {
        account: { ...closed.account, lastOrder: placed },
        effect: { ...closed.effect, celebrate: true },
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

    case "claimPromo": {
      const points = PROMO_POINTS[action.promo.kind];
      const store = storeLedgerName(action.promo.storeId);
      const title = text.promo.catalog[action.promo.kind].title;
      return {
        account: {
          ...account,
          points: account.points + points,
          movements: [movement(clock, text.promo.ledger(store), points, store), ...account.movements],
        },
        effect: { note: text.promo.activated(title, points), celebrate: true },
      };
    }

    case "topUp": {
      // Simulated PSE top-up. The reference comes from the interface; nothing was charged.
      const amount = Math.round(action.amount);
      if (!Number.isFinite(amount) || amount <= 0) return { account, effect: {} };
      const entry = walletMovement(clock, text.wallet.ledger.topUp(action.bank), amount, action.reference);
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

    default:
      return { account, effect: {} };
  }
}
