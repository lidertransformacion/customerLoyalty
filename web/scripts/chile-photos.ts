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
const PRINT_ROOT = path.resolve("print");
const folderOf = (source: Source = "chile") => path.join(PRINT_ROOT, source);
const OUT = path.resolve("public/menu/cl");
const TRIM = { x: 49.35, y: 49.35, w: 1274.45, h: 693.92 };

type Box = { x: number; y: number; w: number; h: number };
type Source = "chile" | "ctg" | "bog";
type Fx = { steam?: [number, number][]; fizz?: Box[]; sweat?: Box[]; glints?: [number, number][]; sweep?: boolean };
type Cut = { key: string; spread: number; box: Box; source?: Source; fx?: Fx; /** keep only the piece at this point (fractions of the box) */ isolate?: { x: number; y: number } };

/**
 * Products the Chile print shows only in a group, or not at all, cut from the
 * Colombian prints (Cartagena `ctg`, Bogotá-Medellín `bog`), which show them
 * one by one. Boxes and motion in points of that page.
 */
const cup = (key: string, x: number, y: number): Cut => ({ key, source: "ctg", spread: 8, box: { x: x - 85, y: y - 88, w: 190, h: 190 }, fx: { steam: [[x - 10, y - 40], [x + 15, y - 35]] } });
const EXTRA_CUTS: Cut[] = [
  cup("ctg-latte", 371, 122),
  cup("ctg-espresso", 209, 202),
  cup("ctg-macchiato", 371, 310),
  cup("ctg-americano", 209, 400),
  cup("ctg-mocaccino", 371, 508),
  cup("ctg-cappuccino", 209, 608),
  cup("ctg-flat-white", 371, 690),
  { key: "ctg-chai-golden", source: "ctg", spread: 12, box: { x: 30, y: 425, w: 245, h: 250 }, fx: { steam: [[110, 455], [150, 450]] } },
  { key: "ctg-chai-chocolate", source: "ctg", spread: 12, box: { x: 238, y: 318, w: 220, h: 240 }, fx: { steam: [[315, 345], [350, 340]] } },
  { key: "ctg-chai", source: "ctg", spread: 12, box: { x: 440, y: 228, w: 190, h: 220 }, fx: { steam: [[525, 255], [560, 250]] } },
  { key: "ctg-affogato", source: "ctg", spread: 9, box: { x: 205, y: 130, w: 320, h: 570 }, fx: { glints: [[340, 320], [420, 300], [395, 470]], sweep: true } },
  { key: "ctg-esencia", source: "ctg", spread: 11, box: { x: 270, y: 320, w: 175, h: 350 }, fx: { fizz: [{ x: 305, y: 380, w: 105, h: 230 }], sweat: [{ x: 300, y: 350, w: 120, h: 280 }] } },
  { key: "ctg-alquimia", source: "ctg", spread: 11, box: { x: 55, y: 145, w: 240, h: 240 }, fx: { fizz: [{ x: 95, y: 260, w: 150, h: 80 }], glints: [[180, 205]] } },
  { key: "ctg-lumina", source: "ctg", spread: 11, box: { x: 65, y: 450, w: 210, h: 280 }, fx: { fizz: [{ x: 100, y: 520, w: 140, h: 170 }], glints: [[185, 525]] } },
  { key: "ctg-soda-red", source: "ctg", spread: 13, box: { x: 90, y: 245, w: 195, h: 440 }, fx: { fizz: [{ x: 120, y: 300, w: 130, h: 180 }], sweat: [{ x: 115, y: 290, w: 140, h: 190 }] } },
  { key: "ctg-soda-yellow", source: "ctg", spread: 13, box: { x: 310, y: 290, w: 205, h: 455 }, fx: { fizz: [{ x: 340, y: 350, w: 135, h: 190 }], sweat: [{ x: 335, y: 335, w: 145, h: 200 }] } },
  { key: "ctg-chemex", source: "ctg", spread: 10, box: { x: 0, y: 60, w: 590, h: 700 }, fx: { steam: [[300, 520], [360, 540]] } },
  { key: "bog-v60", source: "bog", spread: 4, box: { x: 40, y: 40, w: 630, h: 815 }, fx: { steam: [[300, 640], [420, 650]] } },
  { key: "bog-cold-brew", source: "bog", spread: 3, box: { x: 715, y: 300, w: 560, h: 520 }, fx: { fizz: [{ x: 745, y: 440, w: 230, h: 330 }], sweat: [{ x: 735, y: 420, w: 250, h: 360 }], glints: [[1190, 380]] } },
  { key: "bog-aerocano", source: "bog", spread: 3, box: { x: 712, y: 300, w: 300, h: 520 }, fx: { fizz: [{ x: 745, y: 440, w: 230, h: 330 }], sweat: [{ x: 735, y: 420, w: 250, h: 360 }] } },
  { key: "bog-lumina", source: "bog", spread: 5, box: { x: 58, y: 392, w: 195, h: 280 }, fx: { fizz: [{ x: 85, y: 440, w: 140, h: 200 }], sweat: [{ x: 80, y: 430, w: 150, h: 210 }] } },
  { key: "bog-bruma", source: "bog", spread: 5, box: { x: 238, y: 262, w: 230, h: 425 }, fx: { fizz: [{ x: 270, y: 330, w: 160, h: 100 }], glints: [[300, 300]] } },
  { key: "bog-esencia", source: "bog", spread: 5, box: { x: 482, y: 352, w: 160, h: 335 }, fx: { fizz: [{ x: 505, y: 400, w: 115, h: 250 }], sweat: [{ x: 500, y: 390, w: 125, h: 270 }] } },
  { key: "bog-chai-mug", source: "bog", spread: 5, box: { x: 672, y: 420, w: 215, h: 230 }, fx: { steam: [[790, 445], [820, 440]] } },
  { key: "bog-lemon-spritz", source: "bog", spread: 5, box: { x: 1098, y: 348, w: 205, h: 310 }, fx: { fizz: [{ x: 1125, y: 430, w: 150, h: 190 }], sweat: [{ x: 1120, y: 420, w: 160, h: 210 }] } },
  { key: "bog-volcan", source: "bog", spread: 12, box: { x: 72, y: 392, w: 270, h: 275 }, fx: { glints: [[200, 500], [175, 600]] } },
  { key: "bog-brownie", source: "bog", spread: 12, box: { x: 898, y: 42, w: 268, h: 260 }, fx: { glints: [[1030, 140], [1000, 190]] } },
  { key: "bog-spritz", source: "bog", spread: 13, box: { x: 1105, y: 340, w: 170, h: 435 }, fx: { fizz: [{ x: 1125, y: 420, w: 125, h: 170 }], sweat: [{ x: 1120, y: 410, w: 135, h: 190 }] } },
  { key: "bog-carajillo", source: "bog", spread: 13, box: { x: 710, y: 545, w: 170, h: 215 }, fx: { fizz: [{ x: 730, y: 600, w: 130, h: 110 }], glints: [[790, 580]] } },
  // Chile print, framed on one glass or plate
  { key: "cl-hibisco", spread: 9, box: { x: 1000, y: 520, w: 115, h: 175 } },
  { key: "cl-te-flores", spread: 9, box: { x: 1112, y: 520, w: 115, h: 175 } },
  { key: "cl-moca-menta", spread: 9, box: { x: 790, y: 520, w: 115, h: 175 } },
  { key: "cl-invierno", spread: 9, box: { x: 893, y: 520, w: 115, h: 175 } },
  { key: "cl-iced-latte", spread: 6, box: { x: 40, y: 290, w: 160, h: 260 } },
  { key: "cl-infusion-roja", spread: 9, box: { x: 40, y: 330, w: 260, h: 430 } },
  { key: "cl-infusion-flores", spread: 9, box: { x: 420, y: 300, w: 267, h: 460 } },
  { key: "cl-v60-bloom", spread: 5, box: { x: 250, y: 380, w: 380, h: 330 } },
  { key: "cl-cookie-chocolate", spread: 14, box: { x: 1150, y: 49.35, w: 173.8, h: 200 } },
  { key: "cl-cookie-lemon", spread: 14, box: { x: 1150, y: 310, w: 173.8, h: 210 } },
  { key: "cl-limonada", spread: 10, box: { x: 560, y: 160, w: 127, h: 300 } },
  { key: "cl-kombucha", spread: 10, box: { x: 400, y: 230, w: 200, h: 300 } },
];

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
cuts.push(...EXTRA_CUTS);
const seen = new Set(cuts.map((cut) => cut.key));
for (const item of CHILE_SOURCE) {
  if (!item.focus) continue;
  const key = focusKey(item.focus);
  if (seen.has(key)) continue;
  seen.add(key);
  // framed tight on its own plate, so the neighbours stay out
  const side = item.focus.r * 2.5;
  const box = clampBox({ x: item.focus.x - side / 2, y: item.focus.y - side * 0.55, w: side, h: side * 1.08 });
  cuts.push({ key, spread: item.focus.spread, box, isolate: { x: (item.focus.x - box.x) / box.w, y: (item.focus.y - box.y) / box.h } });
}

// --- motion, from print points to percent of each cut
const FLOW: Record<string, "silk" | "liquid"> = { "cl-coldbrew": "liquid", "cl-matcha": "liquid", "cl-7-350-400-300": "liquid" };

type Spec = { src: string; mood: "cold" | "pour" | "hot" | "fizz" | "still"; focus: string; flow?: "silk" | "liquid"; cutout?: boolean; native?: number; pours?: unknown[]; steam?: { x: number; y: number }[]; sweat?: Box[]; fizz?: Box[]; glints?: { x: number; y: number }[]; sweep?: boolean };

const pct = (v: number, from: number, size: number) => +(((v - from) / size) * 100).toFixed(1);
const inside = (x: number, y: number, box: Box, margin = 0) => x >= box.x - margin && x <= box.x + box.w + margin && y >= box.y - margin && y <= box.y + box.h + margin;

function ownEffects(fx: Fx): Effect[] {
  return [
    ...(fx.steam ?? []).map(([x, y]): Effect => ({ kind: "steam", x, y, w: 50 })),
    ...(fx.fizz ?? []).map((box): Effect => ({ kind: "bubbles", ...box })),
    ...(fx.sweat ?? []).map((box): Effect => ({ kind: "drips", ...box })),
    ...(fx.glints ?? []).map(([x, y]): Effect => ({ kind: "glint", x, y })),
    ...(fx.sweep ? [{ kind: "sweep", x: -1e4, y: -1e4, w: 2e4, h: 2e4 } as Effect] : []),
  ];
}

function specFor(cut: Cut): Spec {
  const effects: Effect[] = cut.fx
    ? ownEffects(cut.fx)
    : (cut.source ?? "chile") !== "chile"
      ? []
      : Object.entries(PRINT_EFFECTS)
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
  if (FLOW[cut.key]) spec.flow = FLOW[cut.key];
  spec.mood = spec.pours ? "pour" : spec.steam ? "hot" : spec.sweat ? "cold" : spec.fizz ? "fizz" : "still";
  return spec;
}

// --- which cuts are plates without a ground (every photo they touch is a cut-out)
type PagePhoto = { key: string; alpha: boolean; w: number; h: number; matrix: number[] };
function placed(photo: PagePhoto): Box {
  const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = photo.matrix;
  const xs = [0, photo.w].flatMap((u) => [0, photo.h].map((v) => a * u + c * v + e));
  const ys = [0, photo.w].flatMap((u) => [0, photo.h].map((v) => b * u + d * v + f));
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
/** A WebP with an alpha channel (VP8X flag or a lossless image with alpha). */
function fileHasAlpha(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  const head = fs.readFileSync(file).subarray(0, 30);
  if (head.toString("ascii", 12, 16) === "VP8X") return (head[20]! & 0x10) !== 0;
  if (head.toString("ascii", 12, 16) === "VP8L") return ((head[24]! >> 4) & 1) === 1;
  return false;
}

let currentFolder = "";
/** How many real pixels the print has across a box: the sparsest photo it touches decides. */
function nativeWidth(photos: PagePhoto[], box: Box): number {
  const touched = photos.filter((photo) => {
    const p = placed(photo);
    return p.x < box.x + box.w && p.x + p.w > box.x && p.y < box.y + box.h && p.y + p.h > box.y;
  });
  if (!touched.length) return 1800;
  const density = Math.min(...touched.map((photo) => photo.w / Math.hypot(photo.matrix[0] ?? 1, photo.matrix[1] ?? 0) / photo.w));
  return Math.round(box.w * density);
}

function isCutout(photos: PagePhoto[], box: Box): boolean {
  const touched = photos.filter((photo) => {
    const p = placed(photo);
    return p.x < box.x + box.w && p.x + p.w > box.x && p.y < box.y + box.h && p.y + p.h > box.y;
  });
  return touched.length > 0 && touched.every((photo) => photo.alpha || fileHasAlpha(path.join(currentFolder, "img-full", `${photo.key}.webp`)));
}

// --- render the photo layers of each cut
const { chromium } = (await import(PW)) as typeof import("playwright");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const specs: Record<string, Spec> = {};
const spreads = new Map<string, { defs: string; layers: { t: string; svg: string }[]; photos: PagePhoto[] }>();
for (const cut of cuts) {
  const folder = folderOf(cut.source);
  const spreadKey = `${cut.source ?? "chile"}-${cut.spread}`;
  if (!spreads.has(spreadKey)) spreads.set(spreadKey, JSON.parse(fs.readFileSync(path.join(folder, "pages", `p${cut.spread}.json`), "utf8")));
  const data = spreads.get(spreadKey)!;
  currentFolder = folder;
  const native = nativeWidth(data.photos, cut.box);
  const width = Math.max(600, Math.min(1800, Math.round(native * 1.25)));
  const height = Math.round((width * cut.box.h) / cut.box.w);
  const photos = data.layers
    .filter((layer) => layer.t === "i")
    .map((layer) => layer.svg.replace(/href="\/(chile|ctg|bog)\/img\//g, `href="file://${folder}/img-full/`))
    .join("");
  const cutout = isCutout(data.photos, cut.box);
  const ground = cutout ? "transparent" : "#e9dfcb";
  const html = `<!doctype html><html><head><style>html,body{margin:0;background:${ground}}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${cut.box.x} ${cut.box.y} ${cut.box.w} ${cut.box.h}" preserveAspectRatio="xMidYMid slice">
${cutout ? "" : '<rect x="0" y="0" width="1400" height="800" fill="#e9dfcb"/>'}<defs>${data.defs}</defs>${photos}</svg></body></html>`;
  await page.setViewportSize({ width, height });
  const sheet = path.join(folder, "_cut.html");
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
  if (cutout) {
    // plates float on the page: keep their alpha, trim the empty margin, and place the motion on what is kept
    const render = path.join(OUT, `${cut.key}-render.png`);
    await page.screenshot({ path: render, omitBackground: true, clip: { x: 0, y: 0, width, height } });
    const centre = cut.isolate ?? (cut.key.startsWith("cl-") && !CHAPTER_CUTS[cut.key] ? { x: 0.5, y: 0.5 } : null);
    const kept = JSON.parse(execFileSync(PY, ["scripts/chile-cutout.py", render, OUT, cut.key, ...(centre ? [String(centre.x), String(centre.y)] : [])]).toString()) as { l: number; t: number; r: number; b: number };
    for (const old of [`${cut.key}.jpg`, `${cut.key}@2x.jpg`]) fs.rmSync(path.join(OUT, old), { force: true });
    const box = { x: cut.box.x + kept.l * cut.box.w, y: cut.box.y + kept.t * cut.box.h, w: (kept.r - kept.l) * cut.box.w, h: (kept.b - kept.t) * cut.box.h };
    specs[cut.key] = { ...specFor({ ...cut, box }), src: `/menu/cl/${cut.key}.webp`, cutout: true, native: Math.round(native * (kept.r - kept.l)) };
    continue;
  }
  for (const old of [`${cut.key}.webp`, `${cut.key}@2x.webp`]) fs.rmSync(path.join(OUT, old), { force: true });
  const big = path.join(OUT, `${cut.key}@2x.jpg`);
  await page.screenshot({ path: big, type: "jpeg", quality: 84, clip: { x: 0, y: 0, width, height } });
  specs[cut.key] = { ...specFor(cut), native };
}
await browser.close();
execFileSync(PY, ["scripts/chile-compress.py", OUT], { stdio: "inherit" });

const file = `import type { PhotoSpec } from "../motion/living-photo";

/** Generated by scripts/chile-photos.ts from the Chile print. Do not edit by hand. */
export const CHILE_PHOTOS: Record<string, PhotoSpec> = ${JSON.stringify(specs, null, 1)};
`;
fs.writeFileSync("src/core/chile-photos.ts", file);
console.log("cuts:", cuts.length, "→", OUT);
