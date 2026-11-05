import { motion } from "motion/react";

import { Book } from "../book/book";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import type { MenuItem } from "@/src/data/menu";

import type { Catalog } from "../core/catalog";
import { groupsOf, type Group } from "../core/chile";
import { CHILE_COVERS } from "../core/chile-covers";
import { CHILE_RECOMMENDED } from "../core/chile-data";
import { searchGroups } from "../core/search";
import { CHILE_PACKS, photoSpec } from "../core/photos";
import { visualFor } from "../core/visuals";
import type { Copy } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Beans } from "../motion/beans";
import { Product } from "../motion/product";
import { ChileSpread } from "./spread";

type Lang = "es" | "en";

/** The cover holds this long before it turns to the index by itself. */
const COVER_MS = 2000;

/**
 * Where the guest was: the page (0 cover, 1 index, then chapters), whether the
 * index showed the favourites, and what was typed in the search. Kept in the
 * tab, so coming back from a product or reloading lands on the same spot.
 */
const PAGE_KEY = "libertario-cl-page";
const VIEW_KEY = "libertario-cl-view";
const QUERY_KEY = "libertario-cl-query";
/** The hearts, kept on the phone across visits. */
const FAVS_KEY = "libertario-cl-favs-v1";

function readSession(key: string): string {
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function writeSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* the tab forgets; nothing breaks */
  }
}
function readFavorites(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FAVS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
function writeFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(FAVS_KEY, JSON.stringify(ids));
  } catch {
    /* nothing */
  }
}

const memory = { page: Number(readSession(PAGE_KEY)) || 0 };
function rememberPage(page: number) {
  memory.page = page;
  writeSession(PAGE_KEY, String(page));
}

/** One product per printed product, with every size or blend it is sold in. */
function productsOf(catalog: Catalog, chapterId: string): MenuItem[][] {
  return groupsOf(catalog, chapterId).map((group) => group.lines);
}

/** A soft ground behind each chapter's cut-out on its card, taken from what it serves. */
const TINT: Record<string, string> = {
  "cl-coffee": "#efe8dc",
  "cl-formats": "#ece6dc",
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
  "cl-extras": "#f1ece3",
};
const PACK_PROFILES = ["PAZ", "LIBRE", "ROCK", "PUNK"] as const;
/** The print's cut-outs of the drip trio and the capsule boxes: what the formats chapter floats. */
const FORMAT_CUTS = ["cl-drip", "cl-capsulas-paz", "cl-capsulas-libre"] as const;

/** The print's own photograph of a product, if it has one. */
function printPhoto(item: MenuItem) {
  return item.photo ? photoSpec(item.photo) : null;
}

/** The chapter's star at the top of its sheet: its cover cut-out, else the first product's print cut, else its photograph. */
function heroOf(products: MenuItem[][], chapterId: string) {
  const cover = CHILE_COVERS[chapterId];
  if (cover) return cover;
  for (const [first] of products) {
    const print = first ? printPhoto(first) : null;
    if (print?.cutout) return print;
  }
  const first = products[0]?.[0];
  const visual = first ? visualFor(first) : null;
  return visual?.kind === "photo" ? visual.photo : null;
}

/**
 * The Chile menu, minimal: a full-screen cover that turns by itself, then a book.
 * Its first page is the menu as a grid: the chapters as pills, each product as a
 * card with its photograph, its price and a heart, and a search. Every chapter
 * after it is one sheet, turned with the thumb like the Colombian book, with one
 * product floating alive, its title in the print's type and a quiet list.
 */
export function MinimalMenu({ catalog, copy, money, lang, setLang, onItem }: { catalog: Catalog; copy: Copy; money: (value: number) => string; lang: Lang; setLang: (lang: Lang) => void; onItem: (item: MenuItem) => void }) {
  const chapters = catalog.categories.filter((category) => productsOf(catalog, category.id).length > 0);
  const total = chapters.length + 3;
  const [page, setPageState] = useState(() => Math.min(memory.page, total - 1));
  const [command, setCommand] = useState<{ id: number; direction: "forward" | "back" } | null>(null);
  const [favoritesOpen, setFavoritesOpenState] = useState(() => readSession(VIEW_KEY) === "favorites");
  const [query, setQueryState] = useState(() => readSession(QUERY_KEY));
  const [searching, setSearching] = useState(() => readSession(QUERY_KEY) !== "");
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  const setPage = useCallback((next: number) => {
    rememberPage(next);
    setPageState(next);
  }, []);
  const setFavoritesOpen = useCallback((open: boolean) => {
    writeSession(VIEW_KEY, open ? "favorites" : "");
    setFavoritesOpenState(open);
  }, []);
  const setQuery = useCallback((text: string) => {
    writeSession(QUERY_KEY, text);
    setQueryState(text);
  }, []);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
      writeFavorites(next);
      return next;
    });
  }, []);
  const turn = (direction: "forward" | "back") => setCommand({ id: Date.now(), direction });
  // what the index shows first: the bags and the first covers, fetched while the cover holds
  const warm = useMemo(() => [...Object.values(CHILE_PACKS), ...FORMAT_CUTS.map((key) => photoSpec(key).src), ...chapters.slice(0, 6).map((category) => CHILE_COVERS[category.id]?.src).filter((src): src is string => !!src)], [chapters]);

  const pages = useMemo(
    () => [
      <CoverSheet key="cover" copy={copy} active={page === 0} warm={warm} onStart={() => turn("forward")} />,
      <IndexSheet
        key="index"
        chapters={chapters}
        catalog={catalog}
        copy={copy}
        money={money}
        favoritesOpen={favoritesOpen}
        onFavoritesOpen={setFavoritesOpen}
        query={query}
        onQuery={setQuery}
        searching={searching}
        onSearching={setSearching}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onItem={onItem}
        onOpen={(i) => setPage(i + 2)}
      />,
      ...chapters.map((category, i) => (
        <ChapterPage
          key={category.id}
          category={category}
          catalog={catalog}
          copy={copy}
          money={money}
          live={Math.abs(i + 2 - page) <= 1}
          next={chapters[i + 1]?.name}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
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
    [chapters.map((c) => c.id + c.name).join(), catalog, copy, money, lang, page, favoritesOpen, query, searching, favorites, onItem, setPage, setFavoritesOpen, setQuery, toggleFavorite],
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
          className="mn-book"
        />
        {page >= 2 ? (
          <button className="mn-turn back" onClick={() => turn("back")} aria-label={copy.back} data-testid="turn-back">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        ) : null}
        {page >= 1 && page < total - 1 ? (
          <button className="mn-turn" onClick={() => turn("forward")} aria-label={copy.menu.turn} data-testid="turn-forward">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        ) : null}
      </div>
      <header className="mn-bar glass lens strong">
        <div className="mn-top">
          <button className="mn-home" onClick={() => setPage(0)} aria-label={copy.book.toCover} data-testid="book-to-cover">
            <img src="/chile/brujula-azul.webp" srcSet="/chile/brujula-azul.webp 1x, /chile/brujula-azul@2x.webp 2x" alt="" width={28} height={28} decoding="async" />
            {onCover || onIndex ? <span className="mn-city">{catalog.city.name === "Santiago" ? "Santiago de Chile" : catalog.city.name}</span> : null}
          </button>
          {onIndex || onCover || onEnd ? (
            <span className="mn-spacer" />
          ) : (
            <span className="mn-count" aria-live="polite">
              {String(Math.max(1, page - 1)).padStart(2, "0")} <span>/ {String(chapters.length).padStart(2, "0")}</span>
            </span>
          )}
          <div className="mn-right">
            {onIndex || onCover ? null : (
              <button
                className="mn-bar-search glass pill lens"
                onClick={() => {
                  setSearching(true);
                  setPage(1);
                }}
                aria-label={copy.menu.searchLabel}
                data-testid="bar-search"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              </button>
            )}
            <LangSwitch lang={lang} setLang={setLang} />
            {onIndex ? null : (
              <button className="mn-index-button" onClick={() => setPage(1)} data-testid="book-to-index">
                {copy.book.toCategories}
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

/**
 * The print's cover as the book's first sheet. A thin line fills along the foot
 * for three seconds and the page turns by itself; a tap turns it sooner.
 */
function CoverSheet({ copy, active, warm, onStart }: { copy: Copy; active: boolean; warm: string[]; onStart: () => void }) {
  const start = useRef(onStart);
  start.current = onStart;
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => start.current(), COVER_MS);
    // the index's first pictures come down while the cover holds, so the turn lands on a drawn page
    for (const src of warm) {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    }
    return () => window.clearTimeout(timer);
  }, [active, warm]);
  return (
    <div className="mn-cover" data-testid="book-cover">
      <img className="mn-cover-poster" src="/chile/img/p1-1.webp" alt="" aria-hidden="true" fetchPriority="high" decoding="async" />
      <div className="mn-cover-art">
        <ChileSpread n={1} view="full" label={copy.brand} />
      </div>
      <button className="mn-cover-tap" onClick={onStart} aria-label={copy.book.open} data-testid="book-open" />
      <div className="mn-load" aria-hidden="true">
        <motion.span key={active ? "on" : "off"} initial={{ width: "0%" }} animate={{ width: active ? "100%" : "0%" }} transition={{ duration: active ? COVER_MS / 1000 : 0, ease: "linear" }} />
      </div>
    </div>
  );
}

/** A product as a little card: its studio photograph, its name, the price it starts from, a line under it and a heart. */
function ProductCard({ group, index, note, copy, money, favorite, onToggleFavorite, onItem }: { group: Group; index: number; note: string | null; copy: Copy; money: (value: number) => string; favorite: boolean; onToggleFavorite: (id: string) => void; onItem: (item: MenuItem) => void }) {
  const first = group.lines[0]!;
  const from = Math.min(...group.lines.map((line) => line.price));
  const spec = first.studio ? photoSpec(first.studio) : null;
  return (
    <motion.article
      className="mn-pcard"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`card-${group.id}`}
    >
      <button className="mn-pcard-open" onClick={() => onItem(first)} data-testid={`book-item-${first.id}`}>
        <span className="mn-pcard-photo">
          {spec ? <img src={spec.src} alt="" loading={index < 4 ? "eager" : "lazy"} decoding="async" /> : null}
        </span>
        <span className="mn-pcard-name">{first.name.split(" · ")[0]}</span>
        <span className="mn-pcard-price">{from > 0 ? money(from) : copy.menu.askAtBar}</span>
        {note ? <span className="mn-pcard-note">{note}</span> : null}
        {first.vegan ? <span className="mn-tag">{copy.menu.plant}</span> : null}
      </button>
      <button
        className={`mn-heart glass pill lens${favorite ? " on" : ""}`}
        onClick={() => onToggleFavorite(group.id)}
        aria-label={favorite ? copy.menu.unfavorite : copy.menu.favorite}
        aria-pressed={favorite}
        data-testid={`fav-${group.id}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.3c0 5.4-7.5 10-7.5 10Z" /></svg>
      </button>
    </motion.article>
  );
}

/**
 * The menu as the guest meets it: the chapters as little cards, each with its
 * cut-out floating on a soft ground, and the hearts as one more card when there
 * are any. A card opens its sheet. Search changes everything: the field, a
 * showcase of the most striking products while nothing is typed, then the
 * results across every chapter.
 */
/** Whether a sheet has more below its fold and the reader has not scrolled it yet. */
function useMore(sheet: RefObject<HTMLElement | null>, when: string) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    let seen = false;
    const check = () => {
      if (el.scrollTop > 24) seen = true;
      setMore(!seen && el.scrollHeight - el.clientHeight > 48);
    };
    check();
    // once the photographs have given the cards their height
    const timer = window.setTimeout(check, 600);
    el.addEventListener("scroll", check, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    observer?.observe(el);
    for (const child of Array.from(el.children)) observer?.observe(child);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("scroll", check);
      observer?.disconnect();
    };
  }, [sheet, when]);
  return more;
}

/** The foot of a sheet with more below: the paper fades and a small nudge says to scroll, until the reader does. */
function ScrollHint({ sheet, copy, when }: { sheet: RefObject<HTMLElement | null>; copy: Copy; when: string }) {
  const more = useMore(sheet, when);
  return (
    <div className={`mn-more${more ? " on" : ""}`} aria-hidden={!more}>
      <button
        className="mn-more-button"
        tabIndex={more ? 0 : -1}
        onClick={() => sheet.current?.scrollBy({ top: Math.round(sheet.current.clientHeight * 0.6), behavior: "smooth" })}
        aria-label={copy.menu.more}
        data-testid="scroll-more"
      >
        <span>{copy.menu.more}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7 7 7-7" /></svg>
      </button>
    </div>
  );
}

function IndexSheet({
  chapters,
  catalog,
  copy,
  money,
  favoritesOpen,
  onFavoritesOpen,
  query,
  onQuery,
  searching,
  onSearching,
  favorites,
  onToggleFavorite,
  onItem,
  onOpen,
}: {
  chapters: Catalog["categories"];
  catalog: Catalog;
  copy: Copy;
  money: (value: number) => string;
  favoritesOpen: boolean;
  onFavoritesOpen: (open: boolean) => void;
  query: string;
  onQuery: (text: string) => void;
  searching: boolean;
  onSearching: (on: boolean) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onItem: (item: MenuItem) => void;
  onOpen: (chapterIndex: number) => void;
}) {
  const field = useRef<HTMLInputElement>(null);
  const all = useMemo(() => chapters.flatMap((category) => groupsOf(catalog, category.id)), [chapters, catalog]);
  const nameOf = (id: string) => chapters.find((category) => category.id === id)?.name ?? "";
  const asked = query.trim();
  const favoritesView = !searching && favoritesOpen;
  const results = asked ? searchGroups(all, asked) : null;
  const recommended = CHILE_RECOMMENDED.map((id) => all.find((group) => group.id === id)).filter((group): group is Group => !!group);
  const products = searching ? (results ?? recommended) : favoritesView ? all.filter((group) => favorites.includes(group.id)) : null;
  const heading = searching ? (results ? copy.menu.resultsFor(asked) : copy.menu.recommended) : null;
  const title = searching ? copy.menu.searchTitle : favoritesView ? copy.menu.favorites : copy.book.toCategories;

  const sheet = useRef<HTMLElement>(null);
  useEffect(() => {
    if (searching) field.current?.focus();
  }, [searching]);

  return (
    <>
      <section ref={sheet} className="book-page-inner mn-sheet mn-page mn-index" data-testid="book-index">
        <div className="mn-index-head">
          <h1 className="mn-index-title">{title}</h1>
          <button
            className={`mn-heart-toggle glass pill lens${favoritesView ? " on" : ""}`}
            onClick={() => {
              if (searching) {
                onQuery("");
                onSearching(false);
              }
              onFavoritesOpen(!favoritesView);
            }}
            aria-label={copy.menu.favorites}
            aria-pressed={favoritesView}
            data-testid="menu-favorites-toggle"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.3c0 5.4-7.5 10-7.5 10Z" /></svg>
          </button>
          <button
            className={`mn-search-toggle glass pill lens${searching ? " on" : ""}`}
            onClick={() => {
              if (searching) onQuery("");
              onSearching(!searching);
            }}
            aria-label={searching ? copy.menu.close : copy.menu.searchLabel}
            aria-pressed={searching}
            data-testid="menu-search-toggle"
          >
            {searching ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            )}
          </button>
        </div>

        {searching ? (
          <div className="mn-search" data-no-turn="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input ref={field} value={query} onChange={(event) => onQuery(event.target.value)} placeholder={copy.menu.searchPlaceholder} aria-label={copy.menu.searchLabel} data-testid="menu-search" />
          </div>
        ) : null}

        {heading ? <h2 className="mn-section">{heading}</h2> : null}

        {products ? (
          <div className="mn-grid" data-testid="menu-grid">
            {products.length === 0 ? <div className="mn-empty">{favoritesView ? copy.menu.noFavorites : copy.menu.empty}</div> : null}
            {products.map((group, i) => (
              <ProductCard key={group.id} group={group} index={i} note={nameOf(group.chapterId)} copy={copy} money={money} favorite={favorites.includes(group.id)} onToggleFavorite={onToggleFavorite} onItem={onItem} />
            ))}
          </div>
        ) : (
          <div className="mn-grid" data-testid="chapter-grid">
            {chapters.map((category, i) => {
              const groups = groupsOf(catalog, category.id);
              const hero = heroOf(groups.map((group) => group.lines), category.id);
              const coffee = category.id === "cl-coffee";
              const formats = category.id === "cl-formats";
              return (
                <motion.button
                  key={category.id}
                  className={`mn-ccard${coffee || formats ? " wide" : ""}${formats ? " formats" : ""}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpen(i)}
                  data-testid={`index-${category.id}`}
                >
                  <span className="mn-ccard-art" style={{ background: coffee || formats ? "#fff" : (TINT[category.id] ?? "#f4f1ec") }}>
                    {coffee ? (
                      PACK_PROFILES.map((profile, k) => <img key={profile} src={CHILE_PACKS[profile]} alt="" className="cut" decoding="async" style={{ animationDelay: `${k * 0.4}s` }} />)
                    ) : formats ? (
                      FORMAT_CUTS.map((key, k) => {
                        const spec = photoSpec(key);
                        return <img key={key} src={spec.src} alt="" className="cut" decoding="async" style={{ animationDelay: `${k * 0.4}s` }} />;
                      })
                    ) : hero ? (
                      <img src={hero.src} alt="" className="cut" loading={i < 4 ? "eager" : "lazy"} decoding="async" style={{ animationDelay: `${(i % 4) * 0.5}s` }} />
                    ) : null}
                  </span>
                  <span className="mn-ccard-name">{category.name}</span>
                  <span className="mn-ccard-count">{copy.book.items(groups.length)}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>
      <ScrollHint sheet={sheet} copy={copy} when={`${searching}|${favoritesView}|${products?.length ?? -1}`} />
    </>
  );
}

function ChapterPage({
  category,
  catalog,
  copy,
  money,
  live,
  next,
  favorites,
  onToggleFavorite,
  onNext,
  onItem,
}: {
  category: Catalog["categories"][number];
  catalog: Catalog;
  copy: Copy;
  money: (value: number) => string;
  live: boolean;
  next: string | undefined;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onNext: () => void;
  onItem: (item: MenuItem) => void;
}) {
  const sheet = useRef<HTMLElement>(null);
  const groups = groupsOf(catalog, category.id);
  const hero = heroOf(groups.map((group) => group.lines), category.id);
  // four bags across the sheet, overlapping a sixth of their width: 2.72 bags of room is what the row takes
  const bag = Math.round(Math.min(150, (Math.min(window.innerWidth, 600) - 76) / 2.72));
  // the drip trio and the capsule boxes, a little smaller than a bag, the trio wider
  const box = Math.round(bag * 0.9);
  return (
    <>
      <section ref={sheet} className="book-page-inner mn-sheet mn-page" data-testid={`chapter-${category.id}`} aria-label={category.name}>
        <div className="mn-hero">
          {live ? (
            category.id === "cl-coffee" ? (
              <div className="mn-packs">
                {PACK_PROFILES.map((profile) => (
                  <Product key={profile} src={CHILE_PACKS[profile]!} size={bag} float style={{ margin: `0 ${-Math.round(bag * 0.16)}px` }} />
                ))}
              </div>
            ) : category.id === "cl-formats" ? (
              <div className="mn-packs">
                {FORMAT_CUTS.map((key, i) => (
                  <Product key={key} src={photoSpec(key).src} size={i === 0 ? Math.round(box * 1.4) : box} float style={{ margin: `0 ${-Math.round(box * 0.08)}px` }} />
                ))}
              </div>
            ) : hero ? (
              <LivingPhoto photo={{ ...hero, cutout: true }} radius={20} interactive={false} style={{ width: "100%", height: "100%" }} />
            ) : null
          ) : null}
        </div>
        <h1 className="mn-title">{category.name}</h1>
        {category.intro ? <p className="mn-intro">{category.intro}</p> : null}
        <div className="mn-grid" data-testid={`grid-${category.id}`}>
          {groups.map((group, i) => (
            <ProductCard
              key={group.id}
              group={group}
              index={i}
              note={group.lines.length > 1 ? copy.book.options(group.lines.length) : null}
              copy={copy}
              money={money}
              favorite={favorites.includes(group.id)}
              onToggleFavorite={onToggleFavorite}
              onItem={onItem}
            />
          ))}
        </div>
        {next ? (
          <button className="mn-next glass pill" onClick={onNext} data-testid={`next-${category.id}`}>
            {next} →
          </button>
        ) : null}
      </section>
      <ScrollHint sheet={sheet} copy={copy} when={category.id} />
    </>
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

