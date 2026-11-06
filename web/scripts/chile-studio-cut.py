"""Reworks the Chile studio photographs (square, on white) for the menu.

cut   Cuts each photograph off its ground and sets it on white with a soft contact shadow, publishes it at
      640 px and @2x 1200 px under a version name (cl-p-<slug>-<VER>.webp), re-cuts the chapter cover from
      one of them (cl-cover-<chapter>-<VER>.webp, with alpha) and points chile-studio.ts and chile-covers.ts
      at the new names. The mask is BiRefNet's joined with everything enclosed by crisp edges: a plate has a
      crisp outline, a cast shadow does not, so a beige plate stays and the shadow goes. A white plate cannot
      be told from the white ground: keep those photographs instead.
keep  Publishes photographs as they are (the studio original, or a file someone cut by hand).
bags  Cuts the four coffee bags with alpha (cl-bag-<profile>-<VER>.webp, 713 px and @2x 1426 px).

Usage:
  python chile-studio-cut.py cut <chapter id> <cover slug or -> <slug>...     (a slug may be slug=/path/to/source.png)
  python chile-studio-cut.py keep <slug or slug=/path/to/file.png>...
  python chile-studio-cut.py bags
Environment: CHILE_PHOTOS (the studio folder; default the November 2026 delivery), VER (default v3), PREVIEW=1 (cut only, publish nothing).
Needs: python -m venv venv && venv/bin/pip install "rembg[cpu]" opencv-python-headless; ImageMagick (`magick`).
Every replaced file carries a new name, because the phones keep the old one 90 days under its old name.
Work files go to web/print/studio/ (not versioned); after a run: npx tsc --noEmit && npx vitest run.
"""
import os
import re
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUB = f"{W}/public/menu/cl"
WORK = f"{W}/print/studio"
M = os.environ.get("CHILE_PHOTOS", "/Users/santimurilloval/Documents/Libertario/menu/menuNuevoChile/Fotos carta Chile Libertario")
VER = os.environ.get("VER", "v3")
PREVIEW = os.environ.get("PREVIEW") == "1"
SIZE = 2048


def enclosed(rgb: np.ndarray, low=14, high=40, gap=3) -> np.ndarray:
    """Everything enclosed by strong edges: not reachable from the border without crossing one."""
    gray = cv2.GaussianBlur(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), (3, 3), 0)
    edges = cv2.dilate(cv2.Canny(gray, low, high), np.ones((gap, gap), np.uint8), iterations=1)
    h, w = edges.shape
    canvas = (edges == 0).astype(np.uint8)
    reach = np.zeros((h + 2, w + 2), np.uint8)
    for (x, y) in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if canvas[y, x] == 1:
            cv2.floodFill(canvas, reach, (x, y), 2)
    mask = np.where(canvas == 2, 0, 255).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    keep = np.zeros_like(mask)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= (h * w) * 0.0005:
            keep[labels == i] = 255
    return keep


def plate_cut(original: Image.Image, saliency: Image.Image) -> Image.Image:
    """Alpha for the object with its plate: saliency ∪ enclosed, holes filled, a soft edge from the distance to white."""
    rgb = np.asarray(original.convert("RGB"))
    sal = np.asarray(saliency.convert("L"))
    union = np.maximum(enclosed(rgb), np.where(sal > 128, 255, 0).astype(np.uint8))
    h, w = union.shape
    canvas = (union == 0).astype(np.uint8)
    cv2.floodFill(canvas, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    filled = np.where(canvas == 2, 0, 255).astype(np.uint8)
    dist = 255 - rgb.min(axis=2)
    ring = cv2.dilate(filled, np.ones((5, 5), np.uint8)) - filled
    soft = np.clip(dist.astype(np.float32) / 24.0, 0, 1) * 255
    alpha = np.where(ring > 0, soft, filled).astype(np.uint8)
    return Image.fromarray(cv2.GaussianBlur(alpha, (3, 3), 0), "L")


def compose(cut: Image.Image) -> Image.Image:
    """The cut-out at three quarters of a white square, over a soft elliptical contact shadow."""
    w, h = cut.size
    scale = min(SIZE * 0.74 / w, SIZE * 0.70 / h)
    obj = cut.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    ow, oh = obj.size
    x = (SIZE - ow) // 2
    y = round(SIZE * 0.5 - oh * 0.52)
    canvas = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
    shadow = Image.new("L", (SIZE, SIZE), 0)
    sw, sh = ow * 0.86, max(40, ow * 0.16)
    cx, cy = x + ow / 2, y + oh - sh * 0.35
    ImageDraw.Draw(shadow).ellipse((cx - sw / 2, cy - sh / 2, cx + sw / 2, cy + sh / 2), fill=255)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(24, ow * 0.045)))
    tint = Image.new("RGBA", (SIZE, SIZE), (29, 24, 18, 0))
    tint.putalpha(shadow.point(lambda a: int(a * 0.34)))
    canvas.alpha_composite(tint)
    canvas.alpha_composite(obj, (x, y))
    return canvas.convert("RGB")


def webp(src: str, dst: str, width: int, quality: int, alpha=False) -> None:
    extra = ["-define", "webp:alpha-quality=100"] if alpha else []
    subprocess.check_call(["magick", src, "-resize", f"{width}x{width}", "-quality", str(quality), *extra, dst])


def drop_old(prefix: str) -> None:
    for old in os.listdir(PUB):
        if re.fullmatch(rf"{re.escape(prefix)}(-v\d+)?(@2x)?\.webp", old) and f"-{VER}" not in old:
            os.remove(f"{PUB}/{old}")


def point_studio(studio: str, slug: str) -> str:
    out = re.sub(rf'"cl-p-{re.escape(slug)}": \{{ src: "/menu/cl/cl-p-{re.escape(slug)}(?:-v\d+)?\.webp"',
                 f'"cl-p-{slug}": {{ src: "/menu/cl/cl-p-{slug}-{VER}.webp"', studio)
    assert f"cl-p-{slug}-{VER}.webp" in out, f"no studio entry for {slug}"
    return out


def cut(chapter: str, cover_slug: str, args: list[str]) -> None:
    from rembg import new_session, remove
    session = new_session("birefnet-general")
    for d in ("cut", "after"):
        os.makedirs(f"{WORK}/{d}", exist_ok=True)
    slugs = []
    for arg in args:
        slug, _, source = arg.partition("=")
        slugs.append(slug)
        original = Image.open(source or f"{M}/{slug}.png").convert("RGB")
        alpha = plate_cut(original, remove(original, session=session, only_mask=True, post_process_mask=True))
        rgba = original.convert("RGBA")
        rgba.putalpha(alpha)
        piece = rgba.crop(alpha.getbbox())
        piece.save(f"{WORK}/cut/{slug}.png")
        compose(piece).save(f"{WORK}/after/{slug}.png")
        print("cut", slug, flush=True)
    if PREVIEW:
        return
    studio = open(f"{W}/src/core/chile-studio.ts").read()
    for slug in slugs:
        drop_old(f"cl-p-{slug}")
        webp(f"{WORK}/after/{slug}.png", f"{PUB}/cl-p-{slug}-{VER}.webp", 640, 82)
        webp(f"{WORK}/after/{slug}.png", f"{PUB}/cl-p-{slug}-{VER}@2x.webp", 1200, 80)
        studio = point_studio(studio, slug)
        print("published", slug)
    open(f"{W}/src/core/chile-studio.ts", "w").write(studio)
    if cover_slug != "-":
        drop_old(f"cl-cover-{chapter}")
        piece = f"{WORK}/cut/{cover_slug}.png"
        subprocess.check_call(["magick", piece, "-resize", "1100x", "-quality", "85", f"{PUB}/cl-cover-{chapter}-{VER}@2x.webp"])
        subprocess.check_call(["magick", piece, "-resize", "480x", "-quality", "80", f"{PUB}/cl-cover-{chapter}-{VER}.webp"])
        native = int(subprocess.check_output(["magick", "identify", "-format", "%w", f"{PUB}/cl-cover-{chapter}-{VER}@2x.webp"]).decode())
        covers = open(f"{W}/src/core/chile-covers.ts").read()
        covers = re.sub(rf'"{chapter}": \{{ src: "/menu/cl/cl-cover-{chapter}(?:-v\d+)?\.webp", mood: "[a-z]+"[^\n]*?, cutout: true, native: \d+ \}}',
                        f'"{chapter}": {{ src: "/menu/cl/cl-cover-{chapter}-{VER}.webp", mood: "still", cutout: true, native: {native} }}', covers)
        assert f"cl-cover-{chapter}-{VER}.webp" in covers
        open(f"{W}/src/core/chile-covers.ts", "w").write(covers)
        print("cover", chapter, "from", cover_slug, "native", native, "(run chile-studio-effects.py again if it is a drink)")


def keep(args: list[str]) -> None:
    studio = open(f"{W}/src/core/chile-studio.ts").read()
    for arg in args:
        slug, _, source = arg.partition("=")
        source = source or f"{M}/{slug}.png"
        drop_old(f"cl-p-{slug}")
        webp(source, f"{PUB}/cl-p-{slug}-{VER}.webp", 640, 82)
        webp(source, f"{PUB}/cl-p-{slug}-{VER}@2x.webp", 1200, 80)
        studio = point_studio(studio, slug)
        print("kept", slug, "from", os.path.basename(source))
    open(f"{W}/src/core/chile-studio.ts", "w").write(studio)


def bags() -> None:
    """The four bags: BiRefNet's mask tightened by a pixel, the white ground pulled out of the edge pixels."""
    from rembg import new_session, remove
    session = new_session("birefnet-general")
    os.makedirs(f"{WORK}/bags", exist_ok=True)
    for slug in ("paz", "libre", "rock", "punk"):
        original = Image.open(f"{M}/{slug}.png").convert("RGB")
        mask = np.asarray(remove(original, session=session, only_mask=True, post_process_mask=True)).astype(np.float32) / 255
        hard = cv2.erode((mask > 0.5).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=1)
        alpha = np.clip(cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 0.9), 0, 1)
        rgb = np.asarray(original).astype(np.float32)
        a = alpha[..., None]
        fg = np.clip(np.where(a > 0.02, (rgb - 255 * (1 - a)) / np.maximum(a, 0.02), rgb), 0, 255)
        im = Image.fromarray(np.dstack([fg, alpha * 255]).astype(np.uint8), "RGBA")
        im = im.crop(im.getbbox())
        png = f"{WORK}/bags/{slug}.png"
        im.save(png)
        drop_old(f"cl-bag-{slug}")
        subprocess.check_call(["magick", png, "-quality", "92", "-define", "webp:alpha-quality=100", f"{PUB}/cl-bag-{slug}-{VER}@2x.webp"])
        subprocess.check_call(["magick", png, "-resize", "50%", "-quality", "90", "-define", "webp:alpha-quality=100", f"{PUB}/cl-bag-{slug}-{VER}.webp"])
        print("bag", slug, im.size, "→ point CHILE_PACKS in core/photos.ts at", f"cl-bag-{slug}-{VER}.webp")


if __name__ == "__main__":
    mode, *rest = sys.argv[1:] or ["help"]
    if mode == "cut" and len(rest) >= 3:
        cut(rest[0], rest[1], rest[2:])
    elif mode == "keep" and rest:
        keep(rest)
    elif mode == "bags":
        bags()
    else:
        print(__doc__)
        sys.exit(1)
