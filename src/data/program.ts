import { copy } from "@/src/i18n/strings";

/**
 * Brújula, the house program. The guest counts cerezas; the code keeps calling them points.
 * COP 1.000 at the register = 1 cereza. Rules from the Brújula deck of 3 November 2026.
 */
export const PESOS_PER_POINT = 1000;

/** Whole-bean bags earn double: the house wants its coffee in the guest's kitchen. */
export const GRAIN_MULTIPLIER = 2;

/** Paying with the prepaid balance earns double, the way a registered Starbucks card does. Loading it earns nothing by itself. */
export const PREPAID_MULTIPLIER = 2;

/** Signing up: 100 cerezas and two stamps in the logbook. */
export const WELCOME_BONUS = 100;
export const WELCOME_STAMPS = 2;

/** Every first time (a profile, a method, a house, a bag, a tasting) is a stamp and 20 cerezas. */
export const STAMP_BONUS = 20;

/** A first time counts again after this many months. */
export const STAMP_MONTHS = 12;

/**
 * Levels climb on stamps, never on spend.
 * Travesía needs stamps from two families; Origen needs one from Casa and one from Aprender.
 */
export const STAMPS_FOR_TRAVESIA = 6;
export const STAMPS_FOR_ORIGEN = 12;

/** A level holds with one visit every 90 days. Resting longer drops one level, never two. */
export const LEVEL_KEEP_DAYS = 90;

/** Cerezas never expire while the guest keeps coming: only after 12 months without a purchase, with 30 days' notice. */
export const INACTIVITY_MONTHS = 12;
export const EXPIRY_NOTICE_DAYS = 30;

/** Coming from Leal: 910 points bought a cappuccino; 300 cerezas buy the same one. Rounded up for the member. */
export const LEAL_POINTS_PER_CAPPUCCINO = 910;

/** The Expo app still draws the eight-cup card. The web app runs the logbook. */
export const CUPS_FOR_FILTER = 8;

export type RewardId = "cappuccino" | "invite" | "bagPaz";

export type Reward = {
  id: RewardId;
  points: number;
};

/** 300 is a cappuccino. 150 invites one for somebody else: the only way to pay less for the same coffee. */
export const REWARDS: readonly Reward[] = [
  { id: "cappuccino", points: 300 },
  { id: "invite", points: 150 },
  { id: "bagPaz", points: 1000 },
];

export const CAPPUCCINO_POINTS = 300;

export type StampFamily = "profile" | "method" | "place" | "home" | "learn" | "welcome";

/** The five families that count for a level. Welcome stamps add to the total, not to the families. */
export const STAMP_FAMILIES: readonly StampFamily[] = ["profile", "method", "place", "home", "learn"];

export type Level = "rumbo" | "travesia" | "origen";

export const LEVELS: readonly Level[] = ["rumbo", "travesia", "origen"];

export type StoreId = "zona-g" | "calle-93" | "calle-85" | "usaquen";

export type Store = {
  id: StoreId;
  nearby: boolean;
};

/**
 * Zona G is marked nearest only inside this demo.
 * There is no GPS. Calle 93 keeps the name already used in the program ledger.
 */
export const STORES: readonly Store[] = [
  { id: "zona-g", nearby: true },
  { id: "calle-93", nearby: false },
  { id: "calle-85", nearby: false },
  { id: "usaquen", nearby: false },
];

export const INITIAL_STORE: StoreId = "calle-93";

export function storeById(id: string): Store {
  return STORES.find((store) => store.id === id) ?? STORES[1] ?? STORES[0]!;
}

export function storeName(id: string): string {
  return copy.stores.names[id as StoreId] ?? id;
}

export function storeLedgerName(id: string): string {
  return copy.stores.ledger[id as StoreId] ?? id;
}

export function rewardName(id: RewardId): string {
  return copy.rewards[id].name;
}

export function rewardNote(id: RewardId): string {
  return copy.rewards[id].note;
}

export function pointsForPrice(price: number): number {
  return Math.floor(price / PESOS_PER_POINT);
}

/** A bag of beans. */
export function isGrain(category: string): boolean {
  return category === "coffee";
}

/** What a piece earns at the register: one cereza per COP 1.000, double on beans. */
export function pointsFor(price: number, category: string): number {
  return pointsForPrice(price) * (isGrain(category) ? GRAIN_MULTIPLIER : 1);
}

/**
 * Points still needed to redeem a reward.
 * The gap is the reward cost minus the balance on screen.
 * A balance of 280 against the cappuccino (300) is 20, not a fixed number.
 */
export function pointsStillNeeded(balance: number, cost: number): number {
  return cost - balance;
}

const CUP_CATEGORIES = new Set([
  "filter",
  "espresso",
  "signature",
  "matcha",
  "cold-brew",
]);

export function isCup(category: string): boolean {
  return CUP_CATEGORIES.has(category);
}

/** The level the stamps have earned. */
export function levelFor(stamps: readonly { family: StampFamily }[]): Level {
  const families = new Set(stamps.map((stamp) => stamp.family).filter((family) => family !== "welcome"));
  const count = stamps.length;
  if (count >= STAMPS_FOR_ORIGEN && families.has("home") && families.has("learn")) return "origen";
  if (count >= STAMPS_FOR_TRAVESIA && families.size >= 2) return "travesia";
  return "rumbo";
}

/** The level the guest holds today: one step down after 90 days without a purchase. The stamps stay. */
export function levelHeld(
  stamps: readonly { family: StampFamily }[],
  lastPurchaseAt: string | undefined,
  now: Date,
): Level {
  const earned = levelFor(stamps);
  if (!lastPurchaseAt) return earned;
  const days = (now.getTime() - new Date(lastPurchaseAt).getTime()) / 86_400_000;
  if (days <= LEVEL_KEEP_DAYS) return earned;
  const index = LEVELS.indexOf(earned);
  return LEVELS[Math.max(0, index - 1)] ?? "rumbo";
}

/** How many stamps open the next level, or null at Origen. */
export function stampsForNextLevel(level: Level): number | null {
  if (level === "rumbo") return STAMPS_FOR_TRAVESIA;
  if (level === "travesia") return STAMPS_FOR_ORIGEN;
  return null;
}

/** Leal points into cerezas: what bought a cappuccino still buys one. 771 points are 255 cerezas. */
export function lealToPoints(lealPoints: number): number {
  return Math.ceil((Math.max(0, lealPoints) * CAPPUCCINO_POINTS) / LEAL_POINTS_PER_CAPPUCCINO);
}

export function productionBlocked(): boolean {
  return (process.env.EXPO_PUBLIC_ODOO_URL ?? "").includes(
    "libertariocoffee.odoo.com",
  );
}
