import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { MenuItem } from "@/src/data/menu";
import { pointsForItem } from "@/src/data/menu";

import { filterCatalog, type MenuFilter } from "../core/catalog";
import { haptics } from "../core/haptics";
import { readVisit } from "../core/market";
import { menuOnly } from "../core/mode";
import { visualFor } from "../core/visuals";
import { useCopy, useLocale } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";
import { MinimalMenu } from "../menu/minimal";
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

/** The menu: a minimal book you turn (cover, index as cards, one chapter per sheet), or a list you search. Both read the same catalog. */
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
  const turnTo = useCallback((next: number) => {
    haptics.select();
    setPage(next);
  }, [setPage]);

  const results = useMemo(() => filterCatalog(catalog, filter), [catalog, filter]);
  const chapters = catalog.categories.filter((c) => c.id !== "extras");

  return (
    <Screen testId="menu" className="full">
      {view === "list" ? (
      <div className="pad pad-top row" style={{ justifyContent: "space-between", paddingBottom: 8 }}>
        <div className="kicker" style={{ minHeight: 38, display: "flex", alignItems: "center" }}>
          {copy.menu.kicker} · {catalog.city.name}
          {menuOnly && visit.table ? ` · ${copy.table.title(visit.table)}` : ""}
        </div>
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
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {view === "book" ? (
          <motion.div key="book" style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <MinimalMenu catalog={catalog} copy={copy} money={money} lang={lang} setLang={setLang} page={page} setPage={turnTo} points={!menuOnly} withTabs={!menuOnly} nudge={hint} onItem={onItem} />
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
                            <span style={{ fontSize: 11, color: "var(--roast)" }}>{copy.menu.earns(pointsForItem(item))}</span>
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
