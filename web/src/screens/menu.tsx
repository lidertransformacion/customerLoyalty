import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { MenuItem } from "@/src/data/menu";
import { pointsForPrice } from "@/src/data/program";

import { Book } from "../book/book";
import { buildBook, Verso } from "../book/pages";
import { filterCatalog, type MenuFilter } from "../core/catalog";
import { haptics } from "../core/haptics";
import { readVisit } from "../core/market";
import { menuOnly } from "../core/mode";
import { visualFor } from "../core/visuals";
import { useCopy, useLocale } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";
import { useAccount } from "../state/account";
import { useCatalog } from "../state/catalog";
import { markHintSeen, menuMemory } from "../state/menu-memory";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

type View = "book" | "list";

function useWide(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return wide;
}

/** The menu: a book you turn, or a list you search. Both read the same catalog. */
export function MenuScreen() {
  const copy = useCopy();
  const { money, lang, setLang } = useLocale();
  const navigate = useNavigate();
  const visit = readVisit();
  const catalog = useCatalog();
  const { account, dispatch } = useAccount();
  const wide = useWide();
  // Only the book for now; the list stays wired for later.
  const view = "book" as View;
  const [page, setPageState] = useState(() => menuMemory.page);
  const [filter, setFilterState] = useState<MenuFilter>(() => menuMemory.filter);
  const [hint, setHint] = useState(() => !menuMemory.hintSeen);
  const [command, setCommand] = useState<{ id: number; direction: "forward" | "back" } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const setPage = useCallback((next: number | ((current: number) => number)) => {
    setPageState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      menuMemory.page = value;
      if (value > 0 && !menuMemory.hintSeen) {
        markHintSeen();
        setHint(false);
      }
      return value;
    });
  }, []);
  const setFilter = useCallback((next: MenuFilter) => {
    menuMemory.filter = next;
    setFilterState(next);
  }, []);

  // the list comes back where it was
  useEffect(() => {
    if (view !== "list") return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = menuMemory.listScroll;
    const onScroll = () => {
      menuMemory.listScroll = node.scrollTop;
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [view]);

  const onItem = useCallback((item: MenuItem) => navigate(`/item/${item.id}`), [navigate]);
  const onChapter = useCallback((target: number) => {
    haptics.select();
    setPage(wide ? target - (target % 2) : target);
  }, [wide]);
  const onOpen = useCallback(() => {
    haptics.select();
    setCommand({ id: Date.now(), direction: "forward" });
  }, []);

  const book = useMemo(
    () => buildBook({ catalog, copy, money, spread: wide, onItem, onChapter, onOpen, points: !menuOnly }),
    [catalog, copy, money, wide, onItem, onChapter, onOpen],
  );

  useEffect(() => {
    if (page > book.total - 1) setPage(0);
  }, [book.total, page]);

  const results = useMemo(() => filterCatalog(catalog, filter), [catalog, filter]);
  const chapters = catalog.categories.filter((c) => c.id !== "extras");

  return (
    <Screen testId="menu" className="full">
      <div className="pad pad-top row" style={{ justifyContent: "space-between", paddingBottom: 8 }}>
        {view === "book" && page > 0 ? (
          <div className="row" style={{ gap: 6 }}>
            <button onClick={() => { haptics.select(); setPage(0); }} className="chip" style={{ background: "var(--cream)", minHeight: 38, paddingLeft: 12, paddingRight: 12 }} data-testid="book-to-cover" aria-label={copy.book.toCover}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10.5V19h11v-8.5" /></svg>
              {copy.book.toCover}
            </button>
            {page !== book.indexPage ? (
              <button onClick={() => { haptics.select(); setPage(book.indexPage); }} className="chip" style={{ background: "var(--cream)", minHeight: 38, paddingLeft: 12, paddingRight: 12 }} data-testid="book-to-index">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
                {copy.book.toIndex}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="kicker" style={{ minHeight: 38, display: "flex", alignItems: "center" }}>
            {copy.menu.kicker} · {catalog.city.name}
            {menuOnly && visit.table ? ` · ${copy.table.title(visit.table)}` : ""}
          </div>
        )}
        {menuOnly ? (
          <Glass pill flat style={{ display: "flex", padding: 3, background: "var(--cream)" }}>
            {(["es", "en"] as const).map((option) => (
              <button key={option} onClick={() => setLang(option)} data-testid={`lang-${option}`} style={{ padding: "6px 11px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: lang === option ? "#fff" : "transparent", boxShadow: lang === option ? "0 2px 8px -4px rgba(27,22,18,0.3)" : "none" }}>
                {option.toUpperCase()}
              </button>
            ))}
          </Glass>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === "book" ? (
          <motion.div key="book" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
            <div style={{ flex: 1, minHeight: 0, padding: `0 ${wide ? 24 : 14}px calc(var(--tabbar) + var(--sab) + 10px)` }}>
              <Book pages={book.pages} index={page} onIndex={setPage} spread={wide} verso={() => <Verso copy={copy} />} nudge={hint && page <= 1} command={command} />
            </div>
            <AnimatePresence>
              {hint && page <= 1 ? (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ position: "absolute", right: 18, top: page === 0 ? "70%" : "44%", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 6 }}
                  data-testid="turn-hint"
                >
                  <motion.div
                    animate={{ x: [0, -14, 0], opacity: [0.9, 0.5, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(27,22,18,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
                  </motion.div>
                  <span style={{ fontSize: 11, color: "rgba(27,22,18,0.55)", background: "rgba(255,255,255,0.7)", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{copy.book.turnHint}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="list" ref={listRef} className="scroll with-tabs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}>
            <div className="pad">
              <Glass flat className="glass-field" style={{ borderRadius: 18, background: "var(--cream)", flexDirection: "row", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--smoke)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input value={filter.text} onChange={(event) => setFilter({ ...filter, text: event.target.value })} placeholder={copy.menu.searchPlaceholder} aria-label={copy.menu.searchLabel} data-testid="menu-search" style={{ fontSize: 16 }} />
              </Glass>
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 20px 4px", scrollbarWidth: "none" }}>
              <button className={`chip ${filter.category === null ? "active" : ""}`} style={{ background: filter.category === null ? undefined : "var(--cream)" }} onClick={() => setFilter({ ...filter, category: null })}>{copy.menu.allCategories}</button>
              {chapters.map((category) => (
                <button key={category.id} className={`chip ${filter.category === category.id ? "active" : ""}`} style={{ background: filter.category === category.id ? undefined : "var(--cream)" }} onClick={() => setFilter({ ...filter, category: category.id })} data-testid={`chip-${category.id}`}>{category.name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "6px 20px 10px", scrollbarWidth: "none" }}>
              <button className={`chip ${filter.plant ? "active" : ""}`} style={{ background: filter.plant ? undefined : "var(--cream)" }} onClick={() => setFilter({ ...filter, plant: !filter.plant })}>🌱 {copy.menu.plant}</button>
              <button className={`chip ${filter.noNuts ? "active" : ""}`} style={{ background: filter.noNuts ? undefined : "var(--cream)" }} onClick={() => setFilter({ ...filter, noNuts: !filter.noNuts })}>{copy.menu.noNuts}</button>
              {[null, 15000, 30000].map((ceiling) => (
                <button key={String(ceiling)} className={`chip ${filter.ceiling === ceiling ? "active" : ""}`} style={{ background: filter.ceiling === ceiling ? undefined : "var(--cream)" }} onClick={() => setFilter({ ...filter, ceiling })}>
                  {ceiling === null ? copy.menu.priceAll : ceiling === 15000 ? copy.menu.priceTo15 : copy.menu.priceTo30}
                </button>
              ))}
            </div>
            <div className="pad" style={{ display: "grid", gridTemplateColumns: wide ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
              {results.length === 0 ? <div className="serif-italic" style={{ gridColumn: "1 / -1", color: "var(--smoke)", padding: 20, textAlign: "center" }}>{copy.menu.empty}</div> : null}
              {results.map((item, i) => {
                const visual = visualFor(item);
                const inOrder = account?.order.find((line) => line.itemId === item.id)?.quantity ?? 0;
                return (
                  <motion.div key={item.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03, type: "spring", stiffness: 260, damping: 26 }}>
                    <Press quiet onClick={() => onItem(item)} data-testid={`card-${item.id}`} style={{ width: "100%", textAlign: "left" }}>
                      <Glass flat style={{ overflow: "hidden", borderRadius: 22, background: "var(--paper)" }}>
                        <div style={{ height: 150, display: "grid", placeItems: "center", background: visual.kind === "product" ? "linear-gradient(180deg, #fff, var(--cream))" : "transparent", overflow: "hidden" }}>
                          {visual.kind === "product" ? (
                            <Product src={visual.src} size={104} float={false} />
                          ) : (
                            <LivingPhoto photo={visual.photo} radius={0} style={{ width: "100%", height: "100%" }} interactive={false} drift={i < 6} />
                          )}
                        </div>
                        <div style={{ padding: "10px 12px 12px" }}>
                          <div className="serif" style={{ fontSize: 16, lineHeight: 1.15 }}>{item.name}</div>
                          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                            <span style={{ fontWeight: 500 }}>{money(item.price)}</span>
                            <span style={{ fontSize: 11, color: "var(--roast)" }}>{copy.menu.earns(pointsForPrice(item.price))}</span>
                          </div>
                        </div>
                      </Glass>
                    </Press>
                    {account ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          dispatch({ type: "addToTable", itemId: item.id });
                        }}
                        aria-label={copy.order.add}
                        data-testid={`add-${item.id}`}
                        style={{ position: "relative", marginTop: -46, marginLeft: "auto", marginRight: 10, display: "block", width: 36, height: 36, borderRadius: 18, background: inOrder ? "var(--roast)" : "var(--ink)", color: "#fff", fontSize: 18, boxShadow: "0 8px 18px -8px rgba(27,22,18,0.6)" }}
                      >
                        {inOrder ? inOrder : "+"}
                      </button>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}
