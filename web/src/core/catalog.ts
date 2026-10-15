import { categories as baseCategories, items as baseItems, type Category, type MenuItem } from "@/src/data/menu";
import { fold } from "@/src/format";

/**
 * The catalog a guest sees. Each city prints its own menu: Bogotá and
 * Medellín share one, Cartagena has another. A city catalog is the base
 * (Bogotá) with price and availability overrides; what is not overridden
 * is the same product at the same price.
 */
export type CityId = "bogota" | "medellin" | "cartagena";

export type City = { id: CityId; name: string; market: "CO" | "CL" };

export const CITIES: readonly City[] = [
  { id: "bogota", name: "Bogotá", market: "CO" },
  { id: "medellin", name: "Medellín", market: "CO" },
  { id: "cartagena", name: "Cartagena", market: "CO" },
];

export type CityOverride = {
  /** Items that are not served in this city. */
  hidden?: string[];
  /** Price in this city when it differs from the base. */
  prices?: Record<string, number>;
  /** Items that only this city serves. */
  extraItems?: MenuItem[];
  /** Categories that only this city serves. */
  extraCategories?: Category[];
};

export type Catalog = { city: City; categories: Category[]; items: MenuItem[] };

const OVERRIDES: Partial<Record<CityId, CityOverride>> = {};

export function registerCity(id: CityId, override: CityOverride): void {
  OVERRIDES[id] = override;
}

export function cityById(id: string | null | undefined): City {
  return CITIES.find((city) => city.id === id) ?? CITIES[0]!;
}

export function catalogFor(cityId: CityId): Catalog {
  const city = cityById(cityId);
  const override = OVERRIDES[cityId];
  if (!override) return { city, categories: baseCategories, items: baseItems };
  const hidden = new Set(override.hidden ?? []);
  const items = baseItems
    .filter((item) => !hidden.has(item.id))
    .map((item) => {
      const price = override.prices?.[item.id];
      return price !== undefined ? { ...item, price } : item;
    })
    .concat(override.extraItems ?? []);
  const categories = baseCategories.concat(override.extraCategories ?? []);
  return { city, categories, items };
}

export type MenuFilter = {
  text: string;
  category: string | null;
  ceiling: number | null;
  plant: boolean;
  noNuts: boolean;
};

export function filterCatalog(catalog: Catalog, filter: MenuFilter): MenuItem[] {
  const text = fold(filter.text.trim());
  return catalog.items.filter((item) => {
    if (item.extra) return false;
    if (filter.category && item.category !== filter.category) return false;
    if (filter.ceiling !== null && item.price > filter.ceiling) return false;
    if (filter.plant && !item.vegan) return false;
    if (filter.noNuts && item.nuts) return false;
    if (!text) return true;
    const chapter = catalog.categories.find((c) => c.id === item.category)?.name ?? "";
    return fold(item.name).includes(text) || fold(item.description).includes(text) || fold(chapter).includes(text);
  });
}

export function itemIn(catalog: Catalog, id: string): MenuItem | undefined {
  return catalog.items.find((item) => item.id === id);
}
