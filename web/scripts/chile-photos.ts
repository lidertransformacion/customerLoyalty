/**
 * Cuts the Chile menu photographs out of the print and writes their
 * living-photo specs.
 *
 * Each chapter gets one photograph and each product its own, framed on its
 * plate. Only the photo layers of the PDF spread are drawn (no type), on the
 * print's paper colour. The motion placed on the print (steam, bubbles,
 * condensation, the pour, glints) is carried over to each cut, in percent of
 * the cut, which is what `LivingPhoto` reads.
 *
 * Reads the spreads that `chile-build.sh` extracts into print/chile, and
 * needs Playwright.
 * Usage: npx vite-node scripts/chile-photos.ts [python with Pillow] [playwright index.mjs]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { CHILE_CHAPTERS, CHILE_SOURCE, focusKey } from "../src/core/chile-data";
import { PRINT_EFFECTS, type Effect } from "./chile-print-effects";

const PY = process.argv[2] ?? "python3";
const PW = process.argv[3] ?? "/Users/santimurilloval/Documents/Libertario/InstaRadar/node_modules/playwright/index.mjs";
const PRINT = path.resolve("print/chile");
const OUT = path.resolve("public/menu/cl");
const TRIM = { x: 49.35, y: 49.35, w: 1274.45, h: 693.92 };

type Box = { x: number; y: number; w: number; h: number };
type Cut = { key: string; spread: number; box: Box };

const CHAPTER_CUTS: Record<string, { spread: number; box: Box }> = {
  "cl-filter": { spread: 5, box: { x: 49.35, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-espresso": { spread: 6, box: { x: 49.35, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-coldbrew": { spread: 7, box: { x: 49.35, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-matcha": { spread: 8, box: { x: 49.35, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-signature": { spread: 9, box: { x: 49.35, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-juices": { spread: 10, box: { x: 49.35, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-eggs": { spread: 11, box: { x: 320, y: 150, w: 390, h: 594 } },
  "cl-waffle": { spread: 12, box: { x: 686.6, y: 49.35, w: 637.2, h: 693.9 } },
  "cl-cakes": { spread: 13, box: { x: 1010, y: 110, w: 313.8, h: 560 } },
  "cl-croissants": { spread: 14, box: { x: 49.35, y: 430, w: 640, h: 280 } },
  "cl-cookies": { spread: 14, box: { x: 820, y: 49.35, w: 503.8, h: 520 } },
  "cl-sandwiches": { spread: 15, box: { x: 790, y: 70, w: 480, h: 340 } },
  "cl-toasts": { spread: 16, box: { x: 740, y: 49.35, w: 583.8, h: 380 } },
  "cl-bowls": { spread: 17, box: { x: 405, y: 49.35, w: 270, h: 693.9 } },
};

function clampBox(box: Box): Box {
  const w = Math.min(box.w, TRIM.w);
  const h = Math.min(box.h, TRIM.h);
  return { x: Math.min(Math.max(box.x, TRIM.x), TRIM.x + TRIM.w - w), y: Math.min(Math.max(box.y, TRIM.y), TRIM.y + TRIM.h - h), w, h };
}

const cuts: Cut[] = [];
for (const chapter of CHILE_CHAPTERS) {
  const cut = CHAPTER_CUTS[chapter.photo];
  if (cut) cuts.push({ key: chapter.photo, spread: cut.spread, box: cut.box });
}
const seen = new Set(cuts.map((cut) => cut.key));
for (const item of CHILE_SOURCE) {
  if (!item.focus) continue;
  const key = focusKey(item.focus);
  if (seen.has(key)) continue;
  seen.add(key);
  const side = item.focus.r * 2.3;
  cuts.push({ key, spread: item.focus.spread, box: clampBox({ x: item.focus.x - side / 2, y: item.focus.y - side * 0.55, w: side, h: side * 1.1 }) });
}

// --- motion, from print points to percent of each cut
type Spec = { src: string; mood: "cold" | "pour" | "hot" | "fizz" | "still"; focus: string; pours?: unknown[]; steam?: { x: number; y: number }[]; sweat?: Box[]; fizz?: Box[]; glints?: { x: number; y: number }[]; sweep?: boolean };

const pct = (v: number, from: number, size: number) => +(((v - from) / size) * 100).toFixed(1);
const inside = (x: number, y: number, box: Box, margin = 0) => x >= box.x - margin && x <= box.x + box.w + margin && y >= box.y - margin && y <= box.y + box.h + margin;

function specFor(cut: Cut): Spec {
  const effects: Effect[] = Object.entries(PRINT_EFFECTS)
    .filter(([key]) => key.startsWith(`p${cut.spread}-`))
    .flatMap(([, list]) => list);
  const { box } = cut;
  const spec: Spec = { src: `/menu/cl/${cut.key}.jpg`, mood: "still", focus: "50% 50%" };
  const P = (x: number, y: number) => ({ x: pct(x, box.x, box.w), y: pct(y, box.y, box.h) });
  const R = (r: Box): Box | null => {
    const x0 = Math.max(r.x, box.x);
    const y0 = Math.max(r.y, box.y);
    const x1 = Math.min(r.x + r.w, box.x + box.w);
    const y1 = Math.min(r.y + r.h, box.y + box.h);
    if (x1 - x0 < 8 || y1 - y0 < 8) return null;
    return { ...P(x0, y0), w: pct(x1, x0, box.w), h: pct(y1, y0, box.h) };
  };
  for (const effect of effects) {
    switch (effect.kind) {
      case "steam":
        if (inside(effect.x, effect.y, box, 10)) (spec.steam ??= []).push(P(effect.x, Math.max(effect.y, box.y + 4)));
        break;
      case "glint":
        if (inside(effect.x, effect.y, box)) (spec.glints ??= []).push(P(effect.x, effect.y));
        break;
      case "bubbles": {
        const region = R(effect);
        if (region) (spec.fizz ??= []).push(region);
        break;
      }
      case "drips": {
        const region = R(effect);
        if (region) (spec.sweat ??= []).push(region);
        break;
      }
      case "sweep":
        if (R(effect)) spec.sweep = true;
        break;
      case "pour":
        if (inside(effect.to.x, effect.to.y, box)) {
          (spec.pours ??= []).push({ from: P(effect.from.x, effect.from.y), to: P(effect.to.x, effect.to.y), width: +((2.6 / box.w) * 100).toFixed(2), color: "water", spiral: +(((effect.rx * 0.55) / box.w) * 100).toFixed(2), body: false });
        }
        break;
      default:
        break;
    }
  }
  spec.mood = spec.pours ? "pour" : spec.steam ? "hot" : spec.sweat ? "cold" : spec.fizz ? "fizz" : "still";
  return spec;
}

// --- render the photo layers of each cut
const { chromium } = (await import(PW)) as typeof import("playwright");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const specs: Record<string, Spec> = {};
const spreads = new Map<number, { defs: string; layers: { t: string; svg: string }[] }>();
for (const cut of cuts) {
  if (!spreads.has(cut.spread)) spreads.set(cut.spread, JSON.parse(fs.readFileSync(path.join(PRINT, "pages", `p${cut.spread}.json`), "utf8")));
  const data = spreads.get(cut.spread)!;
  const width = 1800;
  const height = Math.round((width * cut.box.h) / cut.box.w);
  const photos = data.layers
    .filter((layer) => layer.t === "i")
    .map((layer) => layer.svg.replace(/href="\/chile\/img\//g, `href="file://${PRINT}/img/`))
    .join("");
  const html = `<!doctype html><html><head><style>html,body{margin:0;background:#e9dfcb}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${cut.box.x} ${cut.box.y} ${cut.box.w} ${cut.box.h}" preserveAspectRatio="xMidYMid slice">
<rect x="0" y="0" width="1400" height="800" fill="#e9dfcb"/><defs>${data.defs}</defs>${photos}</svg></body></html>`;
  await page.setViewportSize({ width, height });
  const sheet = path.join(PRINT, "_cut.html");
  fs.writeFileSync(sheet, html);
  await page.goto(`file://${sheet}`, { waitUntil: "load" });
  // wait until every photo is decoded, not just placed
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll("image")].map(
        (node) =>
          new Promise<void>((resolve) => {
            const probe = new Image();
            probe.onload = () => void probe.decode().then(() => resolve(), () => resolve());
            probe.onerror = () => resolve();
            probe.src = (node as SVGImageElement).href.baseVal;
          }),
      ),
    ),
  );
  await page.waitForTimeout(150);
  const big = path.join(OUT, `${cut.key}@2x.jpg`);
  await page.screenshot({ path: big, type: "jpeg", quality: 84, clip: { x: 0, y: 0, width, height } });
  specs[cut.key] = specFor(cut);
}
await browser.close();
execFileSync(PY, ["scripts/chile-compress.py", OUT], { stdio: "inherit" });

const file = `import type { PhotoSpec } from "../motion/living-photo";

/** Generated by scripts/chile-photos.ts from the Chile print. Do not edit by hand. */
export const CHILE_PHOTOS: Record<string, PhotoSpec> = ${JSON.stringify(specs, null, 1)};
`;
fs.writeFileSync("src/core/chile-photos.ts", file);
console.log("cuts:", cuts.length, "→", OUT);
