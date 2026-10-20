import type { ReactNode } from "react";

import type { Catalog } from "../core/catalog";
import { PRODUCT_IMAGES } from "../core/photos";
import { isPackChapter, photoForCategory } from "../core/visuals";
import type { Copy } from "../i18n";
import { CHAPTER_PAGE, CHILE_ITEMS, CHILE_SPREADS, printedToSpread, type ChileItem } from "./data";
import type { MenuItem } from "@/src/data/menu";

import { PhonePage } from "./phone";
import { ChileSpread, type View } from "./spread";

/**
 * The Chile menu as its print: every sheet of the PDF, alive, in the same book
 * as Colombia. The index of chapters is its own page right after the cover
 * (it takes the place of the print's blank left page) and stays one tap away.
 */
type Entry = { kind: "sheet"; n: number; view: View } | { kind: "stack"; n: number } | { kind: "index" } | { kind: "blank" };

/** Phone pages are tall: each spread of the print shows both its sheets, one above the other. */
export const STACKED_RATIO = 0.5;

export type SheetBook = { pages: ReactNode[]; total: number; indexPage: number; pageOf: (printed: number) => number; chapterAt: (page: number) => string | null };

function entriesFor(wide: boolean): Entry[] {
  const cover: Entry = { kind: "sheet", n: 1, view: "full" };
  const back: Entry = { kind: "sheet", n: CHILE_SPREADS, view: "full" };
  if (!wide) {
    const stacks: Entry[] = [];
    for (let n = 2; n < CHILE_SPREADS; n += 1) stacks.push({ kind: "stack", n });
    return [cover, { kind: "index" }, ...stacks, back];
  }
  const middle: Entry[] = [{ kind: "index" }, { kind: "sheet", n: 2, view: "right" }];
  for (let n = 3; n < CHILE_SPREADS; n += 1) middle.push({ kind: "sheet", n, view: "left" }, { kind: "sheet", n, view: "right" });
  return [{ kind: "blank" }, cover, ...middle, back, { kind: "blank" }];
}

export function buildSheetBook({
  wide,
  copy,
  catalog,
  onRow,
  onPrinted,
  onItem,
  money,
}: {
  wide: boolean;
  copy: Copy;
  catalog: Catalog;
  onRow: (row: ChileItem) => void;
  onPrinted: (printed: number) => void;
  onItem: (item: MenuItem) => void;
  money: (value: number) => string;
}): SheetBook {
  const entries = entriesFor(wide);
  const pageOf = (printed: number) => {
    const { spread, side } = printedToSpread(printed);
    const found = entries.findIndex((entry) => (entry.kind === "stack" && entry.n === spread) || (entry.kind === "sheet" && entry.n === spread && (entry.view === side || entry.view === "full")));
    const index = Math.max(0, found);
    return wide ? index - (index % 2) : index;
  };
  const indexPage = entries.findIndex((entry) => entry.kind === "index");
  const pages = entries.map((entry, i) => {
    if (entry.kind === "blank") return <div key={`blank-${i}`} className="ch-blank" />;
    if (entry.kind === "index") return <IndexPage key="index" copy={copy} catalog={catalog} onPrinted={onPrinted} />;
    if (entry.kind === "stack") {
      // spreads with products read as an app page; the rest (intro, glossary) as the print
      if (CHILE_ITEMS.some((row) => row.spread === entry.n)) return <PhonePage key={`phone-${entry.n}`} n={entry.n} catalog={catalog} copy={copy} money={money} onItem={onItem} />;
      return (
        <div key={`stack-${entry.n}`} className="ch-stack">
          <div className="ch-stack-half">
            <ChileSpread n={entry.n} view="left" onItem={onRow} onIndex={onPrinted} label={`${copy.brand} ${entry.n}`} />
          </div>
          <div className="ch-stack-half">
            <ChileSpread n={entry.n} view="right" onItem={onRow} onIndex={onPrinted} label={`${copy.brand} ${entry.n}`} />
          </div>
        </div>
      );
    }
    return <ChileSpread key={`${entry.n}-${String(entry.view)}`} n={entry.n} view={entry.view} onItem={onRow} onIndex={onPrinted} label={`${copy.brand} ${entry.n}`} />;
  });
  const chapterSpreads = Object.entries(CHAPTER_PAGE).map(([id, printed]) => ({ id, spread: printedToSpread(printed).spread })).sort((x, y) => x.spread - y.spread);
  const chapterAt = (page: number) => {
    const entry = entries[page] ?? entries[page + 1];
    if (!entry || (entry.kind !== "sheet" && entry.kind !== "stack")) return null;
    if (entry.n >= CHILE_SPREADS - 2 || entry.n < chapterSpreads[0]!.spread) return null;
    return [...chapterSpreads].reverse().find((c) => c.spread <= entry.n)?.id ?? null;
  };
  return { pages, total: pages.length, indexPage: wide ? indexPage - (indexPage % 2) : indexPage, pageOf, chapterAt };
}

/** The chapters as cards, each with its photograph and the printed page it opens. */
function IndexPage({ copy, catalog, onPrinted }: { copy: Copy; catalog: Catalog; onPrinted: (printed: number) => void }) {
  const chapters = catalog.categories.filter((category) => CHAPTER_PAGE[category.id] !== undefined);
  return (
    <div className="book-page-inner ch-index" data-testid="book-index">
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <img src="/chile/brujula-azul.svg" alt="" style={{ width: 26, height: 26 }} />
        <div className="serif" style={{ fontSize: 30, lineHeight: 1 }}>{copy.book.index}</div>
      </div>
      <div className="ch-index-grid">
        {chapters.map((category) => {
          const printed = CHAPTER_PAGE[category.id]!;
          const count = catalog.items.filter((item) => item.category === category.id && !item.extra).length;
          const pack = isPackChapter(category.id);
          return (
            <button key={category.id} onClick={() => onPrinted(printed)} data-testid={`index-${category.id}`} className="ch-index-card">
              <img src={pack ? PRODUCT_IMAGES.PAZ! : photoForCategory(category.id, category.photo).src} alt="" loading="lazy" style={{ objectFit: pack ? "contain" : "cover" }} />
              <span className="ch-index-name serif">{category.name}</span>
              <span className="ch-index-page" aria-label={copy.book.items(count)}>{printed}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
