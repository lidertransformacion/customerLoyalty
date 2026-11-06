import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { pointsForPrice } from "@/src/data/program";


import type { Catalog } from "../core/catalog";
import { groupsOf, type Group } from "../core/chile";
import { CHILE_COVERS } from "../core/chile-covers";
import { CHILE_RECOMMENDED } from "../core/chile-data";
import { menuOnly } from "../core/mode";
import { CHILE_PACKS, photoSpec } from "../core/photos";
import { searchGroups } from "../core/search";
import { visualFor } from "../core/visuals";
import type { Lang } from "../core/market";
import type { Copy } from "../i18n";
import { Beans } from "../motion/beans";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";
import { Glass } from "../ui/glass";
import { FORMAT_CUTS, heroOf, LangSwitch, PACK_PROFILES, ProductCard } from "./minimal";

import "./store.css";

const SCROLL_KEY = "libertario-cl-store-scroll";

type Props = {
  chapters: Catalog["categories"];
  catalog: Catalog;
  copy: Copy;
  money: (value: number) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  favoritesOpen: boolean;
  onFavoritesOpen: (open: boolean) => void;
  query: string;
  onQuery: (text: string) => void;
  onSearching: (on: boolean) => void;
};

/**
 * The Chile menu on a wide window: a shop rather than a book. The cover is a banner,
 * the categories stand in a rail on the left and follow the scroll, every chapter lies
 * on the page one after another with its hero and its cards four or five across, and
 * the search field and the hearts sit in the bar. Same paper, type, cards and glass.
 */
export function Store({ chapters, catalog, copy, money, lang, setLang, favorites, onToggleFavorite, favoritesOpen, onFavoritesOpen, query, onQuery, onSearching }: Props) {
  const main = useRef<HTMLElement>(null);
  // the product on view, in the panel across from the rail; the page narrows to make room
  const [opened, setOpened] = useState<Group | null>(null);
  const byLine = useMemo(() => new Map(chapters.flatMap((category) => groupsOf(catalog, category.id)).flatMap((group) => group.lines.map((line) => [line.id, group] as const))), [chapters, catalog]);
  const onItem = useCallback((item: { id: string }) => setOpened(byLine.get(item.id) ?? null), [byLine]);
  useEffect(() => {
    if (!opened) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpened(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened]);
  const [current, setCurrent] = useState<string>(chapters[0]?.id ?? "");
  const all = useMemo(() => chapters.flatMap((category) => groupsOf(catalog, category.id)), [chapters, catalog]);
  const nameOf = (id: string) => chapters.find((category) => category.id === id)?.name ?? "";
  const asked = query.trim();
  const results = asked ? searchGroups(all, asked) : null;
  const favoritesView = !asked && favoritesOpen;
  const recommended = useMemo(() => CHILE_RECOMMENDED.map((id) => all.find((group) => group.id === id)).filter((group): group is Group => !!group), [all]);
  const products = results ?? (favoritesView ? all.filter((group) => favorites.includes(group.id)) : null);

  // the mobile book keeps a "searching" switch; here the field is always there
  useEffect(() => {
    onSearching(asked !== "");
  }, [asked, onSearching]);

  // results and favourites start at the top of the page
  const showing = products ? "list" : "all";
  useEffect(() => {
    if (showing === "list") main.current?.scrollTo({ top: 0 });
  }, [showing, asked]);

  // where the reader was, back from a product: remembered as they scroll, restored at once on return
  useEffect(() => {
    const node = main.current;
    if (!node) return;
    try {
      const saved = Number(window.sessionStorage.getItem(SCROLL_KEY));
      if (saved > 0) node.scrollTo({ top: saved, behavior: "instant" });
    } catch {
      /* nothing */
    }
  }, []);
  const remember = useCallback(() => {
    const node = main.current;
    if (!node) return;
    try {
      window.sessionStorage.setItem(SCROLL_KEY, String(Math.round(node.scrollTop)));
    } catch {
      /* nothing */
    }
  }, []);

  // the rail follows the scroll: the chapter crossing a line near the top is the current one
  useEffect(() => {
    const node = main.current;
    if (!node || products || typeof IntersectionObserver === "undefined") return;
    const sections = Array.from(node.querySelectorAll<HTMLElement>("[data-chapter]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.getAttribute("data-chapter") ?? "");
        }
      },
      { root: node, rootMargin: "-18% 0px -72% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [products, chapters]);

  const jump = useCallback(
    (id: string) => {
      onQuery("");
      onFavoritesOpen(false);
      window.requestAnimationFrame(() => {
        main.current?.querySelector<HTMLElement>(`[data-chapter="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [onFavoritesOpen, onQuery],
  );

  const thumb = (id: string) => (id === "cl-coffee" ? CHILE_PACKS.PAZ : id === "cl-formats" ? photoSpec("cl-drip").src : CHILE_COVERS[id]?.src);
  const city = catalog.city.name === "Santiago" ? "Santiago de Chile" : catalog.city.name;

  return (
    <div className="st" data-testid="store">
      <header className="st-bar glass lens strong">
        <button
          className="mn-home"
          onClick={() => {
            onQuery("");
            onFavoritesOpen(false);
            main.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label={copy.book.toCover}
          data-testid="book-to-cover"
        >
          <img src="/chile/brujula-azul.webp" srcSet="/chile/brujula-azul.webp 1x, /chile/brujula-azul@2x.webp 2x" alt="" width={28} height={28} decoding="async" />
          <span className="mn-city">{city}</span>
        </button>
        <label className="st-search" data-no-turn="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={copy.menu.searchPlaceholder} aria-label={copy.menu.searchLabel} data-testid="menu-search" />
          {query ? (
            <button type="button" className="st-clear" onClick={() => onQuery("")} aria-label={copy.menu.close} data-testid="menu-search-clear">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          ) : null}
        </label>
        <div className="st-right">
          <button
            className={`mn-heart-toggle glass pill lens${favoritesView ? " on" : ""}`}
            onClick={() => {
              onQuery("");
              onFavoritesOpen(!favoritesView);
              main.current?.scrollTo({ top: 0 });
            }}
            aria-label={copy.menu.favorites}
            aria-pressed={favoritesView}
            data-testid="menu-favorites-toggle"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.3c0 5.4-7.5 10-7.5 10Z" /></svg>
          </button>
          <LangSwitch lang={lang} setLang={setLang} />
        </div>
      </header>

      <div className="st-body">
        <aside className="st-rail" data-testid="store-rail">
          <div className="st-rail-title">{copy.book.toCategories}</div>
          {chapters.map((category) => (
            <button
              key={category.id}
              className={`st-rail-item${!products && current === category.id ? " on" : ""}`}
              onClick={() => jump(category.id)}
              data-testid={`rail-${category.id}`}
            >
              <span className="st-rail-art">{thumb(category.id) ? <img src={thumb(category.id)} alt="" loading="lazy" decoding="async" /> : null}</span>
              <span className="st-rail-name">{category.name}</span>
              <span className="st-rail-count">{groupsOf(catalog, category.id).length}</span>
            </button>
          ))}
        </aside>

        <main ref={main} className="st-main" onScroll={remember} data-testid="store-main">
          {products ? (
            <section className="st-section st-results" data-testid="menu-grid-section">
              <h1 className="mn-title">{asked ? copy.menu.searchTitle : copy.menu.favorites}</h1>
              {asked ? <h2 className="mn-section">{copy.menu.resultsFor(asked)}</h2> : null}
              <div className="st-grid" data-testid="menu-grid">
                {products.length === 0 ? <div className="mn-empty">{favoritesView ? copy.menu.noFavorites : copy.menu.empty}</div> : null}
                {products.map((group, i) => (
                  <ProductCard key={group.id} group={group} index={i} note={nameOf(group.chapterId)} copy={copy} money={money} favorite={favorites.includes(group.id)} onToggleFavorite={onToggleFavorite} onItem={onItem} />
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="st-hero" data-testid="store-hero">
                <img src="/chile/img/p1-1.webp" alt="" decoding="async" />
                <div className="st-hero-text">
                  <span className="st-hero-kicker">{city}</span>
                  <h1>{copy.brandFull}</h1>
                  <p>{copy.menu.coverLine}</p>
                </div>
              </section>

              {recommended.length ? (
                <section className="st-section st-picks" data-testid="store-recommended">
                  <h2 className="mn-section">{copy.menu.recommended}</h2>
                  <div className="st-grid">
                    {recommended.map((group, i) => (
                      <ProductCard key={group.id} group={group} index={i} note={nameOf(group.chapterId)} copy={copy} money={money} favorite={favorites.includes(group.id)} onToggleFavorite={onToggleFavorite} onItem={onItem} prefix="pick-" />
                    ))}
                  </div>
                </section>
              ) : null}

              {chapters.map((category) => {
                const groups = groupsOf(catalog, category.id);
                const hero = heroOf(groups.map((group) => group.lines), category.id);
                const coffee = category.id === "cl-coffee";
                const formats = category.id === "cl-formats";
                return (
                  <section key={category.id} className="st-section" data-chapter={category.id} data-testid={`store-${category.id}`}>
                    <div className="st-section-head">
                      <div className={`st-section-hero${coffee || formats ? " packs" : ""}`}>
                        {coffee ? (
                          PACK_PROFILES.map((profile) => <Product key={profile} src={CHILE_PACKS[profile]!} size={78} float style={{ margin: "0 -10px" }} />)
                        ) : formats ? (
                          FORMAT_CUTS.map((key, i) => <Product key={key} src={photoSpec(key).src} size={i === 0 ? 96 : 70} float style={{ margin: "0 -6px" }} />)
                        ) : hero ? (
                          <LivingPhoto photo={{ ...hero, cutout: true }} radius={20} interactive={false} style={{ width: "100%", height: "100%" }} />
                        ) : null}
                      </div>
                      <div className="st-section-text">
                        <h2 className="mn-title">{category.name}</h2>
                        {category.intro ? <p className="mn-intro">{category.intro}</p> : null}
                        <span className="mn-ccard-count">{copy.book.items(groups.length)}</span>
                      </div>
                    </div>
                    <div className="st-grid" data-testid={`grid-${category.id}`}>
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
                  </section>
                );
              })}

              <footer className="st-colophon" data-testid="book-colophon">
                <Beans profile="LIBRE" size={140} />
                <p>{copy.menu.notCharged}</p>
              </footer>
            </>
          )}
        </main>

      </div>

      {/* the product, in a window floating over the shop; the shop dims behind it and a click there closes it */}
      <AnimatePresence>
        {opened ? (
          <motion.div
            key="backdrop"
            className="st-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpened(null)}
            data-testid="store-backdrop"
          />
        ) : null}
        {opened ? (
          <motion.aside
            key="panel"
            className="st-panel"
            initial={{ x: 48, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 48, opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.8 }}
            role="dialog"
            aria-modal="true"
            aria-label={opened.lines[0]?.name}
            data-testid="store-panel"
          >
            <ProductPanel key={opened.id} group={opened} chapter={nameOf(opened.chapterId)} copy={copy} money={money} favorite={favorites.includes(opened.id)} onToggleFavorite={() => onToggleFavorite(opened.id)} onClose={() => setOpened(null)} />
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** What a line is called next to its price: its size, or the blend it is made with. */
function lineLabel(line: Group["lines"][number], group: Group, copy: Copy): string {
  if (line.name.includes(" · ")) return line.name.split(" · ")[1]!;
  if (line.id.endsWith("-so")) return copy.menu.originLine;
  if (group.lines.some((other) => other.id.endsWith("-so"))) return copy.menu.blendLine;
  return line.name;
}

/** A product in the shop's panel: its living photograph, what it is, its lines and prices. */
function ProductPanel({ group, chapter, copy, money, favorite, onToggleFavorite, onClose }: { group: Group; chapter: string; copy: Copy; money: (value: number) => string; favorite: boolean; onToggleFavorite: () => void; onClose: () => void }) {
  const item = group.lines[0]!;
  const visual = visualFor(item);
  const pairing = item.description.match(/(?:Maridaje|Pairing):\s*(.+?)\.?$/)?.[1];
  const description = item.description.replace(/\s*(?:Maridaje|Pairing):.*$/, "");
  const from = Math.min(...group.lines.map((line) => line.price));
  return (
    <div className="st-panel-inner">
      <div className="st-panel-top">
        <button
          className={`mn-heart glass pill lens${favorite ? " on" : ""}`}
          onClick={onToggleFavorite}
          aria-label={favorite ? copy.menu.unfavorite : copy.menu.favorite}
          aria-pressed={favorite}
          data-testid={`fav-${group.id}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.3c0 5.4-7.5 10-7.5 10Z" /></svg>
        </button>
        <button className="st-close glass pill lens" onClick={onClose} aria-label={copy.menu.close} data-testid="store-panel-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="st-panel-photo">
        {visual.kind === "photo" ? (
          <LivingPhoto photo={{ ...visual.photo, cutout: true }} radius={18} style={{ width: "100%", height: "100%" }} testId={`living-${visual.photo.mood}`} />
        ) : (
          <Product src={visual.src} size={220} testId="product-3d" />
        )}
      </div>
      <Glass strong lens style={{ padding: 20, borderRadius: 24 }}>
        <div className="kicker">{chapter}</div>
        <h1 className="serif st-panel-name">{item.name.split(" · ")[0]}</h1>
        <div className="st-panel-chips">
          {item.vegan ? <span className="chip" style={{ background: "rgba(111,143,75,0.14)", color: "var(--matcha)", minHeight: 30, fontSize: 12 }}>🌱 {copy.menu.plant}</span> : null}
          {item.nuts ? <span className="chip" style={{ background: "rgba(122,67,40,0.12)", color: "var(--roast)", minHeight: 30, fontSize: 12 }}>🥜</span> : null}
          {item.profile ? <span className="chip" style={{ background: "var(--cream)", minHeight: 30, fontSize: 12 }}>{item.profile}</span> : null}
          {visual.kind === "photo" && visual.photo.mood === "cold" ? <span className="chip" style={{ background: "rgba(120,180,255,0.18)", color: "#2a5a9a", minHeight: 30, fontSize: 12 }}>❄︎</span> : null}
        </div>
        {description ? <p className="st-panel-text">{description}</p> : null}
        {pairing ? (
          <div className="st-panel-pairing">
            <span className="kicker">{copy.book.pairing}</span>
            {pairing}
          </div>
        ) : null}
        {group.lines.length > 1 ? (
          <ul className="st-panel-lines" data-testid="panel-lines">
            {group.lines.map((line) => (
              <li key={line.id}>
                <span>{lineLabel(line, group, copy)}</span>
                <strong>{line.price > 0 ? money(line.price) : copy.menu.askAtBar}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <div className="serif st-panel-price" data-testid="item-price">{from > 0 ? money(from) : copy.menu.askAtBar}</div>
        )}
        {!menuOnly ? <div className="st-panel-points">{copy.menu.earnsAtCounter(pointsForPrice(from))}</div> : null}
      </Glass>
    </div>
  );
}
