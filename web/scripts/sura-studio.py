"""Publishes the Sura studio photographs (Drive folder «Menú Sura», November 2026).

Each photograph (square, on white, the plate kept) becomes public/menu/su/su-p-<slug>.webp (640 px)
and su-p-<slug>@2x.webp (its own size, up to 1200 px), and src/core/sura-studio.ts lists them. Its
ground is first brought to pure white, so it does not show as a box on the white sheet.

A slug written with a leading «+» also gets a cover: su-cover-<slug>.webp (600 px) and @2x, the same photograph with
its white turned transparent (the shadows stay, as soft greys), for the chapter cards and heroes.
It is meant for a white ground: a white plate lets the ground through.

Usage, from web/:
  python scripts/sura-studio.py <slug>=<file> [<slug>=<file> ...]
Needs Pillow with WebP and numpy. Every run rewrites the registry with what is in public/menu/su.
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
OUT = os.path.join(WEB, "public", "menu", "su")
REGISTRY = os.path.join(WEB, "src", "core", "sura-studio.ts")
os.makedirs(OUT, exist_ok=True)

def on_pure_white(image):
    """Stretches the levels so the ground the camera saw (the border's median, a little under white) reads 255."""
    pixels = np.asarray(image, dtype=np.float32)
    border = np.concatenate([pixels[:6].reshape(-1, 3), pixels[-6:].reshape(-1, 3), pixels[:, :6].reshape(-1, 3), pixels[:, -6:].reshape(-1, 3)])
    ground = np.median(border, axis=0) - 3
    return Image.fromarray(np.clip(pixels * (255.0 / ground), 0, 255).astype(np.uint8), "RGB")


def white_to_alpha(image):
    """White becomes transparent; everything else keeps its colour over what is behind (colour-to-alpha on white)."""
    pixels = np.asarray(image, dtype=np.float32) / 255.0
    alpha = (1.0 - pixels).max(axis=2)
    alpha[alpha < 0.02] = 0.0
    # a shadow that reaches the photograph's edge fades out over the last 7 % instead of ending in a straight line;
    # what is solid (a glass at the edge) keeps most of itself, since only the faint greys are faded fully
    height, width = alpha.shape
    reach = max(1, round(width * 0.07))
    ramp = np.minimum(np.arange(width), np.arange(width)[::-1]).clip(0, reach) / reach
    column = np.minimum(np.arange(height), np.arange(height)[::-1]).clip(0, reach) / reach
    edge = np.minimum(ramp[None, :], column[:, None])
    faint = np.clip((0.45 - alpha) / 0.45, 0, 1)
    alpha = alpha * (1 - faint * (1 - edge))
    safe = np.where(alpha > 0, alpha, 1.0)[..., None]
    colour = np.clip((pixels - (1.0 - alpha[..., None])) / safe, 0, 1)
    return Image.fromarray((np.dstack([colour, alpha]) * 255).round().astype(np.uint8), "RGBA")


for pair in sys.argv[1:]:
    slug, path = pair.split("=", 1)
    cover = slug.startswith("+")
    slug = slug.lstrip("+")
    image = on_pure_white(Image.open(path).convert("RGB"))
    if cover:
        cut = white_to_alpha(image)
        for name, width in ((f"su-cover-{slug}@2x.webp", min(1100, cut.width)), (f"su-cover-{slug}.webp", 600)):
            out = cut.resize((width, round(cut.height * width / cut.width)), Image.LANCZOS)
            out.save(os.path.join(OUT, name), "WEBP", quality=86, method=6)
    big = min(1200, image.width)
    for name, width in ((f"su-p-{slug}@2x.webp", big), (f"su-p-{slug}.webp", 640)):
        out = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
        out.save(os.path.join(OUT, name), "WEBP", quality=82, method=6)

lines = [
    'import type { PhotoSpec } from "../motion/living-photo";',
    "",
    "/**",
    " * Studio photographs of the Sura menu: square, on white, the plate kept (Drive folder «Menú Sura»).",
    " * Published at /menu/su/su-p-<slug>.webp (640 px) and @2x by scripts/sura-studio.py.",
    " * Generated: run the script again rather than editing this file.",
    " */",
    "export const SURA_STUDIO: Record<string, PhotoSpec> = {",
]
count = 0
for name in sorted(os.listdir(OUT)):
    if name.endswith("@2x.webp") or not name.endswith(".webp") or name.startswith("su-cover-"):
        continue
    key = name[: -len(".webp")]
    native = Image.open(os.path.join(OUT, f"{key}@2x.webp")).width
    lines.append(f'  "{key}": {{ src: "/menu/su/{name}", mood: "still", studio: true, native: {native} }},')
    count += 1
lines += [
    "};",
    "",
    "/** The same photographs with their white turned transparent, for chapter cards and heroes on a white ground. */",
    "export const SURA_COVERS: Record<string, PhotoSpec> = {",
]
for name in sorted(os.listdir(OUT)):
    if not name.startswith("su-cover-") or name.endswith("@2x.webp"):
        continue
    key = name[: -len(".webp")]
    native = Image.open(os.path.join(OUT, f"{key}@2x.webp")).width
    lines.append(f'  "{key}": {{ src: "/menu/su/{name}", mood: "still", cutout: true, studio: true, native: {native} }},')
lines += ["};", ""]
with open(REGISTRY, "w") as handle:
    handle.write("\n".join(lines))
print(f"{count} photographs in {REGISTRY}")
