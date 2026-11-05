import type { MenuItem } from "@/src/data/menu";
import { fold } from "@/src/format";

import type { Group } from "./chile";

/**
 * Search over the Chile menu that understands what the guest means, not only
 * what the print says: "desayuno" finds the eggs, the parfaits and the toasts,
 * "bebidas frías" the iced coffee, the sodas and the juices, "sin café" the
 * matcha, the teas and the chocolate. Pure: words in, groups out, no network.
 */
type Intent = { words: string[]; chapters?: string[]; ids?: string[]; test?: (line: MenuItem) => boolean };

const COLD_IDS = [
  "cold-brew", "aerocano", "iced-cappuccino", "iced-latte", "affogato", "espresso-tonic", "espresso-ginger", "espresso-naranja",
  "matcha-lemon-spritz", "matcha-maracuya", "affomatcha",
  "cold-brew-invierno", "moca-menta", "hibisco", "te-de-flores",
  "soda-frutos-rojos", "soda-maracuya", "infusion-frutos-rojos", "infusion-flores",
  "jugo-naranja", "jugo-maracuya", "jugo-frutilla", "jugo-frutos-rojos", "limonada", "limonada-menta", "tonic", "ginger-beer", "kombucha",
];
const HOT_IDS = [
  "espresso", "americano", "cappuccino", "latte", "macchiato", "flat-white", "mocaccino",
  "fil-paz", "fil-libre", "fil-rock", "fil-punk", "matcha", "dirty-matcha", "matcha-berry",
  "chocolate", "chai", "babyccino", "golden-milk", "te-jazmin", "te-durazno",
];
const NO_COFFEE_IDS = [
  "paz-decaf", "matcha", "matcha-berry", "matcha-lemon-spritz", "matcha-maracuya", "affomatcha",
  "hibisco", "te-de-flores", "chocolate", "chai", "babyccino", "golden-milk", "soda-frutos-rojos", "soda-maracuya",
  "te-jazmin", "te-durazno", "infusion-frutos-rojos", "infusion-flores", "jugo-naranja", "jugo-maracuya", "jugo-frutilla", "jugo-frutos-rojos",
  "limonada", "limonada-menta", "tonic", "ginger-beer", "kombucha",
];
const MILK_IDS = ["latte", "flat-white", "cappuccino", "mocaccino", "iced-latte", "iced-cappuccino", "babyccino", "golden-milk", "chai", "matcha", "dirty-matcha", "matcha-berry", "adicion-leche-de-avena"];
const TEA_IDS = ["te-jazmin", "te-durazno", "infusion-frutos-rojos", "infusion-flores", "te-de-flores", "hibisco", "chai"];
const JUICE_IDS = ["jugo-naranja", "jugo-maracuya", "jugo-frutilla", "jugo-frutos-rojos", "limonada", "limonada-menta", "adicion-zumo-de-limon"];
const FIZZ_IDS = ["soda-frutos-rojos", "soda-maracuya", "tonic", "ginger-beer", "kombucha", "espresso-tonic", "espresso-ginger", "matcha-lemon-spritz"];
const FRUIT_IDS = ["bowl-frutas", "parfait", "waffle", "granola", "jugo-naranja", "jugo-maracuya", "jugo-frutilla", "jugo-frutos-rojos", "adicion-fruta-de-temporada", "matcha-berry", "espresso-naranja"];
const LIGHT_IDS = ["bowl-vegetariano", "bowl-green", "bowl-salmon", "bowl-mediterraneo", "bowl-caprese", "parfait", "granola", "bowl-frutas", "jugo-naranja", "jugo-maracuya", "jugo-frutilla", "jugo-frutos-rojos", "infusion-frutos-rojos", "infusion-flores", "kombucha"];
const SWEET_IDS = ["waffle", "french-toast", "croissant", "medialuna-rellena", "brownie-helado", "affogato", "affomatcha", "mocaccino", "chocolate", "moca-menta"];
const SAVORY_CHAPTERS = ["cl-sandwiches", "cl-bowls", "cl-eggs"];
const SAVORY_IDS = ["tostada-serrano", "tostada-vegetariana", "tostada-palta-salmon", "huevos-benedictinos", "tostada-palta-tomates", "huevos-fritos-tocino"];
const KIDS_IDS = ["babyccino", "chocolate", "jugo-naranja", "jugo-frutilla", "galletas", "waffle", "medialuna"];

const INTENTS: Intent[] = [
  { words: ["desayuno", "desayunos", "brunch", "manana", "breakfast", "morning"], chapters: ["cl-eggs", "cl-parfait", "cl-toast", "cl-bakery"] },
  { words: ["almuerzo", "almorzar", "comida", "comer", "lunch", "meal", "plato", "platos"], chapters: SAVORY_CHAPTERS, ids: SAVORY_IDS },
  { words: ["frio", "fria", "frios", "frias", "helado", "helada", "hielo", "iced", "cold", "frozen", "refrescante", "refrescar", "fresco", "fresca"], ids: COLD_IDS },
  { words: ["caliente", "calientes", "tibio", "hot", "warm", "calentar"], ids: HOT_IDS },
  { words: ["cafe", "cafes", "coffee", "espresso", "cafecito"], chapters: ["cl-coffee", "cl-formats", "cl-filter", "cl-espresso", "cl-cold"] },
  { words: ["sin cafe", "sin cafeina", "descafeinado", "decaf", "no coffee", "caffeine free", "without coffee"], ids: NO_COFFEE_IDS },
  { words: ["dulce", "dulces", "postre", "postres", "torta", "tortas", "pastel", "pasteles", "sweet", "dessert", "desserts", "cake", "cakes"], chapters: ["cl-cakes", "cl-cookies"], ids: SWEET_IDS },
  { words: ["salado", "salados", "savory", "savoury"], chapters: SAVORY_CHAPTERS, ids: SAVORY_IDS },
  { words: ["ensalada", "ensaladas", "salad", "salads", "bowl", "bowls"], chapters: ["cl-bowls"] },
  { words: ["sandwich", "sandwiches", "sanduche", "focaccia"], chapters: ["cl-sandwiches"] },
  { words: ["tostada", "tostadas", "toast", "toasts", "pan de masa madre", "masa madre", "sourdough"], chapters: ["cl-toast"], ids: ["adicion-porcion-de-pan-de-masa-madre"] },
  { words: ["huevo", "huevos", "egg", "eggs", "cacerola"], chapters: ["cl-eggs"], ids: ["huevos-benedictinos", "huevos-fritos-tocino", "adicion-huevo"] },
  { words: ["pan", "panaderia", "bakery", "pastry", "croissant", "medialuna", "medialunas"], chapters: ["cl-bakery"] },
  { words: ["galleta", "galletas", "cookie", "cookies"], chapters: ["cl-cookies"] },
  { words: ["sin azucar", "sugar free", "no sugar", "sin gluten"], ids: ["alfajor", "canele"] },
  { words: ["vegetariano", "vegetariana", "vegetarianos", "vegano", "vegana", "vegetal", "vegan", "veggie", "vegetarian", "plant"], ids: ["bowl-vegetariano", "sandwich-vegetariano", "tostada-vegetariana", "tostada-palta-tomates", "bowl-caprese", "bowl-green"], test: (line) => line.vegan },
  { words: ["grano", "granos", "bolsa", "bolsas", "llevar", "para la casa", "casa", "beans", "bag", "bags", "take home", "whole bean"], chapters: ["cl-coffee", "cl-formats"] },
  { words: ["capsula", "capsulas", "capsule", "capsules", "drip", "drips", "filtro", "pods", "nespresso"], chapters: ["cl-formats"] },
  { words: ["filtrado", "filtrados", "filter", "chemex", "v60", "origami", "metodo", "metodos", "pour over"], chapters: ["cl-filter"] },
  { words: ["te", "tes", "tea", "teas", "infusion", "infusiones", "hibisco", "hibiscus", "rooibos"], ids: TEA_IDS },
  { words: ["jugo", "jugos", "zumo", "juice", "juices", "natural", "naturales", "limonada", "lemonade"], ids: JUICE_IDS },
  { words: ["soda", "sodas", "gaseosa", "tonica", "tonic", "ginger", "kombucha", "burbujas", "sparkling", "fizzy"], ids: FIZZ_IDS },
  { words: ["leche", "latte", "milk", "cremoso", "cremosa", "creamy"], ids: MILK_IDS },
  { words: ["avena", "oat", "vegetal", "sin lactosa", "lactose"], ids: ["adicion-leche-de-avena"] },
  { words: ["fruta", "frutas", "fruit", "fruits", "berries", "frutos rojos"], ids: FRUIT_IDS },
  { words: ["ligero", "liviano", "light", "saludable", "healthy", "fit", "sano", "sana"], ids: LIGHT_IDS },
  { words: ["nino", "ninos", "kids", "children", "chico", "chicos"], ids: KIDS_IDS },
  { words: ["palta", "aguacate", "avocado"], ids: ["cacerola-palta", "tostada-palta-salmon", "tostada-palta-tomates", "bowl-green", "bowl-salmon", "bowl-pastrami", "adicion-palta", "sandwich-pollo", "sandwich-pastrami", "sandwich-vegetariano", "croissant-salmon"] },
  { words: ["pollo", "chicken"], ids: ["sandwich-pollo", "bowl-green", "adicion-porcion-de-pollo"] },
  { words: ["salmon", "pescado", "fish"], ids: ["cacerola-salmon", "tostada-palta-salmon", "huevos-benedictinos", "croissant-salmon", "bowl-salmon", "adicion-salmon"] },
  { words: ["queso", "cheese", "burrata", "mozzarella"], ids: ["cacerola-gratinados", "croissant-jamon-queso", "tostada-serrano", "bowl-caprese", "bowl-mediterraneo", "adicion-queso-mozzarella", "torta-vasca", "cheesecake-oreo"] },
  { words: ["chocolate", "cacao", "choco", "mocca", "moca"], ids: ["chocolate", "mocaccino", "moca-menta", "brownie", "brownie-helado", "volcan", "galletas", "alfajor", "cheesecake-oreo"] },
  { words: ["matcha", "verde", "green"], chapters: ["cl-matcha"], ids: ["bowl-green"] },
  { words: ["adicion", "adiciones", "extra", "extras", "agregar", "add", "add on", "topping"], chapters: ["cl-extras"] },
  { words: ["autor", "signature", "freedom", "trending", "especial", "especiales"], chapters: ["cl-signature"] },
];

const STOP = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "para", "con", "en", "al", "que", "me", "mi", "the", "a", "an", "of", "and", "or", "with", "for", "to", "some", "something", "algo", "quiero", "busco", "dame", "tengo", "ganas", "bebida", "bebidas", "drink", "drinks", "tomar", "comida"]);

function words(text: string): string[] {
  return fold(text).split(/[^a-z0-9]+/).filter(Boolean);
}

/** The same word, or one that starts the other: four letters at least, so "sin" is never "single". */
function close(token: string, word: string): boolean {
  if (token === word) return true;
  if (token.length < 4 || word.length < 4) return false;
  return word.startsWith(token) || token.startsWith(word);
}

type Scored = { group: Group; score: number; index: number };

/**
 * The groups that answer a query, best first. Every word has to find something,
 * in a name, a description or an intent; if none does, the search loosens to any word.
 */
export function searchGroups(groups: readonly Group[], query: string): Group[] {
  const text = fold(query.trim());
  if (!text) return [];
  // phrases first ("sin café", "para llevar"): they count whole and leave the sentence
  let rest = text;
  const phraseHits = new Map<Intent, boolean>();
  for (const intent of INTENTS) {
    const hit = intent.words.filter((word) => word.includes(" ") && rest.includes(word));
    phraseHits.set(intent, hit.length > 0);
    for (const word of hit) rest = rest.replace(word, " ");
  }
  const tokens = words(rest).filter((token) => !STOP.has(token));
  const probes = tokens.length > 0 ? tokens : [...phraseHits.values()].some(Boolean) ? [] : words(text);

  const scoreOf = (group: Group, probe: string): number => {
    let best = 0;
    for (const line of group.lines) {
      for (const word of words(line.name)) if (close(probe, word)) best = Math.max(best, probe === word ? 4 : 3);
      if (best < 1.5 && words(line.description).some((word) => close(probe, word))) best = Math.max(best, 1.5);
    }
    for (const intent of INTENTS) {
      if (!intent.words.some((word) => !word.includes(" ") && close(probe, word))) continue;
      if (intentMatches(intent, group)) best = Math.max(best, 2.5);
    }
    return best;
  };

  const scored: Scored[] = [];
  groups.forEach((group, index) => {
    let score = 0;
    let matchedAll = true;
    for (const probe of probes) {
      const s = scoreOf(group, probe);
      if (s === 0) matchedAll = false;
      score += s;
    }
    for (const [intent, hit] of phraseHits) {
      if (hit && intentMatches(intent, group)) {
        score += 3;
        matchedAll = true;
      }
    }
    if (score > 0) scored.push({ group, score: matchedAll ? score + 10 : score, index });
  });
  const strict = scored.filter((entry) => entry.score >= 10);
  const picked = strict.length > 0 ? strict : scored;
  return picked.sort((a, b) => b.score - a.score || a.index - b.index).map((entry) => entry.group);
}

function intentMatches(intent: Intent, group: Group): boolean {
  if (intent.chapters?.includes(group.chapterId)) return true;
  if (intent.ids?.includes(group.id)) return true;
  if (intent.test && group.lines.some(intent.test)) return true;
  return false;
}
