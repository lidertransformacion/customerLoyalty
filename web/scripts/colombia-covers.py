"""Chapter covers of the Colombian menu, without their ground: one product per chapter, cut off the white
of its studio photograph with its plate (the same cut as the Chile covers: BiRefNet's mask joined with
everything crisp edges enclose, see chile-studio-cut.py), published with alpha at
public/menu/co/co-cover-<chapter>-<VER>.webp (480 px) and @2x (1100 px), listed in src/core/colombia-covers.ts.
The index floats it on the chapter card; the chapter sheet opens with it.

Usage, from web/:  python scripts/colombia-covers.py <folder with the studio PNGs>
Environment: VER (default v1), PREVIEW=1 (writes the cuts to print/covers-co/ on grey, publishes nothing).
Needs Python 3.12 with "rembg[cpu]", opencv-python-headless and Pillow.
A replaced cover gets a new VER: the phones keep the old file 90 days under its old name.
"""
import importlib.util
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
OUT = os.path.join(WEB, "public", "menu", "co")
WORK = os.path.join(WEB, "print", "covers-co")
REGISTRY = os.path.join(WEB, "src", "core", "colombia-covers.ts")
VER = os.environ.get("VER", "v2")
PREVIEW = os.environ.get("PREVIEW") == "1"

# The product that stands for each chapter. Coffee and formats float their bags and boxes instead.
COVER_OF = {
    "co-filter": "filtrado-paz",
    "co-espresso": "cappuccino",
    "co-cold": "iced-latte",
    "co-matcha": "matcha-bloom",
    "co-signature": "pistacho-crush",
    "co-other": "soda-frutos-rojos",
    "co-cocktails": "patron-espresso-martini",
    "co-eggs": "huevos-turcos",
    "co-parfait": "parfait-de-frutos-rojos",
    "co-bakery": "croissant-almendra",
    "co-cakes": "torta-de-zanahoria",
    "co-cookies": "galleta-chips-de-chocolate",
    "co-sandwiches": "sandwich-de-croissant",
    "co-toast": "french-toast",
    "co-soup": "crema-de-tomate",
    "co-bowls": "bowl-salmon",
    "co-extras": "adicion-tocineta",
}

# Round plates whose rim is almost white: the edge cut bites the rim, so the plate is an ellipse fitted to its lower arc.
ELLIPSE = {"co-toast"}

# Chapters without a product photograph: a cut from the chapter's own photograph, glasses only (no plate, the ground is grey).
FROM_PHOTO: dict[str, str] = {}

spec = importlib.util.spec_from_file_location("chile_cut", os.path.join(HERE, "chile-studio-cut.py"))
chile_cut = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chile_cut)


def ellipse_cut(original: Image.Image, saliency: Image.Image) -> Image.Image:
    """The food by saliency, joined with an ellipse fitted to the convex hull of the plate's lower arc (1.5 % inside it) for the lower half."""
    import cv2
    import numpy as np

    sal = (np.asarray(saliency.convert("L")) > 128).astype(np.uint8) * 255
    edged = (np.asarray(chile_cut.plate_cut(original, saliency)) > 128).astype(np.uint8) * 255
    plate = cv2.subtract(edged, sal)
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    points = max(contours, key=cv2.contourArea).reshape(-1, 2)
    top = np.percentile(np.where(plate.any(axis=1))[0], 15)
    (cx, cy), (w, h), angle = cv2.fitEllipse(cv2.convexHull(points[points[:, 1] > top]))
    mask = np.zeros_like(edged)
    cv2.ellipse(mask, ((cx, cy), (w * 0.985, h * 0.985), angle), 255, -1)
    # the ellipse only below its centre, where the rim was bitten; above, the food hides the back rim and the edge cut is right
    mask[: int(cy)] = edged[: int(cy)]
    return Image.fromarray(cv2.GaussianBlur(np.maximum(mask, sal), (5, 5), 0), "L")


def main(source: str) -> None:
    from rembg import new_session, remove

    session = new_session("birefnet-general")
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    entries = []
    jobs = [(chapter, os.path.join(source, f"{slug}.png"), "ellipse" if chapter in ELLIPSE else "plate") for chapter, slug in COVER_OF.items()]
    jobs += [(chapter, path, "saliency") for chapter, path in FROM_PHOTO.items()]
    for chapter, path, plate in jobs:  # plate: "plate", "ellipse" or "saliency"
        slug = os.path.basename(path)
        original = Image.open(path).convert("RGB")
        mask = remove(original, session=session, only_mask=True, post_process_mask=True)
        alpha = ellipse_cut(original, mask) if plate == "ellipse" else chile_cut.plate_cut(original, mask) if plate == "plate" else mask.convert("L")
        rgba = original.convert("RGBA")
        rgba.putalpha(alpha)
        piece = rgba.crop(alpha.point(lambda a: 255 if a > 8 else 0).getbbox())
        if PREVIEW:
            ground = Image.new("RGBA", piece.size, (205, 196, 186, 255))
            ground.alpha_composite(piece)
            ground.convert("RGB").save(os.path.join(WORK, f"{chapter}.jpg"), quality=80)
            print("preview", chapter, slug, piece.size)
            continue
        native = min(1100, piece.width)
        for name, width, quality in ((f"co-cover-{chapter}-{VER}@2x.webp", 1100, 85), (f"co-cover-{chapter}-{VER}.webp", 480, 80)):
            width = min(width, piece.width)
            out = piece.resize((width, round(piece.height * width / piece.width)), Image.LANCZOS)
            out.save(os.path.join(OUT, name), "WEBP", quality=quality, alpha_quality=100, method=6)
        entries.append(f'  "{chapter}": {{ src: "/menu/co/co-cover-{chapter}-{VER}.webp", mood: "still", cutout: true, native: {native} }},')
        print("cover", chapter, "from", slug)
    if PREVIEW:
        return
    lines = [
        'import type { PhotoSpec } from "../motion/living-photo";',
        "",
        "/**",
        " * Chapter covers of the Colombian menu, cut off their ground with their plate (scripts/colombia-covers.py).",
        " * Generated: run the script again (with a new VER) rather than editing this file.",
        " */",
        "export const CO_COVERS: Record<string, PhotoSpec> = {",
        *entries,
        "};",
        "",
    ]
    with open(REGISTRY, "w") as handle:
        handle.write("\n".join(lines))


main(sys.argv[1])
