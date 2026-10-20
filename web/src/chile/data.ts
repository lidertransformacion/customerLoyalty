/**
 * The Chile menu (Menú nuevo Chile Libertario 2026), as printed.
 * Prices are Chilean pesos, written exactly as the print shows them.
 * `spread` is the PDF page that holds the item; `focus` is where its photo
 * sits, in points of that spread (pdf media box), used to zoom on the plate.
 */
export type Price = { label?: string; value: string };

export type ChileItem = {
  id: string;
  name: string;
  spread: number;
  description?: string;
  prices: Price[];
  pairing?: string;
  /** Extra pairing lines, as on the cookies. */
  pairings?: string[];
  focus?: { spread: number; x: number; y: number; r: number };
  /** Tap area set by hand where the print layout defeats the locator, in PDF points. */
  area?: { x: number; y: number; w: number; h: number };
};

export const PAGE = { width: 637.225, height: 693.92 };
/** Trim box of a spread, in PDF points (left, top). */
export const TRIM = { x: 49.35, y: 49.35 };

const SB = "Signature Blends";
const SO = "Single Origin";

export const CHILE_ITEMS: ChileItem[] = [
  // Café tostado — spread 4 (printed page 6)
  { id: "paz-bag", area: { x: 100, y: 265, w: 480, h: 62 }, name: "PAZ", spread: 4, description: "Balanceado & Acaramelado · Signature Blends. PAZ es ese lugar conocido al que siempre quieres volver. Dulce, suave y consistente. Un café que simplemente se siente bien, todos los días.", prices: [{ label: "200 g", value: "$15,990" }, { label: "340 g", value: "$26,890" }, { label: "454 g", value: "$33,890" }, { label: "Descafeinado 200 g", value: "$18,590" }, { label: "Descafeinado 340 g", value: "$32,000" }, { label: "Descafeinado 454 g", value: "$39,000" }], focus: { spread: 3, x: 1020, y: 400, r: 300 } },
  { id: "libre-bag", area: { x: 100, y: 357, w: 480, h: 56 }, name: "LIBRE", spread: 4, description: "Intenso & Afrutado · Signature Blends. LIBRE comienza donde termina lo conocido. Más intensidad, más carácter y una invitación a explorar un poco más, taza a taza.", prices: [{ label: "200 g", value: "$17,000" }, { label: "340 g", value: "$28,000" }, { label: "454 g", value: "$37,000" }], focus: { spread: 3, x: 1020, y: 400, r: 300 } },
  { id: "rock-bag", area: { x: 100, y: 447, w: 480, h: 82 }, name: "ROCK", spread: 4, description: "Variedades Exóticas · Single Origin. Todo comienza en la genética. Cada variedad tiene una forma única de expresarse. ROCK celebra el papel de la genética en los aromas, sabores y texturas que descubrimos en cada taza.", prices: [{ label: "200 g", value: "$20,000" }, { label: "340 g", value: "$32,000" }, { label: "454 g", value: "$39,990" }], focus: { spread: 3, x: 1020, y: 400, r: 300 } },
  { id: "punk-bag", area: { x: 100, y: 537, w: 480, h: 106 }, name: "PUNK", spread: 4, description: "Procesos Experimentales · Single Origin. Cuando la fermentación abre nuevas posibilidades. PUNK celebra la experimentación. A través de la fermentación, exploramos hasta dónde puede llegar una variedad y todas las nuevas expresiones que podemos descubrir en ella.", prices: [{ label: "340 g", value: "$49,000" }], focus: { spread: 3, x: 1020, y: 400, r: 300 } },

  // Filtrados — spread 5 (9)
  { id: "fil-paz", name: "PAZ", spread: 5, description: "Balanceado & Acaramelado · Signature Blend. Preparado con métodos como Chemex, Origami o V60.", prices: [{ label: "1 taza", value: "$5,790" }, { label: "2 tazas", value: "$10,900" }, { label: "3 tazas", value: "$15,800" }], focus: { spread: 5, x: 440, y: 470, r: 230 } },
  { id: "fil-libre", name: "LIBRE", spread: 5, description: "Intenso & Afrutado · Signature Blend. Preparado con métodos como Chemex, Origami o V60.", prices: [{ label: "1 taza", value: "$5,790" }, { label: "2 tazas", value: "$10,900" }, { label: "3 tazas", value: "$15,800" }], focus: { spread: 5, x: 440, y: 470, r: 230 } },
  { id: "fil-rock", name: "ROCK", spread: 5, description: "Variedades Exóticas · Single Origin. Preparado con métodos como Chemex, Origami o V60.", prices: [{ label: "1 taza", value: "$6,000" }, { label: "2 tazas", value: "$11,500" }, { label: "3 tazas", value: "$17,100" }], focus: { spread: 5, x: 440, y: 470, r: 230 } },
  { id: "fil-punk", name: "PUNK", spread: 5, description: "Procesos Experimentales · Single Origin. Preparado con métodos como Chemex, Origami o V60.", prices: [{ label: "1 taza", value: "$6,290" }, { label: "2 tazas", value: "$11,700" }, { label: "3 tazas", value: "$17,300" }], focus: { spread: 5, x: 440, y: 470, r: 230 } },

  // A base de espresso — spread 6 (11)
  { id: "cappuccino", name: "Cappuccino", spread: 6, description: "Espresso con leche vaporizada y espuma.", prices: [{ label: SB, value: "$4,590" }, { label: SO, value: "$5,000" }], focus: { spread: 6, x: 375, y: 430, r: 125 } },
  { id: "latte", name: "Latte", spread: 6, description: "Espresso con leche vaporizada.", prices: [{ label: SB, value: "$4,690" }, { label: SO, value: "$5,190" }], focus: { spread: 6, x: 115, y: 420, r: 140 } },
  { id: "macchiato", name: "Macchiato", spread: 6, description: "Espresso “manchado” con un toque de leche.", prices: [{ label: SB, value: "$3,690" }, { label: SO, value: "$4,190" }], focus: { spread: 6, x: 285, y: 640, r: 115 } },
  { id: "flat-white", name: "Flat White", spread: 6, description: "Espresso con leche vaporizada y textura sedosa.", prices: [{ label: SB, value: "$4,890" }, { label: SO, value: "$5,390" }], focus: { spread: 6, x: 460, y: 545, r: 130 } },
  { id: "mocaccino", name: "Mocaccino", spread: 6, description: "Espresso, chocolate y leche vaporizada.", prices: [{ label: SB, value: "$5,390" }, { label: SO, value: "$5,890" }], focus: { spread: 6, x: 290, y: 360, r: 120 } },
  { id: "iced-cappuccino", name: "Iced Cappuccino", spread: 6, description: "Cappuccino servido frío con hielo.", prices: [{ label: SB, value: "$4,990" }, { label: SO, value: "$5,490" }], focus: { spread: 9, x: 950, y: 610, r: 120 } },
  { id: "iced-latte", name: "Iced Latte", spread: 6, description: "Latte servido frío con hielo.", prices: [{ label: SB, value: "$4,990" }, { label: SO, value: "$5,490" }], focus: { spread: 9, x: 950, y: 610, r: 120 } },
  { id: "affogato", name: "Affogato", spread: 6, description: "Espresso servido sobre helado.", prices: [{ label: SB, value: "$5,890" }, { label: SO, value: "$6,390" }], focus: { spread: 7, x: 350, y: 300, r: 260 } },
  { id: "espresso-tonic", name: "Espresso Tonic", spread: 6, description: "Espresso con agua tónica y hielo.", prices: [{ label: SB, value: "$4,990" }, { label: SO, value: "$5,490" }], focus: { spread: 7, x: 350, y: 240, r: 220 } },
  { id: "espresso-ginger-beer", name: "Espresso Ginger Beer", spread: 6, description: "Espresso con ginger beer y hielo.", prices: [{ label: SB, value: "$4,990" }, { label: SO, value: "$5,490" }], focus: { spread: 7, x: 350, y: 240, r: 220 } },
  { id: "espresso-naranja", name: "Espresso Naranja", spread: 6, description: "Jugo de naranja con espresso PAZ.", prices: [{ label: SB, value: "$5,290" }, { label: SO, value: "$6,390" }], focus: { spread: 9, x: 1170, y: 610, r: 120 } },

  // Espresso, americano, cold brew — spread 7 (13)
  { id: "espresso", name: "Espresso", spread: 7, prices: [{ label: SB, value: "$3,000" }, { label: SO, value: "$3,590" }], focus: { spread: 6, x: 1235, y: 215, r: 90 } },
  { id: "americano", name: "Americano", spread: 7, description: "Espresso con agua caliente.", prices: [{ label: SB, value: "$3,790" }, { label: SO, value: "$4,290" }], focus: { spread: 6, x: 1133, y: 510, r: 90 } },
  { id: "cold-brew", name: "Cold Brew", spread: 7, description: "Café de extracción en frío.", prices: [{ label: SB, value: "$4,890" }], focus: { spread: 7, x: 350, y: 400, r: 300 } },
  { id: "aerocano", name: "Aerocano", spread: 7, description: "Americano frío aireado.", prices: [{ label: SB, value: "$4,290" }, { label: SO, value: "$5,290" }], focus: { spread: 7, x: 350, y: 240, r: 220 } },

  // Matcha Spirit — spread 8 (15)
  { id: "matcha", name: "Matcha", spread: 8, description: "Tradicional con leche. Frío o caliente.", prices: [{ value: "$4,990" }], focus: { spread: 8, x: 815, y: 520, r: 85 } },
  { id: "matcha-berry", name: "Matcha Berry", spread: 8, description: "Leche y frutos rojos.", prices: [{ value: "$5,590" }], focus: { spread: 8, x: 978, y: 505, r: 85 } },
  { id: "dirty-matcha", name: "Dirty Matcha", spread: 8, description: "Shot de espresso.", prices: [{ value: "$5,390" }], focus: { spread: 8, x: 897, y: 600, r: 85 } },
  { id: "matcha-lemon-spritz", name: "Matcha Lemon Spritz", spread: 8, description: "Limón y soda.", prices: [{ value: "$5,590" }], focus: { spread: 8, x: 1195, y: 610, r: 90 } },
  { id: "matcha-maracuya-mango", name: "Matcha de maracuyá y mango", spread: 8, description: "Salsas de maracuyá y mango con soda.", prices: [{ value: "$5,590" }], focus: { spread: 8, x: 1100, y: 540, r: 85 } },
  { id: "affomatcha", name: "Affomatcha", spread: 8, description: "Servido sobre helado.", prices: [{ value: "$5,890" }], focus: { spread: 8, x: 1015, y: 650, r: 90 } },

  // Bebidas de autor — spread 9 (17)
  { id: "cold-brew-invierno", name: "Cold Brew Invierno", spread: 9, description: "Notas de panela, miel, canela y vainilla, con espuma de leche. Freedom Drinks, frío.", prices: [{ value: "$5,590" }], focus: { spread: 9, x: 950, y: 610, r: 90 } },
  { id: "moca-menta", name: "Moca Menta", spread: 9, description: "Espresso PAZ con leche, chocolate y un refrescante toque de menta. Freedom Drinks, frío.", prices: [{ value: "$5,590" }], focus: { spread: 9, x: 845, y: 610, r: 90 } },
  { id: "hibisco", name: "Hibisco", spread: 9, description: "Infusión de hibisco con naranja, limón y un refrescante toque de ginger beer. Trending Drinks, frío.", prices: [{ value: "$3,990" }], focus: { spread: 9, x: 160, y: 540, r: 220 } },
  { id: "te-de-flores", name: "Té de flores", spread: 9, description: "Infusión de rooibos con frutos rojos y notas de pomelo. Trending Drinks, frío.", prices: [{ value: "$5,990" }], focus: { spread: 9, x: 555, y: 550, r: 220 } },

  // Otras bebidas — spread 10 (19)
  { id: "chocolate", name: "Chocolate", spread: 10, description: "Chocolate caliente.", prices: [{ value: "$4,890" }], focus: { spread: 19, x: 370, y: 540, r: 160 } },
  { id: "chai", name: "Chai", spread: 10, description: "Chai latte especiado.", prices: [{ value: "$4,890" }], focus: { spread: 19, x: 450, y: 330, r: 160 } },
  { id: "babyccino", name: "Babyccino", spread: 10, description: "Leche vaporizada con espuma, sin café.", prices: [{ value: "$4,990" }], focus: { spread: 6, x: 1235, y: 335, r: 90 } },
  { id: "golden-milk", name: "Golden Milk", spread: 10, description: "Leche vaporizada con cúrcuma y especias.", prices: [{ value: "$4,990" }], focus: { spread: 6, x: 1135, y: 385, r: 90 } },
  { id: "soda-frutos-rojos", name: "Frutos rojos", spread: 10, description: "Soda saborizada con frutos rojos.", prices: [{ value: "$5,700" }], focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "soda-maracuya-mango", name: "Maracuyá y mango", spread: 10, description: "Soda saborizada con maracuyá y mango.", prices: [{ value: "$5,700" }], focus: { spread: 10, x: 495, y: 380, r: 150 } },
  { id: "te-jazmin", name: "Jazmín", spread: 10, description: "Infusión de té de jazmín.", prices: [{ value: "$3,600" }], focus: { spread: 19, x: 450, y: 330, r: 160 } },
  { id: "te-durazno", name: "Durazno", spread: 10, description: "Infusión de té de durazno.", prices: [{ value: "$3,800" }], focus: { spread: 19, x: 450, y: 330, r: 160 } },
  { id: "infusion-frutos-rojos", name: "Infusión de frutos rojos", spread: 10, description: "Infusión fría de frutos rojos.", prices: [{ value: "$3,690" }], focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "infusion-flores", name: "Infusión de flores", spread: 10, description: "Infusión fría floral.", prices: [{ value: "$3,690" }], focus: { spread: 10, x: 630, y: 330, r: 130 } },
  { id: "jugo-naranja", name: "Jugo de naranja", spread: 10, description: "Jugo de naranja natural.", prices: [{ value: "$4,000" }], focus: { spread: 10, x: 160, y: 540, r: 170 } },
  { id: "jugo-maracuya-mango", name: "Jugo de maracuyá y mango", spread: 10, description: "Jugo de maracuyá y mango natural.", prices: [{ value: "$4,590" }], focus: { spread: 10, x: 495, y: 380, r: 150 } },
  { id: "jugo-frutilla", name: "Jugo de frutilla", spread: 10, description: "Frutilla.", prices: [{ value: "$4,590" }], focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "jugo-frutos-rojos", name: "Jugo de frutos rojos", spread: 10, description: "Mix de frutos rojos.", prices: [{ value: "$4,590" }], focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "limonada", name: "Limonada tradicional", spread: 10, description: "Limón sutil.", prices: [{ value: "$3,590" }], focus: { spread: 10, x: 630, y: 330, r: 130 } },
  { id: "limonada-menta-jengibre", name: "Limonada de menta y jengibre", spread: 10, description: "Limón sutil, menta y jengibre.", prices: [{ value: "$3,590" }], focus: { spread: 10, x: 630, y: 330, r: 130 } },
  { id: "tonic", name: "Tonic Water clásica", spread: 10, description: "Agua tónica clásica.", prices: [{ value: "$3,490" }] },
  { id: "ginger-beer", name: "Ginger beer clásica", spread: 10, description: "Ginger beer clásica.", prices: [{ value: "$3,490" }] },
  { id: "kombucha", name: "Kombucha", spread: 10, prices: [{ value: "$4,290" }] },

  // Huevos — spread 11 (20-21)
  { id: "cacerola-criollos", name: "Cacerola de huevos criollos", spread: 11, description: "Huevos al gusto con palta, yogur griego, tomates asados y un toque de pimentón, acompañados de pan de masa madre o croissant.", prices: [{ value: "$8,590" }], pairing: "LATTE PAZ", focus: { spread: 11, x: 560, y: 300, r: 140 } },
  { id: "cacerola-gratinados", name: "Cacerola de huevos gratinados", spread: 11, description: "Huevos al gusto con jamón serrano, tomates asados y queso gratinado, acompañados de pan de masa madre o croissant.", prices: [{ value: "$8,590" }], pairing: "FILTRADO ROCK", focus: { spread: 11, x: 470, y: 600, r: 160 } },
  { id: "cacerola-palta", name: "Cacerola de huevos con palta", spread: 11, description: "Huevos al gusto con tomates al horno, pastrami, palta y brotes, acompañados de pan de masa madre o croissant.", prices: [{ value: "$7,590" }], pairing: "ESPRESSO NARANJA", focus: { spread: 11, x: 1215, y: 340, r: 150 } },
  { id: "cacerola-salmon", name: "Cacerola de salmón", spread: 11, description: "Huevos al gusto con tomates al horno, salmón, queso crema y espinaca, acompañados de pan de masa madre o croissant.", prices: [{ value: "$8,990" }], pairing: "AEROCANO", focus: { spread: 11, x: 1080, y: 610, r: 160 } },

  // Parfait y granola — spread 12 (22-23)
  { id: "parfait", name: "Parfait", spread: 12, description: "Yogurt griego con fruta fresca y granola.", prices: [{ value: "$6,990" }], pairing: "AMERICANO PAZ", focus: { spread: 12, x: 420, y: 455, r: 85 } },
  { id: "granola", name: "Granola", spread: 12, description: "Con yogurt, chocolate y fruta fresca.", prices: [{ value: "$8,990" }], pairing: "MOCACCINO PAZ", focus: { spread: 12, x: 225, y: 530, r: 130 } },
  { id: "bowl-frutas", name: "Bowl de frutas", spread: 12, description: "Smoothie de frutas de temporada, con granola, frutas frescas, miel y coco rallado.", prices: [{ value: "$8,990" }], pairing: "FILTRADO LIBRE", focus: { spread: 12, x: 500, y: 625, r: 135 } },
  { id: "waffle", name: "Waffle de frutas", spread: 12, description: "Waffle de avena con fruta fresca, almendras, yogur griego y ralladura de limón.", prices: [{ value: "$7,990" }], pairing: "MOCACCINO PAZ", focus: { spread: 12, x: 1000, y: 480, r: 260 } },

  // Panadería — spreads 13 and 14 (24-27)
  { id: "pie-limon", name: "Pie de limón", spread: 13, prices: [{ value: "$5,490" }], pairing: "FILTRADO ROCK", focus: { spread: 13, x: 1285, y: 565, r: 110 } },
  { id: "torta-vasca", name: "Torta vasca", spread: 13, description: "Cheesecake vasco.", prices: [{ value: "$5,990" }], pairing: "ESPRESSO PUNK", focus: { spread: 13, x: 615, y: 690, r: 110 } },
  { id: "tartaleta-manzana", name: "Tartaleta de manzana", spread: 13, prices: [{ value: "$5,490" }], pairing: "FILTRADO PAZ", focus: { spread: 13, x: 1125, y: 450, r: 110 } },
  { id: "red-velvet", name: "Red Velvet", spread: 13, description: "Torta red velvet.", prices: [{ value: "$4,990" }], pairing: "AMERICANO PUNK", focus: { spread: 13, x: 565, y: 470, r: 110 } },
  { id: "carrot-cake", name: "Carrot Cake", spread: 13, description: "Bizcocho húmedo y especiado de zanahoria, cubierto con frosting de queso crema.", prices: [{ value: "$4,990" }], pairing: "AEROCANO", focus: { spread: 13, x: 505, y: 285, r: 110 } },
  { id: "cheesecake-oreo", name: "Cheesecake de Oreo", spread: 13, description: "Cheesecake de Oreo.", prices: [{ value: "$5,490" }], pairing: "MOCACCINO", focus: { spread: 13, x: 440, y: 95, r: 110 } },
  { id: "tiramisu", name: "Tiramisú", spread: 13, prices: [{ value: "$4,990" }], pairing: "ESPRESSO PAZ", focus: { spread: 13, x: 1135, y: 215, r: 110 } },
  { id: "brownie", name: "Brownie", spread: 13, description: "Brownie de chocolate.", prices: [{ value: "$3,790" }], pairing: "COLD BREW DE INVIERNO", focus: { spread: 13, x: 1300, y: 345, r: 100 } },
  { id: "brownie-helado", name: "Brownie con helado y mix de frutos rojos", spread: 13, description: "Brownie de chocolate intenso y húmedo, acompañado de helado y un mix de frutos rojos.", prices: [{ value: "$6,890" }], pairing: "FILTRADO LIBRE", focus: { spread: 13, x: 1300, y: 345, r: 100 } },
  { id: "volcan", name: "Volcán de chocolate", spread: 13, description: "Volcán de chocolate con centro intenso y cremoso, acompañado de salsa de frutos rojos y una bola de helado.", prices: [{ value: "$6,890" }], pairing: "FILTRADO LIBRE", focus: { spread: 13, x: 1300, y: 345, r: 100 } },
  { id: "croissant", name: "Croissant", spread: 14, description: "Croissant con crema de avellanas, frutillas y almendras.", prices: [{ value: "$6,990" }], pairing: "FILTRADO PUNK", focus: { spread: 14, x: 375, y: 565, r: 110 } },
  { id: "medialuna", name: "Medialuna", spread: 14, description: "Medialuna clásica.", prices: [{ value: "$3,000" }], pairing: "CAPPUCCINO PAZ", focus: { spread: 14, x: 610, y: 565, r: 110 } },
  { id: "medialuna-rellena", name: "Medialuna rellena", spread: 14, description: "Dulce de leche o crema pastelera.", prices: [{ value: "$3,990" }], pairing: "LATTE PAZ", focus: { spread: 14, x: 125, y: 565, r: 110 } },
  { id: "galletas", name: "Galletas", spread: 14, description: "Variedad de galletas.", prices: [{ value: "$4,990" }], pairings: ["Dulce de leche con nuez · FILTRADO PAZ", "Limón · FILTRADO ROCK", "Chocolate · COLD BREW DE INVIERNO"], focus: { spread: 14, x: 1100, y: 270, r: 250 } },
  { id: "alfajor", name: "Alfajor", spread: 14, description: "Brownie bañado en chocolate belga, relleno de manjar y frutos rojos. Sin azúcar.", prices: [{ value: "$3,290" }], pairing: "AMERICANO PUNK", focus: { spread: 14, x: 1230, y: 145, r: 115 } },
  { id: "canele", name: "Canelé", spread: 14, description: "Textura crujiente por fuera y suave por dentro, elaborado sin azúcar añadida.", prices: [{ value: "$3,290" }], pairing: "ESPRESSO PUNK" },

  // Sándwiches — spread 15 (28-29)
  { id: "croissant-serrano", name: "Croissant con jamón serrano", spread: 15, description: "Croissant con mozzarella, jamón serrano, rúcula y reducción de balsámico, acompañado de chips.", prices: [{ value: "$9,790" }], pairing: "ESPRESSO TONIC", focus: { spread: 15, x: 630, y: 265, r: 135 } },
  { id: "croissant-jamon-queso", name: "Croissant con jamón y queso", spread: 15, description: "Croissant horneado con jamón y queso mozzarella, acompañado de chips.", prices: [{ value: "$6,990" }], pairing: "ESPRESSO NARANJA", focus: { spread: 15, x: 340, y: 690, r: 140 } },
  { id: "croissant-salmon", name: "Croissant de salmón ahumado", spread: 15, description: "Croissant con salmón ahumado, palta, queso fresco, mix de lechugas y aderezo de limón, acompañado de chips.", prices: [{ value: "$9,990" }], pairing: "FILTRADO PUNK", focus: { spread: 15, x: 530, y: 490, r: 150 } },
  { id: "sandwich-pollo", name: "Sándwich de pollo", spread: 15, description: "Focaccia con pollo, tomate al horno, mozzarella, palta y rúcula. Acompañado de chips y dip de queso.", prices: [{ value: "$11,790" }], focus: { spread: 15, x: 990, y: 300, r: 160 } },
  { id: "sandwich-pastrami", name: "Sándwich de pastrami", spread: 15, description: "Focaccia con pesto, pastrami, tomate al horno, mozzarella, palta y rúcula. Acompañado de chips y dip de queso.", prices: [{ value: "$11,790" }], focus: { spread: 15, x: 1135, y: 180, r: 125 } },
  { id: "sandwich-vegetariano", name: "Sándwich vegetariano", spread: 15, description: "Focaccia con pesto, palta, tomate al horno, rúcula, champiñones salteados y mozzarella. Acompañado de chips y dip de queso.", prices: [{ value: "$8,990" }], pairing: "COLD BREW", focus: { spread: 15, x: 905, y: 140, r: 120 } },

  // Tostadas — spread 16 (30-31)
  { id: "tostada-serrano-durazno", name: "Jamón serrano y durazno", spread: 16, description: "Tostada con burrata, jamón serrano, duraznos asados y balsámico.", prices: [{ value: "$8,290" }], focus: { spread: 16, x: 580, y: 680, r: 135 } },
  { id: "tostada-vegetariana", name: "Vegetariana", spread: 16, description: "Tostada con betarraga y champiñones sobre una base suave de pimentón y zanahoria, pesto de albahaca, almendras laminadas y brotes.", prices: [{ value: "$7,590" }], pairing: "COLD BREW", focus: { spread: 16, x: 125, y: 445, r: 125 } },
  { id: "tostada-palta-salmon", name: "Palta con salmón ahumado", spread: 16, description: "Tostada con pesto, palta y salmón ahumado.", prices: [{ value: "$8,890" }], focus: { spread: 16, x: 865, y: 80, r: 120 } },
  { id: "huevos-benedictinos", name: "Huevos benedictinos con salmón", spread: 16, description: "Tostada con salmón ahumado, huevos pochados, tocino, palta, salsa holandesa y brotes.", prices: [{ value: "$10,990" }], focus: { spread: 16, x: 340, y: 575, r: 130 } },
  { id: "tostada-palta-tomates", name: "Palta con tomates", spread: 16, description: "Tostada con pesto, palta, tomates asados, tocino y huevo frito.", prices: [{ value: "$7,590" }], focus: { spread: 16, x: 1270, y: 280, r: 130 } },
  { id: "huevos-fritos-tocino", name: "Huevos fritos con tocino", spread: 16, description: "Tostada con huevos fritos, tocino, palta y tomates al horno.", prices: [{ value: "$8,990" }], focus: { spread: 16, x: 1070, y: 165, r: 130 } },
  { id: "french-toast", name: "French Toast", spread: 16, description: "Tostadas acompañadas de frutas de temporada y miel natural.", prices: [{ value: "$8,590" }], pairing: "CAPPUCCINO PAZ", focus: { spread: 16, x: 1140, y: 610, r: 150 } },

  // Bowls — spread 17 (32-33)
  { id: "bowl-vegetariano", name: "Vegetariano", spread: 17, description: "Mix de lechugas con verduras asadas, tomates cherry, semillas de zapallo, crutones de pan y vinagreta de mostaza y miel.", prices: [{ value: "$8,890" }], focus: { spread: 17, x: 535, y: 120, r: 125 } },
  { id: "bowl-green", name: "Green", spread: 17, description: "Mix de lechugas con pollo, palta, tomates cherry, maíz, crutones de pan, pesto y aderezo de cilantro.", prices: [{ value: "$9,990" }], pairing: "ESPRESSO TONIC", focus: { spread: 17, x: 535, y: 385, r: 125 } },
  { id: "bowl-salmon", name: "Salmón", spread: 17, description: "Mix de lechugas y rúcula con salmón, palta, mango, almendras, crutones de pan, pesto y limón.", prices: [{ value: "$12,290" }], focus: { spread: 17, x: 535, y: 650, r: 125 } },
  { id: "bowl-mediterraneo", name: "Mediterráneo", spread: 17, description: "Mix de lechugas con huevos de codorniz, tomates cherry, pepino, aceitunas, queso feta, cebolla morada, tocino, crutones de pan y aderezo de limón y orégano.", prices: [{ value: "$9,490" }], focus: { spread: 17, x: 1155, y: 125, r: 125 } },
  { id: "bowl-pastrami", name: "Pastrami", spread: 17, description: "Mix de lechugas y rúcula con pastrami, palta, mango, tomates cherry, almendras, crutones de pan y pesto.", prices: [{ value: "$11,390" }], pairing: "AMERICANO PAZ", focus: { spread: 17, x: 1160, y: 400, r: 125 } },
  { id: "bowl-caprese", name: "Caprese", spread: 17, description: "Mix de lechugas y rúcula con tomate, burrata, albahaca y salsa de aceto balsámico.", prices: [{ value: "$8,890" }], pairing: "AMERICANO PUNK", focus: { spread: 17, x: 1160, y: 655, r: 125 } },
];

/** The index on spread 3: each line jumps to a printed page. Rows are PDF points. */
export const CHILE_INDEX: { label: string; page: number; y: number }[] = [
  { label: "Coffee Program / Café tostado", page: 6, y: 188 },
  { label: "Filtrados", page: 8, y: 218 },
  { label: "A base de espresso", page: 10, y: 248 },
  { label: "Matcha Spirit", page: 14, y: 308 },
  { label: "Bebidas de autor", page: 16, y: 338 },
  { label: "Otras bebidas", page: 18, y: 368 },
  { label: "Huevos", page: 20, y: 428 },
  { label: "Parfait y granola", page: 22, y: 458 },
  { label: "Panadería", page: 24, y: 488 },
  { label: "Sándwiches", page: 28, y: 518 },
  { label: "Tostadas", page: 30, y: 548 },
  { label: "Bowls", page: 32, y: 578 },
  { label: "Glosario", page: 34, y: 638 },
];

/** Printed page number → PDF spread and side. Printed 6 is the left page of spread 4. */
export function printedToSpread(printed: number): { spread: number; side: "left" | "right" } {
  return { spread: Math.floor(printed / 2) + 1, side: printed % 2 === 0 ? "left" : "right" };
}

export const CHILE_SPREADS = 21;

/** Finds the drink a pairing names, so the pairing can open it. */
export function pairingTarget(pairing: string): ChileItem | undefined {
  const words = pairing.toLowerCase().replace(/\s+de\s+/g, " ").trim();
  const byName = (name: string) => CHILE_ITEMS.find((item) => item.name.toLowerCase() === name);
  if (words.startsWith("filtrado ")) return CHILE_ITEMS.find((item) => item.id === `fil-${words.split(" ")[1]}`);
  if (words.startsWith("cold brew invierno")) return byName("cold brew invierno");
  const first = words.split(" ").slice(0, words.startsWith("espresso ") && words.split(" ").length > 2 ? 2 : words.split(" ").length).join(" ");
  return byName(words) ?? byName(first) ?? byName(words.split(" ")[0] ?? "");
}
