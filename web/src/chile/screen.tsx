import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Book } from "../book/book";
import { haptics } from "../core/haptics";
import { useCopy } from "../i18n";
import "./chile.css";
import { CHILE_SPREADS, PAGE, pairingTarget, printedToSpread, TRIM, type ChileItem } from "./data";
import { ChileDefs } from "./effects";
import { ChileSpread, loadSpread, type View } from "./spread";
import { ZoomStage, type ZoomHandle } from "./zoom";
import hotspots from "./hotspots.json";

type Entry = { n: number; view: View } | null;

const HINT_KEY = "libertario-chile-hint";
const memory = { page: 0 };

function useWide(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return wide;
}

/** Phone: one page at a time. Desktop: the print's spreads, cover and back alone on their side. */
function entriesFor(wide: boolean): Entry[] {
  const middle: Entry[] = [];
  for (let n = 2; n < CHILE_SPREADS; n += 1) middle.push({ n, view: "left" }, { n, view: "right" });
  const cover: Entry = { n: 1, view: "full" };
  const back: Entry = { n: CHILE_SPREADS, view: "full" };
  return wide ? [null, cover, ...middle, back, null] : [cover, ...middle, back];
}

function indexOf(entries: Entry[], n: number, side: "left" | "right" | "full"): number {
  const found = entries.findIndex((entry) => entry && entry.n === n && (entry.view === side || entry.view === "full"));
  return Math.max(0, found);
}

/** Fits a box of the given ratio inside its parent. */
function useFit(ratio: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const style = getComputedStyle(node);
      const W = node.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const H = node.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const w = Math.min(W, H * ratio);
      setSize({ w: Math.floor(w), h: Math.floor(w / ratio) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ratio]);
  return { ref, size };
}

const SPOTS = hotspots as Record<string, { spread: number; x: number; y: number; w: number; h: number }>;

/** The Chile menu as printed, page by page, alive. */
export function ChileMenuScreen() {
  const copy = useCopy();
  const wide = useWide();
  const entries = useMemo(() => entriesFor(wide), [wide]);
  const [page, setPageState] = useState(() => memory.page);
  const [command, setCommand] = useState<{ id: number; direction: "forward" | "back" } | null>(null);
  const [item, setItem] = useState<ChileItem | null>(null);
  const [hint, setHint] = useState(() => {
    try {
      return window.localStorage.getItem(HINT_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const zoomRef = useRef<ZoomHandle>(null);
  const [zoomed, setZoomed] = useState(false);
  const ratio = (PAGE.width * (wide ? 2 : 1)) / PAGE.height;
  const { ref, size } = useFit(ratio);

  const setPage = useCallback((next: number) => {
    memory.page = next;
    setPageState(next);
    if (next > 0) {
      setHint(false);
      try {
        window.localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* the hint just shows again */
      }
    }
  }, []);

  // keep the page when the layout switches between phone and desktop
  const lastWide = useRef(wide);
  useEffect(() => {
    if (lastWide.current === wide) return;
    const previous = entriesFor(lastWide.current)[page];
    lastWide.current = wide;
    if (!previous) return setPage(0);
    let target = indexOf(entries, previous.n, previous.view === "right" ? "right" : previous.view === "left" ? "left" : "full");
    if (wide && target % 2 === 1) target -= 1;
    setPage(target);
  }, [entries, page, setPage, wide]);

  // fetch the spreads around the one in view
  useEffect(() => {
    const here = entries[page] ?? entries[page + 1];
    const n = here?.n ?? 1;
    for (const k of [n, n + 1, n - 1, n + 2]) if (k >= 1 && k <= CHILE_SPREADS) void loadSpread(k);
  }, [entries, page]);

  const goPrinted = useCallback(
    (printed: number) => {
      haptics.select();
      const { spread, side } = printedToSpread(printed);
      let target = indexOf(entries, spread, side);
      if (wide && target % 2 === 1) target -= 1;
      setPage(target);
    },
    [entries, setPage, wide],
  );

  const openItem = useCallback((next: ChileItem) => {
    haptics.select();
    setItem(next);
  }, []);

  const pages = useMemo(
    () =>
      entries.map((entry, i) =>
        entry ? <ChileSpread key={`${entry.n}-${String(entry.view)}-${i}`} n={entry.n} view={entry.view} onItem={openItem} onIndex={goPrinted} label={`${copy.chile.title}, ${entry.n}`} /> : <div key={`blank-${i}`} className="ch-blank" />,
      ),
    [copy.chile.title, entries, goPrinted, openItem],
  );

  const onCover = page === 0;
  return (
    <div className="ch-screen" data-testid="chile-menu">
      <ChileDefs />
      <header className="ch-bar">
        <button
          className="ch-chip"
          data-testid="ch-cover"
          onClick={() => {
            if (onCover) setCommand({ id: Date.now(), direction: "forward" });
            else setPage(0);
          }}
        >
          {onCover ? copy.chile.open : copy.chile.cover}
        </button>
        <img src="/chile/brujula-azul.svg" alt="Libertario" style={{ height: 30, width: 30 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ch-chip ch-icon" data-testid="ch-zoom-button" aria-label={zoomed ? copy.chile.fit : copy.chile.zoom} aria-pressed={zoomed} onClick={() => zoomRef.current?.toggle()}>
            {zoomed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8v6M8 11h6" /></svg>
            )}
          </button>
          <button className="ch-chip" data-testid="ch-index" onClick={() => goPrinted(4)}>
            {copy.chile.index}
          </button>
        </div>
      </header>
      <div className="ch-stage" ref={ref}>
        {size ? (
          <ZoomStage ref={zoomRef} width={size.w} height={size.h} onZoomed={setZoomed}>
            <Book
              pages={pages}
              index={page}
              onIndex={setPage}
              spread={wide}
              verso={() => <div style={{ position: "absolute", inset: 0, background: "#e9dfcb" }} />}
              nudge={hint && page === 0}
              command={command}
              className={`chile${page === 0 || page >= entries.length - (wide ? 2 : 1) ? " alone" : ""}`}
            />
            <AnimatePresence>
              {hint && page === 0 ? (
                <motion.div className="ch-hint" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} data-testid="ch-hint">
                  <motion.div
                    animate={{ x: [0, -14, 0], opacity: [0.95, 0.55, 0.95] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(233,223,203,0.4)", border: "1px solid rgba(233,223,203,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "grid", placeItems: "center", color: "#fff" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
                  </motion.div>
                  <span>{copy.chile.turnHint}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </ZoomStage>
        ) : null}
      </div>
      <ItemSheet item={item} onClose={() => setItem(null)} onOpen={openItem} />
    </div>
  );
}

function ItemSheet({ item, onClose, onOpen }: { item: ChileItem | null; onClose: () => void; onOpen: (item: ChileItem) => void }) {
  const copy = useCopy();
  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  const view = item ? zoomOf(item) : null;
  const paired = item?.pairing ? pairingTarget(item.pairing) : undefined;
  return (
    <AnimatePresence>
      {item && view ? (
        <>
          <motion.div key="backdrop" className="ch-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <div className="ch-sheet-wrap" key="wrap">
            <motion.div
              key={item.id}
              className="ch-sheet"
              role="dialog"
              aria-label={item.name}
              data-testid="ch-sheet"
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) onClose();
              }}
            >
              <div className="ch-sheet-photo">
                <ChileSpread n={view.n} view={view.box} label={item.name} />
                <button className="ch-close" onClick={onClose} aria-label={copy.chile.close} data-testid="ch-sheet-close">✕</button>
              </div>
              <div className="ch-sheet-body">
                <h2>{item.name}</h2>
                {item.description ? <p>{item.description}</p> : null}
                <div className="ch-prices">
                  {item.prices.map((price) => (
                    <div key={`${price.label ?? ""}${price.value}`}>
                      <span>{price.label ?? copy.chile.prices}</span>
                      <strong>{price.value}</strong>
                    </div>
                  ))}
                </div>
                {item.pairing ? (
                  <>
                    <span className="ch-label">{copy.chile.pairing}</span>
                    {paired && paired.id !== item.id ? (
                      <button className="ch-pairing" onClick={() => onOpen(paired)} data-testid="ch-pairing">{item.pairing} →</button>
                    ) : (
                      <span className="ch-pairing">{item.pairing}</span>
                    )}
                  </>
                ) : null}
                {item.pairings ? (
                  <>
                    <span className="ch-label">{copy.chile.pairing}</span>
                    {item.pairings.map((line) => (
                      <span key={line} className="ch-pairing">{line}</span>
                    ))}
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/** The plate of an item, framed 4:3; items without a photo show their line on the page. */
function zoomOf(item: ChileItem): { n: number; box: View } {
  if (item.focus) {
    const { spread, x, y, r } = item.focus;
    const h = r * 2;
    const w = h * (4 / 3);
    const pageW = spread === 1 || spread === CHILE_SPREADS ? PAGE.width : PAGE.width * 2;
    const left = Math.min(Math.max(x - w / 2, TRIM.x), TRIM.x + pageW - w);
    const top = Math.min(Math.max(y - h / 2, TRIM.y), TRIM.y + PAGE.height - h);
    return { n: spread, box: { x: left, y: top, w, h } };
  }
  const spot = SPOTS[item.id];
  const cx = spot ? spot.x + spot.w / 2 : 400;
  const cy = spot ? spot.y + spot.h / 2 : 400;
  return { n: item.spread, box: { x: cx - 180, y: cy - 135, w: 360, h: 270 } };
}
