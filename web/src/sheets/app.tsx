import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import type { Catalog } from "../core/catalog";
import { PRODUCT_IMAGES } from "../core/photos";
import { isPackChapter, photoForCategory } from "../core/visuals";
import type { Copy } from "../i18n";
import { CHAPTER_PAGE } from "./data";
import { ChileSpread } from "./spread";

type Lang = "es" | "en";

function LangSwitch({ lang, setLang, dark = false }: { lang: Lang; setLang: (lang: Lang) => void; dark?: boolean }) {
  return (
    <div className={`ch-lang${dark ? " dark" : ""}`}>
      {(["es", "en"] as const).map((option) => (
        <button key={option} onClick={() => setLang(option)} aria-pressed={lang === option} data-testid={`lang-${option}`}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** The print's cover over the whole screen: its silk alive, its lockup, and one way in. */
export function ChileCover({ copy, lang, setLang, onStart }: { copy: Copy; lang: Lang; setLang: (lang: Lang) => void; onStart: () => void }) {
  return (
    <div className="ch-cover" data-testid="book-cover">
      <div className="ch-cover-art">
        <ChileSpread n={1} view="full" label={copy.brand} />
      </div>
      <div className="ch-cover-top">
        <LangSwitch lang={lang} setLang={setLang} dark />
      </div>
      <motion.button
        className="ch-cover-start"
        onClick={onStart}
        data-testid="book-open"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 160, damping: 20 }}
        whileTap={{ scale: 0.96 }}
      >
        {copy.book.start}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </motion.button>
    </div>
  );
}

/** Always on top: home, the chapters to jump to (the index that never leaves), and the language. */
export function ChapterBar({
  copy,
  catalog,
  active,
  lang,
  setLang,
  onHome,
  onIndex,
  onChapter,
}: {
  copy: Copy;
  catalog: Catalog;
  active: string | null;
  lang: Lang;
  setLang: (lang: Lang) => void;
  onHome: () => void;
  onIndex: () => void;
  onChapter: (id: string) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const chapters = catalog.categories.filter((category) => CHAPTER_PAGE[category.id] !== undefined);

  // keep the chapter in view centred in the rail
  useEffect(() => {
    const node = rail.current?.querySelector<HTMLElement>(`[data-active="true"]`);
    node?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <div className="ch-bar-app">
      <div className="ch-bar-top">
        <button className="ch-round" onClick={onHome} aria-label={copy.book.toCover} data-testid="book-to-cover">
          <img src="/chile/brujula-azul.svg" alt="" width={26} height={26} />
        </button>
        <button className={`ch-index-pill${active === "index" ? " on" : ""}`} onClick={onIndex} data-testid="book-to-index">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
          {copy.book.toIndex}
        </button>
        <LangSwitch lang={lang} setLang={setLang} />
      </div>
      <div className="ch-rail" ref={rail}>
        {chapters.map((category) => {
          const on = active === category.id;
          const pack = isPackChapter(category.id);
          return (
            <button key={category.id} className={`ch-tab${on ? " on" : ""}`} data-active={on} onClick={() => onChapter(category.id)} data-testid={`tab-${category.id}`}>
              <img src={pack ? PRODUCT_IMAGES.PAZ! : photoForCategory(category.id, category.photo).src} alt="" style={{ objectFit: pack ? "contain" : "cover" }} />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
