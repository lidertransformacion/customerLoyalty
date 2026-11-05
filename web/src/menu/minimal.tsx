import { motion } from "motion/react";
import { useMemo, useState } from "react";

import type { Category, MenuItem } from "@/src/data/menu";
import { pointsForItem } from "@/src/data/menu";

import { Book } from "../book/book";
import type { Catalog } from "../core/catalog";
import { fromPrice, groupLines } from "../core/lines";
import { BRAND, CLIPS, PRODUCT_IMAGES } from "../core/photos";
import { photoForCategory } from "../core/visuals";
import type { Copy } from "../i18n";
import { Beans } from "../motion/beans";
import { LivingPhoto, retina } from "../motion/living-photo";
import { Product } from "../motion/product";
import "./minimal.css";

type Lang = "es" | "en";

const PACKS = ["PAZ", "LIBRE", "ROCK", "PUNK"] as const;

/** A soft ground for each chapter's card, taken from what it serves. */
const TINT: Record<string, string> = {
  coffee: "#efe8dc",
  filter: "#e9eef4",
  espresso: "#f3ebe1",
  "cold-brew": "#f1e6dc",
  matcha: "#eaf0e1",
  signature: "#f8e9dc",
  "other-drinks": "#f4ece4",
  eggs: "#f6eee0",
  parfait: "#f6e6ea",
  toast: "#f6ece0",
  bakery: "#f5ecdc",
  sandwiches: "#eef0e4",
  bowls: "#e8f0e6",
  cakes: "#f4e8e6",
  cookies: "#efe7df",
  cocktails: "#ebe4ec",
};

type Props = {
  catalog: Catalog;
  copy: Copy;
  money: (value: number) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
  page: number;
  setPage: (page: number) => void;
  /** Show the cerezas each product earns. Off in the menu-only build. */
  points: boolean;
  /** Leave room for the tab bar at the foot. */
  withTabs: boolean;
  nudge: boolean;
  onItem: (item: MenuItem) => void;
};

/**
 * The menu, minimal: a full-screen cover, then a book. Its first page is the
 * index of chapters as cards; every chapter after it is one sheet, turned with
 * the thumb, with its photograph alive, its title in the house serif and a quiet
 * list of products and prices. Same bones as the Chile menu, in Libertario's own type.
 */
export function MinimalMenu({ catalog, copy, money, lang, setLang, page, setPage, points, withTabs, nudge, onItem }: Props) {
  const chapters = useMemo(
    () => catalog.categories.filter((category) => category.id !== "extras" && catalog.items.some((item) => item.category === category.id && !item.extra)),
    [catalog],
  );
  const total = chapters.length + 3;
  const current = Math.min(page, total - 1);
  const [command, setCommand] = useState<{ id: number; direction: "forward" | "back" } | null>(null);
  const turn = (direction: "forward" | "back") => setCommand({ id: Date.now(), direction });

  const pages = useMemo(
    () => [
      <CoverSheet key="cover" copy={copy} onStart={() => turn("forward")} />,
      <IndexCards key="index" chapters={chapters} catalog={catalog} copy={copy} current={current - 2} onOpen={(i) => setPage(i + 2)} />,
      ...chapters.map((category, i) => (
        <ChapterPage
          key={category.id}
          category={category}
          catalog={catalog}
          copy={copy}
          money={money}
          points={points}
          live={Math.abs(i + 2 - current) <= 1}
          next={chapters[i + 1]?.name}
          onNext={() => turn("forward")}
          onItem={onItem}
        />
      )),
      <div key="colophon" className="book-page-inner mn-sheet mn-colophon" data-testid="book-colophon">
        <Beans profile="LIBRE" size={180} />
        {points ? <p className="serif mn-colophon-rule">{copy.home.earnRule}</p> : null}
        <p>{copy.menu.notCharged}</p>
      </div>,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapters.map((c) => c.id + c.name).join(), catalog, copy, money, points, current, onItem, setPage],
  );

  const onCover = current === 0;
  const onIndex = current === 1;
  const onEnd = current === total - 1;
  return (
    <div className={`mn${withTabs ? " with-tabs" : ""}`} data-testid="minimal-menu">
      <div className="mn-stage">
        <Book
          pages={pages}
          index={current}
          onIndex={setPage}
          spread={false}
          verso={() => <div style={{ position: "absolute", inset: 0, background: "#fff" }} />}
          command={command}
          nudge={nudge && onCover}
          className="mn-book"
        />
      </div>
      <header className="mn-bar glass lens strong">
        <div className="mn-top">
          <button className="mn-home" onClick={() => setPage(0)} aria-label={copy.book.toCover} data-testid="book-to-cover">
            <img src={BRAND.isotipoDark} alt="" width={26} height={26} />
            <span className="mn-city">{catalog.city.name}</span>
          </button>
          {onIndex || onCover || onEnd ? (
            <span className="mn-spacer" />
          ) : (
            <span className="mn-count" aria-live="polite" data-testid="book-count">
              {String(Math.max(1, current - 1)).padStart(2, "0")} <span>/ {String(chapters.length).padStart(2, "0")}</span>
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
          <motion.span animate={{ width: `${(Math.max(0, current - 1) / chapters.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
        </div>
      </header>
    </div>
  );
}

/** The roast, alive, with the logo: the cover as the book's first sheet. Start turns it like a page. */
function CoverSheet({ copy, onStart }: { copy: Copy; onStart: () => void }) {
  return (
    <div className="mn-cover" data-testid="book-cover">
      <LivingPhoto photo={CLIPS.roast!} radius={0} interactive={false} style={{ position: "absolute", inset: 0 }} />
      <div className="mn-cover-shade" />
      <div className="mn-cover-lockup">
        <img src={BRAND.isotipoWhite} alt="" className="mn-cover-mark" />
        <img src={BRAND.logoWhite} alt={copy.brand} className="mn-cover-logo" />
      </div>
      <div className="mn-start-wrap">
        <motion.button className="mn-start glass dark pill lens" onClick={onStart} data-testid="book-open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} whileTap={{ scale: 0.97 }}>
          {copy.book.start}
        </motion.button>
      </div>
      <div className="mn-cover-foot">
        <span>Born in Colombia</span>
        <span>Crafted for the world</span>
      </div>
    </div>
  );
}

function IndexCards({ chapters, catalog, copy, current, onOpen }: { chapters: Category[]; catalog: Catalog; copy: Copy; current: number; onOpen: (i: number) => void }) {
  return (
    <div className="book-page-inner mn-sheet" data-testid="book-index">
      <h1 className="mn-index-title serif">{copy.book.index}</h1>
      <div className="mn-cards">
        {chapters.map((category, i) => {
          const count = groupLines(catalog.items.filter((item) => item.category === category.id && !item.extra)).length;
          const photo = photoForCategory(category.id);
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
                {category.id === "coffee" ? (
                  PACKS.map((profile, k) => <img key={profile} src={PRODUCT_IMAGES[profile]} alt="" className="cut" style={{ animationDelay: `${k * 0.4}s` }} />)
                ) : (
                  <img src={photo.src} srcSet={`${photo.src} 1x, ${retina(photo.src)} 2x`} alt="" className="photo" loading="lazy" />
                )}
              </span>
              <span className="mn-card-name serif">{category.name}</span>
              <span className="mn-card-count">{copy.book.items(count)}</span>
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
  copy,
  money,
  points,
  live,
  next,
  onNext,
  onItem,
}: {
  category: Category;
  catalog: Catalog;
  copy: Copy;
  money: (value: number) => string;
  points: boolean;
  live: boolean;
  next: string | undefined;
  onNext: () => void;
  onItem: (item: MenuItem) => void;
}) {
  const products = groupLines(catalog.items.filter((item) => item.category === category.id && !item.extra));
  // four bags across the sheet, a little overlapped
  const bag = Math.round(Math.min(132, (Math.min(window.innerWidth, 600) - 76) / 3.1));
  return (
    <section className="book-page-inner mn-sheet mn-page" data-testid={`chapter-${category.id}`} aria-label={category.name}>
      <div className="mn-hero">
        {live ? (
          category.id === "coffee" ? (
            <div className="mn-packs">
              {PACKS.map((profile) => (
                <Product key={profile} src={PRODUCT_IMAGES[profile]!} size={bag} float style={{ margin: `0 ${-Math.round(bag * 0.13)}px` }} />
              ))}
            </div>
          ) : (
            <LivingPhoto photo={photoForCategory(category.id)} radius={20} interactive={false} style={{ width: "100%", height: "100%" }} />
          )
        ) : null}
      </div>
      <h1 className="mn-title serif">{category.name}</h1>
      {category.intro ? <p className="mn-intro serif-italic">{category.intro}</p> : null}
      <ul className="mn-list">
        {products.map((group) => {
          const first = group.lines[0]!;
          return (
            <li key={first.id}>
              <button className="mn-row" onClick={() => onItem(first)} data-testid={`book-item-${first.id}`}>
                <span className="mn-name">{group.name}</span>
                <span className="mn-price">{money(fromPrice(group))}</span>
                {group.lines.length > 1 || points ? (
                  <span className="mn-sizes">
                    {group.lines.length > 1 ? copy.book.options(group.lines.length) : null}
                    {group.lines.length > 1 && points ? " · " : null}
                    {points ? copy.menu.earns(pointsForItem(first)) : null}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {next ? (
        <button className="mn-next glass pill serif" onClick={onNext} data-testid={`next-${category.id}`}>
          {next} →
        </button>
      ) : null}
    </section>
  );
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return (
    <div className="mn-lang glass pill flat">
      {(["es", "en"] as const).map((option) => (
        <button key={option} onClick={() => setLang(option)} aria-pressed={lang === option} data-testid={`lang-${option}`}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
