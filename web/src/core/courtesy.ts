import type { StoreId } from "@/src/data/program";

/**
 * A courtesy is something on the house, with a reason: a first time at this house, a second visit,
 * a birthday. It has no clock on it and it is never a discount. The guest activates it when they like.
 */
export type CourtesyKind = "firstVisit" | "secondVisit" | "birthday";

export type Courtesy = {
  id: string;
  kind: CourtesyKind;
  storeId: StoreId;
  at: string;
  claimed: boolean;
};

/** The birthday drink can be used on the day and the fifteen days after. */
export const BIRTHDAY_WINDOW_DAYS = 15;

const DAY_MS = 86_400_000;

type Guest = {
  birthday?: string;
  visits?: number;
  stampLog?: readonly { key: string }[];
};

/** The year whose birthday window is open now, or null. A window that opened in December still counts in January. */
export function birthdayWindow(birthday: string | undefined, now: Date): number | null {
  if (!birthday) return null;
  const [, month, day] = birthday.split("-").map(Number);
  if (!month || !day) return null;
  for (const year of [now.getFullYear() - 1, now.getFullYear()]) {
    const start = new Date(year, month - 1, day);
    const days = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
    if (days >= 0 && days <= BIRTHDAY_WINDOW_DAYS) return year;
  }
  return null;
}

/**
 * What the house has for this guest at this door, if anything. One at a time, the most personal first.
 * `seen` holds the ids already activated or closed, so nothing is offered twice.
 */
export function courtesyFor(guest: Guest, storeId: StoreId, now: Date, seen: readonly string[]): Courtesy | null {
  const at = now.toISOString();
  const year = birthdayWindow(guest.birthday, now);
  if (year !== null) {
    const id = `birthday:${year}`;
    if (!seen.includes(id)) return { id, kind: "birthday", storeId, at, claimed: false };
  }
  if ((guest.visits ?? 0) === 1 && !seen.includes("second")) {
    return { id: "second", kind: "secondVisit", storeId, at, claimed: false };
  }
  const visited = (guest.stampLog ?? []).some((stamp) => stamp.key === `place:${storeId}`);
  const id = `first:${storeId}`;
  if (!visited && !seen.includes(id)) return { id, kind: "firstVisit", storeId, at, claimed: false };
  return null;
}
