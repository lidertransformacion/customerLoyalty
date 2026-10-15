import type { Catalog, CityId } from "./catalog";

/**
 * A corner is a Libertario bar inside another company's space (an office,
 * a store). It serves a shorter menu, sometimes at its own prices, and has
 * its own QR: /corner/<id>. Shortcuts /corner-<id> and /corners-<id> land
 * on the same page.
 *
 * Content and prices per corner are still pending from operations. Until
 * they arrive, every corner shows the chapters listed in `categories` from
 * its city's catalog at the city prices. To set a corner's own prices, fill
 * `prices` (item id → COP); to drop items, list them in `hidden`.
 */
export type Corner = {
  id: string;
  /** What the guest reads. */
  name: string;
  /** Whose space it is. */
  company: string;
  cityId: CityId;
  /** Chapters this corner serves, in menu order. */
  categories: string[];
  hidden?: string[];
  prices?: Record<string, number>;
  /** Shown on the cover while the real menu is pending. */
  provisional?: boolean;
};

/** The short bar menu: drinks, pastry, cookies. No brunch, bowls or cocktails. */
const BAR_CHAPTERS = ["espresso", "filter", "matcha", "cold-brew", "other-drinks", "bakery", "cookies"];

export const CORNERS: readonly Corner[] = [
  { id: "sura", name: "Sura", company: "Seguros Sura", cityId: "bogota", categories: BAR_CHAPTERS, provisional: true },
  { id: "meli", name: "Mercado Libre", company: "Mercado Libre", cityId: "bogota", categories: BAR_CHAPTERS, provisional: true },
  { id: "adidas-82", name: "Adidas Calle 82", company: "Adidas", cityId: "bogota", categories: BAR_CHAPTERS, provisional: true },
  { id: "adidas-provenza", name: "Adidas Provenza", company: "Adidas", cityId: "medellin", categories: BAR_CHAPTERS, provisional: true },
];

export function cornerById(id: string | null | undefined): Corner | null {
  if (!id) return null;
  const key = id.toLowerCase();
  return CORNERS.find((corner) => corner.id === key) ?? null;
}

/** `/corner-sura`, `/corners-sura` or `/corner/sura` → `sura`. */
export function cornerIdFromPath(pathname: string): string | null {
  const match = /^\/corners?[-/]([a-z0-9-]+)\/?$/i.exec(pathname);
  return match?.[1]?.toLowerCase() ?? null;
}

export function cornerPath(corner: Corner): string {
  return `/corner/${corner.id}`;
}

/** The city catalog cut down to what the corner serves. */
export function cornerCatalog(catalog: Catalog, corner: Corner): Catalog {
  const hidden = new Set(corner.hidden ?? []);
  const order = new Map(corner.categories.map((id, index) => [id, index]));
  const categories = catalog.categories
    .filter((category) => order.has(category.id) || category.id === "extras")
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  const items = catalog.items
    .filter((item) => (order.has(item.category) || item.category === "extras") && !hidden.has(item.id))
    .map((item) => {
      const price = corner.prices?.[item.id];
      return price !== undefined ? { ...item, price } : item;
    });
  return { city: catalog.city, categories, items };
}
