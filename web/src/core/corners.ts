import type { MenuItem } from "@/src/data/menu";

import type { Catalog, CityId } from "./catalog";

/**
 * A corner is a Libertario bar inside another company's space. It serves a
 * short menu at its own prices, and has its own QR: /corner/<id>. Shortcuts
 * /corner-<id> and /corners-<id> land on the same page.
 *
 * Every corner lists exactly what it sells: `items` maps an item id (from
 * the base catalog or from CORNER_ITEMS below) to that corner's price in COP.
 * Prices come from the operations sheet "Menús corners" (SURA, MELI,
 * BAVARIA), October 2026. Everything is made with the PAZ blend.
 */
export type Corner = {
  id: string;
  /** What the guest reads. */
  name: string;
  /** Whose space it is. */
  company: string;
  cityId: CityId;
  /** Item id → price at this corner. Only these items are served. */
  items: Record<string, number>;
  /** What a plant-based milk adds to a milk drink here (almond only). */
  milk: number;
  /** Prices the company asked to change, not yet applied. */
  pendingPrices?: Record<string, number>;
  provisional?: boolean;
};

const item = (
  partial: Omit<MenuItem, "vegan" | "nuts" | "extra" | "price"> & Partial<Pick<MenuItem, "vegan" | "nuts" | "extra">> & { price?: number },
): MenuItem => ({ vegan: false, nuts: false, extra: false, price: 0, ...partial });

/** Pieces that only the corners serve. Each corner sets the price in `items`. */
export const CORNER_ITEMS: readonly MenuItem[] = [
  item({ id: "ctr-fil-pazlibre-1", name: "Filtrado PAZ o LIBRE · 1 taza", category: "filter", description: "Una taza. Blend balanceado o intenso y afrutado.", vegan: true }),
  item({ id: "ctr-fil-pazlibre-2", name: "Filtrado PAZ o LIBRE · 2 tazas", category: "filter", description: "Dos tazas, para compartir.", vegan: true }),
  item({ id: "ctr-fil-pazlibre-3", name: "Filtrado PAZ o LIBRE · 3 tazas", category: "filter", description: "Tres tazas, para la mesa.", vegan: true }),
  item({ id: "ctr-fil-rock-1", name: "Filtrado ROCK · 1 taza", category: "filter", description: "Single origin rebelde.", vegan: true }),
  item({ id: "ctr-fil-rock-2", name: "Filtrado ROCK · 2 tazas", category: "filter", description: "Single origin rebelde, para compartir.", vegan: true }),
  item({ id: "ctr-fil-rock-3", name: "Filtrado ROCK · 3 tazas", category: "filter", description: "Single origin rebelde, para la mesa.", vegan: true }),
  item({ id: "ctr-fil-punk-1", name: "Filtrado PUNK · 1 taza", category: "filter", description: "Single origin extravagante.", vegan: true }),
  item({ id: "ctr-fil-punk-2", name: "Filtrado PUNK · 2 tazas", category: "filter", description: "Single origin extravagante, para compartir.", vegan: true }),
  item({ id: "ctr-fil-punk-3", name: "Filtrado PUNK · 3 tazas", category: "filter", description: "Single origin extravagante, para la mesa.", vegan: true }),
  item({ id: "ctr-matcha-frio", name: "Matcha latte frío", category: "matcha", description: "Matcha y leche, con hielo. 12 oz." }),
  item({ id: "ctr-palito-yuca", name: "Palito de yuca", category: "bakery", description: "Palito de yuca, sin gluten." }),
  item({ id: "ctr-pastel-pollo", name: "Pastel de pollo campesino", category: "bakery", description: "Pastel de pollo de la casa." }),
  item({ id: "ctr-galleta", name: "Galleta de la casa", category: "cookies", description: "Galleta artesanal del día." }),
  item({ id: "ctr-san-quesos", name: "Sándwich de quesos", category: "sandwiches", description: "Pan de la casa con mezcla de quesos." }),
  item({ id: "ctr-san-serrano", name: "Sándwich jamón serrano", category: "sandwiches", description: "Pan de la casa con jamón serrano." }),
  item({ id: "ctr-kit-lovers", name: "Kit Coffee Lovers", category: "coffee", description: "Las bolsas de la casa, en kit.", image: "/products/kit-coffee-lovers.png" }),
  item({ id: "ctr-drip-lovers", name: "Drip Coffee Lovers", category: "coffee", description: "Kit de drips de la casa.", image: "/products/drip-rock-1.png" }),
  item({ id: "ctr-drip-rosado", name: "Drip Coffee x5 · Bourbon Rosado", category: "coffee", description: "Cinco drips de Bourbon Rosado.", image: "/products/drip-rock-1.png" }),
  item({ id: "ctr-drip-libre", name: "Drip Coffee x5 · LIBRE", category: "coffee", description: "Cinco drips de LIBRE.", image: "/products/drip-libre.png" }),
  item({ id: "ctr-drip-paz", name: "Drip Coffee x5 · PAZ", category: "coffee", description: "Cinco drips de PAZ.", image: "/products/drip-libre.png" }),
  item({ id: "ctr-caps-paz", name: "Cápsulas PAZ x10", category: "coffee", description: "Diez cápsulas de PAZ.", image: "/products/capsulas-paz-1.png" }),
  item({ id: "ctr-caps-libre", name: "Cápsulas LIBRE x10", category: "coffee", description: "Diez cápsulas de LIBRE.", image: "/products/capsulas-libre.png" }),
];

/** The bar menu, in the order a corner reads it. */
const ORDER = ["espresso", "filter", "cold-brew", "matcha", "other-drinks", "bakery", "cakes", "cookies", "sandwiches", "parfait", "coffee", "extras"];

const ESPRESSO_SURA = { "esp-blend": 7200, "ame-blend": 8300, "cap-blend": 11900, "lat-blend": 11900, "mac-blend": 8500, "moc-blend": 11900, "fw-blend": 10500, "iced-cap": 11900, "iced-lat": 12900, "cb-lata": 12800, "add-vegetal": 4000 };
const ESPRESSO_MELI = { "esp-blend": 6900, "ame-blend": 8000, "cap-blend": 8100, "lat-blend": 8100, "mac-blend": 7500, "moc-blend": 10700, "fw-blend": 9800, "iced-cap": 12200, "iced-lat": 12200, "cb-lata": 11000, "add-vegetal": 2000 };
const FILTER_MELI = { "ctr-fil-pazlibre-1": 9100, "ctr-fil-pazlibre-2": 16100, "ctr-fil-pazlibre-3": 25500, "ctr-fil-rock-1": 10900, "ctr-fil-rock-2": 19800, "ctr-fil-rock-3": 26200, "ctr-fil-punk-1": 11300, "ctr-fil-punk-2": 20900, "ctr-fil-punk-3": 31300 };
const BAGS_MELI = { "paz-200": 27500, "paz-340": 37500, "paz-454": 51800, "libre-200": 30000, "libre-340": 47300, "libre-454": 55500, "rock-200": 43700, "rock-340": 55300, "rock-454": 82200, "impacto-340": 59500, "punk-340": 70800, "ctr-kit-lovers": 101000, "cb-pack": 31300 };
const DRINKS_MELI = { "matcha-latte": 14000, "ctr-matcha-frio": 14800, "dirty-matcha": 14300, "matcha-spritz": 14000, chai: 11000, "chai-carbon": 11000, "chai-choc": 11000, "chai-golden": 11000, "soda-rojos": 12000, "soda-maracuya": 12000, chocolate: 9800, jugo: 9000 };
const FOOD_MELI = { pandebono: 10900, arepa: 6700, croix: 7900, "croix-almendra": 11800, "ctr-palito-yuca": 8500, "ctr-pastel-pollo": 11000, brownie: 8800, zanahoria: 12500, volcan: 12500, "ctr-galleta": 8800, "ctr-san-quesos": 20500, "ctr-san-serrano": 23800, "par-rojos": 11500 };

export const CORNERS: readonly Corner[] = [
  {
    id: "sura",
    name: "Sura",
    company: "Seguros Sura",
    cityId: "bogota",
    milk: 4000,
    items: {
      ...ESPRESSO_SURA,
      "paz-200": 32800, "libre-200": 35400, "rock-200": 51400, "impacto-340": 70000, "punk-340": 83200,
      arepa: 7800, croix: 9200, "croix-almendra": 13800, "ctr-palito-yuca": 8900, palito: 8900, brownie: 8800, zanahoria: 12500, almojabana: 14300, volcan: 12500, "ctr-galleta": 8800, "ctr-pastel-pollo": 11000,
      "matcha-latte": 15500, "ctr-matcha-frio": 15500, "dirty-matcha": 16800, chai: 12200, "chai-carbon": 12200, "chai-choc": 12200, "chai-golden": 12200, "inf-rojos": 11200, "inf-amarillos": 11200, "soda-rojos": 12000, "soda-maracuya": 12000, chocolate: 11800, jugo: 10800,
    },
  },
  {
    id: "meli",
    name: "Mercado Libre",
    company: "Mercado Libre",
    cityId: "bogota",
    milk: 2000,
    items: { ...ESPRESSO_MELI, ...FILTER_MELI, ...BAGS_MELI, ...DRINKS_MELI, ...FOOD_MELI, palito: 8200, "almo-sin": 14300, "inf-amarillos": 9000 },
    // The company asked for these; operations has not approved them yet.
    pendingPrices: { "ame-blend": 7500, "mac-blend": 7000, "fw-blend": 9000, chocolate: 9000, "matcha-latte": 11500, "inf-amarillos": 8500, "iced-lat": 11500, "soda-rojos": 10200, "soda-maracuya": 10200, jugo: 8400, croix: 6500, "ctr-pastel-pollo": 8100, brownie: 6500, "ctr-galleta": 5500 },
  },
  {
    id: "bavaria",
    name: "Bavaria",
    company: "Bavaria",
    cityId: "bogota",
    milk: 2000,
    items: {
      ...ESPRESSO_MELI, ...FILTER_MELI, ...BAGS_MELI, ...DRINKS_MELI, ...FOOD_MELI,
      palito: 8200, almojabana: 14300, "inf-rojos": 9000, "inf-amarillos": 9000,
      "ctr-drip-lovers": 75300, "ctr-drip-rosado": 29400, "ctr-drip-libre": 27500, "ctr-drip-paz": 24000, "ctr-caps-paz": 29800, "ctr-caps-libre": 31500,
    },
  },
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

/** Milk drinks say what the plant-based milk costs here, and that everything is PAZ. */
function cornerText(description: string, milk: number): string {
  const cop = `$${milk.toLocaleString("es-CO")}`;
  const usd = `$${milk.toLocaleString("en-US")}`;
  return description
    .replace(/Vegetal de almendra o avena, \+\$4\.000\./, `Vegetal de almendra, +${cop}.`)
    .replace(/Almond or oat milk, \+\$4,000\./, `Almond milk, +${usd}.`)
    .replace(/Perfil de la casa\./, "Perfil PAZ.")
    .replace(/The house profile\./, "PAZ profile.");
}

/** The corner's menu: its items at its prices, in bar order, from the city catalog plus the corner-only pieces. */
export function cornerCatalog(catalog: Catalog, corner: Corner, cornerItems: readonly MenuItem[] = CORNER_ITEMS): Catalog {
  const pool = new Map<string, MenuItem>();
  for (const entry of catalog.items) pool.set(entry.id, entry);
  for (const entry of cornerItems) if (!pool.has(entry.id)) pool.set(entry.id, entry);
  const items: MenuItem[] = [];
  for (const [id, price] of Object.entries(corner.items)) {
    const base = pool.get(id);
    if (!base) continue;
    items.push({ ...base, price, description: cornerText(base.description, corner.milk) });
  }
  const rank = new Map(ORDER.map((id, index) => [id, index]));
  items.sort((a, b) => (rank.get(a.category) ?? 99) - (rank.get(b.category) ?? 99));
  const present = new Set(items.map((entry) => entry.category));
  const categories = catalog.categories
    .filter((category) => present.has(category.id))
    .sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99));
  return { city: catalog.city, categories, items };
}
