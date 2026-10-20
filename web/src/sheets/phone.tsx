import type { MenuItem } from "@/src/data/menu";

import type { Catalog } from "../core/catalog";
import { LINES_OF } from "../core/chile";
import { PRODUCT_IMAGES } from "../core/photos";
import type { Copy } from "../i18n";
import { Product } from "../motion/product";
import { CHILE_ITEMS, PAGE, sourceOf, TRIM } from "./data";
import { ChileSpread, useSpread } from "./spread";

/**
 * A spread of the Chile print on a phone: its photographs as composed in the
 * print, alive, then the products of those two pages in type made to be read,
 * each one a tap away from its sheet.
 */
export function PhonePage({ n, catalog, copy, money, onItem }: { n: number; catalog: Catalog; copy: Copy; money: (value: number) => string; onItem: (item: MenuItem) => void }) {
  const data = useSpread(n);
  const sources = [...new Set(CHILE_ITEMS.filter((row) => row.spread === n).map((row) => sourceOf(row.id)))];
  const groups = sources
    .map((source) => (LINES_OF[source] ?? []).map((id) => catalog.items.find((item) => item.id === id)).filter((item): item is MenuItem => !!item))
    .filter((lines) => lines.length > 0);

  // the photographs of this spread, framed together
  const boxes = (data?.layers ?? []).filter((layer) => layer.t === "i" && layer.box).map((layer) => layer.box!);
  let view: { x: number; y: number; w: number; h: number } | null = null;
  if (boxes.length) {
    const x0 = Math.max(TRIM.x, Math.min(...boxes.map((b) => b.x0)));
    const y0 = Math.max(TRIM.y, Math.min(...boxes.map((b) => b.y0)));
    const x1 = Math.min(TRIM.x + PAGE.width * 2, Math.max(...boxes.map((b) => b.x1)));
    const y1 = Math.min(TRIM.y + PAGE.height, Math.max(...boxes.map((b) => b.y1)));
    let w = x1 - x0;
    let h = y1 - y0;
    // a strip no flatter than 16:9 and no taller than square
    if (h < w * 0.5625) h = w * 0.5625;
    if (h > w) {
      const cx = (x0 + x1) / 2;
      w = h;
      view = { x: Math.max(TRIM.x, Math.min(cx - w / 2, TRIM.x + PAGE.width * 2 - w)), y: y0, w, h };
    } else view = { x: x0, y: Math.max(TRIM.y, Math.min((y0 + y1) / 2 - h / 2, TRIM.y + PAGE.height - h)), w, h };
  }

  let lastCategory = "";
  return (
    <div className="book-page-inner ch-phone" data-testid={`ch-phone-${n}`}>
      {view ? (
        <div className="ch-phone-hero" style={{ aspectRatio: `${view.w} / ${view.h}` }}>
          <ChileSpread n={n} view={view} photosOnly label={copy.brand} />
        </div>
      ) : groups.some((lines) => lines[0]?.profile) ? (
        <div className="ch-phone-hero packs">
          {["PAZ", "LIBRE", "ROCK", "PUNK"].map((profile) => (
            <Product key={profile} src={PRODUCT_IMAGES[profile]!} size={78} float={false} />
          ))}
        </div>
      ) : null}
      {groups.map((lines) => {
        const first = lines[0]!;
        const category = catalog.categories.find((c) => c.id === first.category);
        const header = category && category.id !== lastCategory ? category : null;
        lastCategory = first.category;
        const [description, pairing] = first.description.split(/\s*(?:Maridaje|Pairing):\s*/);
        return (
          <div key={first.id}>
            {header ? <h2 className="ch-phone-chapter serif">{header.name}</h2> : null}
            <button className="ch-phone-item" onClick={() => onItem(first)} data-testid={`book-item-${first.id}`}>
              <span className="ch-phone-name serif">{first.name.split(" · ")[0]}</span>
              {description ? <span className="ch-phone-desc">{description}</span> : null}
              <span className="ch-phone-prices">
                {lines.map((line) => {
                  const label = line.name.includes(" · ") ? line.name.split(" · ")[1] : line.id.endsWith("-so") ? "Single Origin" : lines.length > 1 ? "Signature Blends" : "";
                  return (
                    <span key={line.id} className="ch-phone-price">
                      {label ? <span>{label}</span> : null}
                      <strong>{money(line.price)}</strong>
                    </span>
                  );
                })}
              </span>
              {pairing ? <span className="ch-phone-pairing">{copy.book.pairing} · {pairing.replace(/\.$/, "")}</span> : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}
