"""Finds, on each studio photograph of a drink, where its liquid is, and writes the life of the photograph
(steam, sweat, bubbles, glints, the drifting liquid) into chile-studio.ts and chile-covers.ts.
Coordinates are percent of the photograph. Classes (hot, cold, fizzy, scenes) are the sets below: a new drink goes in one.
Usage: python chile-studio-effects.py [--debug]   (--debug only draws what it found to web/print/studio/fx/sheet.png)
Needs Pillow and numpy; run after chile-studio-cut.py, then npx tsc --noEmit && npx vitest run."""
import colorsys, json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw

W = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUB = f"{W}/public/menu/cl"
C = f"{W}/print/studio/fx"
DEBUG = "--debug" in sys.argv

HOT = {"filtrado-paz", "filtrado-libre", "filtrado-rock", "filtrado-punk", "espresso", "americano", "cappuccino", "latte", "macchiato",
       "flat-white", "mocaccino", "matcha", "cold-brew-invierno", "chocolate", "chai", "babyccino", "golden-milk", "te-jazmin", "te-durazno"}
FIZZ = {"espresso-tonic", "espresso-ginger-beer", "matcha-lemon-spritz", "soda-frutos-rojos", "soda-maracuya-y-mango", "tonic-water-clasica",
        "ginger-beer-clasica", "kombucha"}
COLD = {"cold-brew", "aerocano", "iced-cappuccino", "iced-latte", "affogato", "espresso-naranja", "matcha-berry", "dirty-matcha",
        "matcha-de-maracuya-y-mango", "affomatcha", "moca-menta", "hibiscus", "te-de-flores", "infusion-de-frutos-rojos", "infusion-de-flores",
        "jugo-de-naranja", "jugo-de-maracuya-y-mango", "jugo-de-frutilla", "jugo-de-frutos-rojos", "limonada-tradicional",
        "limonada-de-menta-y-jengibre"} | FIZZ
JUICE = {"jugo-de-naranja", "jugo-de-maracuya-y-mango", "jugo-de-frutilla", "jugo-de-frutos-rojos"}
SCENE = {"filtrado-paz", "filtrado-libre", "filtrado-rock", "filtrado-punk"}   # chemex, bag and a small cup: the cup is on the left

def hsv(rgb):
    r, g, b = [rgb[..., i].astype(np.float32) / 255 for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return sat, mx

def analyse(path, alpha_cut=False):
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im); rgb = arr[..., :3]; a = arr[..., 3]
    H, Wd = a.shape
    if alpha_cut:
        obj = a > 40
    else:
        obj = (255 - rgb.min(axis=2)) > 10
    ys, xs = np.where(obj)
    if len(xs) == 0: return None
    ox0, ox1, oy0, oy1 = xs.min(), xs.max(), ys.min(), ys.max()
    sat, val = hsv(rgb)
    liquid = obj & ((sat > 0.2) | (val < 0.5))
    # not the ground shadow, not the saucer's shade: only the upper four fifths of the object, inside it
    band = np.zeros_like(liquid); band[oy0:oy0 + int((oy1 - oy0) * 0.84), ox0:ox1 + 1] = True
    liquid &= band
    return dict(im=im, size=(Wd, H), obj=(ox0, oy0, ox1, oy1), liquid=liquid)

def bbox_of(mask):
    ys, xs = np.where(mask)
    if len(xs) == 0: return None
    return (xs.min(), ys.min(), xs.max(), ys.max())

def pct(v, total): return round(float(v) / total * 100, 1)

def spec_for(slug, path, alpha_cut=False):
    a = analyse(path, alpha_cut)
    if not a: return None, None
    Wd, H = a["size"]; ox0, oy0, ox1, oy1 = a["obj"]; ow, oh = ox1 - ox0, oy1 - oy0
    liquid = a["liquid"]
    if slug in SCENE:
        # the small cup sits in the left third, below the carafe's top
        sub = np.zeros_like(liquid); sub[oy0 + int(oh * 0.35):oy1, ox0:ox0 + int(ow * 0.24)] = True
        liquid &= sub
    if slug == "babyccino":
        # white foam in a white cup: nothing to find, the rim is the top of the cup, the handle on the right
        liquid = np.zeros_like(liquid); liquid[oy0 + int(oh * 0.05):oy0 + int(oh * 0.16), ox0 + int(ow * 0.16):ox1 - int(ow * 0.34)] = True
    lb = bbox_of(liquid)
    # a glass of clear water or pale lemonade: little colour to find, take the inside of the glass
    if lb is None or (lb[2] - lb[0]) < ow * 0.2 or (slug not in HOT and (lb[3] - lb[1]) < oh * 0.35):
        lb = (ox0 + int(ow * 0.22), oy0 + int(oh * 0.18), ox1 - int(ow * 0.22), oy0 + int(oh * 0.8))
    lx0, ly0, lx1, ly1 = lb; lw, lh = lx1 - lx0, ly1 - ly0
    out = {}
    debug = {"obj": a["obj"], "liquid": lb}
    if slug in HOT:
        # the surface: the top band of the liquid, an ellipse seen from above the rim
        top = liquid.copy(); top[ly0 + max(int(lh * 0.22), int(oh * 0.07)):, :] = False
        sb = bbox_of(top) or lb
        sx0, sy0, sx1, sy1 = sb; sw, sh = sx1 - sx0, sy1 - sy0
        if sh < oh * 0.04: sy1 = sy0 + int(oh * 0.05); sh = sy1 - sy0
        cx, cy = (sx0 + sx1) / 2, (sy0 + sy1) / 2
        out["mood"] = "hot"
        out["steam"] = [{"x": pct(cx - sw * 0.28, Wd), "y": pct(cy, H)}, {"x": pct(cx + 0.18 * sw, Wd), "y": pct(sy0 + sh * 0.3, H)}, {"x": pct(cx - 0.02 * sw, Wd), "y": pct(sy0 + sh * 0.55, H)}]
        if slug != "babyccino":
            out["liquid"] = {"x": pct(sx0 + sw * 0.06, Wd), "y": pct(sy0, H), "w": pct(sw * 0.88, Wd), "h": pct(sh * 1.05, H)}
        debug["surface"] = sb
    else:
        out["mood"] = "cold"
        body = {"x": pct(lx0 + lw * 0.08, Wd), "y": pct(ly0 + lh * 0.06, H), "w": pct(lw * 0.84, Wd), "h": pct(lh * 0.9, H)}
        out["sweat"] = [body]
        if slug not in ("affogato", "affomatcha"):   # ice cream does not drift
            out["liquid"] = {"x": pct(lx0 + lw * 0.16, Wd), "y": pct(ly0 + lh * 0.12, H), "w": pct(lw * 0.68, Wd), "h": pct(lh * 0.78, H)}
        if slug in FIZZ:
            out["fizz"] = [{"x": pct(lx0 + lw * 0.2, Wd), "y": pct(ly0 + lh * 0.1, H), "w": pct(lw * 0.6, Wd), "h": pct(lh * 0.82, H)}]
        out["glints"] = [{"x": pct(lx0 + lw * 0.2, Wd), "y": pct(ly0 + lh * 0.12, H)}, {"x": pct(lx1 - lw * 0.18, Wd), "y": pct(ly0 + lh * 0.2, H)}, {"x": pct(lx0 + lw * 0.3, Wd), "y": pct(ly0 + lh * 0.6, H)}]
    if DEBUG:
        d = a["im"].convert("RGB").copy(); dr = ImageDraw.Draw(d)
        dr.rectangle(a["obj"], outline=(0, 160, 255), width=3)
        dr.rectangle(lb, outline=(255, 60, 60), width=3)
        if "surface" in debug: dr.ellipse(debug["surface"], outline=(255, 200, 0), width=4)
        for p in out.get("steam", []): dr.ellipse((p["x"] / 100 * Wd - 10, p["y"] / 100 * H - 10, p["x"] / 100 * Wd + 10, p["y"] / 100 * H + 10), fill=(255, 255, 255), outline=(0, 0, 0), width=2)
        for r in out.get("sweat", []): dr.rectangle((r["x"] / 100 * Wd, r["y"] / 100 * H, (r["x"] + r["w"]) / 100 * Wd, (r["y"] + r["h"]) / 100 * H), outline=(80, 200, 255), width=3)
        if "liquid" in out:
            r = out["liquid"]; dr.ellipse((r["x"] / 100 * Wd, r["y"] / 100 * H, (r["x"] + r["w"]) / 100 * Wd, (r["y"] + r["h"]) / 100 * H), outline=(0, 200, 90), width=4)
        d.resize((300, 300)).save(f"{C}/{slug}.png")
    return out, debug

def ts(value):
    """A compact TypeScript literal, keys unquoted."""
    return re.sub(r'"([a-z]+)":', r'\1:', json.dumps(value, separators=(", ", ": ")))

if __name__ == "__main__":
    os.makedirs(C, exist_ok=True)
    data = open(f"{W}/src/core/chile-data.ts").read()
    studio = open(f"{W}/src/core/chile-studio.ts").read()
    of = dict(re.findall(r'"([a-z0-9-]+)": "cl-p-([a-z0-9-]+)"', studio[studio.find("STUDIO_OF"):]))
    srcs = dict(re.findall(r'"cl-p-([a-z0-9-]+)": \{ src: "/menu/cl/(cl-p-[a-z0-9-]+)\.webp"', studio))
    slugs = []
    for ch in ["cl-filter", "cl-espresso", "cl-cold", "cl-matcha", "cl-signature", "cl-other"]:
        slugs += [of[pid] for pid in re.findall(r'\{ id: "([a-z0-9-]+)", category: "%s"' % ch, data)]
    specs = {}
    for slug in slugs:
        spec, _ = spec_for(slug, f"{PUB}/{srcs[slug]}@2x.webp")
        specs[slug] = spec
    if DEBUG:
        from PIL import Image
        tiles = [Image.open(f"{C}/{s}.png") for s in slugs]
        sheet = Image.new("RGB", (8 * 304, ((len(tiles) + 7) // 8) * 304), (120, 120, 120))
        for i, t in enumerate(tiles): sheet.paste(t, ((i % 8) * 304, (i // 8) * 304))
        sheet.save(f"{C}/sheet.png"); print("debug sheet", f"{C}/sheet.png")
        sys.exit(0)
    # write the studio entries
    for slug, spec in specs.items():
        if not spec: continue
        pattern = rf'("cl-p-{re.escape(slug)}": \{{ src: "[^"]+", )mood: "[a-z]+"(?:, (?:steam|liquid|sweat|fizz|glints): [^\n]*?)?(, studio: true, native: \d+ \}})'
        body = ", ".join(f"{k}: {ts(v)}" if k != "mood" else f'mood: "{v}"' for k, v in spec.items())
        new, n = re.subn(pattern, lambda m: m.group(1) + body + m.group(2), studio)
        assert n == 1, slug
        studio = new
    open(f"{W}/src/core/chile-studio.ts", "w").write(studio)
    # the covers of the drink chapters: the same life, measured on the cut-out itself
    covers = open(f"{W}/src/core/chile-covers.ts").read()
    cover_of = dict(re.findall(r'"(cl-[a-z]+)": "([a-z0-9-]+)"', covers[covers.find("COVER_OF"):covers.find("CHILE_COVERS")]))
    for chapter, slug in cover_of.items():
        if slug not in specs or not specs[slug]: continue
        m = re.search(rf'"{chapter}": \{{ src: "(/menu/cl/[^"]+)\.webp"', covers)
        spec, _ = spec_for(slug, f"{PUB}/{os.path.basename(m.group(1))}@2x.webp", alpha_cut=True)
        if not spec: continue
        pattern = rf'("{chapter}": \{{ src: "[^"]+", )mood: "[a-z]+"(?:, (?:steam|liquid|sweat|fizz|glints): [^\n]*?)?(, cutout: true, native: \d+ \}})'
        body = ", ".join(f"{k}: {ts(v)}" if k != "mood" else f'mood: "{v}"' for k, v in spec.items())
        covers, n = re.subn(pattern, lambda mm: mm.group(1) + body + mm.group(2), covers)
        assert n == 1, chapter
    open(f"{W}/src/core/chile-covers.ts", "w").write(covers)
    print("written:", sum(1 for s in specs.values() if s), "studio entries;", len(cover_of), "covers checked")
