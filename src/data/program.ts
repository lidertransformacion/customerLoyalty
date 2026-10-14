import { copy } from "@/src/i18n/strings";

/** Live program. $100 at the register = 1 point. */
export const PESOS_PER_POINT = 100;

export const WELCOME_BONUS = 1000;

export const CUPS_FOR_FILTER = 8;

export const REWARD_DEADLINE = "2026-12-31";

export type RewardId = "americano" | "cappuccino" | "croissant";

export type Reward = {
  id: RewardId;
  points: number;
};

export const REWARDS: readonly Reward[] = [
  { id: "americano", points: 700 },
  { id: "cappuccino", points: 910 },
  { id: "croissant", points: 2000 },
];

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

/**
 * Points still needed to redeem a reward.
 * The gap is the reward cost minus the balance on screen.
 * A balance of 898 against the almond croissant (2,000) is 1,102, not 1,000.
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

export function productionBlocked(): boolean {
  return (process.env.EXPO_PUBLIC_ODOO_URL ?? "").includes(
    "libertariocoffee.odoo.com",
  );
}
