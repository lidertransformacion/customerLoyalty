import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { MenuItem } from "@/src/data/menu";

import type { Catalog } from "../core/catalog";
import { LINES_OF } from "../core/chile";
import { CHILE_SOURCE } from "../core/chile-data";
import { photoSpec, PRODUCT_IMAGES } from "../core/photos";
import { visualFor } from "../core/visuals";
import type { Copy } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";
import { ChileSpread } from "./spread";

type Lang = "es" | "en";

/** Where the guest was, kept while the app is open, so coming back from a product lands in place. */
const memory = { started: false, chapter: 0 };

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
 * The Chile menu, minimal: a full-screen cover, then one chapter per screen,
 * swiped sideways. Each chapter shows one product floating alive, its title in
 * the print's type, and a quiet list of names and prices.
 */
export function MinimalMenu({ catalog, copy, money, lang, setLang, onItem }: { catalog: Catalog; copy: Copy; money: (value: number) => string; lang: Lang; setLang: (lang: Lang) => void; onItem: (item: MenuItem) => void }) {
  const chapters = catalog.categories.filter((category) => productsOf(catalog, category.id).length > 0);
  const [started, setStarted] = useState(memory.started);
  const [current, setCurrent] = useState(memory.chapter);
  const [index, setIndex] = useState(false);
  const rail = useRef<HTMLDivElement>(null);

  const go = useCallback((n: number, smooth = true) => {
    const node = rail.current;
    if (!node) return;
    node.scrollTo({ left: n * node.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // back from a product: the same chapter
  useLayoutEffect(() => {
    if (started) go(memory.chapter, false);
  }, [started, go]);

  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const onScroll = () => {
      const n = Math.round(node.scrollLeft / Math.max(1, node.clientWidth));
      if (n !== memory.chapter) {
        memory.chapter = n;
        setCurrent(n);
      }
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [started]);

  const start = () => {
    memory.started = true;
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="mn-cover" data-testid="book-cover">
        <div className="mn-cover-art">
          <ChileSpread n={1} view="full" label={copy.brand} />
        </div>
        <div className="mn-top on-dark">
          <span />
          <LangSwitch lang={lang} setLang={setLang} dark />
        </div>
        <div className="mn-start-wrap">
        <motion.button className="mn-start" onClick={start} data-testid="book-open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} whileTap={{ scale: 0.97 }}>
          {copy.book.start}
        </motion.button>
        </div>
      </div>
    );
  }

  const chapter = chapters[current];
  return (
    <div className="mn" data-testid="minimal-menu">
      <header className="mn-top">
        <button className="mn-home" onClick={() => { memory.started = false; setStarted(false); }} aria-label={copy.book.toCover} data-testid="book-to-cover">
          <img src="/chile/brujula-azul.svg" alt="" width={28} height={28} />
        </button>
        <span className="mn-count" aria-live="polite">
          {String(current + 1).padStart(2, "0")} <span>/ {String(chapters.length).padStart(2, "0")}</span>
        </span>
        <button className="mn-index-button" onClick={() => setIndex(true)} data-testid="book-to-index">
          {copy.book.toIndex}
        </button>
      </header>
      <div className="mn-progress" aria-hidden="true">
        <motion.span animate={{ width: `${((current + 1) / chapters.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
      </div>

      <div className="mn-rail" ref={rail}>
        {chapters.map((category, i) => {
          const products = productsOf(catalog, category.id);
          const hero = heroOf(products, category.id);
          const near = Math.abs(i - current) <= 1;
          return (
            <section key={category.id} className="mn-page" data-testid={`chapter-${category.id}`} aria-label={category.name}>
              <div className="mn-hero">
                {near ? (
                  category.id === "cl-coffee" ? (
                    <div className="mn-packs">
                      {["PAZ", "LIBRE", "ROCK", "PUNK"].map((profile) => (
                        <Product key={profile} src={PRODUCT_IMAGES[profile]!} size={84} float />
                      ))}
                    </div>
                  ) : hero ? (
                    <LivingPhoto photo={{ ...hero, cutout: true }} radius={20} interactive={i === current} style={{ width: "100%", height: "100%" }} />
                  ) : null
                ) : null}
              </div>
              <h1 className="mn-title">{category.name}</h1>
              {category.intro ? <p className="mn-intro">{category.intro}</p> : null}
              <ul className="mn-list">
                {products.map((lines) => {
                  const first = lines[0]!;
                  const name = first.name.split(" · ")[0];
                  return (
                    <li key={first.id}>
                      <button className="mn-row" onClick={() => onItem(first)} data-testid={`book-item-${first.id}`}>
                        <span className="mn-name">{name}</span>
                        <span className="mn-price">{money(Math.min(...lines.map((line) => line.price)))}</span>
                        {lines.length > 1 ? <span className="mn-sizes">{lines.length} {lang === "en" ? "options" : "opciones"}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {i < chapters.length - 1 ? (
                <button className="mn-next" onClick={() => go(i + 1)} data-testid={`next-${category.id}`}>
                  {chapters[i + 1]!.name} →
                </button>
              ) : null}
            </section>
          );
        })}
      </div>

      <AnimatePresence>
        {index ? (
          <motion.div className="mn-index" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} data-testid="book-index">
            <div className="mn-top">
              <LangSwitch lang={lang} setLang={setLang} />
              <button className="mn-index-button" onClick={() => setIndex(false)} data-testid="index-close">
                {copy.web.close}
              </button>
            </div>
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
                    onClick={() => {
                      setIndex(false);
                      go(i, false);
                    }}
                    data-testid={`index-${category.id}`}
                  >
                    <span className="mn-card-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mn-card-art">
                      {coffee ? (
                        ["PAZ", "LIBRE", "ROCK", "PUNK"].map((profile, k) => (
                          <img key={profile} src={PRODUCT_IMAGES[profile]} alt="" style={{ animationDelay: `${k * 0.4}s` }} />
                        ))
                      ) : hero ? (
                        <img src={hero.src} srcSet={`${hero.src} 1x, ${hero.src.replace(/\.(webp|jpg)$/, "@2x.$1")} 2x`} alt="" className={hero.cutout ? "cut" : "photo"} style={{ animationDelay: `${(i % 4) * 0.5}s` }} />
                      ) : null}
                    </span>
                    <span className="mn-card-name">{category.name}</span>
                    <span className="mn-card-count">{products.length} {lang === "en" ? (products.length === 1 ? "item" : "items") : products.length === 1 ? "producto" : "productos"}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {chapter ? null : null}
    </div>
  );
}

function LangSwitch({ lang, setLang, dark = false }: { lang: Lang; setLang: (lang: Lang) => void; dark?: boolean }) {
  return (
    <div className={`mn-lang${dark ? " dark" : ""}`}>
      {(["es", "en"] as const).map((option) => (
        <button key={option} onClick={() => setLang(option)} aria-pressed={lang === option} data-testid={`lang-${option}`}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export { photoSpec };
