import type { StoreId } from "@/src/data/program";

/** The arrival promo lives this long once the guest walks in. */
export const PROMO_MINUTES = 10;

export type PromoKind = "filterCroissant" | "doubleCup" | "afternoon";

export type ActivePromo = {
  id: string;
  kind: PromoKind;
  storeId: StoreId;
  startedAt: string;
  expiresAt: string;
  claimed: boolean;
};

/** Points the house adds when the guest activates the promo at the register. */
export const PROMO_POINTS: Record<PromoKind, number> = {
  filterCroissant: 150,
  doubleCup: 100,
  afternoon: 120,
};

export function promoForMoment(date: Date): PromoKind {
  const hour = date.getHours();
  if (hour < 12) return "filterCroissant";
  if (hour >= 14) return "afternoon";
  return "doubleCup";
}

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function promoId(storeId: StoreId, date: Date): string {
  return `${storeId}:${dayKey(date)}`;
}

export function startPromo(storeId: StoreId, now: Date): ActivePromo {
  return {
    id: promoId(storeId, now),
    kind: promoForMoment(now),
    storeId,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PROMO_MINUTES * 60_000).toISOString(),
    claimed: false,
  };
}

export function remainingMs(promo: ActivePromo, now: Date): number {
  return Math.max(0, new Date(promo.expiresAt).getTime() - now.getTime());
}

export function isLive(promo: ActivePromo | null, now: Date): promo is ActivePromo {
  return !!promo && !promo.claimed && remainingMs(promo, now) > 0;
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
