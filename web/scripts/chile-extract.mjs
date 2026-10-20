/**
 * Turns the Chile menu PDF into layered pages for the web book.
 *
 * Each PDF spread is exported to SVG (pdftocairo), then split, in drawing
 * order, into vector layers (text as the PDF's own glyph outlines, rules,
 * dots) and photo layers (each photo with its clip). Photos are written out
 * as raw files so `chile-images.py` can merge their alpha masks and size
 * them; this script then writes one JSON per spread to public/chile/pages.
 *
 * Usage: node scripts/chile-extract.mjs <menu.pdf> <workdir> [playwright index.mjs]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [, , pdf, work, pw = "/Users/santimurilloval/Documents/Libertario/InstaRadar/node_modules/playwright/index.mjs"] = process.argv;
const { chromium } = await import(pw);
const raw = path.join(work, "raw");
const svgDir = path.join(work, "svg");
fs.mkdirSync(raw, { recursive: true });
fs.mkdirSync(svgDir, { recursive: true });

const info = execFileSync("pdfinfo", ["-box", "-f", "1", "-l", "99", pdf]).toString();
const pages = Number(execFileSync("pdfinfo", [pdf]).toString().match(/Pages:\s+(\d+)/)[1]);
const trim = {};
for (const m of info.matchAll(/Page\s+(\d+)\s+TrimBox:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)) {
  trim[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
}
const media = {};
for (const m of info.matchAll(/Page\s+(\d+)\s+MediaBox:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)) media[m[1]] = Number(m[5]);

const browser = await chromium.launch();
const page = await browser.newPage();
const manifest = [];

for (let n = 1; n <= pages; n += 1) {
  const file = path.join(svgDir, `p${n}.svg`);
  if (!fs.existsSync(file)) execFileSync("pdftocairo", ["-svg", "-f", String(n), "-l", String(n), pdf, file]);
  const text = fs.readFileSync(file, "utf8");
  const prefix = `c${n}-`;
  const result = await page.evaluate(({ text, prefix }) => {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const root = doc.documentElement;
    const ser = new XMLSerializer();
    const defs = root.querySelector("defs");
    const images = {};
    for (const img of [...defs.querySelectorAll("image")]) {
      images[img.id] = { w: Number(img.getAttribute("width")), h: Number(img.getAttribute("height")), href: img.getAttribute("xlink:href") || img.getAttribute("href") };
      img.remove();
    }
    const maskSource = {};
    for (const mask of [...defs.querySelectorAll("mask")]) {
      const use = mask.querySelector("use");
      maskSource[mask.id] = (use.getAttribute("xlink:href") || "").slice(1);
      mask.remove();
    }
    for (const f of [...defs.querySelectorAll("filter")]) f.remove();
    const hrefOf = (u) => (u.getAttribute("xlink:href") || u.getAttribute("href") || "").slice(1);
    const children = [...root.children].filter((c) => c.tagName !== "defs");
    const layers = [];
    const photos = [];
    let pending = "";
    let count = 0;
    for (const child of children) {
      const uses = [...child.querySelectorAll("use"), ...(child.tagName === "use" ? [child] : [])].filter((u) => images[hrefOf(u)]);
      if (!uses.length) {
        pending += ser.serializeToString(child);
        continue;
      }
      if (pending) {
        layers.push({ t: "v", svg: pending });
        pending = "";
      }
      let layerRoot = child;
      for (const use of uses) {
        count += 1;
        const key = `p${prefix.slice(1, -1)}-${count}`;
        const source = hrefOf(use);
        const masked = use.parentElement?.getAttribute("mask");
        const maskId = masked ? masked.match(/#([^)]+)/)[1] : null;
        const transform = use.getAttribute("transform") || "";
        const nums = (transform.match(/matrix\(([^)]+)\)/)?.[1] || "1,0,0,1,0,0").split(/[\s,]+/).map(Number);
        const scale = Math.hypot(nums[0], nums[1]);
        const im = images[source];
        const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", transform);
        const image = doc.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("class", "chp");
        image.setAttribute("data-k", key);
        image.setAttribute("width", String(im.w));
        image.setAttribute("height", String(im.h));
        image.setAttribute("preserveAspectRatio", "none");
        image.setAttribute("href", `__IMG:${key}__`);
        g.appendChild(image);
        const target = maskId ? use.parentElement : use;
        target.replaceWith(g);
        // the whole top-level element was the photo: keep the replacement
        if (target === layerRoot) layerRoot = g;
        photos.push({ key, source, mask: maskId ? maskSource[maskId] : null, w: im.w, h: im.h, ptW: im.w * scale, ptH: im.h * scale, matrix: nums });
      }
      layers.push({ t: "i", keys: uses.length, svg: ser.serializeToString(layerRoot) });
    }
    if (pending) layers.push({ t: "v", svg: pending });
    return { defs: ser.serializeToString(defs), layers, photos, images: Object.fromEntries(Object.entries(images).map(([id, v]) => [id, v.href])) };
  }, { text, prefix });

  // write the raw sources
  for (const photo of result.photos) {
    for (const [role, id] of [["c", photo.source], ["m", photo.mask]]) {
      if (!id) continue;
      const href = result.images[id];
      const [, mime, b64] = href.match(/^data:image\/(\w+);base64,(.*)$/s);
      fs.writeFileSync(path.join(raw, `${photo.key}.${role}.${mime === "jpeg" ? "jpg" : mime}`), Buffer.from(b64, "base64"));
    }
  }
  // namespace ids per spread so several spreads can live in one document
  const ns = (s) =>
    s
      .replace(/\sxmlns(:xlink)?="[^"]*"/g, "")
      .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
      .replace(/xlink:href="#([^"]+)"/g, `href="#${prefix}$1"`)
      .replace(/href="#(?!c\d+-)([^"]+)"/g, `href="#${prefix}$1"`);
  const [x0, y0, x1, y1] = trim[n];
  const H = media[n];
  const out = {
    n,
    trim: [x0, H - y1, x1 - x0, y1 - y0],
    defs: ns(result.defs.replace(/^<defs[^>]*>/, "").replace(/<\/defs>$/, "")),
    layers: result.layers.map((l) => ({ ...l, svg: ns(l.svg) })),
    photos: result.photos.map(({ key, w, h, ptW, ptH, mask, matrix }) => ({ key, w, h, ptW, ptH, alpha: !!mask, matrix })),
  };
  fs.writeFileSync(path.join(work, `p${n}.json`), JSON.stringify(out));
  manifest.push({ n, photos: out.photos.length, layers: out.layers.length, kb: Math.round(JSON.stringify(out).length / 1024) });
}
await browser.close();
console.table(manifest);
