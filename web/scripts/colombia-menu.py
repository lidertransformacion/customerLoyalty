"""Builds src/core/colombia-menu.ts from the new Colombian menu (Menú nuevo Colombia Libertario 2026, 29-oct-2026).

Source: scripts/data/menu-colombia-2026.csv, the print transcribed one row per product with its prices
and its photograph (`foto_final`), checked price by price against the PDF. Bogotá and Medellín serve it.
Run from web/ after editing the CSV:  python3 scripts/colombia-menu.py
"""
import csv
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "data", "menu-colombia-2026.csv")
TARGET = os.path.join(os.path.dirname(HERE), "src", "core", "colombia-menu.ts")

# The print's sections, as chapters in the Chile layout's order: id, name, intro, English name, English intro.
CHAPTERS = [
    ("co-coffee", "Café tostado", "Para llevar y regalar.", "Roasted coffee", "To take home and to give."),
    ("co-formats", "Drip Coffee y Cápsulas", "Otras formas de disfrutar Libertario.", "Drip Coffee and Capsules", "Other ways to enjoy Libertario."),
    ("co-filter", "Filtrados", "Chemex, Origami o V60.", "Filter coffee", "Chemex, Origami or V60."),
    ("co-espresso", "A base de espresso", "Signature Blend o Single Origin. Bebida vegetal + $4.000.", "Espresso drinks", "Signature Blend or Single Origin. Plant-based milk + $4,000."),
    ("co-cold", "Espresso frío y cold brew", "Con hielo, helado o extracción en frío.", "Iced espresso and cold brew", "Over ice, over ice cream, or cold-extracted."),
    ("co-matcha", "Matcha Spirit", "Frío o caliente.", "Matcha Spirit", "Iced or hot."),
    ("co-signature", "Freedom Drinks", "Un espacio creativo para experimentar con nuestro café.", "Freedom Drinks", "A creative space to experiment with our coffee."),
    ("co-other", "Otras bebidas", "Calientes, sodas, chai y fríos.", "Other drinks", "Hot drinks, sodas, chai and cold drinks."),
    ("co-cocktails", "Cócteles", "Cócteles y shots.", "Cocktails", "Cocktails and shots."),
    ("co-eggs", "Huevos", "All-day breakfast.", "Eggs", "All-day breakfast."),
    ("co-parfait", "Parfait y granola", "Yogur griego, fruta y granola.", "Parfait and granola", "Greek yogurt, fruit and granola."),
    ("co-bakery", "Panadería", "Pandebonos, pandeyuca y croissants.", "Bakery", "Pandebonos, pandeyuca and croissants."),
    ("co-cakes", "Postres", "Tortas de la casa.", "Desserts", "House cakes."),
    ("co-cookies", "Galletas", "Recién horneadas.", "Cookies", "Freshly baked."),
    ("co-sandwiches", "Sándwiches", "Acompañados de chips y dip.", "Sandwiches", "Served with chips and dip."),
    ("co-toast", "Tostadas", "Sobre pan de masa madre o brioche.", "Toasts", "On sourdough or brioche."),
    ("co-soup", "Crema", "Crema de tomate de la casa.", "Soup", "House tomato soup."),
    ("co-bowls", "Bowls", "Lo mejor de la temporada.", "Bowls", "The best of the season."),
    ("co-extras", "Adiciones", "Se suman a tu plato o a tu bebida.", "Add-ons", "Added to your plate or your drink."),
]


def chapter_of(category: str) -> str | None:
    c = category.lower()
    if c.startswith("café tostado"):
        return "co-coffee"
    if c.startswith("otras formas"):
        return "co-formats"
    if c.startswith("filtrados"):
        return "co-filter"
    if c.startswith("a base de espresso - caliente"):
        return "co-espresso"
    if c.startswith("a base de espresso - frío"):
        return "co-cold"
    if c.startswith("matcha"):
        return "co-matcha"
    if c.startswith("freedom"):
        return "co-signature"
    if "cócteles" in c:
        return "co-cocktails"
    if c.startswith("otras bebidas"):
        return "co-other"
    if "adiciones" in c:
        return "co-extras"
    if c.startswith("huevos"):
        return "co-eggs"
    if c.startswith("parfait"):
        return "co-parfait"
    if c.startswith("panadería - postres"):
        return "co-cakes"
    if c.startswith("panadería") or c.startswith("croissants"):
        return "co-bakery"
    if c.startswith("galletas"):
        return "co-cookies"
    if c.startswith("sándwiches"):
        return "co-sandwiches"
    if c.startswith("tostadas"):
        return "co-toast"
    if c.startswith("crema"):
        return "co-soup"
    if c.startswith("bowls"):
        return "co-bowls"
    raise SystemExit(f"no chapter for {category!r}")


# The print names some products only under their section ("Turcos" under Huevos): the full name, and English.
NAMES = {
    "chai-tradicional": ("Chai tradicional", "Traditional chai"),
    "chai-chocolate": ("Chai de chocolate", "Chocolate chai"),
    "golden-milk": ("Chai golden milk", "Golden milk chai"),
    "carbon-activado": ("Chai de carbón activado", "Activated charcoal chai"),
    "soda-frutos-rojos": ("Soda de frutos rojos", "Red berry soda"),
    "soda-maracuya": ("Soda de maracuyá", "Passion fruit soda"),
    "huevos-tomatillos-verdes": ("Huevos tomatillos verdes", "Green tomatillo eggs"),
    "huevos-turcos": ("Huevos turcos", "Turkish eggs"),
    "huevos-con-chilaquiles": ("Huevos con chilaquiles", "Eggs with chilaquiles"),
    "huevos-con-tocineta": ("Huevos con tocineta", "Eggs with bacon"),
    "huevos-gratinados": ("Huevos gratinados", "Baked eggs au gratin"),
    "huevos-al-gusto": ("Huevos al gusto", "Eggs your way"),
    "croissant-sencillo": ("Croissant sencillo", "Plain croissant"),
    "croissant-almendra": ("Croissant de almendra", "Almond croissant"),
    "croissant-crema-de-avellanas": ("Croissant de crema de avellanas", "Hazelnut cream croissant"),
    "croissant-pistacho": ("Croissant de pistacho", "Pistachio croissant"),
    "galleta-brownie": ("Galleta brownie", "Brownie cookie"),
    "galleta-chips-de-chocolate": ("Galleta de chips de chocolate", "Chocolate chip cookie"),
    "galleta-healthy-de-chocolate": ("Galleta healthy de chocolate", "Healthy chocolate cookie"),
    "sandwich-de-croissant": ("Sándwich de croissant", "Croissant sandwich"),
    "sandwich-quesos": ("Sándwich de quesos", "Cheese sandwich"),
    "sandwich-jamon-serrano": ("Sándwich de jamón serrano", "Serrano ham sandwich"),
    "sandwich-pollo": ("Sándwich de pollo", "Chicken sandwich"),
    "tostada-caprese": ("Tostada caprese", "Caprese toast"),
    "tostada-aguacate": ("Tostada de aguacate", "Avocado toast"),
    "tostada-jamon-serrano": ("Tostada de jamón serrano", "Serrano ham toast"),
    "tostada-salmon": ("Tostada de salmón", "Salmon toast"),
    "crema-de-tomate": ("Crema de tomate", "Tomato soup"),
    "bowl-vegetariano": ("Bowl vegetariano", "Vegetarian bowl"),
    "bowl-pollo": ("Bowl de pollo", "Chicken bowl"),
    "bowl-jamon-serrano": ("Bowl de jamón serrano", "Serrano ham bowl"),
    "bowl-salmon": ("Bowl de salmón", "Salmon bowl"),
    "adicion-tocineta": ("Tocineta", "Bacon"),
    "adicion-burrata": ("Burrata (30 g)", "Burrata (30 g)"),
    "adicion-pan-de-masa-madre": ("Pan de masa madre", "Sourdough bread"),
    "adicion-pan-focaccia": ("Pan focaccia", "Focaccia bread"),
    "adicion-aguacate": ("Aguacate", "Avocado"),
    "adicion-jamon-serrano": ("Jamón serrano", "Serrano ham"),
    "adicion-pollo": ("Pollo", "Chicken"),
    "adicion-salmon": ("Salmón", "Salmon"),
    "adicion-zumo-de-limon": ("Zumo de limón", "Lemon juice"),
    "adicion-jugo-de-naranja": ("Jugo de naranja", "Orange juice"),
    "leche-vegetal": ("Leche vegetal", "Plant-based milk"),
    "leche-deslactosada": ("Leche deslactosada", "Lactose-free milk"),
    "totopos": ("Totopos", "Tortilla chips"),
    "te-verde": ("Té verde", "Green tea"),
    "infusion-de-frutos-rojos": ("Infusión de frutos rojos", "Red berry infusion"),
    "infusion-de-frutos-amarillos": ("Infusión de frutos amarillos", "Yellow fruit infusion"),
    "agua-con-gas": ("Agua con gas", "Sparkling water"),
    "agua-sin-gas": ("Agua sin gas", "Still water"),
    "jugo-natural": ("Jugo natural", "Fresh juice"),
    "pastel-de-arequipe": ("Pastel de arequipe", "Arequipe pastry"),
    "arepa-de-queso": ("Arepa de queso", "Cheese arepa"),
    "palito-de-queso": ("Palito de queso", "Cheese stick"),
    "mini-pandebonos": ("Mini pandebonos", "Mini pandebonos"),
    "volcan-de-chocolate": ("Volcán de chocolate", "Chocolate lava cake"),
    "torta-de-zanahoria": ("Torta de zanahoria", "Carrot cake"),
    "torta-de-almojabana": ("Torta de almojábana", "Almojábana cake"),
    "torta-de-almojabana-sin-azucar": ("Torta de almojábana sin azúcar", "Sugar-free almojábana cake"),
    "cheesecake-de-arequipe": ("Cheesecake de arequipe", "Arequipe cheesecake"),
    "cheesecake-de-agraz": ("Cheesecake de agraz", "Agraz cheesecake"),
    "chocolate": ("Chocolate", "Hot chocolate"),
    "bowl-de-granola": ("Bowl de granola", "Granola bowl"),
    "waffle-de-avena": ("Waffle de avena", "Oat waffle"),
    "parfait-de-frutos-amarillos": ("Parfait de frutos amarillos", "Yellow fruit parfait"),
    "parfait-de-frutos-rojos": ("Parfait de frutos rojos", "Red berry parfait"),
    "cold-brew-en-lata": ("Cold Brew en lata", "Canned cold brew"),
    "three-pack-cold-brew": ("Three Pack Cold Brew", "Cold brew three-pack"),
    "capsulas": ("Cápsulas", "Capsules"),
}

# The same product printed under several sections (the add-ons, sparkling water): one entry, where it first reads best.
SKIP = {("co-extras", "agua-con-gas")}

LABEL_EN = {"1 taza": "1 cup", "2 tazas": "2 cups", "3 tazas": "3 cups"}

money = lambda text: int(text.replace(".", ""))


def lines_of(price: str):
    """'200 g $34.200 / 340 g $46.200' → [('200 g', 34200), …]; 'Signature Blend $9.200 / Single Origin $10.200' keeps those labels."""
    if not price.strip():
        return [(None, 0)]
    out = []
    for part in price.split("/"):
        match = re.match(r"\s*(.*?)\s*\$([\d.]+)\s*$", part)
        if not match:
            raise SystemExit(f"price not understood: {price!r}")
        out.append((match.group(1) or None, money(match.group(2))))
    return out


def main():
    rows = list(csv.DictReader(open(SOURCE, encoding="utf-8-sig")))
    products = []
    seen = set()
    kinds = {}  # profile -> (trait, origin), from the roasted coffee rows; the filter rows share them
    for row in rows:
        slug = row["slug"]
        chapter = chapter_of(row["categoria"])
        if (chapter, slug) in SKIP or slug in seen:
            continue
        seen.add(slug)
        raw = row["nombre"].strip()
        profile = None
        description = row["descripcion"].strip()
        # "PAZ (Balanceado & Acaramelado, Signature Blend)": the name, then what it is
        bag = re.match(r"^([A-Z]+) \((.+)\)$", raw)
        if bag:
            raw, kind = bag.group(1), bag.group(2).split(", ")
            profile = raw
            kinds[profile] = (kind[0], kind[1])
        elif chapter == "co-filter":
            profile = raw.split()[-1]
        name, name_en = NAMES.get(slug, (raw, raw))
        pairing = None
        found = re.search(r"\*Maridaje recomendado:\s*(.+)$", description)
        if found:
            pairing = found.group(1).strip().rstrip(".")
            description = description[: found.start()].strip()
        notes = row["notas"]
        tags = []
        if "Libre de Gluten" in notes:
            tags.append(("Libre de gluten.", "Gluten-free."))
        if "Libre de Azúcar" in notes:
            tags.append(("Libre de azúcar.", "Sugar-free."))
        description_en = row["descripcion_en"].strip()
        if pairing and description_en:
            description_en = re.sub(r"\*.*$", "", description_en).strip()
        photo = os.path.splitext(os.path.basename(row["foto_final"]))[0] if row["foto_final"].strip() else None
        products.append({
            "id": slug,
            "chapter": chapter,
            "name": name,
            "nameEn": name_en,
            "description": " ".join(filter(None, [description, *[t[0] for t in tags]])),
            "descriptionEn": " ".join(filter(None, [description_en, *[t[1] for t in tags]])),
            **({"pairing": pairing} if pairing else {}),
            **({"profile": profile} if profile else {}),
            **({"trait": kinds[profile][0], "origin": kinds[profile][1]} if profile in kinds else {}),
            "lines": [{**({"label": label} if label else {}), **({"labelEn": LABEL_EN[label]} if label in LABEL_EN else {}), "price": price} for label, price in lines_of(row["precio"])],
            **({"photo": photo} if photo else {}),
            "nuts": "Contiene Nueces" in notes,
        })
    order = {chapter[0]: i for i, chapter in enumerate(CHAPTERS)}
    # stable: the print's order inside a chapter. The CSV lists Esencia and Bruma first; the print (p. 17) opens with Into the Cloud.
    first = {"pistacho-crush": 0, "berry-cloud": 1, "maracuya-sun": 2, "vainilla-mood": 3}
    products.sort(key=lambda p: (order[p["chapter"]], first.get(p["id"], 9) if p["chapter"] == "co-signature" else 0))
    chapters = [{"id": c[0], "name": c[1], "intro": c[2], "en": [c[3], c[4]]} for c in CHAPTERS if any(p["chapter"] == c[0] for p in products)]

    body = [
        "/**",
        " * The new Colombian menu (Menú nuevo Colombia Libertario 2026, printed 29-oct-2026), served in Bogotá and Medellín.",
        " * Generated by scripts/colombia-menu.py from scripts/data/menu-colombia-2026.csv: edit the CSV and run it again.",
        " * Prices in Colombian pesos, VAT included, as printed. A line without a price reads «Pregunta en la barra».",
        " */",
        "export type CoLine = { label?: string; labelEn?: string; price: number };",
        "export type CoProduct = { id: string; chapter: string; name: string; nameEn: string; description: string; descriptionEn: string; pairing?: string; profile?: string; /** What the print says under a coffee profile: «Balanceado & Acaramelado», then «Signature Blend» or «Single Origin». */ trait?: string; origin?: string; lines: CoLine[]; photo?: string; nuts: boolean };",
        "export type CoChapter = { id: string; name: string; intro: string; en: [string, string] };",
        "",
        f"export const CO_CHAPTERS: CoChapter[] = {json.dumps(chapters, ensure_ascii=False, indent=2)};",
        "",
        f"export const CO_PRODUCTS: CoProduct[] = {json.dumps(products, ensure_ascii=False, indent=2)};",
        "",
    ]
    with open(TARGET, "w") as handle:
        handle.write("\n".join(body))
    photos = sorted({p["photo"] for p in products if "photo" in p})
    print(f"{len(products)} products in {len(chapters)} chapters; {len(photos)} photographs")
    print("PHOTOS " + " ".join(photos))


main()
