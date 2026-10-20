"""Turns a transparent render of plates into web cut-outs.

With a centre point, keeps only the plate or glass that sits there (its
connected shape and its own soft shadow) and drops the neighbours that the
frame caught. Then trims the empty margin, writes name@2x.webp (1400 px) and
name.webp (800 px) with alpha, and prints the kept area as fractions of the
render, so the motion can be placed on the trimmed image.
Usage: python chile-cutout.py <render.png> <out dir> <name> [cx cy]
"""
import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

src, out, name = sys.argv[1], sys.argv[2], sys.argv[3]
centre = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else None
im = Image.open(src).convert("RGBA")
alpha = im.getchannel("A")

if centre:
    # work small: find the solid shape under the centre, ignoring faint shadows that touch neighbours
    scale = 400 / max(im.size)
    small = alpha.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.BILINEAR)
    # erode first so shapes that only touch at their shadows come apart
    solid = small.point(lambda a: 255 if a > 225 else 0).filter(ImageFilter.MinFilter(5))
    cx, cy = round(centre[0] * small.width), round(centre[1] * small.height)
    # the nearest solid pixel to the centre, in case the centre falls in a gap
    best = None
    for r in range(0, max(small.size)):
        for dx in range(-r, r + 1):
            for dy in (-r, r) if abs(dx) != r else range(-r, r + 1):
                x, y = cx + dx, cy + dy
                if 0 <= x < small.width and 0 <= y < small.height and solid.getpixel((x, y)) == 255:
                    best = (x, y)
                    break
            if best:
                break
        if best:
            break
    if best:
        ImageDraw.floodfill(solid, best, 128)
        keep = solid.point(lambda v: 255 if v == 128 else 0)
        # grow it to take back its soft edge and shadow, then feather
        # fill holes (glass, foam) by taking the shape's hull row by row, then grow back edge and shadow
        w, h = keep.size
        px = keep.load()
        for y in range(h):
            xs = [x for x in range(w) if px[x, y]]
            if xs:
                for x in range(xs[0], xs[-1] + 1):
                    px[x, y] = 255
        keep = keep.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(4))
        keep = keep.resize(im.size, Image.BILINEAR)
        im.putalpha(ImageChops.multiply(alpha, keep))

alpha = im.getchannel("A").point(lambda a: 255 if a > 10 else 0)
box = alpha.getbbox() or (0, 0, im.width, im.height)
pad = round(max(im.width, im.height) * 0.02)
l, t = max(0, box[0] - pad), max(0, box[1] - pad)
r, b = min(im.width, box[2] + pad), min(im.height, box[3] + pad)
cut = im.crop((l, t, r, b))
for suffix, width in (("@2x", 1400), ("", 800)):
    img = cut if cut.width <= width else cut.resize((width, round(cut.height * width / cut.width)), Image.LANCZOS)
    img.save(os.path.join(out, f"{name}{suffix}.webp"), "WEBP", quality=80, alpha_quality=85, method=6)
os.remove(src)
print(json.dumps({"l": l / im.width, "t": t / im.height, "r": r / im.width, "b": b / im.height}))
