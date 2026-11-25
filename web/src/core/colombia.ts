import type { Category, MenuItem } from "@/src/data/menu";
import { fold } from "@/src/format";

import { CATEGORIES_EN, ITEMS_EN } from "../i18n/menu-en";
import type { Catalog, CityId } from "./catalog";
import { catalogFor, registerCatalog, registerTranslations } from "./catalog";
import "./cities";
import type { PhotoSpec } from "../motion/living-photo";
import { CHILE_COVERS } from "./chile-covers";
import { CO_COVERS } from "./colombia-covers";
import { CO_CHAPTERS, CO_PRODUCTS } from "./colombia-menu";
import { baseName } from "./lines";

/** The slugs of the Colombian studio set this menu uses (scripts/colombia-studio.py publishes exactly these). */
export const usedStudio = (): string[] => [...new Set(Object.values(CO_STUDIO))];

/**
 * The Colombian menu in the Chile layout: Bogotá and Medellín share the
 * printed Bogotá–Medellín menu, Cartagena prints its own prices and dishes
 * (`cities.ts`). Prices stay the Colombian ones, in pesos.
 *
 * Each chapter gets a `co-` id; `chileKey()` maps it to the Chile chapter
 * that serves the same thing, so the layout reuses its tint, its cover and
 * its search intents. Each size or blend is its own line, named like the
 * Chile lines ("Filtrado PAZ · 8 oz"), and the lines of one product share a
 * group, so a chapter lists products and each says how many options it has.
 */
export const CO_CITIES: readonly CityId[] = ["bogota", "medellin", "cartagena"];

/** The Chile chapter each Colombian chapter matches; a chapter not listed has no Chile twin. */
const CHAPTER: Record<string, string> = {
  coffee: "co-coffee",
  "cold-brew": "co-cold",
  filter: "co-filter",
  espresso: "co-espresso",
  signature: "co-signature",
  matcha: "co-matcha",
  "other-drinks": "co-other",
  eggs: "co-eggs",
  parfait: "co-parfait",
  toast: "co-toast",
  bakery: "co-bakery",
  sandwiches: "co-sandwiches",
  bowls: "co-bowls",
  cakes: "co-cakes",
  cookies: "co-cookies",
  cocktails: "co-cocktails",
  extras: "co-extras",
};

const chapterOf = (id: string) => CHAPTER[id] ?? `co-${id}`;

/** The Chile chapter a Colombian one stands for (its tint, its search intents); any other id comes back as it is. */
export function chileKey(chapterId: string): string {
  return chapterId.startsWith("co-") ? `cl-${chapterId.slice(3)}` : chapterId;
}

/**
 * Chapters whose Chile cover shows a product Colombia also serves. The others
 * (eggs, toasts, bowls, sandwiches, cakes, parfaits, bakery…) are other dishes here: they open
 * with their own first product instead.
 */
const SHARED_COVERS = new Set(["co-filter", "co-espresso", "co-matcha", "co-other", "co-extras"]);

/** The cover of a chapter: the Colombian cut when it has one, else the Chile cover it shares, else none. */
export function coverOf(chapterId: string): PhotoSpec | undefined {
  return LENT_COVERS[chapterId] ?? CO_COVERS[chapterId] ?? CHILE_COVERS[coverKey(chapterId)];
}

/** Covers of the chapters of another menu built on this one (the Sura corner), by chapter id: a Colombian cover by its chapter, or a photograph of its own. */
const LENT_COVERS: Record<string, PhotoSpec> = {};
export function lendCover(chapterId: string, from: string | PhotoSpec): void {
  const cover = typeof from === "string" ? CO_COVERS[from] : from;
  if (cover) LENT_COVERS[chapterId] = cover;
}

export function coverKey(chapterId: string): string {
  return chapterId.startsWith("co-") ? (SHARED_COVERS.has(chapterId) ? chileKey(chapterId) : "") : chapterId;
}

/**
 * The Chile studio photograph of the same product, by its name here. Only
 * products that are the same drink or the same plate: a Colombian dish that
 * only shares a name with a Chilean one keeps its chapter photograph.
 */
const STUDIO: Record<string, string> = {
  paz: "cl-p-paz",
  libre: "cl-p-libre",
  rock: "cl-p-rock",
  punk: "cl-p-punk",
  "filtrado paz": "cl-p-filtrado-paz",
  "filtrado libre": "cl-p-filtrado-libre",
  "filtrado rock": "cl-p-filtrado-rock",
  "filtrado punk": "cl-p-filtrado-punk",
  "filtrado decaf": "cl-p-filtrado-paz",
  "filtrado impacto": "cl-p-filtrado-libre",
  "filtrado competition": "cl-p-filtrado-rock",
  espresso: "cl-p-espresso",
  americano: "cl-p-americano",
  macchiato: "cl-p-macchiato",
  latte: "cl-p-latte",
  cappuccino: "cl-p-cappuccino",
  mocaccino: "cl-p-mocaccino",
  "flat white": "cl-p-flat-white",
  "iced cappuccino": "cl-p-iced-cappuccino",
  "iced latte": "cl-p-iced-latte",
  affogato: "cl-p-affogato",
  "cold brew en copa": "cl-p-cold-brew",
  "dirty matcha": "cl-p-dirty-matcha",
  "strawberry matcha": "cl-p-matcha-berry",
  "matcha lemon spritz": "cl-p-matcha-lemon-spritz",
  "matcha latte": "cl-p-matcha",
  "chai tradicional": "cl-p-chai",
  "chai golden milk": "cl-p-golden-milk",
  "soda frutos rojos": "cl-p-soda-frutos-rojos",
  "soda maracuya": "cl-p-soda-maracuya-y-mango",
  "infusion frutos rojos": "cl-p-infusion-de-frutos-rojos",
  chocolate: "cl-p-chocolate",
  babyccino: "cl-p-babyccino",
  "bowl de granola": "cl-p-granola",
  "waffle de avena": "cl-p-waffle-de-frutas",
  brownie: "cl-p-brownie",
  "volcan de chocolate": "cl-p-volcan-de-chocolate",
};

/**
 * The Colombian studio photograph of each product, by its name here: the
 * November 2026 set (Drive folder «menu Colombia», with `menu-colombia.csv`),
 * published at /menu/co/co-p-<slug>.webp. It comes before the Chile one; a
 * product with no photograph in that set keeps what it had.
 */
const CO_STUDIO: Record<string, string> = {
  paz: "paz",
  libre: "libre",
  impacto: "impacto",
  rock: "rock",
  punk: "punk",
  "filtrado paz": "filtrado-paz",
  "filtrado libre": "filtrado-libre",
  "filtrado impacto": "filtrado-impacto",
  "filtrado rock": "filtrado-rock",
  "filtrado punk": "filtrado-punk",
  espresso: "espresso",
  americano: "americano",
  macchiato: "macchiato",
  latte: "latte",
  cappuccino: "cappuccino",
  mocaccino: "mocaccino",
  "flat white": "flat-white",
  "iced cappuccino": "iced-cappuccino",
  "iced latte": "iced-latte",
  affogato: "affogato",
  "dirty matcha": "dirty-matcha",
  "matcha lemon spritz": "matcha-lemon-spritz",
  "matcha latte": "matcha-latte",
  "chai tradicional": "chai-tradicional",
  "chai golden milk": "golden-milk",
  "soda frutos rojos": "soda-frutos-rojos",
  "infusion frutos rojos": "infusion-de-frutos-rojos",
  chocolate: "chocolate",
  babyccino: "babyccino",
  "huevos gratinados": "huevos-gratinados",
  "huevos tomatillo verde": "huevos-tomatillos-verdes",
  "huevos turcos": "huevos-turcos",
  "huevos al gusto": "huevos-al-gusto",
  "parfait frutos rojos": "parfait-de-frutos-rojos",
  "parfait frutos amarillos": "parfait-de-frutos-amarillos",
  "chia pudding": "chia-pudding",
  "bowl de granola": "bowl-de-granola",
  "waffle de avena": "waffle-de-avena",
  "tostadas francesas": "french-toast",
  "tostada caprese": "tostada-caprese",
  "tostada de aguacate": "tostada-aguacate",
  "tostada jamon serrano": "tostada-jamon-serrano",
  "tostada de salmon": "tostada-salmon",
  "mini pandebonos x5": "mini-pandebonos",
  "palito de queso": "palito-de-queso",
  "croissant sencillo": "croissant-sencillo",
  "croissant de almendra": "croissant-almendra",
  "croissant de pistacho": "croissant-pistacho",
  "croissant de avellanas": "croissant-crema-de-avellanas",
  "sandwich de croissant": "sandwich-de-croissant",
  "sandwich jamon serrano": "sandwich-jamon-serrano",
  "sandwich de quesos": "sandwich-quesos",
  "sandwich de pollo": "sandwich-pollo",
  "bowl jamon serrano": "bowl-jamon-serrano",
  "bowl de salmon": "bowl-salmon",
  "bowl vegetariano": "bowl-vegetariano",
  "bowl de pollo": "bowl-pollo",
  "volcan de chocolate": "volcan-de-chocolate",
  "torta de almojabana": "torta-de-almojabana",
  "torta de zanahoria": "torta-de-zanahoria",
  brownie: "brownie",
  "cheesecake de arequipe": "cheesecake-de-arequipe",
  "cheesecake de agraz": "cheesecake-de-agraz",
  "almojabana sin azucar": "torta-de-almojabana-sin-azucar",
  "galleta chips de chocolate": "galleta-chips-de-chocolate",
  "zumo de limon": "adicion-zumo-de-limon",
  burrata: "adicion-burrata",
  "pan de masa madre": "adicion-pan-de-masa-madre",
  "pan focaccia": "adicion-pan-focaccia",
  aguacate: "adicion-aguacate",
  "jamon serrano extra": "adicion-jamon-serrano",
  "pollo extra": "adicion-pollo",
  "salmon extra": "adicion-salmon",
};

/** What the index and the search show first: the strongest photographs, by group id. */
export const CO_RECOMMENDED: string[] = [
  "co-cappuccino",
  "co-matcha-bloom",
  "co-pistacho-crush",
  "co-filtrado-paz",
  "co-huevos-turcos",
  "co-tostada-salmon",
  "co-iced-latte",
  "co-berry-cloud",
  "co-sandwich-pollo",
  "co-parfait-de-frutos-rojos",
  "co-croissant-almendra",
  "co-soda-frutos-rojos",
];

const slug = (text: string) => fold(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A line's name in the Chile form: the product, then its size after " · ". Blends keep the product's name; single origin says so. */
function lineName(name: string): string {
  const base = baseName(name);
  const rest = name.slice(base.length).trim();
  if (!rest || /^blend$/i.test(rest)) return base;
  if (/^single origin$/i.test(rest)) return `${base} single origin`;
  return `${base} · ${rest}`;
}

/** What the print says under a coffee profile, by line id: its trait and whether it is a blend or a single origin. */
const KIND_OF: Record<string, { trait: string; origin: string }> = {};
export function kindOf(itemId: string): { trait: string; origin: string } | undefined {
  return KIND_OF[itemId];
}

/** Group of every line, by item id: computed on the Spanish names so a favourite survives a change of language. */
const GROUP_OF: Record<string, string> = {};

function colombian(cityId: CityId): { categories: Category[]; items: MenuItem[] } {
  const source = catalogFor(cityId);
  const items = source.items.map((item): MenuItem => {
    const base = baseName(item.name);
    GROUP_OF[item.id] = `co-${slug(base)}`;
    const own = CO_STUDIO[fold(base)];
    const studio = own ? `co-p-${own}` : STUDIO[fold(base)];
    return { ...item, name: lineName(item.name), category: chapterOf(item.category), ...(studio ? { studio } : {}) };
  });
  const categories = source.categories.map((category) => ({ ...category, id: chapterOf(category.id) }));
  return { categories, items };
}

/**
 * Bogotá and Medellín: the new Colombian menu (colombia-menu.ts, printed 29-oct-2026), one line per size or
 * blend, named like the Chile lines. Its own studio photograph when the November 2026 set has one.
 */
function newMenu(): { categories: Category[]; items: MenuItem[]; en: Record<string, { name: string; description: string }> } {
  const items: MenuItem[] = [];
  const en: Record<string, { name: string; description: string }> = {};
  for (const product of CO_PRODUCTS) {
    const group = `co-${product.id}`;
    const pairing = product.pairing ? ` Maridaje: ${product.pairing}.` : "";
    const pairingEn = product.pairing ? ` Pairing: ${product.pairing.toLowerCase()}.` : "";
    product.lines.forEach((line, index) => {
      const label = line.label;
      // a lone size keeps its label («IMPACTO · 340 g»): the print says which bag the price is for
      const single = !label || label === "Signature Blend";
      const origin = label === "Single Origin";
      const id = single || product.lines.length === 1 ? group : origin ? `${group}-so` : `${group}-${slug(label!) || index}`;
      const name = single ? product.name : origin ? `${product.name} single origin` : `${product.name} · ${label}`;
      const nameEn = single ? product.nameEn : origin ? `${product.nameEn} single origin` : `${product.nameEn} · ${line.labelEn ?? label}`;
      GROUP_OF[id] = group;
      if (product.trait && product.origin) KIND_OF[id] = { trait: product.trait, origin: product.origin };
      items.push({
        id,
        name,
        category: product.chapter,
        price: line.price,
        description: `${product.description}${pairing}`.trim(),
        ...(product.profile ? { profile: product.profile } : {}),
        ...(product.photo ? { studio: `co-p-${product.photo}` } : {}),
        vegan: false,
        nuts: product.nuts,
        extra: product.chapter === "co-extras",
      });
      en[id] = { name: nameEn, description: `${product.descriptionEn || product.description}${pairingEn}`.trim() };
    });
  }
  const categories = CO_CHAPTERS.map((chapter) => ({ id: chapter.id, name: chapter.name, intro: chapter.intro, photo: "" }));
  return { categories, items, en };
}

/**
 * Every Colombian city serves the new menu and only its products (Santiago, 24-nov-2026: «deja solo los que
 * están en esa nueva carta»). Cartagena's older printed menu (cities.ts) is no longer served.
 */
export const NEW_MENU_CITIES: readonly CityId[] = ["bogota", "medellin", "cartagena"];

{
  const fresh = newMenu();
  for (const city of NEW_MENU_CITIES) registerCatalog(city, { categories: fresh.categories, items: fresh.items });

  const categories: Record<string, { name: string; intro: string }> = {};
  for (const [id, text] of Object.entries(CATEGORIES_EN)) categories[chapterOf(id)] = text;
  for (const chapter of CO_CHAPTERS) categories[chapter.id] = { name: chapter.en[0], intro: chapter.en[1] };
  const items: Record<string, { name: string; description: string }> = {};
  for (const [id, text] of Object.entries(ITEMS_EN)) items[id] = { ...text, name: lineName(text.name) };
  Object.assign(items, fresh.en);
  registerTranslations(categories, items);
}

export type ColombiaGroup = { id: string; chapterId: string; lines: MenuItem[] };

/** The products of a Colombian chapter, in the menu's order, each with its lines from the catalog given (translated or not). */
export function colombiaGroups(catalog: Catalog, chapterId: string): ColombiaGroup[] {
  const groups: ColombiaGroup[] = [];
  const byId = new Map<string, ColombiaGroup>();
  for (const item of catalog.items) {
    if (item.category !== chapterId) continue;
    const id = GROUP_OF[item.id] ?? `co-${slug(baseName(item.name))}`;
    let group = byId.get(id);
    if (!group) {
      group = { id, chapterId, lines: [] };
      byId.set(id, group);
      groups.push(group);
    }
    group.lines.push(item);
  }
  return groups;
}
