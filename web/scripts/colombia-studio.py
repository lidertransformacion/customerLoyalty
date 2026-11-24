"""Publishes the Colombian studio photographs (Drive folder «menu Colombia», November 2026).

Each <slug>.png (2048 px, on white, plate kept) becomes public/menu/co/co-p-<slug>.webp (640 px)
and co-p-<slug>@2x.webp (1200 px), and src/core/colombia-studio.ts lists them. Only the slugs
given are published: the ones the menu uses (`usedStudio()` in src/core/colombia.ts).

Usage, from web/:
  python colombia-studio.py <folder with the PNGs> <slug> [<slug> ...]
Needs Pillow with WebP.
"""
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
OUT = os.path.join(WEB, "public", "menu", "co")
REGISTRY = os.path.join(WEB, "src", "core", "colombia-studio.ts")

source, slugs = sys.argv[1], sorted(set(sys.argv[2:]))
os.makedirs(OUT, exist_ok=True)

missing = [slug for slug in slugs if not os.path.exists(os.path.join(source, f"{slug}.png"))]
if missing:
    sys.exit(f"missing in {source}: {', '.join(missing)}")

wide = set()
for slug in slugs:
    image = Image.open(os.path.join(source, f"{slug}.png")).convert("RGB")
    # a subject that spans the photograph but is under 45 % of its height: the product page shows it across the screen
    box = image.convert("L").point(lambda v: 255 if v < 238 else 0).getbbox()
    if box and (box[2] - box[0]) / image.width > 0.75 and (box[3] - box[1]) / image.height < 0.45:
        wide.add(slug)
    for name, width in ((f"co-p-{slug}@2x.webp", 1200), (f"co-p-{slug}.webp", 640)):
        out = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
        out.save(os.path.join(OUT, name), "WEBP", quality=80, method=6)

lines = [
    'import type { PhotoSpec } from "../motion/living-photo";',
    "",
    "/**",
    " * Studio photographs of the Colombian menu: square, on white, the plate kept (November 2026 set).",
    " * Published at /menu/co/co-p-<slug>.webp (640 px) and @2x (1200 px) by scripts/colombia-studio.py.",
    " * Generated: run the script again rather than editing this file. A photograph replaced later gets a",
    " * new name (-v2…), because the phones keep the old one 90 days under the old name.",
    " */",
    "export const CO_STUDIO_PHOTOS: Record<string, PhotoSpec> = {",
]
lines += [f'  "co-p-{slug}": {{ src: "/menu/co/co-p-{slug}.webp", mood: "still", studio: true, native: 1200{", wide: true" if slug in wide else ""} }},' for slug in slugs]
lines += ["};", ""]
with open(REGISTRY, "w") as handle:
    handle.write("\n".join(lines))
print(f"{len(slugs)} photographs published to {OUT}")
