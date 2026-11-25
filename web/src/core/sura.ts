import type { Category, MenuItem } from "@/src/data/menu";

import { registerCatalog, registerTranslations } from "./catalog";
import { lendCover } from "./colombia";
import { SURA_COVERS } from "./sura-studio";

/**
 * The Sura menu: the Colombian menu's layout with what Libertario serves at Sura under their
 * agreement, which the company subsidises. Everything is a combo at one price; some let the
 * guest choose (a drink, a side, how the eggs come). A guest picks, writes their ID number and
 * sends; the order lands in a Google Sheet the bar reads (web/sura/Code.gs).
 *
 * To add or change what is served, edit `SURA_COMBOS` (and the «productos» tab of the sheet, by
 * the same ids). Photographs: Sura's own, from the Drive folder «Menú Sura» (scripts/sura-studio.py).
 */
export type SuraOption = { id: string; name: string; nameEn: string; photo: string };
export type SuraChoice = { id: string; title: string; titleEn: string; options: SuraOption[] };
export type SuraCombo = {
  id: string;
  chapter: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  /** What Sura pays, VAT included. The guest never sees it; it travels with the order. */
  price: number;
  photo: string;
  choices: SuraChoice[];
  /** What the bar calls it on the ticket, when it is not the card's name («Refrigerio» for «Galleta»). */
  kitchenName?: string;
  /** What always comes in it, for the bar's list. What the guest chooses is added after. */
  includes: string[];
};

const AMERICANO: SuraOption = { id: "americano", name: "Americano", nameEn: "Americano", photo: "su-p-americano" };
const INFUSION: SuraOption = { id: "infusion", name: "Infusión", nameEn: "Infusion", photo: "su-p-infusion" };
const LATTE: SuraOption = { id: "latte", name: "Latte", nameEn: "Latte", photo: "su-p-latte" };
const JUICE: SuraOption = { id: "jugo", name: "Jugo de naranja", nameEn: "Orange juice", photo: "su-p-jugo" };

const DRINK_FULL: SuraChoice = { id: "bebida", title: "Elige tu bebida", titleEn: "Choose your drink", options: [AMERICANO, LATTE, INFUSION, JUICE] };

export const SURA_CHAPTERS: { id: string; name: string; intro: string; en: [string, string] }[] = [
  { id: "co-su-refrigerios", name: "Refrigerios", intro: "Elige qué comer; la bebida va incluida.", en: ["Snacks", "Choose what to eat; the drink is included."] },
  { id: "co-su-desayunos", name: "Desayunos", intro: "Elige tu desayuno.", en: ["Breakfasts", "Choose your breakfast."] },
];

/** The drinks a refrigerio comes with. */
const DRINK_SNACK: SuraChoice = {
  id: "bebida",
  title: "Elige tu bebida",
  titleEn: "Choose your drink",
  options: [AMERICANO, INFUSION, { id: "latte-deslactosado", name: "Latte Paz deslactosado", nameEn: "Lactose-free Paz latte", photo: "su-p-latte-deslactosado" }],
};

/**
 * A refrigerio is a side and a drink at one price. The menu shows the sides, each as its own card, so the
 * guest sees the food; the drink is asked when one is added.
 */
function refrigerio(id: string, name: string, nameEn: string, photo: string): SuraCombo {
  return {
    id: `su-refrigerio-${id}`,
    chapter: "co-su-refrigerios",
    name,
    nameEn,
    description: `Refrigerio: ${name.toLowerCase()} con la bebida que elijas.`,
    descriptionEn: `Snack: ${nameEn.toLowerCase()} with the drink you choose.`,
    price: 12000,
    photo,
    choices: [DRINK_SNACK],
    kitchenName: "Refrigerio",
    includes: [name],
  };
}

// Each chapter opens with a photograph that stands on the sheet without a ground: Sura's own with its white
// turned transparent.
lendCover("co-su-refrigerios", SURA_COVERS["su-cover-portada-refrigerios"]!);
lendCover("co-su-desayunos", SURA_COVERS["su-cover-portada-completos"]!);

export const SURA_COMBOS: readonly SuraCombo[] = [
  refrigerio("galleta", "Galleta", "Cookie", "su-p-galleta"),
  refrigerio("arepa", "Arepa de queso", "Cheese arepa", "su-p-arepa"),
  refrigerio("pandeyuca", "Pan de yuca × 2", "Pan de yuca × 2", "su-p-pandeyuca"),
  {
    id: "su-ejecutivo",
    chapter: "co-su-desayunos",
    name: "Desayuno ejecutivo",
    nameEn: "Executive breakfast",
    description: "Sándwich de jamón serrano y jugo de naranja.",
    descriptionEn: "Serrano ham sandwich and orange juice.",
    price: 25000,
    photo: "su-p-ejecutivo",
    choices: [],
    includes: ["Sándwich de jamón serrano", "Jugo de naranja"],
  },
  {
    id: "su-ejecutivo-granola",
    chapter: "co-su-desayunos",
    name: "Desayuno ejecutivo con granola",
    nameEn: "Executive breakfast with granola",
    description: "Sándwich de jamón serrano, jugo de naranja y granola.",
    descriptionEn: "Serrano ham sandwich, orange juice and granola.",
    price: 33000,
    photo: "su-p-ejecutivo-granola",
    choices: [],
    includes: ["Sándwich de jamón serrano", "Jugo de naranja", "Granola"],
  },
  {
    id: "su-completo-huevos",
    chapter: "co-su-desayunos",
    name: "Desayuno con huevos",
    nameEn: "Breakfast with eggs",
    description: "Huevos al gusto con croissant, parfait y la bebida que elijas.",
    descriptionEn: "Eggs your way with a croissant, a parfait and the drink you choose.",
    price: 28000,
    photo: "su-p-completo-huevos",
    choices: [
      DRINK_FULL,
      {
        id: "huevos",
        title: "¿Cómo quieres los huevos?",
        titleEn: "How do you want your eggs?",
        options: [
          { id: "fritos", name: "Huevos fritos", nameEn: "Fried eggs", photo: "su-p-huevos-fritos" },
          { id: "revueltos", name: "Huevos revueltos", nameEn: "Scrambled eggs", photo: "su-p-huevos-revueltos" },
        ],
      },
    ],
    includes: ["Croissant", "Parfait"],
  },
  {
    id: "su-completo-croissant",
    chapter: "co-su-desayunos",
    name: "Desayuno con sándwich de croissant",
    nameEn: "Breakfast with croissant sandwich",
    description: "Sándwich de croissant, parfait y la bebida que elijas.",
    descriptionEn: "Croissant sandwich, a parfait and the drink you choose.",
    price: 31000,
    photo: "su-p-completo-croissant",
    choices: [DRINK_FULL],
    includes: ["Sándwich de croissant", "Parfait"],
  },
];

export function comboById(id: string | null | undefined): SuraCombo | undefined {
  return SURA_COMBOS.find((combo) => combo.id === id);
}

/**
 * Where at Sura the order comes from: a service at one of the sites, each paid by one company (the «areas» tab of
 * the sheet has, by the same id, that company and its contacts). Each has its own QR, `/?area=c100-muestras`,
 * and its own menu: a service is entitled to breakfasts or to refrigerios, never both. `name` is what the bar's
 * ticket reads.
 */
export type SuraMenu = "desayunos" | "refrigerios";
export type SuraArea = { id: string; name: string; site: string; service: string; serviceEn: string; menu: SuraMenu };
export const SURA_AREAS: readonly SuraArea[] = [
  { id: "c100-ejecutivos", name: "Calle 100 · Chequeos ejecutivos", site: "Salud Sura Calle 100", service: "Chequeos ejecutivos", serviceEn: "Executive check-ups", menu: "desayunos" },
  { id: "c100-ensayos", name: "Calle 100 · Ensayos clínicos", site: "Salud Sura Calle 100", service: "Ensayos clínicos", serviceEn: "Clinical trials", menu: "desayunos" },
  { id: "c100-muestras", name: "Calle 100 · Toma de muestras", site: "Salud Sura Calle 100", service: "Toma de muestras", serviceEn: "Sample collection", menu: "refrigerios" },
  { id: "usaquen-arl", name: "Usaquén · Chequeos ARL", site: "Salud Sura Usaquén", service: "Chequeos ARL", serviceEn: "ARL check-ups", menu: "desayunos" },
  { id: "usaquen-muestras", name: "Usaquén · Toma de muestras", site: "Salud Sura Usaquén", service: "Toma de muestras", serviceEn: "Sample collection", menu: "refrigerios" },
];

/** The one chapter a service may order from. */
export function chapterOf(area: SuraArea): string {
  return area.menu === "refrigerios" ? "co-su-refrigerios" : "co-su-desayunos";
}

/** The menu a service sees: only its chapter and that chapter's combos. Without a service, the whole menu. */
export function menuFor<T extends { categories: Category[]; items: MenuItem[] }>(catalog: T, area: SuraArea | null): T {
  if (!area) return catalog;
  const chapter = chapterOf(area);
  return { ...catalog, categories: catalog.categories.filter((category) => category.id === chapter), items: catalog.items.filter((item) => item.category === chapter) };
}

/** The sites, in order, each with its services: how the order screen asks. */
export function areasBySite(): { site: string; areas: SuraArea[] }[] {
  const sites: { site: string; areas: SuraArea[] }[] = [];
  for (const area of SURA_AREAS) {
    const last = sites[sites.length - 1];
    if (last && last.site === area.site) last.areas.push(area);
    else sites.push({ site: area.site, areas: [area] });
  }
  return sites;
}

export function areaById(id: string | null | undefined): SuraArea | null {
  const wanted = (id ?? "").trim().toLowerCase();
  return SURA_AREAS.find((area) => area.id === wanted) ?? null;
}

/** An order is one combo, once: the agreement gives each person one breakfast or one refrigerio. */
export const MAX_PRODUCTS = 1;
export const MAX_QUANTITY = 1;

{
  const items: MenuItem[] = SURA_COMBOS.map((combo) => ({
    id: combo.id,
    name: combo.name,
    category: combo.chapter,
    price: combo.price,
    description: combo.description,
    studio: combo.photo,
    vegan: false,
    nuts: false,
    extra: false,
  }));
  const categories: Category[] = SURA_CHAPTERS.map((chapter) => ({ id: chapter.id, name: chapter.name, intro: chapter.intro, photo: "" }));
  registerCatalog("sura", { categories, items });
  registerTranslations(
    Object.fromEntries(SURA_CHAPTERS.map((chapter) => [chapter.id, { name: chapter.en[0], intro: chapter.en[1] }])),
    Object.fromEntries(SURA_COMBOS.map((combo) => [combo.id, { name: combo.nameEn, description: combo.descriptionEn }])),
  );
}

/** What the guest chose in a combo: choice id → option id. */
export type Picks = Record<string, string>;

/** One combo as chosen, with its units. Two refrigerios with different drinks are two lines. */
export type CartLine = { key: string; comboId: string; picks: Picks; quantity: number };
export type Cart = CartLine[];

/** Whether every choice of the combo has one of its options. */
export function picksComplete(combo: SuraCombo, picks: Picks): boolean {
  return combo.choices.every((choice) => choice.options.some((option) => option.id === picks[choice.id]));
}

export function lineKey(combo: SuraCombo, picks: Picks): string {
  return [combo.id, ...combo.choices.map((choice) => picks[choice.id] ?? "")].join("|");
}

/** Puts a combo in the order. The order holds one: choosing another replaces what was there. */
export function addToCart(_cart: Cart, combo: SuraCombo, picks: Picks): Cart {
  if (!picksComplete(combo, picks)) return _cart;
  const kept: Picks = {};
  for (const choice of combo.choices) kept[choice.id] = picks[choice.id]!;
  return [{ key: lineKey(combo, picks), comboId: combo.id, picks: kept, quantity: 1 }];
}

/** Takes a line out of the order. */
export function removeFromCart(cart: Cart, key: string): Cart {
  return cart.filter((entry) => entry.key !== key);
}

export function cartCount(cart: Cart): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function quantityOf(cart: Cart, comboId: string): number {
  return cart.reduce((sum, line) => (line.comboId === comboId ? sum + line.quantity : sum), 0);
}

/** A cart that came back from storage: one combo still served, with every choice made. */
export function cleanCart(value: unknown): Cart {
  if (!Array.isArray(value)) return [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { comboId, picks } = entry as { comboId?: unknown; picks?: unknown };
    const combo = typeof comboId === "string" ? comboById(comboId) : undefined;
    if (!combo || !picks || typeof picks !== "object") continue;
    const cart = addToCart([], combo, picks as Picks);
    if (cart.length > 0) return cart;
  }
  return [];
}

/** What goes to the bar: the combo, everything that comes in it with what was chosen (in Spanish, whatever the guest reads), units and price. The sheet lists `detail` split at « + ». */
export type OrderLine = { key: string; id: string; name: string; detail: string; quantity: number; price: number };

export function cartLines(cart: Cart): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const line of cart) {
    const combo = comboById(line.comboId);
    if (!combo) continue;
    // everything in the combo, one thing after another: what always comes, then what was chosen
    const chosen = combo.choices.map((choice) => choice.options.find((option) => option.id === line.picks[choice.id])?.name ?? "").filter(Boolean);
    const detail = [...combo.includes, ...chosen].join(" + ");
    const name = combo.kitchenName ?? combo.name;
    lines.push({ key: line.key, id: combo.id, name, detail, quantity: line.quantity, price: combo.price });
  }
  return lines;
}

export function linesTotal(lines: readonly OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

/** Only digits, at most fifteen: the longest ID number the bar sees. */
export function cleanCedula(text: string): string {
  return text.replace(/\D+/g, "").slice(0, 15);
}

export function validCedula(text: string): boolean {
  return /^\d{6,15}$/.test(text);
}

/** A name as typed, without stray spaces, at most sixty characters. */
export function cleanName(text: string): string {
  return text.replace(/\s+/g, " ").replace(/^ /, "").slice(0, 60);
}

/** At least three letters: enough for the bar to call someone. */
export function validName(text: string): boolean {
  return text.trim().length >= 3;
}

export type SuraOrder = {
  /** Made once per attempt, so a retry of the same order is not written twice. */
  clientId: string;
  nombre: string;
  cedula: string;
  area: string;
  items: { id: string; name: string; detail: string; quantity: number; price: number }[];
  total: number;
  sentAt: string;
};

export type OrderProblem = "empty" | "area" | "name" | "cedula";

/** What is still missing before the order can go, in the order the screen asks for it. */
export function orderProblem(lines: readonly OrderLine[], area: SuraArea | null, name: string, cedula: string): OrderProblem | null {
  if (lines.length === 0) return "empty";
  if (!area) return "area";
  if (!validName(name)) return "name";
  if (!validCedula(cedula)) return "cedula";
  return null;
}

export function buildOrder(lines: readonly OrderLine[], area: SuraArea, name: string, cedula: string, clientId: string, now: Date): SuraOrder {
  return {
    clientId,
    nombre: name.trim(),
    cedula,
    area: area.name,
    items: lines.map(({ id, name, detail, quantity, price }) => ({ id, name, detail, quantity, price })),
    total: linesTotal(lines),
    sentAt: now.toISOString(),
  };
}

export type Sent = { ok: true; number: number } | { ok: false };

/**
 * Posts the order to the sheet's web app. The body goes as plain text so the
 * browser sends no preflight, which an Apps Script web app cannot answer.
 */
export async function sendOrder(order: SuraOrder, url: string, post: typeof fetch): Promise<Sent> {
  if (!url) return { ok: false };
  try {
    const response = await post(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(order), redirect: "follow" });
    if (!response.ok) return { ok: false };
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "ok" in data && data.ok === true && "number" in data && typeof data.number === "number") return { ok: true, number: data.number };
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
