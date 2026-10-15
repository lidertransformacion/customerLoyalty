import type { ReactNode } from "react";

import type { Category, MenuItem } from "@/src/data/menu";
import { pointsForPrice } from "@/src/data/program";

import type { Catalog } from "../core/catalog";
import { BRAND, CLIPS, PRODUCT_IMAGES } from "../core/photos";
import { photoForCategory } from "../core/visuals";
import type { Copy } from "../i18n";
import { Beans } from "../motion/beans";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";

export type BuiltBook = {
  pages: ReactNode[];
  chapterPage: Record<string, number>;
  indexPage: number;
  total: number;
};

type Deps = {
  catalog: Catalog;
  copy: Copy;
  /** Show the points each item earns. Off in the menu-only build. */
  points: boolean;
  money: (value: number) => string;
  spread: boolean;
  onItem: (item: MenuItem) => void;
  onChapter: (page: number) => void;
  onOpen: () => void;
};

const FIRST_PAGE_ROWS = 5;
const NEXT_PAGE_ROWS = 9;

function ChapterVisual({ category }: { category: Category }) {
  if (category.id === "coffee") {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
        {["PAZ", "LIBRE", "ROCK"].map((profile) => (
          <Product key={profile} src={PRODUCT_IMAGES[profile] ?? PRODUCT_IMAGES.PAZ!} size={84} float={false} />
        ))}
      </div>
    );
  }
  return <LivingPhoto photo={photoForCategory(category.id)} radius={14} style={{ height: 176 }} interactive={false} />;
}

function Row({ item, money, onItem, copy, points }: { item: MenuItem; money: (v: number) => string; onItem: (i: MenuItem) => void; copy: Copy; points: boolean }) {
  return (
    <button className="book-item" onClick={() => onItem(item)} data-testid={`book-item-${item.id}`}>
      <div className="grow">
        <div className="name">
          {item.name}
          {item.vegan ? <span className="book-badge">{copy.menu.plant}</span> : null}
          {item.nuts ? <span className="book-badge nuts">{copy.menu.noNuts.replace(/^sin |^no /i, "")}</span> : null}
        </div>
        {item.description ? <div className="desc">{item.description}</div> : null}
      </div>
      <span className="book-leader" />
      <div>
        <div className="price">{money(item.price)}</div>
        {points ? <div className="pts">{copy.menu.earns(pointsForPrice(item.price))}</div> : null}
      </div>
    </button>
  );
}

function Folio({ n, total, copy }: { n: number; total: number; copy: Copy }) {
  return <div className="book-folio">{copy.book.page(n, total)}</div>;
}

export function buildBook(deps: Deps): BuiltBook {
  const { catalog, copy, money, spread, onItem, onChapter, onOpen, points } = deps;
  const { categories, items } = catalog;
  // Only chapters that this city serves.
  const chapters = categories.filter((category) => category.id !== "extras" && items.some((item) => item.category === category.id && !item.extra));
  const pages: ReactNode[] = [];
  const chapterPage: Record<string, number> = {};

  // A closed book shows its cover alone on the right.
  if (spread) pages.push(<div key="endpaper" className="book-page-inner" style={{ background: "var(--cream)" }} />);

  pages.push(
    <div key="cover" style={{ position: "absolute", inset: 0 }} data-testid="book-cover">
      <LivingPhoto photo={CLIPS.roast!} radius={0} style={{ position: "absolute", inset: 0 }} interactive={false} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,22,18,0.35), rgba(27,22,18,0.15) 35%, rgba(27,22,18,0.25) 60%, rgba(27,22,18,0.88))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 26, color: "#fff", textAlign: "center" }}>
        <img src={BRAND.isotipoWhite} alt="" style={{ width: 46, height: 46, opacity: 0.9, position: "absolute", top: 22 }} />
        <img src={BRAND.logoWhite} alt={copy.brand} style={{ width: "76%", maxWidth: 300, height: "auto", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }} />
        <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.6)", margin: "18px 0 6px" }} />
        <button
          onClick={onOpen}
          style={{ marginTop: 22, padding: "12px 26px", color: "#fff", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 999, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", fontSize: 13, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          data-testid="book-open"
        >
          {copy.book.open}
        </button>
        <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 22px", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
          <span>Born in Colombia</span>
          <span>Crafted for the world</span>
        </div>
      </div>
    </div>,
  );

  const indexPage = pages.length;
  const indexEntries: { category: Category; page: number }[] = [];
  pages.push(null); // placeholder; filled once chapter pages are known

  for (const [i, category] of chapters.entries()) {
    const all = items.filter((item) => item.category === category.id && !item.extra);
    const first = all.slice(0, FIRST_PAGE_ROWS);
    const rest = all.slice(FIRST_PAGE_ROWS);
    chapterPage[category.id] = pages.length;
    indexEntries.push({ category, page: pages.length });
    pages.push(
      <div key={category.id} className="book-page-inner" data-testid={`chapter-${category.id}`}>
        <div className="kicker">{copy.book.chapter(i + 1)}</div>
        <div className="serif" style={{ fontSize: 30, lineHeight: 1.05 }}>{category.name}</div>
        <div className="serif-italic" style={{ fontSize: 15, color: "var(--smoke)", marginTop: -4 }}>{category.intro}</div>
        <div style={{ margin: "4px 0 2px" }}>
          <ChapterVisual category={category} />
        </div>
        <div>
          {first.map((item) => (
            <Row key={item.id} item={item} money={money} onItem={onItem} copy={copy} points={points} />
          ))}
        </div>
        {rest.length > 0 ? <div className="serif-italic" style={{ fontSize: 13, color: "var(--smoke)", marginTop: "auto" }}>{copy.book.continues} →</div> : null}
      </div>,
    );
    for (let start = 0; start < rest.length; start += NEXT_PAGE_ROWS) {
      const chunk = rest.slice(start, start + NEXT_PAGE_ROWS);
      const more = start + NEXT_PAGE_ROWS < rest.length;
      pages.push(
        <div key={`${category.id}-${start}`} className="book-page-inner">
          <div className="kicker">{category.name}</div>
          <div>
            {chunk.map((item) => (
              <Row key={item.id} item={item} money={money} onItem={onItem} copy={copy} points={points} />
            ))}
          </div>
          {more ? <div className="serif-italic" style={{ fontSize: 13, color: "var(--smoke)", marginTop: "auto" }}>{copy.book.continues} →</div> : null}
        </div>,
      );
    }
  }

  pages.push(
    <div key="colophon" className="book-page-inner" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: 14 }}>
      <Beans profile="LIBRE" size={180} />
      {points ? <div className="serif" style={{ fontSize: 24 }}>{copy.home.earnRule}</div> : null}
      <div style={{ fontSize: 14, color: "var(--smoke)", maxWidth: 260 }}>{copy.menu.notCharged}</div>
    </div>,
  );

  const total = pages.length;
  pages[indexPage] = (
    <div key="index" className="book-page-inner" data-testid="book-index">
      <div className="kicker">{copy.brand}</div>
      <div className="serif" style={{ fontSize: 32, lineHeight: 1 }}>{copy.book.index}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        {indexEntries.map(({ category, page }, i) => {
          const count = items.filter((item) => item.category === category.id && !item.extra).length;
          return (
            <button
              key={category.id}
              onClick={() => onChapter(page)}
              data-testid={`index-${category.id}`}
              style={{ textAlign: "left", borderRadius: 14, padding: "10px 12px 9px", background: "rgba(255,255,255,0.75)", boxShadow: "0 6px 18px -10px rgba(27,22,18,0.35), inset 0 1px 0 rgba(255,255,255,0.9)", display: "flex", flexDirection: "column", gap: 3, minHeight: 58 }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 10, color: "var(--smoke)", minWidth: 14 }}>{i + 1}</span>
                <span className="serif" style={{ fontSize: 15, lineHeight: 1.1 }}>{category.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--smoke)", paddingLeft: 20 }}>
                <span>{copy.book.items(count)}</span>
                <span style={{ color: "var(--roast)" }}>{page + 1}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return {
    pages: pages.map((page, i) => (
      <div key={i} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {page}
        {i > 0 && i < total - 1 && !(spread && i === 1) ? <Folio n={i + 1} total={total} copy={copy} /> : null}
      </div>
    )),
    chapterPage,
    indexPage: spread ? indexPage - (indexPage % 2) : indexPage,
    total,
  };
}

export function Verso({ copy }: { copy: Copy }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--cream)", display: "grid", placeItems: "center" }}>
      <div className="serif-italic" style={{ color: "rgba(27,22,18,0.25)", fontSize: 22, transform: "rotate(-90deg)", whiteSpace: "nowrap" }}>
        {copy.brand} · {copy.book.cover}
      </div>
    </div>
  );
}
