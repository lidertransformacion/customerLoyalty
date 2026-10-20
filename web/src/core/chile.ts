import type { Category, MenuItem } from "@/src/data/menu";

import { registerCatalog, registerTranslations } from "./catalog";
import { CHILE_CHAPTERS, CHILE_SOURCE, focusKey, type ChileSource } from "./chile-data";

/**
 * Santiago, from the printed Chile menu. Same book as Colombia; its own
 * products, prices (Chilean pesos), photographs and pairings.
 * Each size or blend of a product is its own line, as in the Colombian menu.
 */
const PAIRING_EN: [RegExp, string][] = [
  [/FILTRADO (\w+)/g, "$1 filter"],
  [/COLD BREW DE INVIERNO/g, "winter cold brew"],
  [/ESPRESSO NARANJA/g, "orange espresso"],
  [/ con la de dulce de leche y nuez/g, " with the dulce de leche and walnut"],
  [/ con la de limón/g, " with the lemon"],
  [/ con la de chocolate/g, " with the chocolate"],
];

const pairingEn = (pairing: string) => PAIRING_EN.reduce((text, [pattern, value]) => text.replace(pattern, value), pairing);

const LABEL_EN: Record<string, string> = { "1 taza": "1 cup", "2 tazas": "2 cups", "3 tazas": "3 cups" };

type Line = { id: string; name: string; nameEn: string };

function linesOf(source: ChileSource): { line: Line; price: number }[] {
  const base = `cl-${source.id}`;
  return source.prices.map((price, index) => {
    const label = price.label;
    if (!label || source.prices.length === 1) return { line: { id: base, name: source.name, nameEn: source.en[0] }, price: price.value };
    if (label === "Signature Blends") return { line: { id: base, name: source.name, nameEn: source.en[0] }, price: price.value };
    if (label === "Single Origin") return { line: { id: `${base}-so`, name: `${source.name} single origin`, nameEn: `${source.en[0]} single origin` }, price: price.value };
    const suffix = label.replace(/\D+/g, "") || String(index);
    return { line: { id: `${base}-${suffix}`, name: `${source.name} · ${label}`, nameEn: `${source.en[0]} · ${LABEL_EN[label] ?? label}` }, price: price.value };
  });
}

const categories: Category[] = CHILE_CHAPTERS.map((chapter) => ({ id: chapter.id, name: chapter.name, photo: chapter.photo, intro: chapter.intro }));

const items: MenuItem[] = [];
/** The first line (size or blend) of each printed product, by its id in chile-data. */
export const FIRST_LINE: Record<string, string> = {};
/** Every line (size or blend) of each printed product. */
export const LINES_OF: Record<string, string[]> = {};
const itemsEn: Record<string, { name: string; description: string }> = {};
for (const source of CHILE_SOURCE) {
  const photo = source.photo ?? (source.focus ? focusKey(source.focus) : undefined);
  for (const { line, price } of linesOf(source)) {
    FIRST_LINE[source.id] ??= line.id;
    (LINES_OF[source.id] ??= []).push(line.id);
    const description = `${source.description ?? ""}${source.pairing ? ` Maridaje: ${source.pairing}.` : ""}`.trim();
    items.push({
      id: line.id,
      name: line.name,
      category: source.category,
      price,
      description,
      ...(source.profile ? { profile: source.profile } : {}),
      ...(photo ? { photo } : {}),
      vegan: source.vegan ?? false,
      nuts: source.nuts ?? false,
      extra: false,
    });
    itemsEn[line.id] = { name: line.nameEn, description: `${source.en[1] ?? ""}${source.pairing ? ` Pairing: ${pairingEn(source.pairing)}.` : ""}`.trim() };
  }
}

export const CHILE_CATEGORIES = categories;
export const CHILE_ITEMS = items;

registerCatalog("santiago", { categories, items });
registerTranslations(
  Object.fromEntries(CHILE_CHAPTERS.map((chapter) => [chapter.id, { name: chapter.en[0], intro: chapter.en[1] }])),
  itemsEn,
);
