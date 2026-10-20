/**
 * Finds each Chile menu item on its printed page and writes its tap area.
 * Reads the word boxes from `pdftotext -bbox-layout` (scripts/chile-words.html).
 * The print font drops the lowercase "t" when text is extracted, so names are
 * compared without it.
 *
 * Usage: node scripts/chile-hotspots.mjs  (writes src/chile/hotspots.json)
 */
import fs from "node:fs";

const { CHILE_ITEMS } = await import("../src/chile/data.ts").catch(async () => {
  // Node without TS: evaluate the data module after stripping types.
  const src = fs.readFileSync(new URL("../src/chile/data.ts", import.meta.url), "utf8");
  const js = src
    .replace(/export type[\s\S]*?};\n/g, "")
    .replace(/: \{ label: string; page: number; y: number \}\[\]/g, "")
    .replace(/: ChileItem\[\]/g, "")
    .replace(/\(printed: number\): \{ spread: number; side: "left" \| "right" \}/g, "(printed)")
    .replace(/\(pairing: string\): ChileItem \| undefined/g, "(pairing)")
    .replace(/\(name: string\)/g, "(name)")
    .replace(/\(item\)/g, "(item)");
  const url = "data:text/javascript;base64," + Buffer.from(js).toString("base64");
  return import(url);
});

const html = fs.readFileSync(new URL("./chile-words.html", import.meta.url), "utf8");
const pages = [...html.matchAll(/<page[^>]*>([\s\S]*?)<\/page>/g)].map((m) => m[1]);
const fold = (s) => s.normalize("NFC").replace(/t/g, "").replace(/\s+/g, "");
const linesOf = (page) =>
  [...page.matchAll(/<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/line>/g)].map((m) => ({
    x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4],
    text: [...m[5].matchAll(/<word[^>]*>([^<]*)<\/word>/g)].map((w) => w[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"')).join(" "),
  }));
const isPrice = (s) => /^\$[\d,]+$/.test(s.trim());

const out = {};
const missing = [];
for (const item of CHILE_ITEMS) {
  if (item.area) {
    out[item.id] = { spread: item.spread, ...item.area };
    continue;
  }
  const lines = linesOf(pages[item.spread - 1]);
  const target = fold(item.name);
  const candidates = [];
  for (let i = 0; i < lines.length; i += 1) {
    const one = fold(lines[i].text.replace(/\$[\d,]+/g, ""));
    if (one === target) candidates.push([lines[i]]);
    else if (i + 1 < lines.length && target.startsWith(one) && one.length > 2) {
      const next = lines.slice(i + 1).find((l) => Math.abs(l.x0 - lines[i].x0) < 3 && l.y0 > lines[i].y0 && l.y0 - lines[i].y1 < 8);
      if (next && fold(lines[i].text.replace(/\$[\d,]+/g, "") + next.text) === target) candidates.push([lines[i], next]);
    }
  }
  // a name with a price on its row is the menu line; a bare label elsewhere is not
  const pricesBeside = (found) => found.some((n) => lines.some((l) => l !== n && Math.abs((l.y0 + l.y1) / 2 - (n.y0 + n.y1) / 2) < 4 && l.x0 > n.x0 && /\$[\d,]+/.test(l.text)));
  const found = candidates.find(pricesBeside) ?? candidates[0] ?? null;
  if (!found) {
    missing.push(`${item.id} (${item.name}) on ${item.spread}`);
    continue;
  }
  const head = found[0];
  const last = found[found.length - 1];
  // the block: lines under the name in the same column, until a gap
  let bottom = last.y1;
  const column = lines.filter((l) => Math.abs(l.x0 - head.x0) < 4 && l.y0 > last.y0).sort((a, b) => a.y0 - b.y0);
  for (const l of column) {
    if (l.y0 - bottom > 7) break;
    if (/^\$/.test(l.text) || l.text.length < 2) break;
    bottom = l.y1;
  }
  // prices on the name rows, to the right, stopping at the next column's text
  let right = Math.max(...found.map((n) => n.x1));
  for (const n of found) {
    const row = lines.filter((l) => !found.includes(l) && Math.abs((l.y0 + l.y1) / 2 - (n.y0 + n.y1) / 2) < 4 && l.x0 > n.x0).sort((a, b) => a.x0 - b.x0);
    for (const l of row) {
      const words = l.text.split(" ");
      if (!words.every(isPrice)) {
        if (isPrice(words.at(-1) ?? "") && words.slice(0, -1).every(isPrice)) right = Math.max(right, l.x1);
        break;
      }
      right = Math.max(right, l.x1);
    }
  }
  out[item.id] = { spread: item.spread, x: +(head.x0 - 6).toFixed(1), y: +(head.y0 - 5).toFixed(1), w: +(right - head.x0 + 12).toFixed(1), h: +(bottom - head.y0 + 10).toFixed(1) };
}
fs.writeFileSync(new URL("../src/chile/hotspots.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("placed", Object.keys(out).length, "of", CHILE_ITEMS.length);
if (missing.length) console.log("missing:", missing.join("; "));
