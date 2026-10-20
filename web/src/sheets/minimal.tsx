import { motion } from "motion/react";

import { Book } from "../book/book";
import { useCallback, useMemo, useState } from "react";

import type { MenuItem } from "@/src/data/menu";

import type { Catalog } from "../core/catalog";
import { LINES_OF } from "../core/chile";
import { CHILE_SOURCE } from "../core/chile-data";
import { photoSpec, PRODUCT_IMAGES } from "../core/photos";
import { visualFor } from "../core/visuals";
import type { Copy } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Beans } from "../motion/beans";
import { Product } from "../motion/product";
import { ChileSpread } from "./spread";

type Lang = "es" | "en";

/**
 * The page the guest is on (0 cover, 1 index, then chapters). Kept in the tab,
 * so coming back from a product or reloading lands on the same sheet.
 */
const PAGE_KEY = "libertario-cl-page";
const memory = {
  page: (() => {
    try {
      return Number(window.sessionStorage.getItem(PAGE_KEY)) || 0;
    } catch {
      return 0;
    }
  })(),
};
function rememberPage(page: number) {
  memory.page = page;
  try {
    window.sessionStorage.setItem(PAGE_KEY, String(page));
  } catch {
    /* the tab forgets; nothing breaks */
  }
}

/** One product per printed product, with every size or blend it is sold in. */
function productsOf(catalog: Catalog, chapterId: string): MenuItem[][] {
  return CHILE_SOURCE.filter((source) => source.category === chapterId)
    .map((source) => (LINES_OF[source.id] ?? []).map((id) => catalog.items.find((item) => item.id === id)).filter((item): item is MenuItem => !!item))
    .filter((lines) => lines.length > 0);
}

/** A soft ground for each chapter's card, taken from what it serves. */
const TINT: Record<string, string> = {
  "cl-coffee": "#efe8dc",
  "cl-filter": "#e9eef4",
  "cl-espresso": "#f3ebe1",
  "cl-cold": "#f1e6dc",
  "cl-matcha": "#eaf0e1",
  "cl-signature": "#f8e9dc",
  "cl-other": "#f4ece4",
  "cl-eggs": "#f6eee0",
  "cl-parfait": "#f6e6ea",
  "cl-cakes": "#f4e8e6",
  "cl-bakery": "#f5ecdc",
  "cl-cookies": "#efe7df",
  "cl-sandwiches": "#eef0e4",
  "cl-toast": "#f6ece0",
  "cl-bowls": "#e8f0e6",
};

/** Chapters whose star is a cut-out from the print rather than their first product. */
const HERO: Record<string, string> = {
  "cl-espresso": "cl-6-1235-335-95",
  "cl-cold": "cl-9-950-610-110",
  "cl-other": "cl-6-1135-385-95",
  "cl-cakes": "cl-13-565-470-110",
  "cl-cookies": "cl-14-1230-145-115",
  "cl-signature": "cl-te-flores",
  "cl-sandwiches": "cl-15-905-140-120",
  "cl-toast": "cl-16-1140-610-150",
};

/** The chapter's star: the first product drawn on its own, so it can float on the white. */
function heroOf(products: MenuItem[][], chapterId: string) {
  if (HERO[chapterId]) return photoSpec(HERO[chapterId]!);
  for (const [first] of products) {
    if (!first) continue;
    const visual = visualFor(first);
    if (visual.kind === "photo" && visual.photo.cutout) return visual.photo;
  }
  const first = products[0]?.[0];
  const visual = first ? visualFor(first) : null;
  return visual?.kind === "photo" ? visual.photo : null;
}

/**
 * The Chile menu, minimal: a full-screen cover, then a book. Its first page is
 * the index of chapters as cards; every chapter after it is one sheet, turned
 * with the thumb like the Colombian book, with one product floating alive, its
 * title in the print's type and a quiet list of names and prices.
 */
export function MinimalMenu({ catalog, copy, money, lang, setLang, onItem }: { catalog: Catalog; copy: Copy; money: (value: number) => string; lang: Lang; setLang: (lang: Lang) => void; onItem: (item: MenuItem) => void }) {
  const chapters = catalog.categories.filter((category) => productsOf(catalog, category.id).length > 0);
  const total = chapters.length + 3;
  const [page, setPageState] = useState(() => Math.min(memory.page, total - 1));
  const [command, setCommand] = useState<{ id: number; direction: "forward" | "back" } | null>(null);

  const setPage = useCallback((next: number) => {
    rememberPage(next);
    setPageState(next);
  }, []);
  const turn = (direction: "forward" | "back") => setCommand({ id: Date.now(), direction });

  const pages = useMemo(
    () => [
      <CoverSheet key="cover" copy={copy} lang={lang} setLang={setLang} onStart={() => turn("forward")} />,
      <IndexCards key="index" chapters={chapters} catalog={catalog} copy={copy} lang={lang} setLang={setLang} current={page - 2} onOpen={(i) => setPage(i + 2)} />,
      ...chapters.map((category, i) => (
        <ChapterPage
          key={category.id}
          category={category}
          catalog={catalog}
          money={money}
          lang={lang}
          live={Math.abs(i + 2 - page) <= 1}
          next={chapters[i + 1]?.name}
          onNext={() => turn("forward")}
          onItem={onItem}
        />
      )),
      // the last sheet says what the Colombian menu says on its last page
      <div key="colophon" className="book-page-inner mn-sheet mn-colophon" data-testid="book-colophon">
        <Beans profile="LIBRE" size={180} />
        <p>{copy.menu.notCharged}</p>
      </div>,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapters.map((c) => c.id + c.name).join(), catalog, copy, money, lang, page, onItem, setPage, setLang],
  );

  const onCover = page === 0;
  const onIndex = page === 1;
  const onEnd = page === total - 1;
  return (
    <div className="mn" data-testid="minimal-menu">
      <div className="mn-stage">
        <Book
          pages={pages}
          index={page}
          onIndex={setPage}
          spread={false}
          verso={() => <div style={{ position: "absolute", inset: 0, background: "#fff" }} />}
          command={command}
          nudge={onCover}
          className="mn-book"
        />
      </div>
      <header className="mn-bar glass lens strong">
        <div className="mn-top">
          <button className="mn-home" onClick={() => setPage(0)} aria-label={copy.book.toCover} data-testid="book-to-cover">
            <img src="/chile/brujula-azul.svg" alt="" width={28} height={28} />
            <span className="mn-city">{catalog.city.name === "Santiago" ? "Santiago de Chile" : catalog.city.name}</span>
          </button>
          {onIndex || onCover || onEnd ? (
            <span className="mn-spacer" />
          ) : (
            <span className="mn-count" aria-live="polite">
              {String(Math.max(1, page - 1)).padStart(2, "0")} <span>/ {String(chapters.length).padStart(2, "0")}</span>
            </span>
          )}
          <div className="mn-right">
            <LangSwitch lang={lang} setLang={setLang} />
            {onIndex ? null : (
              <button className="mn-index-button glass pill flat" onClick={() => setPage(1)} data-testid="book-to-index">
                {copy.book.toIndex}
              </button>
            )}
          </div>
        </div>
        <div className="mn-progress" aria-hidden="true">
          <motion.span animate={{ width: `${(Math.max(0, page - 1) / chapters.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
        </div>
      </header>
    </div>
  );
}

/** The print's cover as the book's first sheet: Start turns it like a page. */
function CoverSheet({ copy, lang, setLang, onStart }: { copy: Copy; lang: Lang; setLang: (lang: Lang) => void; onStart: () => void }) {
  return (
    <div className="mn-cover" data-testid="book-cover">
      <div className="mn-cover-art">
        <ChileSpread n={1} view="full" label={copy.brand} />
      </div>
      <div className="mn-start-wrap">
        <motion.button className="mn-start glass dark pill lens" onClick={onStart} data-testid="book-open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} whileTap={{ scale: 0.97 }}>
          {copy.book.start}
        </motion.button>
      </div>
    </div>
  );
}

function IndexCards({ chapters, catalog, copy, lang, setLang, current, onOpen }: { chapters: Catalog["categories"]; catalog: Catalog; copy: Copy; lang: Lang; setLang: (lang: Lang) => void; current: number; onOpen: (i: number) => void }) {
  return (
    <div className="book-page-inner mn-sheet" data-testid="book-index">
      <h1 className="mn-index-title">{copy.book.index}</h1>
      <div className="mn-cards">
        {chapters.map((category, i) => {
          const products = productsOf(catalog, category.id);
          const hero = heroOf(products, category.id);
          const coffee = category.id === "cl-coffee";
          return (
            <motion.button
              key={category.id}
              className={`mn-card${i === current ? " on" : ""}${i === 0 ? " wide" : ""}`}
              style={{ background: TINT[category.id] ?? "#f4f1ec" }}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.035 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpen(i)}
              data-testid={`index-${category.id}`}
            >
              <span className="mn-card-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="mn-card-art">
                {coffee ? (
                  ["PAZ", "LIBRE", "ROCK", "PUNK"].map((profile, k) => <img key={profile} src={PRODUCT_IMAGES[profile]} alt="" style={{ animationDelay: `${k * 0.4}s` }} />)
                ) : category.id === "cl-filter" ? (
                  <img src="/menu/cl/real-v60.webp" alt="" className="cut fade-v60" />
                ) : hero ? (
                  <img src={hero.src} srcSet={`${hero.src} 1x, ${hero.src.replace(/\.(webp|jpg)$/, "@2x.$1")} 2x`} alt="" className={hero.cutout ? "cut" : "photo"} style={{ animationDelay: `${(i % 4) * 0.5}s` }} />
                ) : null}
              </span>
              <span className="mn-card-name">{category.name}</span>
              <span className="mn-card-count">
                {products.length} {lang === "en" ? (products.length === 1 ? "item" : "items") : products.length === 1 ? "producto" : "productos"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ChapterPage({
  category,
  catalog,
  money,
  lang,
  live,
  next,
  onNext,
  onItem,
}: {
  category: Catalog["categories"][number];
  catalog: Catalog;
  money: (value: number) => string;
  lang: Lang;
  live: boolean;
  next: string | undefined;
  onNext: () => void;
  onItem: (item: MenuItem) => void;
}) {
  const products = productsOf(catalog, category.id);
  const hero = heroOf(products, category.id);
  // four bags across the sheet, a little overlapped
  const bag = Math.round(Math.min(132, (Math.min(window.innerWidth, 600) - 76) / 3.1));
  return (
    <section className="book-page-inner mn-sheet mn-page" data-testid={`chapter-${category.id}`} aria-label={category.name}>
      <div className="mn-hero">
        {live ? (
          category.id === "cl-filter" ? (
            <LivingPhoto photo={photoSpec("real-v60")} radius={0} interactive={false} style={{ width: "100%", height: "100%" }} />
          ) : category.id === "cl-coffee" ? (
            <div className="mn-packs">
              {["PAZ", "LIBRE", "ROCK", "PUNK"].map((profile) => (
                <Product key={profile} src={PRODUCT_IMAGES[profile]!} size={bag} float style={{ margin: `0 ${-Math.round(bag * 0.13)}px` }} />
              ))}
            </div>
          ) : hero ? (
            <LivingPhoto photo={{ ...hero, cutout: true }} radius={20} interactive={false} style={{ width: "100%", height: "100%" }} />
          ) : null
        ) : null}
      </div>
      <h1 className="mn-title">{category.name}</h1>
      {category.intro ? <p className="mn-intro">{category.intro}</p> : null}
      <ul className="mn-list">
        {products.map((lines) => {
          const first = lines[0]!;
          return (
            <li key={first.id}>
              <button className="mn-row" onClick={() => onItem(first)} data-testid={`book-item-${first.id}`}>
                <span className="mn-name">{first.name.split(" · ")[0]}</span>
                <span className="mn-price">{money(Math.min(...lines.map((line) => line.price)))}</span>
                {lines.length > 1 ? <span className="mn-sizes">{lines.length} {lang === "en" ? "options" : "opciones"}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {next ? (
        <button className="mn-next glass pill" onClick={onNext} data-testid={`next-${category.id}`}>
          {next} →
        </button>
      ) : null}
    </section>
  );
}

function LangSwitch({ lang, setLang, dark = false }: { lang: Lang; setLang: (lang: Lang) => void; dark?: boolean }) {
  return (
    <div className={`mn-lang glass pill flat${dark ? " dark" : ""}`}>
      {(["es", "en"] as const).map((option) => (
        <button key={option} onClick={() => setLang(option)} aria-pressed={lang === option} data-testid={`lang-${option}`}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export { photoSpec };
