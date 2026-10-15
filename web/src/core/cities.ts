import type { MenuItem } from "@/src/data/menu";

import { registerCity } from "./catalog";

/**
 * Cartagena, from the printed 2026 menu (menu_ctg_2026.pdf).
 * Bogotá and Medellín share the base catalog in `src/data/menu.json`.
 * Prices are as printed, in Colombian pesos.
 */
const CTG_PRICES: Record<string, number> = {
  // Roasted coffee
  "paz-200": 34800, "paz-340": 44200, "paz-454": 69300,
  "libre-200": 39500, "libre-340": 55800, "libre-454": 80800,
  "impacto-340": 79900,
  "rock-200": 58800, "rock-340": 65000, "rock-454": 110000,
  "punk-340": 95200,
  "competition-100": 115500,
  // Filter
  "fil-paz-8": 12500, "fil-paz-12": 21800, "fil-paz-16": 34500,
  "fil-libre-8": 12500, "fil-libre-12": 21800, "fil-libre-16": 34500,
  "fil-decaf-8": 12500, "fil-decaf-12": 21800, "fil-decaf-16": 34500,
  "fil-rock-8": 15800, "fil-rock-12": 31200, "fil-rock-16": 46500,
  "fil-impacto-8": 14800, "fil-impacto-12": 27200, "fil-impacto-16": 38800,
  "fil-punk-8": 16500, "fil-punk-12": 32000, "fil-punk-16": 48200,
  "fil-competition-8": 25500,
  // Espresso
  "esp-blend": 8800, "esp-so": 9800,
  "ame-blend": 9900, "ame-so": 10900,
  "mac-blend": 9800, "mac-so": 10800,
  "lat-blend": 13500, "lat-so": 14500,
  "cap-blend": 13500, "cap-so": 14500,
  "moc-blend": 12800, "moc-so": 13800,
  "fw-blend": 12500, "fw-so": 13500,
  "iced-cap": 14500, "iced-lat": 14500, "affogato": 17000,
  // Signature
  "esencia": 14500, "lumina": 15200,
  // Matcha & chai
  "matcha-latte": 16500, "chai": 13500, "chai-choc": 13500, "chai-golden": 13500, "chai-carbon": 13500,
  // Other drinks
  "soda-rojos": 13800, "soda-maracuya": 13800, "agua": 7800, "agua-gas": 7800, "jugo": 12800,
  "kombucha": 13000, "inf-rojos": 13200, "inf-amarillos": 13200, "cerveza": 15800, "chocolate": 13500,
  "babyccino": 8800, "te-verde": 10200,
  // Food
  "hue-gratin": 26800,
  "granola": 27200, "waffle": 29500,
  "tos-caprese": 26200, "tos-aguacate": 26200, "tos-serrano": 31500, "tos-salmon": 35800,
  "san-croissant": 29800, "san-quesos": 33200, "san-pollo": 42500,
  "bow-salmon": 44500, "bow-veg": 36200, "bow-pollo": 34800,
  "croix": 10000, "croix-almendra": 15500, "croix-avellana": 17000,
  "zanahoria": 15500,
  // Additions
  "add-limon": 1800, "add-vegetal": 4500, "add-aguacate": 6000, "add-serrano": 10500, "add-pollo": 11500,
  "add-salmon": 12500, "add-miel": 3000, "add-yogurt": 5500, "add-helado": 5800, "add-fruta": 8800,
  "add-huevos": 5800, "add-mozz": 5500, "add-crema": 5000, "add-chips": 7500,
};

const CTG_HIDDEN = [
  "cb-lata", "cb-pack", "bruma",
  "dirty-matcha", "strawberry-matcha", "matcha-spritz",
  "hue-tomatillo", "hue-turcos", "hue-gusto",
  "par-rojos", "par-amarillos", "chia",
  "tos-francesas",
  "san-serrano",
  "bow-serrano",
  "pandebono", "arepa-mini", "palito", "arepa", "croix-pistacho",
  "volcan", "almojabana", "brownie", "cheese-arequipe", "cheese-agraz", "almo-sin",
  "gal-chips", "gal-arandanos", "gal-avena",
  "carajillo", "martini", "spritz", "shot-43", "shot-sg", "shot-patron",
  "add-deslact", "add-burrata", "add-masa", "add-foca", "add-dip",
];

const item = (partial: Omit<MenuItem, "vegan" | "nuts" | "extra"> & Partial<Pick<MenuItem, "vegan" | "nuts" | "extra">>): MenuItem => ({
  vegan: false,
  nuts: false,
  extra: false,
  ...partial,
});

const CTG_EXTRA: MenuItem[] = [
  item({ id: "ctg-cb-copa", name: "Cold brew en copa", category: "cold-brew", price: 15800, description: "Cold brew Libertario, servido en copa.", vegan: true }),
  item({ id: "ctg-alquimia", name: "Alquimia", category: "signature", price: 14500, description: "Cold brew Libertario en infusión de hierbabuena y albahaca, con leche y hielo." }),
  item({ id: "ctg-hue-pastrami", name: "Huevos con pastrami", category: "eggs", price: 25800, description: "Al horno con pastrami de pavo, pan de masa madre y aguacate. Maridaje: filtrado LIBRE." }),
  item({ id: "ctg-hue-cacerola", name: "Cacerola de huevos", category: "eggs", price: 22200, description: "Al horno sobre tomate casero, queso crema y hogao, con arepa de yuca. Maridaje: espresso PAZ." }),
  item({ id: "ctg-parfait", name: "Parfait", category: "parfait", price: 19800, description: "Capas de yogurt griego artesanal, fruta de temporada y granola de la casa." }),
  item({ id: "ctg-san-pastrami", name: "Sándwich pastrami de pavo", category: "sandwiches", price: 35800, description: "Ciabatta con pastrami de pavo, mozzarella, tomates horneados y aguacate. Maridaje: filtrado ROCK." }),
  item({ id: "ctg-bow-pastrami", name: "Bowl pastrami de pavo", category: "bowls", price: 36800, description: "Quinoa, mix de lechugas, pastrami de pavo, cherry, aguacate, mango y almendras tostadas.", nuts: true }),
  item({ id: "ctg-croix-arandanos", name: "Croissant chocolate blanco y arándanos", category: "bakery", price: 17000, description: "Croissant con chocolate blanco y arándanos. Maridaje: filtrado IMPACTO." }),
  item({ id: "ctg-amapola", name: "Torta de amapola y limón", category: "cakes", price: 15200, description: "Pastel de limón con semillas de amapola." }),
  item({ id: "ctg-queso-costeno", name: "Torta de queso costeño", category: "cakes", price: 16200, description: "Queso costeño tradicional con un toque de caramelo salado." }),
  item({ id: "ctg-brownie-almendras", name: "Brownie de almendras", category: "cakes", price: 16000, description: "Brownie de chocolate con marañón y almendra.", nuts: true }),
  item({ id: "ctg-financier", name: "Financier de arándanos", category: "cakes", price: 13500, description: "Cake de almendra con arándanos, sin gluten.", nuts: true }),
  item({ id: "ctg-creme-brulee", name: "Crème brûlée", category: "cakes", price: 15200, description: "Crema de vainilla con azúcar caramelizada." }),
  item({ id: "ctg-gal-redvelvet", name: "Galleta red velvet", category: "cookies", price: 13200, description: "Galleta red velvet." }),
  item({ id: "ctg-gal-chocolate", name: "Galleta de chocolate", category: "cookies", price: 13200, description: "Galleta de chocolate." }),
  item({ id: "ctg-add-shot", name: "Shot de espresso extra", category: "extras", price: 6000, description: "Adición para bebidas de espresso.", extra: true }),
  item({ id: "ctg-add-pastrami", name: "Pastrami extra", category: "extras", price: 10500, description: "Adición para todo el menú.", extra: true }),
];

registerCity("cartagena", { prices: CTG_PRICES, hidden: CTG_HIDDEN, extraItems: CTG_EXTRA });
