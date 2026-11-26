"""Gives life to the Colombian studio photographs: steam over what is served hot, bubbles in what is fizzy,
condensation on cold glasses, filter coffee that drips, and for food steam, a window light and richer colour.
It measures each photograph (where its liquid is, where the plate is) and writes the result into
src/core/colombia-studio.ts. Run it after colombia-studio.py, which writes every photograph as still.
Usage, from web/:  python scripts/colombia-studio-effects.py [--debug]
(--debug also draws what it found to <scratch>/sheet.png given as the next argument). Needs Pillow and numpy."""
import importlib.util, json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
PUB = os.path.join(WEB, "public", "menu", "co")
REGISTRY = os.path.join(WEB, "src", "core", "colombia-studio.ts")
DEBUG = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None

# the measuring is the Chile script's: the same eye for both menus
_spec = importlib.util.spec_from_file_location("chile_fx", os.path.join(HERE, "chile-studio-effects.py"))
chile = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(chile)

HOT = {"macchiato", "flat-white", "cappuccino", "latte", "mocaccino", "espresso", "americano", "matcha-latte", "babyccino", "te-verde",
       "infusion-de-frutos-amarillos", "chocolate", "chai-tradicional", "chai-chocolate", "golden-milk", "carbon-activado"}
FIZZ = {"matcha-lemon-spritz", "agua-con-gas", "corona-cero", "happy-kombucha", "soda-frutos-rojos", "soda-maracuya", "lumina", "st-germain-spritz"}
COLD = {"affogato", "iced-cappuccino", "iced-latte", "matcha-bloom", "dirty-matcha", "strawberry-matcha", "pistacho-crush", "berry-cloud",
        "maracuya-sun", "vainilla-mood", "esencia", "bruma", "infusion-de-frutos-rojos", "agua-sin-gas", "jugo-natural", "carajillo",
        "patron-espresso-martini"} | FIZZ
# the dripper, its carafe, a bag, and (all but the competition one) a small cup on the left
# The scenes of the product pages (November 2026, second set): the dripper pouring into its carafe, and the bag.
POURING = {"filtrado-paz-v2", "filtrado-libre-v2", "filtrado-impacto-v2", "filtrado-rock-v2", "filtrado-punk-v2", "filtrado-competition-v2"}
# The first scene of PAZ, with a small cup on the left: it is still the cover of the chapter.
FILTER = POURING | {"filtrado-paz"}
# served hot: steam rises from the plate
HOT_FOOD = {"huevos-tomatillos-verdes", "huevos-turcos", "huevos-con-chilaquiles", "huevos-con-tocineta", "huevos-gratinados", "huevos-al-gusto",
            "sandwich-de-croissant", "sandwich-quesos", "sandwich-jamon-serrano", "sandwich-pollo", "french-toast", "crema-de-tomate",
            "waffle-de-avena", "volcan-de-chocolate", "bowl-pollo", "adicion-tocineta", "adicion-pollo"}
# out of the oven: a thinner steam
WARM = {"pastel-de-arequipe", "arepa-de-queso", "palito-de-queso", "pandeyuca", "mini-pandebonos", "croissant-sencillo", "croissant-almendra",
        "croissant-crema-de-avellanas", "croissant-pistacho", "adicion-pan-de-masa-madre", "adicion-pan-focaccia", "brownie", "galleta-brownie",
        "galleta-chips-de-chocolate", "galleta-healthy-de-chocolate"}
# everything else on a plate: the light and the colour, no steam
FOOD = {"tostada-caprese", "tostada-aguacate", "tostada-jamon-serrano", "tostada-salmon", "parfait-de-frutos-amarillos", "parfait-de-frutos-rojos",
        "chia-pudding", "bowl-de-granola", "torta-de-zanahoria", "torta-de-almojabana", "cheesecake-de-arequipe", "cheesecake-de-agraz",
        "torta-de-almojabana-sin-azucar", "bowl-vegetariano", "bowl-jamon-serrano", "bowl-salmon", "totopos", "adicion-burrata", "adicion-aguacate",
        "adicion-jamon-serrano", "adicion-salmon"} | HOT_FOOD | WARM

# what cannot be measured and was placed by eye on the photograph itself (percent of it):
# the syrup of the French toast runs down its front in three places and into the pool on the plate
BY_HAND = {
    "french-toast": {"oozes": [
        {"path": [{"x": 47.0, "y": 33.5}, {"x": 47.0, "y": 37.5}, {"x": 47.8, "y": 41.2}, {"x": 48.3, "y": 44.6}], "width": 1.9},
        {"path": [{"x": 53.0, "y": 49.6}, {"x": 53.0, "y": 54.5}, {"x": 53.2, "y": 59.0}, {"x": 53.4, "y": 62.6}], "width": 1.6},
        {"path": [{"x": 38.0, "y": 41.5}, {"x": 38.2, "y": 45.0}, {"x": 39.5, "y": 48.0}, {"x": 40.4, "y": 49.6}], "width": 1.5},
    ]},
}

chile.HOT, chile.FIZZ, chile.COLD = HOT | FILTER, FIZZ, COLD
chile.SCENE = FILTER - POURING
chile.DEBUG = False

def pct(v, total): return round(float(v) / total * 100, 1)

def subject(path):
    rgb = np.asarray(Image.open(path).convert("RGB"))
    obj = (255 - rgb.min(axis=2)) > 14
    ys, xs = np.where(obj)
    return rgb, (xs.min(), ys.min(), xs.max(), ys.max())

SURFACE = {"filtrado-paz": (1.7, 5.6), **{slug: (-4.3, 6.0) for slug in POURING}}

def drip(slug, path, scale=1.0):
    """Where the coffee in the carafe is: the dark body under the dripper. The drop falls onto its surface."""
    rgb, (x0, y0, x1, y1) = subject(path)
    H, W = rgb.shape[:2]; w = x1 - x0; h = y1 - y0
    dark = (rgb.max(axis=2) < 96)
    band = np.zeros_like(dark)
    # the carafe stands between the small cup and the bag; the competition scene has no cup and a black box on the right
    lo, hi = (0.02, 0.42) if slug in POURING else (0.2, 0.5)
    # only the lower half: the wet grounds up in the dripper are dark too
    band[y0 + int(h * 0.5):, x0 + int(w * lo):x0 + int(w * hi)] = True
    ys, xs = np.where(dark & band)
    if len(xs) < 200: return None
    # the middle of the coffee itself: of its lower half, so the leather tie and the small cup beside it do not pull it
    cx = float(np.median(xs[ys > np.median(ys)]))
    # its surface: down the middle column, the coffee is the tallest unbroken run of dark rows. A dark strap or the
    # rim of the cup above it are separate, shorter runs, and they used to lift the ring off the liquid.
    half = max(4, int(w * 0.035))
    column = dark[:, int(cx) - half:int(cx) + half + 1].mean(axis=1) > 0.6
    best, start = (0, 0), None
    for y in range(y0 + int(h * 0.5), min(H, y1 + 1)):
        if column[y] and start is None: start = y
        if (not column[y] or y == min(H, y1 + 1) - 1) and start is not None:
            if y - start > best[1] - best[0]: best = (start, y)
            start = None
    top, depth = float(best[0]), float(best[1] - best[0])
    if depth < h * 0.04: return None
    # The camera looks down into the carafe, so the surface is an oval: what was measured is one of its edges
    # (the far one in a Chemex, the near one where the coffee is clear on top). SURFACE moves the landing to the
    # middle of that oval, and says how far above it the drop starts so it is born under the dripper, inside the glass.
    # Both were read off each photograph, in percent of it.
    shift, rise = [v * scale for v in SURFACE.get(slug, (0.0, 6.0))]
    land = pct(top + depth * 0.04, H) + shift
    return {"from": {"x": pct(cx, W), "y": round(land - rise, 1)}, "to": {"x": pct(cx, W), "y": round(land, 1)}}

def glass(path, region):
    """The outline of the glass where the drink is, as a polygon in percent of the photograph: the drops, the frost
    and the bubbles stay inside it, so a wine glass sweats on its bowl and not around its stem.
    Row by row it takes the widest the glass is near the measured region; rows much narrower than the bowl
    (a stem, a foot) end the shape."""
    rgb = np.asarray(Image.open(path).convert("RGB"))
    H, W = rgb.shape[:2]
    obj = (255 - rgb.min(axis=2)) > 24      # not the paper, not the soft shadow on it
    rx0, ry0 = region["x"] / 100 * W, region["y"] / 100 * H
    rw, rh = region["w"] / 100 * W, region["h"] / 100 * H
    lo, hi = int(max(0, rx0 - rw * 0.16)), int(min(W - 1, rx0 + rw * 1.16))
    rows = []
    for y in np.linspace(ry0 - rh * 0.04, ry0 + rh * 0.98, 22):
        yi = int(min(H - 1, max(0, y)))
        xs = np.where(obj[yi, lo:hi + 1])[0]
        rows.append((yi, lo + xs.min(), lo + xs.max()) if len(xs) >= 4 else None)
    # start where the glass is surely just glass, its middle, and walk up and down from there: a glass has smooth
    # sides, so a row that suddenly juts out (an orange slice on the rim, a fruit beside it, the shadow at its foot)
    # is held to what the row before allowed
    mid = [r for r in rows[8:14] if r]
    if len(mid) < 3: return None
    widest = float(np.median([r[2] - r[1] for r in mid]))
    step = widest * 0.05
    start = rows.index(mid[len(mid) // 2])
    kept = {start: rows[start]}
    for direction in (-1, 1):
        y, l, r = rows[start]
        i = start + direction
        while 0 <= i < len(rows) and rows[i]:
            yi, li, ri = rows[i]
            li = min(max(li, l - step), l + step * 2.2); ri = max(min(ri, r + step), r - step * 2.2)
            if ri - li < widest * 0.45: break      # the stem, the foot
            kept[i] = (yi, li, ri); l, r = li, ri
            i += direction
    kept = [kept[i] for i in sorted(kept)]
    # the lowest row sits on the foot of the glass, where its shadow starts: the shape ends a row above
    if len(kept) > 6: kept = kept[:-1]
    if len(kept) < 4: return None
    inset = widest * 0.035
    left = [{"x": pct(l + inset, W), "y": pct(y, H)} for y, l, r in kept]
    right = [{"x": pct(r - inset, W), "y": pct(y, H)} for y, l, r in reversed(kept)]
    return left + right

def bounds(points):
    xs = [p["x"] for p in points]; ys = [p["y"] for p in points]
    return min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)

def food(slug, path):
    rgb, (x0, y0, x1, y1) = subject(path)
    H, W = rgb.shape[:2]; w, h = x1 - x0, y1 - y0; cx = (x0 + x1) / 2
    out = {"mood": "hot" if slug in HOT_FOOD or slug in WARM else "still"}
    if slug in HOT_FOOD:
        out["steam"] = [{"x": pct(cx - w * 0.18, W), "y": pct(y0 + h * 0.42, H)}, {"x": pct(cx + w * 0.16, W), "y": pct(y0 + h * 0.34, H)}, {"x": pct(cx, W), "y": pct(y0 + h * 0.5, H)}]
    elif slug in WARM:
        out["steam"] = [{"x": pct(cx - w * 0.1, W), "y": pct(y0 + h * 0.4, H)}, {"x": pct(cx + w * 0.14, W), "y": pct(y0 + h * 0.36, H)}]
    out["glints"] = [{"x": pct(cx - w * 0.22, W), "y": pct(y0 + h * 0.36, H)}, {"x": pct(cx + w * 0.2, W), "y": pct(y0 + h * 0.3, H)}, {"x": pct(cx + w * 0.04, W), "y": pct(y0 + h * 0.6, H)}]
    out["sweep"] = True
    out["rich"] = True
    return out

def ts(value):
    return re.sub(r'"([a-z]+)":', r"\1:", json.dumps(value, separators=(", ", ": ")))

def life(slug, path, scale=1.0):
    """What moves on one photograph of a product, or None if it stays still."""
    if slug in HOT | COLD | FILTER:
        spec, _ = chile.spec_for(slug, path)
        # a cup with foam keeps its foam: the drifting-liquid layer softens latte art, so hot cups do without it
        if slug in HOT: spec.pop("liquid", None)
        if slug in COLD and spec.get("sweat"):
            outline = glass(path, spec["sweat"][0])
            if outline:
                x, y, w, h = bounds(outline)
                spec["shape"] = outline
                spec["sweat"] = [{"x": round(x, 1), "y": round(y, 1), "w": round(w, 1), "h": round(h, 1)}]
                if "fizz" in spec: spec["fizz"] = [{"x": round(x + w * 0.14, 1), "y": round(y + h * 0.06, 1), "w": round(w * 0.72, 1), "h": round(h * 0.9, 1)}]
        if slug in FILTER:
            # steam only from the small cup (the competition scene has none); the carafe drips
            if slug in POURING: spec = {"mood": "pour"}
            spec = {"mood": "pour", **{k: v for k, v in spec.items() if k == "steam"}}
            d = drip(slug, path, scale)
            if d: spec["drips"] = [d]
    elif slug in FOOD:
        spec = food(slug, path)
    else:
        return None
    if slug in FILTER and scale == 1.0:
        # a filter scene (dripper, carafe, cup and bag in a row) is small inside its square of white: the product
        # page frames it by what is in it, so it fills the space instead of sitting small in the middle
        rgb = np.asarray(Image.open(path).convert("RGB")); H, W = rgb.shape[:2]
        ys, xs = np.where((255 - rgb.min(axis=2)) > 24)
        m = 0.035
        x0, y0 = max(0, xs.min() / W - m), max(0, ys.min() / H - m)
        x1, y1 = min(1, xs.max() / W + m), min(1, ys.max() / H + m)
        spec["crop"] = {"x": round(x0 * 100, 1), "y": round(y0 * 100, 1), "w": round((x1 - x0) * 100, 1), "h": round((y1 - y0) * 100, 1)}
    if slug in BY_HAND and scale == 1.0:
        # where honey runs, nothing else moves over it: the steam would hide it
        spec.pop("steam", None)
        spec.update(BY_HAND[slug])
    return spec

KEYS = "steam|liquid|sweat|fizz|glints|drips|sweep|rich|shape|oozes|crop"

def write(text, key, spec, tail):
    body = ", ".join(f'mood: "{v}"' if k == "mood" else f"{k}: {ts(v)}" for k, v in spec.items())
    pattern = rf'("{re.escape(key)}": \{{ src: "[^"]+", )mood: "[a-z]+"(?:, (?:{KEYS}): [^\n]*?)?({tail})'
    text, n = re.subn(pattern, lambda m: m.group(1) + body + m.group(2), text)
    assert n == 1, key
    return text

registry = open(REGISTRY).read()
slugs = re.findall(r'"co-p-([a-z0-9-]+)": \{', registry)
written, tiles = 0, []
for slug in slugs:
    path = os.path.join(PUB, f"co-p-{slug}@2x.webp")
    spec = life(slug, path)
    if not spec: continue
    registry = write(registry, f"co-p-{slug}", spec, r", studio: true, native: \d+(?:, wide: true)? \}")
    written += 1

    if DEBUG:
        im = Image.open(path).convert("RGB"); W, H = im.size; dr = ImageDraw.Draw(im)
        P = lambda p: (p["x"] / 100 * W, p["y"] / 100 * H)
        R = lambda r: (r["x"] / 100 * W, r["y"] / 100 * H, (r["x"] + r["w"]) / 100 * W, (r["y"] + r["h"]) / 100 * H)
        for p in spec.get("steam", []): x, y = P(p); dr.ellipse((x - 16, y - 16, x + 16, y + 16), fill=(255, 255, 255), outline=(255, 0, 0), width=5)
        for r in spec.get("sweat", []): dr.rectangle(R(r), outline=(0, 160, 255), width=6)
        for r in spec.get("fizz", []): dr.rectangle(R(r), outline=(255, 0, 255), width=6)
        if "liquid" in spec: dr.ellipse(R(spec["liquid"]), outline=(0, 200, 90), width=6)
        if "shape" in spec: dr.line([P(p) for p in spec["shape"]] + [P(spec["shape"][0])], fill=(255, 0, 0), width=7)
        for d in spec.get("drips", []): dr.line((*P(d["from"]), *P(d["to"])), fill=(255, 0, 0), width=8)
        for p in spec.get("glints", []): x, y = P(p); dr.rectangle((x - 9, y - 9, x + 9, y + 9), fill=(255, 220, 0))
        tiles.append(im.resize((230, 230)))

# The chapter covers: the same product cut off its ground and framed tighter, so it is measured again on the cover
# itself (laid on white first: the measuring reads a white ground). What was placed by eye is scaled to the cover.
COVERS = os.path.join(WEB, "src", "core", "colombia-covers.ts")
covers = open(COVERS).read()
cover_of = dict(re.findall(r'"(co-[a-z]+)": "([a-z0-9-]+)"', open(os.path.join(HERE, "colombia-covers.py")).read()))
import tempfile
covered, cover_tiles = 0, []
for chapter, src in re.findall(r'"(co-[a-z]+)": \{ src: "/menu/co/([^"]+)\.webp"', covers):
    slug = cover_of.get(chapter)
    if not slug: continue
    slug = {"filtrado-competition": "filtrado-competition-v2"}.get(slug, slug)
    cut = Image.open(os.path.join(PUB, f"{src}@2x.webp")).convert("RGBA")
    flat = Image.new("RGB", cut.size, (255, 255, 255)); flat.paste(cut, mask=cut.getchannel("A"))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as handle: flat.save(handle.name); tmp = handle.name
    # how much larger the product is on its cover than on its studio photograph
    studio = os.path.join(PUB, f"co-p-{slug}@2x.webp")
    scale = 1.0
    if os.path.exists(studio):
        _, (a0, b0, a1, b1) = subject(studio); _, (c0, d0, c1, d1) = subject(tmp)
        scale = ((d1 - d0) / flat.height) / ((b1 - b0) / Image.open(studio).height)
    spec = life(slug, tmp, scale)
    if spec and slug in BY_HAND and os.path.exists(studio):
        # what was placed by eye on the studio photograph is carried to the cover: the product is the same picture,
        # framed tighter, so its corners (found without the soft shadow) give the move and the scale
        def corners(path):
            rgb = np.asarray(Image.open(path).convert("RGB")); ys, xs = np.where((255 - rgb.min(axis=2)) > 40)
            return xs.min() / rgb.shape[1] * 100, ys.min() / rgb.shape[0] * 100, xs.max() / rgb.shape[1] * 100, ys.max() / rgb.shape[0] * 100
        sx0, sy0, sx1, sy1 = corners(studio); cx0, cy0, cx1, cy1 = corners(tmp)
        kx, ky = (cx1 - cx0) / (sx1 - sx0), (cy1 - cy0) / (sy1 - sy0)
        move = lambda p: {"x": round(cx0 + (p["x"] - sx0) * kx, 1), "y": round(cy0 + (p["y"] - sy0) * ky, 1)}
        spec.pop("steam", None)
        spec["oozes"] = [{"path": [move(p) for p in run["path"]], "width": round(run["width"] * kx, 1)} for run in BY_HAND[slug].get("oozes", [])]
    os.unlink(tmp)
    if not spec: continue
    covers = write(covers, chapter, spec, r", cutout: true, native: \d+ \}")
    covered += 1
    if DEBUG:
        W, H = flat.size; dr = ImageDraw.Draw(flat)
        P = lambda p: (p["x"] / 100 * W, p["y"] / 100 * H)
        for p in spec.get("steam", []): x, y = P(p); dr.ellipse((x - 14, y - 14, x + 14, y + 14), outline=(255, 0, 0), width=5)
        if "shape" in spec: dr.line([P(p) for p in spec["shape"]] + [P(spec["shape"][0])], fill=(255, 0, 0), width=6)
        for d in spec.get("drips", []): dr.line((*P(d["from"]), *P(d["to"])), fill=(255, 0, 0), width=7)
        for run in spec.get("oozes", []): dr.line([P(p) for p in run["path"]], fill=(0, 255, 255), width=8)
        for p in spec.get("glints", []): x, y = P(p); dr.rectangle((x - 8, y - 8, x + 8, y + 8), fill=(255, 200, 0))
        if "oozes" in spec: flat.save(DEBUG.replace(".png", "-toast.png"))
        cover_tiles.append(flat.resize((230, 230)))
cover_note = " * Their life is measured on each cover and written by scripts/colombia-studio-effects.py: run it after this one."
if cover_note not in covers:
    covers = covers.replace(" * Generated: run the script again", cover_note + "\n * Generated: run the script again", 1)
open(COVERS, "w").write(covers)
tiles += cover_tiles
note = " * Their life (steam, bubbles, condensation, the drip, the light on food) is measured and written by scripts/colombia-studio-effects.py."
if note not in registry:
    registry = registry.replace(" * Generated: run the script again", note + "\n * Generated: run the scripts again", 1)
open(REGISTRY, "w").write(registry)
print(f"{written} photographs and {covered} chapter covers given life")
if DEBUG:
    cols = 9; sheet = Image.new("RGB", (cols * 232, ((len(tiles) + cols - 1) // cols) * 232), (90, 90, 90))
    for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 232, (i // cols) * 232))
    sheet.save(DEBUG); print("sheet", DEBUG, sheet.size)
