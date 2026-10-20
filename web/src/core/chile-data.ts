/**
 * The Chile menu, from the printed "Menú nuevo Chile Libertario 2026".
 * Prices are Chilean pesos as printed. `focus` is where the product's photo
 * sits in the print (PDF spread, points), used to cut its own photograph.
 * `en` is the English name and description.
 */
export type ChilePrice = { label?: string; value: number };

export type ChileSource = {
  id: string;
  category: string;
  name: string;
  description?: string;
  en: [string, string?];
  prices: ChilePrice[];
  profile?: string;
  pairing?: string;
  vegan?: boolean;
  nuts?: boolean;
  focus?: { spread: number; x: number; y: number; r: number };
  /** Its photograph, when it is not the one at `focus` (a cut from `scripts/chile-photos.ts`). */
  photo?: string;
};

export type ChileChapter = { id: string; name: string; intro: string; en: [string, string]; photo: string };

/** Chapter order follows the printed index. `photo` is the key of its cut photograph. */
export const CHILE_CHAPTERS: ChileChapter[] = [
  { id: "cl-coffee", name: "Café tostado", intro: "Para llevar y regalar.", en: ["Roasted coffee", "To take home and to give."], photo: "cl-beans" },
  { id: "cl-filter", name: "Filtrados", intro: "Chemex, Origami o V60.", en: ["Filter coffee", "Chemex, Origami or V60."], photo: "cl-filter" },
  { id: "cl-espresso", name: "A base de espresso", intro: "Signature Blends o Single Origin.", en: ["Espresso drinks", "Signature Blends or Single Origin."], photo: "cl-espresso" },
  { id: "cl-cold", name: "Espresso frío y cold brew", intro: "Con hielo, tónica o extracción en frío.", en: ["Iced espresso and cold brew", "Over ice, with tonic, or cold-extracted."], photo: "cl-coldbrew" },
  { id: "cl-matcha", name: "Matcha Spirit", intro: "Frío o caliente.", en: ["Matcha Spirit", "Iced or hot."], photo: "cl-matcha" },
  { id: "cl-signature", name: "Bebidas de autor", intro: "Freedom Drinks y Trending Drinks.", en: ["Signature drinks", "Freedom Drinks and Trending Drinks."], photo: "cl-signature" },
  { id: "cl-other", name: "Otras bebidas", intro: "Calientes, sodas, tés y jugos.", en: ["Other drinks", "Hot drinks, sodas, teas and juices."], photo: "cl-juices" },
  { id: "cl-eggs", name: "Huevos", intro: "Desayuno todo el día.", en: ["Eggs", "Breakfast all day."], photo: "cl-eggs" },
  { id: "cl-parfait", name: "Parfait y granola", intro: "Yogur, fruta y granola.", en: ["Parfait and granola", "Yogurt, fruit and granola."], photo: "cl-waffle" },
  { id: "cl-cakes", name: "Pastelería", intro: "Tortas de la casa.", en: ["Cakes", "House cakes."], photo: "cl-cakes" },
  { id: "cl-bakery", name: "Panadería", intro: "Croissants y medialunas.", en: ["Bakery", "Croissants and medialunas."], photo: "cl-croissants" },
  { id: "cl-cookies", name: "Galletas y sin azúcar", intro: "Galletas de la casa, alfajor y canelé.", en: ["Cookies and sugar-free", "House cookies, alfajor and canelé."], photo: "cl-cookies" },
  { id: "cl-sandwiches", name: "Sándwiches", intro: "Acompañados de chips.", en: ["Sandwiches", "Served with chips."], photo: "cl-sandwiches" },
  { id: "cl-toast", name: "Tostadas", intro: "Sobre pan de masa madre.", en: ["Toasts", "On sourdough."], photo: "cl-toasts" },
  { id: "cl-bowls", name: "Bowls", intro: "Mix de lechugas y lo mejor de la temporada.", en: ["Bowls", "Mixed greens and the best of the season."], photo: "cl-bowls" },
];

const SB = "Signature Blends";
const SO = "Single Origin";
const v60 = { spread: 5, x: 440, y: 470, r: 230 };

export const CHILE_SOURCE: ChileSource[] = [
  // Café tostado
  { id: "paz", category: "cl-coffee", profile: "PAZ", name: "PAZ", description: "Balanceado & Acaramelado. PAZ es ese lugar conocido al que siempre quieres volver. Dulce, suave y consistente. Un café que simplemente se siente bien, todos los días.", en: ["PAZ", "Balanced & Caramel. PAZ is the familiar place you always want to come back to. Sweet, smooth and consistent. A coffee that simply feels good, every day."], prices: [{ label: "200 g", value: 15990 }, { label: "340 g", value: 26890 }, { label: "454 g", value: 33890 }], vegan: true },
  { id: "paz-decaf", category: "cl-coffee", profile: "PAZ", name: "PAZ descafeinado", description: "Balanceado & Acaramelado, sin cafeína.", en: ["PAZ decaf", "Balanced & Caramel, without caffeine."], prices: [{ label: "200 g", value: 18590 }, { label: "340 g", value: 32000 }, { label: "454 g", value: 39000 }], vegan: true },
  { id: "libre", category: "cl-coffee", profile: "LIBRE", name: "LIBRE", description: "Intenso & Afrutado. LIBRE comienza donde termina lo conocido. Más intensidad, más carácter y una invitación a explorar un poco más, taza a taza.", en: ["LIBRE", "Intense & Fruity. LIBRE starts where the familiar ends. More intensity, more character and an invitation to explore a little further, cup by cup."], prices: [{ label: "200 g", value: 17000 }, { label: "340 g", value: 28000 }, { label: "454 g", value: 37000 }], vegan: true },
  { id: "rock", category: "cl-coffee", profile: "ROCK", name: "ROCK", description: "Variedades Exóticas, Single Origin. Todo comienza en la genética. ROCK celebra el papel de la genética en los aromas, sabores y texturas de cada taza.", en: ["ROCK", "Exotic Varieties, Single Origin. It all starts with genetics. ROCK celebrates the role of genetics in the aromas, flavours and textures of every cup."], prices: [{ label: "200 g", value: 20000 }, { label: "340 g", value: 32000 }, { label: "454 g", value: 39990 }], vegan: true },
  { id: "punk", category: "cl-coffee", profile: "PUNK", name: "PUNK", description: "Procesos Experimentales, Single Origin. Cuando la fermentación abre nuevas posibilidades: hasta dónde puede llegar una variedad.", en: ["PUNK", "Experimental Processes, Single Origin. When fermentation opens new possibilities: how far a variety can go."], prices: [{ label: "340 g", value: 49000 }], vegan: true },

  // Filtrados
  { id: "fil-paz", category: "cl-filter", photo: "cl-filter", name: "Filtrado PAZ", description: "Balanceado & Acaramelado. Signature Blend.", en: ["PAZ filter", "Balanced & Caramel. Signature Blend."], prices: [{ label: "1 taza", value: 5790 }, { label: "2 tazas", value: 10900 }, { label: "3 tazas", value: 15800 }], vegan: true, focus: v60 },
  { id: "fil-libre", category: "cl-filter", photo: "bog-v60", name: "Filtrado LIBRE", description: "Intenso & Afrutado. Signature Blend.", en: ["LIBRE filter", "Intense & Fruity. Signature Blend."], prices: [{ label: "1 taza", value: 5790 }, { label: "2 tazas", value: 10900 }, { label: "3 tazas", value: 15800 }], vegan: true, focus: v60 },
  { id: "fil-rock", category: "cl-filter", photo: "ctg-chemex", name: "Filtrado ROCK", description: "Variedades Exóticas. Single Origin.", en: ["ROCK filter", "Exotic Varieties. Single Origin."], prices: [{ label: "1 taza", value: 6000 }, { label: "2 tazas", value: 11500 }, { label: "3 tazas", value: 17100 }], vegan: true, focus: v60 },
  { id: "fil-punk", category: "cl-filter", photo: "cl-v60-bloom", name: "Filtrado PUNK", description: "Procesos Experimentales. Single Origin.", en: ["PUNK filter", "Experimental Processes. Single Origin."], prices: [{ label: "1 taza", value: 6290 }, { label: "2 tazas", value: 11700 }, { label: "3 tazas", value: 17300 }], vegan: true, focus: v60 },

  // A base de espresso, caliente
  { id: "espresso", category: "cl-espresso", photo: "ctg-espresso", name: "Espresso", description: "Corto, con crema.", en: ["Espresso", "Short, with crema."], prices: [{ label: SB, value: 3000 }, { label: SO, value: 3590 }], vegan: true, focus: { spread: 6, x: 1235, y: 215, r: 95 } },
  { id: "americano", category: "cl-espresso", photo: "ctg-americano", name: "Americano", description: "Espresso con agua caliente.", en: ["Americano", "Espresso with hot water."], prices: [{ label: SB, value: 3790 }, { label: SO, value: 4290 }], vegan: true, focus: { spread: 6, x: 1133, y: 510, r: 95 } },
  { id: "cappuccino", category: "cl-espresso", photo: "ctg-cappuccino", name: "Cappuccino", description: "Espresso con leche vaporizada y espuma.", en: ["Cappuccino", "Espresso with steamed milk and foam."], prices: [{ label: SB, value: 4590 }, { label: SO, value: 5000 }], focus: { spread: 6, x: 375, y: 430, r: 125 } },
  { id: "latte", category: "cl-espresso", photo: "ctg-latte", name: "Latte", description: "Espresso con leche vaporizada.", en: ["Latte", "Espresso with steamed milk."], prices: [{ label: SB, value: 4690 }, { label: SO, value: 5190 }], focus: { spread: 6, x: 115, y: 420, r: 140 } },
  { id: "macchiato", category: "cl-espresso", photo: "ctg-macchiato", name: "Macchiato", description: "Espresso “manchado” con un toque de leche.", en: ["Macchiato", "Espresso “stained” with a touch of milk."], prices: [{ label: SB, value: 3690 }, { label: SO, value: 4190 }], focus: { spread: 6, x: 285, y: 640, r: 115 } },
  { id: "flat-white", category: "cl-espresso", photo: "ctg-flat-white", name: "Flat White", description: "Espresso con leche vaporizada y textura sedosa.", en: ["Flat White", "Espresso with silky steamed milk."], prices: [{ label: SB, value: 4890 }, { label: SO, value: 5390 }], focus: { spread: 6, x: 460, y: 545, r: 130 } },
  { id: "mocaccino", category: "cl-espresso", photo: "ctg-mocaccino", name: "Mocaccino", description: "Espresso, chocolate y leche vaporizada.", en: ["Mocaccino", "Espresso, chocolate and steamed milk."], prices: [{ label: SB, value: 5390 }, { label: SO, value: 5890 }], focus: { spread: 6, x: 290, y: 360, r: 120 } },

  // Frío
  { id: "cold-brew", category: "cl-cold", photo: "bog-cold-brew", name: "Cold Brew", description: "Café de extracción en frío.", en: ["Cold Brew", "Cold-extracted coffee."], prices: [{ label: SB, value: 4890 }], vegan: true, focus: { spread: 7, x: 350, y: 400, r: 300 } },
  { id: "aerocano", category: "cl-cold", photo: "bog-aerocano", name: "Aerocano", description: "Americano frío aireado.", en: ["Aerocano", "Aerated iced americano."], prices: [{ label: SB, value: 4290 }, { label: SO, value: 5290 }], vegan: true, focus: { spread: 7, x: 350, y: 240, r: 220 } },
  { id: "iced-cappuccino", category: "cl-cold", photo: "ctg-alquimia", name: "Iced Cappuccino", description: "Cappuccino servido frío con hielo.", en: ["Iced Cappuccino", "Cappuccino served cold over ice."], prices: [{ label: SB, value: 4990 }, { label: SO, value: 5490 }], focus: { spread: 9, x: 950, y: 610, r: 110 } },
  { id: "iced-latte", category: "cl-cold", photo: "cl-iced-latte", name: "Iced Latte", description: "Latte servido frío con hielo.", en: ["Iced Latte", "Latte served cold over ice."], prices: [{ label: SB, value: 4990 }, { label: SO, value: 5490 }], focus: { spread: 9, x: 950, y: 610, r: 110 } },
  { id: "affogato", category: "cl-cold", photo: "ctg-affogato", name: "Affogato", description: "Espresso servido sobre helado.", en: ["Affogato", "Espresso poured over ice cream."], prices: [{ label: SB, value: 5890 }, { label: SO, value: 6390 }], focus: { spread: 7, x: 350, y: 300, r: 260 } },
  { id: "espresso-tonic", category: "cl-cold", photo: "bog-esencia", name: "Espresso Tonic", description: "Espresso con agua tónica y hielo.", en: ["Espresso Tonic", "Espresso with tonic water and ice."], prices: [{ label: SB, value: 4990 }, { label: SO, value: 5490 }], vegan: true, focus: { spread: 7, x: 350, y: 240, r: 220 } },
  { id: "espresso-ginger", category: "cl-cold", photo: "bog-bruma", name: "Espresso Ginger Beer", description: "Espresso con ginger beer y hielo.", en: ["Espresso Ginger Beer", "Espresso with ginger beer and ice."], prices: [{ label: SB, value: 4990 }, { label: SO, value: 5490 }], vegan: true, focus: { spread: 7, x: 350, y: 240, r: 220 } },
  { id: "espresso-naranja", category: "cl-cold", photo: "ctg-esencia", name: "Espresso Naranja", description: "Jugo de naranja con espresso PAZ.", en: ["Orange Espresso", "Orange juice with PAZ espresso."], prices: [{ label: SB, value: 5290 }, { label: SO, value: 6390 }], vegan: true, focus: { spread: 9, x: 1170, y: 610, r: 110 } },

  // Matcha Spirit
  { id: "matcha", category: "cl-matcha", name: "Matcha", description: "Tradicional con leche.", en: ["Matcha", "Traditional, with milk."], prices: [{ value: 4990 }], focus: { spread: 8, x: 815, y: 520, r: 85 } },
  { id: "matcha-berry", category: "cl-matcha", name: "Matcha Berry", description: "Leche y frutos rojos.", en: ["Matcha Berry", "Milk and red berries."], prices: [{ value: 5590 }], focus: { spread: 8, x: 978, y: 505, r: 85 } },
  { id: "dirty-matcha", category: "cl-matcha", name: "Dirty Matcha", description: "Shot de espresso.", en: ["Dirty Matcha", "With a shot of espresso."], prices: [{ value: 5390 }], focus: { spread: 8, x: 897, y: 600, r: 85 } },
  { id: "matcha-lemon-spritz", category: "cl-matcha", name: "Matcha Lemon Spritz", description: "Limón y soda.", en: ["Matcha Lemon Spritz", "Lemon and soda."], prices: [{ value: 5590 }], vegan: true, focus: { spread: 8, x: 1195, y: 610, r: 90 } },
  { id: "matcha-maracuya", category: "cl-matcha", name: "Matcha de maracuyá y mango", description: "Salsas de maracuyá y mango con soda.", en: ["Passion fruit & mango matcha", "Passion fruit and mango with soda."], prices: [{ value: 5590 }], vegan: true, focus: { spread: 8, x: 1100, y: 540, r: 85 } },
  { id: "affomatcha", category: "cl-matcha", name: "Affomatcha", description: "Servido sobre helado.", en: ["Affomatcha", "Poured over ice cream."], prices: [{ value: 5890 }], focus: { spread: 8, x: 1015, y: 650, r: 90 } },

  // Bebidas de autor
  { id: "cold-brew-invierno", category: "cl-signature", photo: "cl-invierno", name: "Cold Brew Invierno", description: "Notas de panela, miel, canela y vainilla, con espuma de leche.", en: ["Winter Cold Brew", "Notes of panela, honey, cinnamon and vanilla, with milk foam."], prices: [{ value: 5590 }], focus: { spread: 9, x: 950, y: 610, r: 90 } },
  { id: "moca-menta", category: "cl-signature", photo: "cl-moca-menta", name: "Moca Menta", description: "Espresso PAZ con leche, chocolate y un refrescante toque de menta.", en: ["Mint Mocha", "PAZ espresso with milk, chocolate and a fresh touch of mint."], prices: [{ value: 5590 }], focus: { spread: 9, x: 845, y: 610, r: 90 } },
  { id: "hibisco", category: "cl-signature", photo: "cl-hibisco", name: "Hibisco", description: "Infusión de hibisco con naranja, limón y un refrescante toque de ginger beer.", en: ["Hibiscus", "Hibiscus infusion with orange, lemon and a fresh touch of ginger beer."], prices: [{ value: 3990 }], vegan: true, focus: { spread: 9, x: 160, y: 540, r: 220 } },
  { id: "te-de-flores", category: "cl-signature", photo: "cl-te-flores", name: "Té de flores", description: "Infusión de rooibos con frutos rojos y notas de pomelo.", en: ["Flower tea", "Rooibos infusion with red berries and notes of grapefruit."], prices: [{ value: 5990 }], vegan: true, focus: { spread: 9, x: 555, y: 550, r: 220 } },

  // Otras bebidas
  { id: "chocolate", category: "cl-other", photo: "ctg-chai-chocolate", name: "Chocolate", description: "Chocolate caliente.", en: ["Chocolate", "Hot chocolate."], prices: [{ value: 4890 }], focus: { spread: 19, x: 370, y: 540, r: 160 } },
  { id: "chai", category: "cl-other", photo: "ctg-chai", name: "Chai", description: "Chai latte especiado.", en: ["Chai", "Spiced chai latte."], prices: [{ value: 4890 }], focus: { spread: 19, x: 450, y: 330, r: 160 } },
  { id: "babyccino", category: "cl-other", photo: "bog-chai-mug", name: "Babyccino", description: "Leche vaporizada con espuma, sin café.", en: ["Babyccino", "Steamed milk with foam, no coffee."], prices: [{ value: 4990 }], focus: { spread: 6, x: 1235, y: 335, r: 95 } },
  { id: "golden-milk", category: "cl-other", photo: "ctg-chai-golden", name: "Golden Milk", description: "Leche vaporizada con cúrcuma y especias.", en: ["Golden Milk", "Steamed milk with turmeric and spices."], prices: [{ value: 4990 }], focus: { spread: 6, x: 1135, y: 385, r: 95 } },
  { id: "soda-frutos-rojos", category: "cl-other", photo: "ctg-soda-red", name: "Soda frutos rojos", description: "Soda saborizada con frutos rojos.", en: ["Red berry soda", "Soda flavoured with red berries."], prices: [{ value: 5700 }], vegan: true, focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "soda-maracuya", category: "cl-other", photo: "ctg-soda-yellow", name: "Soda maracuyá y mango", description: "Soda saborizada con maracuyá y mango.", en: ["Passion fruit & mango soda", "Soda flavoured with passion fruit and mango."], prices: [{ value: 5700 }], vegan: true, focus: { spread: 10, x: 495, y: 380, r: 150 } },
  { id: "te-jazmin", category: "cl-other", photo: "ctg-lumina", name: "Té jazmín", description: "Infusión de té de jazmín.", en: ["Jasmine tea", "Jasmine tea infusion."], prices: [{ value: 3600 }], vegan: true, focus: { spread: 19, x: 450, y: 330, r: 160 } },
  { id: "te-durazno", category: "cl-other", photo: "bog-lumina", name: "Té durazno", description: "Infusión de té de durazno.", en: ["Peach tea", "Peach tea infusion."], prices: [{ value: 3800 }], vegan: true, focus: { spread: 19, x: 450, y: 330, r: 160 } },
  { id: "infusion-frutos-rojos", category: "cl-other", photo: "cl-infusion-roja", name: "Infusión de frutos rojos", description: "Infusión fría de frutos rojos.", en: ["Red berry infusion", "Iced red berry infusion."], prices: [{ value: 3690 }], vegan: true, focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "infusion-flores", category: "cl-other", photo: "cl-infusion-flores", name: "Infusión de flores", description: "Infusión fría floral.", en: ["Flower infusion", "Iced floral infusion."], prices: [{ value: 3690 }], vegan: true, focus: { spread: 10, x: 630, y: 330, r: 130 } },
  { id: "jugo-naranja", category: "cl-other", name: "Jugo de naranja", description: "Jugo de naranja natural.", en: ["Orange juice", "Fresh orange juice."], prices: [{ value: 4000 }], vegan: true, focus: { spread: 10, x: 160, y: 540, r: 170 } },
  { id: "jugo-maracuya", category: "cl-other", name: "Jugo de maracuyá y mango", description: "Jugo de maracuyá y mango natural.", en: ["Passion fruit & mango juice", "Fresh passion fruit and mango juice."], prices: [{ value: 4590 }], vegan: true, focus: { spread: 10, x: 495, y: 380, r: 150 } },
  { id: "jugo-frutilla", category: "cl-other", name: "Jugo de frutilla", description: "Frutilla.", en: ["Strawberry juice", "Strawberry."], prices: [{ value: 4590 }], vegan: true, focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "jugo-frutos-rojos", category: "cl-other", name: "Jugo de frutos rojos", description: "Mix de frutos rojos.", en: ["Red berry juice", "Mixed red berries."], prices: [{ value: 4590 }], vegan: true, focus: { spread: 10, x: 330, y: 450, r: 150 } },
  { id: "limonada", category: "cl-other", photo: "cl-limonada", name: "Limonada tradicional", description: "Limón sutil.", en: ["Classic lemonade", "Gentle lemon."], prices: [{ value: 3590 }], vegan: true, focus: { spread: 10, x: 630, y: 330, r: 130 } },
  { id: "limonada-menta", category: "cl-other", photo: "bog-lemon-spritz", name: "Limonada de menta y jengibre", description: "Limón sutil, menta y jengibre.", en: ["Mint & ginger lemonade", "Gentle lemon, mint and ginger."], prices: [{ value: 3590 }], vegan: true, focus: { spread: 10, x: 630, y: 330, r: 130 } },
  { id: "tonic", category: "cl-other", photo: "bog-spritz", name: "Tonic Water clásica", description: "Agua tónica clásica.", en: ["Classic tonic water", "Classic tonic water."], prices: [{ value: 3490 }], vegan: true },
  { id: "ginger-beer", category: "cl-other", photo: "bog-carajillo", name: "Ginger beer clásica", description: "Ginger beer clásica.", en: ["Classic ginger beer", "Classic ginger beer."], prices: [{ value: 3490 }], vegan: true },
  { id: "kombucha", category: "cl-other", photo: "cl-kombucha", name: "Kombucha", description: "Kombucha.", en: ["Kombucha", "Kombucha."], prices: [{ value: 4290 }], vegan: true },

  // Huevos
  { id: "cacerola-criollos", category: "cl-eggs", name: "Cacerola de huevos criollos", description: "Huevos al gusto con palta, yogur griego, tomates asados y un toque de pimentón, acompañados de pan de masa madre o croissant.", en: ["Creole eggs skillet", "Eggs your way with avocado, Greek yogurt, roasted tomatoes and a touch of paprika, with sourdough or a croissant."], prices: [{ value: 8590 }], pairing: "LATTE PAZ", focus: { spread: 11, x: 560, y: 300, r: 140 } },
  { id: "cacerola-gratinados", category: "cl-eggs", name: "Cacerola de huevos gratinados", description: "Huevos al gusto con jamón serrano, tomates asados y queso gratinado, acompañados de pan de masa madre o croissant.", en: ["Gratin eggs skillet", "Eggs your way with serrano ham, roasted tomatoes and melted cheese, with sourdough or a croissant."], prices: [{ value: 8590 }], pairing: "FILTRADO ROCK", focus: { spread: 11, x: 470, y: 600, r: 160 } },
  { id: "cacerola-palta", category: "cl-eggs", name: "Cacerola de huevos con palta", description: "Huevos al gusto con tomates al horno, pastrami, palta y brotes, acompañados de pan de masa madre o croissant.", en: ["Eggs skillet with avocado", "Eggs your way with baked tomatoes, pastrami, avocado and sprouts, with sourdough or a croissant."], prices: [{ value: 7590 }], pairing: "ESPRESSO NARANJA", focus: { spread: 11, x: 1215, y: 340, r: 150 } },
  { id: "cacerola-salmon", category: "cl-eggs", name: "Cacerola de salmón", description: "Huevos al gusto con tomates al horno, salmón, queso crema y espinaca, acompañados de pan de masa madre o croissant.", en: ["Salmon skillet", "Eggs your way with baked tomatoes, salmon, cream cheese and spinach, with sourdough or a croissant."], prices: [{ value: 8990 }], pairing: "AEROCANO", focus: { spread: 11, x: 1080, y: 610, r: 160 } },

  // Parfait y granola
  { id: "parfait", category: "cl-parfait", name: "Parfait", description: "Yogurt griego con fruta fresca y granola.", en: ["Parfait", "Greek yogurt with fresh fruit and granola."], prices: [{ value: 6990 }], pairing: "AMERICANO PAZ", nuts: true, focus: { spread: 12, x: 420, y: 455, r: 85 } },
  { id: "granola", category: "cl-parfait", name: "Granola", description: "Con yogurt, chocolate y fruta fresca.", en: ["Granola", "With yogurt, chocolate and fresh fruit."], prices: [{ value: 8990 }], pairing: "MOCACCINO PAZ", nuts: true, focus: { spread: 12, x: 225, y: 530, r: 130 } },
  { id: "bowl-frutas", category: "cl-parfait", name: "Bowl de frutas", description: "Smoothie de frutas de temporada, con granola, frutas frescas, miel y coco rallado.", en: ["Fruit bowl", "Seasonal fruit smoothie with granola, fresh fruit, honey and grated coconut."], prices: [{ value: 8990 }], pairing: "FILTRADO LIBRE", nuts: true, focus: { spread: 12, x: 500, y: 625, r: 135 } },
  { id: "waffle", category: "cl-parfait", name: "Waffle de frutas", description: "Waffle de avena con fruta fresca, almendras, yogur griego y ralladura de limón.", en: ["Fruit waffle", "Oat waffle with fresh fruit, almonds, Greek yogurt and lemon zest."], prices: [{ value: 7990 }], pairing: "MOCACCINO PAZ", nuts: true, focus: { spread: 12, x: 1000, y: 480, r: 260 } },

  // Pastelería
  { id: "pie-limon", category: "cl-cakes", name: "Pie de limón", description: "Pie de limón con merengue.", en: ["Lemon pie", "Lemon meringue pie."], prices: [{ value: 5490 }], pairing: "FILTRADO ROCK", focus: { spread: 13, x: 1285, y: 565, r: 110 } },
  { id: "torta-vasca", category: "cl-cakes", name: "Torta vasca", description: "Cheesecake vasco.", en: ["Basque cheesecake", "Basque burnt cheesecake."], prices: [{ value: 5990 }], pairing: "ESPRESSO PUNK", focus: { spread: 13, x: 615, y: 690, r: 110 } },
  { id: "tartaleta-manzana", category: "cl-cakes", name: "Tartaleta de manzana", description: "Tartaleta de manzana.", en: ["Apple tart", "Apple tart."], prices: [{ value: 5490 }], pairing: "FILTRADO PAZ", focus: { spread: 13, x: 1125, y: 450, r: 110 } },
  { id: "red-velvet", category: "cl-cakes", name: "Red Velvet", description: "Torta red velvet.", en: ["Red Velvet", "Red velvet cake."], prices: [{ value: 4990 }], pairing: "AMERICANO PUNK", focus: { spread: 13, x: 565, y: 470, r: 110 } },
  { id: "carrot-cake", category: "cl-cakes", name: "Carrot Cake", description: "Bizcocho húmedo y especiado de zanahoria, cubierto con frosting de queso crema.", en: ["Carrot Cake", "Moist spiced carrot cake topped with cream cheese frosting."], prices: [{ value: 4990 }], pairing: "AEROCANO", nuts: true, focus: { spread: 13, x: 505, y: 285, r: 110 } },
  { id: "cheesecake-oreo", category: "cl-cakes", name: "Cheesecake de Oreo", description: "Cheesecake de Oreo.", en: ["Oreo cheesecake", "Oreo cheesecake."], prices: [{ value: 5490 }], pairing: "MOCACCINO", focus: { spread: 13, x: 440, y: 95, r: 110 } },
  { id: "tiramisu", category: "cl-cakes", name: "Tiramisú", description: "Tiramisú de la casa.", en: ["Tiramisu", "House tiramisu."], prices: [{ value: 4990 }], pairing: "ESPRESSO PAZ", focus: { spread: 13, x: 1135, y: 215, r: 110 } },
  { id: "brownie", category: "cl-cakes", photo: "bog-brownie", name: "Brownie", description: "Brownie de chocolate.", en: ["Brownie", "Chocolate brownie."], prices: [{ value: 3790 }], pairing: "COLD BREW DE INVIERNO", focus: { spread: 13, x: 1300, y: 345, r: 100 } },
  { id: "brownie-helado", category: "cl-cakes", name: "Brownie con helado y mix de frutos rojos", description: "Brownie de chocolate intenso y húmedo, acompañado de helado y un mix de frutos rojos.", en: ["Brownie with ice cream and red berries", "Rich, moist chocolate brownie with ice cream and mixed red berries."], prices: [{ value: 6890 }], pairing: "FILTRADO LIBRE", focus: { spread: 13, x: 1300, y: 345, r: 100 } },
  { id: "volcan", category: "cl-cakes", photo: "bog-volcan", name: "Volcán de chocolate", description: "Volcán de chocolate con centro intenso y cremoso, acompañado de salsa de frutos rojos y una bola de helado.", en: ["Chocolate lava cake", "Chocolate lava cake with a rich, creamy centre, red berry sauce and a scoop of ice cream."], prices: [{ value: 6890 }], pairing: "FILTRADO LIBRE", focus: { spread: 13, x: 1300, y: 345, r: 100 } },

  // Panadería
  { id: "croissant", category: "cl-bakery", name: "Croissant", description: "Croissant con crema de avellanas, frutillas y almendras.", en: ["Croissant", "Croissant with hazelnut cream, strawberries and almonds."], prices: [{ value: 6990 }], pairing: "FILTRADO PUNK", nuts: true, focus: { spread: 14, x: 375, y: 565, r: 110 } },
  { id: "medialuna", category: "cl-bakery", name: "Medialuna", description: "Medialuna clásica.", en: ["Medialuna", "Classic medialuna."], prices: [{ value: 3000 }], pairing: "CAPPUCCINO PAZ", focus: { spread: 14, x: 610, y: 565, r: 110 } },
  { id: "medialuna-rellena", category: "cl-bakery", name: "Medialuna rellena", description: "Dulce de leche o crema pastelera.", en: ["Filled medialuna", "Dulce de leche or pastry cream."], prices: [{ value: 3990 }], pairing: "LATTE PAZ", focus: { spread: 14, x: 125, y: 565, r: 110 } },

  // Galletas y sin azúcar
  { id: "galletas", category: "cl-cookies", name: "Galletas", description: "Variedad de galletas: dulce de leche con nuez, limón y chocolate.", en: ["Cookies", "A variety of cookies: dulce de leche and walnut, lemon, and chocolate."], prices: [{ value: 4990 }], pairing: "FILTRADO PAZ con la de dulce de leche y nuez; FILTRADO ROCK con la de limón; COLD BREW DE INVIERNO con la de chocolate", nuts: true, focus: { spread: 14, x: 1100, y: 270, r: 250 } },
  { id: "alfajor", category: "cl-cookies", photo: "cl-cookie-chocolate", name: "Alfajor", description: "Brownie bañado en chocolate belga, relleno de manjar y frutos rojos. Sin azúcar.", en: ["Alfajor", "Brownie dipped in Belgian chocolate, filled with manjar and red berries. Sugar-free."], prices: [{ value: 3290 }], pairing: "AMERICANO PUNK", focus: { spread: 14, x: 1230, y: 145, r: 115 } },
  { id: "canele", category: "cl-cookies", photo: "cl-cookie-lemon", name: "Canelé", description: "Textura crujiente por fuera y suave por dentro, elaborado sin azúcar añadida.", en: ["Canelé", "Crisp outside and soft inside, made with no added sugar."], prices: [{ value: 3290 }], pairing: "ESPRESSO PUNK" },

  // Sándwiches
  { id: "croissant-serrano", category: "cl-sandwiches", name: "Croissant con jamón serrano", description: "Croissant con mozzarella, jamón serrano, rúcula y reducción de balsámico, acompañado de chips.", en: ["Serrano ham croissant", "Croissant with mozzarella, serrano ham, rocket and balsamic reduction, with chips."], prices: [{ value: 9790 }], pairing: "ESPRESSO TONIC", focus: { spread: 15, x: 630, y: 265, r: 135 } },
  { id: "croissant-jamon-queso", category: "cl-sandwiches", name: "Croissant con jamón y queso", description: "Croissant horneado con jamón y queso mozzarella, acompañado de chips.", en: ["Ham and cheese croissant", "Baked croissant with ham and mozzarella, with chips."], prices: [{ value: 6990 }], pairing: "ESPRESSO NARANJA", focus: { spread: 15, x: 340, y: 690, r: 140 } },
  { id: "croissant-salmon", category: "cl-sandwiches", name: "Croissant de salmón ahumado", description: "Croissant con salmón ahumado, palta, queso fresco, mix de lechugas y aderezo de limón, acompañado de chips.", en: ["Smoked salmon croissant", "Croissant with smoked salmon, avocado, fresh cheese, mixed greens and lemon dressing, with chips."], prices: [{ value: 9990 }], pairing: "FILTRADO PUNK", focus: { spread: 15, x: 530, y: 490, r: 150 } },
  { id: "sandwich-pollo", category: "cl-sandwiches", name: "Sándwich de pollo", description: "Focaccia con pollo, tomate al horno, mozzarella, palta y rúcula. Con chips y dip de queso.", en: ["Chicken sandwich", "Focaccia with chicken, baked tomato, mozzarella, avocado and rocket. With chips and cheese dip."], prices: [{ value: 11790 }], focus: { spread: 15, x: 990, y: 300, r: 160 } },
  { id: "sandwich-pastrami", category: "cl-sandwiches", name: "Sándwich de pastrami", description: "Focaccia con pesto, pastrami, tomate al horno, mozzarella, palta y rúcula. Con chips y dip de queso.", en: ["Pastrami sandwich", "Focaccia with pesto, pastrami, baked tomato, mozzarella, avocado and rocket. With chips and cheese dip."], prices: [{ value: 11790 }], focus: { spread: 15, x: 1135, y: 180, r: 125 } },
  { id: "sandwich-vegetariano", category: "cl-sandwiches", name: "Sándwich vegetariano", description: "Focaccia con pesto, palta, tomate al horno, rúcula, champiñones salteados y mozzarella. Con chips y dip de queso.", en: ["Vegetarian sandwich", "Focaccia with pesto, avocado, baked tomato, rocket, sautéed mushrooms and mozzarella. With chips and cheese dip."], prices: [{ value: 8990 }], pairing: "COLD BREW", focus: { spread: 15, x: 905, y: 140, r: 120 } },

  // Tostadas
  { id: "tostada-serrano", category: "cl-toast", name: "Jamón serrano y durazno", description: "Tostada con burrata, jamón serrano, duraznos asados y balsámico.", en: ["Serrano ham and peach", "Toast with burrata, serrano ham, roasted peaches and balsamic."], prices: [{ value: 8290 }], focus: { spread: 16, x: 580, y: 680, r: 135 } },
  { id: "tostada-vegetariana", category: "cl-toast", name: "Vegetariana", description: "Tostada con betarraga y champiñones sobre una base suave de pimentón y zanahoria, pesto de albahaca, almendras laminadas y brotes.", en: ["Vegetarian", "Toast with beetroot and mushrooms on a soft pepper and carrot base, basil pesto, sliced almonds and sprouts."], prices: [{ value: 7590 }], pairing: "COLD BREW", nuts: true, focus: { spread: 16, x: 125, y: 445, r: 125 } },
  { id: "tostada-palta-salmon", category: "cl-toast", name: "Palta con salmón ahumado", description: "Tostada con pesto, palta y salmón ahumado.", en: ["Avocado and smoked salmon", "Toast with pesto, avocado and smoked salmon."], prices: [{ value: 8890 }], focus: { spread: 16, x: 865, y: 80, r: 120 } },
  { id: "huevos-benedictinos", category: "cl-toast", name: "Huevos benedictinos con salmón", description: "Tostada con salmón ahumado, huevos pochados, tocino, palta, salsa holandesa y brotes.", en: ["Eggs Benedict with salmon", "Toast with smoked salmon, poached eggs, bacon, avocado, hollandaise and sprouts."], prices: [{ value: 10990 }], focus: { spread: 16, x: 340, y: 575, r: 130 } },
  { id: "tostada-palta-tomates", category: "cl-toast", name: "Palta con tomates", description: "Tostada con pesto, palta, tomates asados, tocino y huevo frito.", en: ["Avocado and tomatoes", "Toast with pesto, avocado, roasted tomatoes, bacon and a fried egg."], prices: [{ value: 7590 }], focus: { spread: 16, x: 1270, y: 280, r: 130 } },
  { id: "huevos-fritos-tocino", category: "cl-toast", name: "Huevos fritos con tocino", description: "Tostada con huevos fritos, tocino, palta y tomates al horno.", en: ["Fried eggs and bacon", "Toast with fried eggs, bacon, avocado and baked tomatoes."], prices: [{ value: 8990 }], focus: { spread: 16, x: 1070, y: 165, r: 130 } },
  { id: "french-toast", category: "cl-toast", name: "French Toast", description: "Tostadas acompañadas de frutas de temporada y miel natural.", en: ["French Toast", "With seasonal fruit and natural honey."], prices: [{ value: 8590 }], pairing: "CAPPUCCINO PAZ", focus: { spread: 16, x: 1140, y: 610, r: 150 } },

  // Bowls
  { id: "bowl-vegetariano", category: "cl-bowls", name: "Vegetariano", description: "Mix de lechugas con verduras asadas, tomates cherry, semillas de zapallo, crutones de pan y vinagreta de mostaza y miel.", en: ["Vegetarian", "Mixed greens with roasted vegetables, cherry tomatoes, pumpkin seeds, croutons and honey mustard vinaigrette."], prices: [{ value: 8890 }], focus: { spread: 17, x: 535, y: 120, r: 125 } },
  { id: "bowl-green", category: "cl-bowls", name: "Green", description: "Mix de lechugas con pollo, palta, tomates cherry, maíz, crutones de pan, pesto y aderezo de cilantro.", en: ["Green", "Mixed greens with chicken, avocado, cherry tomatoes, corn, croutons, pesto and coriander dressing."], prices: [{ value: 9990 }], pairing: "ESPRESSO TONIC", focus: { spread: 17, x: 535, y: 385, r: 125 } },
  { id: "bowl-salmon", category: "cl-bowls", name: "Salmón", description: "Mix de lechugas y rúcula con salmón, palta, mango, almendras, crutones de pan, pesto y limón.", en: ["Salmon", "Mixed greens and rocket with salmon, avocado, mango, almonds, croutons, pesto and lemon."], prices: [{ value: 12290 }], nuts: true, focus: { spread: 17, x: 535, y: 650, r: 125 } },
  { id: "bowl-mediterraneo", category: "cl-bowls", name: "Mediterráneo", description: "Mix de lechugas con huevos de codorniz, tomates cherry, pepino, aceitunas, queso feta, cebolla morada, tocino, crutones de pan y aderezo de limón y orégano.", en: ["Mediterranean", "Mixed greens with quail eggs, cherry tomatoes, cucumber, olives, feta, red onion, bacon, croutons and lemon-oregano dressing."], prices: [{ value: 9490 }], focus: { spread: 17, x: 1155, y: 125, r: 125 } },
  { id: "bowl-pastrami", category: "cl-bowls", name: "Pastrami", description: "Mix de lechugas y rúcula con pastrami, palta, mango, tomates cherry, almendras, crutones de pan y pesto.", en: ["Pastrami", "Mixed greens and rocket with pastrami, avocado, mango, cherry tomatoes, almonds, croutons and pesto."], prices: [{ value: 11390 }], pairing: "AMERICANO PAZ", nuts: true, focus: { spread: 17, x: 1160, y: 400, r: 125 } },
  { id: "bowl-caprese", category: "cl-bowls", name: "Caprese", description: "Mix de lechugas y rúcula con tomate, burrata, albahaca y salsa de aceto balsámico.", en: ["Caprese", "Mixed greens and rocket with tomato, burrata, basil and balsamic dressing."], prices: [{ value: 8890 }], pairing: "AMERICANO PUNK", focus: { spread: 17, x: 1160, y: 655, r: 125 } },
];

/** The key of an item's own photograph, cut from the print around its focus. */
export function focusKey(focus: { spread: number; x: number; y: number; r: number }): string {
  return `cl-${focus.spread}-${focus.x}-${focus.y}-${focus.r}`;
}
