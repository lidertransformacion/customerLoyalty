import { memo, useEffect, useState, type ReactNode } from "react";

import { CHILE_INDEX, CHILE_ITEMS, PAGE, TRIM, type ChileItem } from "./data";
import { EffectLayer, EFFECTS, FLOW, STILL } from "./effects";
import hotspots from "./hotspots.json";

type Layer = { t: "v" | "i"; svg: string };
type Photo = { key: string; alpha: boolean; w: number; h: number; matrix: number[] };
type Rect = { x0: number; y0: number; x1: number; y1: number };
export type SpreadData = { n: number; trim: [number, number, number, number]; defs: string; layers: (Layer & { keys: string[]; box: Rect | null })[] };

/** Where a photo lands on the page, from its placement matrix. */
function photoBox(photo: Photo): Rect {
  const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = photo.matrix;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [u, v] of [[0, 0], [photo.w, 0], [0, photo.h], [photo.w, photo.h]] as const) {
    xs.push(a * u + c * v + e);
    ys.push(b * u + d * v + f);
  }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

const meets = (r: Rect, x: number, y: number, w: number, h: number) => r.x0 < x + w && r.x1 > x && r.y0 < y + h && r.y1 > y;

const cache = new Map<number, Promise<SpreadData>>();
const ready = new Map<number, SpreadData>();

/** Fetches a spread once and marks each photo with how it moves. */
export function loadSpread(n: number): Promise<SpreadData> {
  let pending = cache.get(n);
  if (!pending) {
    pending = fetch(`/chile/pages/p${n}.json`)
      .then((response) => response.json() as Promise<{ n: number; trim: [number, number, number, number]; defs: string; layers: Layer[]; photos: Photo[] }>)
      .then((raw) => {
        const alpha = new Map(raw.photos.map((photo) => [photo.key, photo.alpha]));
        const boxes = new Map(raw.photos.map((photo) => [photo.key, photoBox(photo)]));
        const layers = raw.layers.map((layer) => {
          const keys: string[] = [];
          // the print's cream paper becomes white
          const svg = layer.svg.replace(/fill="rgb\(91\.470337%, 87\.261963%, 79\.53186%\)"/g, 'fill="#ffffff"').replace(/class="chp" data-k="([\w-]+)"/g, (_, key: string) => {
            keys.push(key);
            const flow = FLOW[key];
            if (flow) return `class="chp chp-flow" data-k="${key}" filter="url(#ch-flow-${flow})"`;
            if (alpha.get(key) || STILL.has(key)) return `class="chp" data-k="${key}"`;
            return `class="chp chp-photo" data-k="${key}"`;
          });
          const own = keys.map((key) => boxes.get(key)).filter((box): box is Rect => !!box);
          const box = own.length ? { x0: Math.min(...own.map((r) => r.x0)), y0: Math.min(...own.map((r) => r.y0)), x1: Math.max(...own.map((r) => r.x1)), y1: Math.max(...own.map((r) => r.y1)) } : null;
          return { ...layer, svg, keys, box };
        });
        const data = { n: raw.n, trim: raw.trim, defs: raw.defs, layers };
        ready.set(n, data);
        return data;
      });
    cache.set(n, pending);
    pending.catch(() => cache.delete(n));
  }
  return pending;
}

export function useSpread(n: number): SpreadData | null {
  const [data, setData] = useState<SpreadData | null>(() => ready.get(n) ?? null);
  useEffect(() => {
    let alive = true;
    if (ready.has(n)) setData(ready.get(n)!);
    else void loadSpread(n).then((value) => alive && setData(value));
    return () => {
      alive = false;
    };
  }, [n]);
  return data;
}

export type View = "left" | "right" | "full" | { x: number; y: number; w: number; h: number };

/** The single pages of the print: the covers. Everything else is a two-page spread. */
export const SINGLE = new Set([1, 21]);

export function viewBoxOf(n: number, view: View): [number, number, number, number] {
  if (typeof view === "object") return [view.x, view.y, view.w, view.h];
  if (SINGLE.has(n) || view === "full") return [TRIM.x, TRIM.y, SINGLE.has(n) ? PAGE.width : PAGE.width * 2, PAGE.height];
  return [TRIM.x + (view === "right" ? PAGE.width : 0), TRIM.y, PAGE.width, PAGE.height];
}

type Props = {
  n: number;
  view: View;
  onItem?: (item: ChileItem) => void;
  onIndex?: (printedPage: number) => void;
  /** Effects and taps off, for the back of a turning page. */
  quiet?: boolean;
  /** Only the print's photographs and their motion, without its type. */
  photosOnly?: boolean;
  label?: string;
};

const SPOTS = hotspots as Record<string, { spread: number; x: number; y: number; w: number; h: number }>;

/** One printed page (or spread, or a zoom of it), drawn from the PDF's own layers. */
export const ChileSpread = memo(function ChileSpread({ n, view, onItem, onIndex, quiet = false, photosOnly = false, label }: Props) {
  const data = useSpread(n);
  const [x, y, w, h] = viewBoxOf(n, view);
  const scope = `s${n}-${typeof view === "object" ? "z" : view}`;
  const layers: ReactNode[] = [];
  if (data) {
    const firstPhoto = data.layers.findIndex((layer) => layer.t === "i");
    data.layers.forEach((layer, i) => {
      if (photosOnly && layer.t === "v" && i > firstPhoto) return;
      // a photo that lies wholly on the other page is not drawn here
      if (layer.box && !meets(layer.box, x, y, w, h)) return;
      layers.push(<g key={`l${i}`} dangerouslySetInnerHTML={{ __html: layer.svg }} />);
      if (!quiet) for (const key of layer.keys) layers.push(<EffectLayer key={`fx-${key}`} effects={EFFECTS[key]} scope={`${scope}-${key}`} view={[x, y, w, h]} />);
    });
    if (!quiet) layers.push(<EffectLayer key="fx-top" effects={EFFECTS[`s${n}`]} scope={`${scope}-top`} view={[x, y, w, h]} />);
  }
  const inView = (spot: { x: number; y: number; w: number; h: number }) => spot.x + spot.w / 2 > x && spot.x + spot.w / 2 < x + w && spot.y + spot.h / 2 > y && spot.y + spot.h / 2 < y + h;
  const items = !quiet && !photosOnly && onItem ? CHILE_ITEMS.filter((item) => item.spread === n && SPOTS[item.id] && inView(SPOTS[item.id]!)) : [];
  return (
    <svg className="ch-page" viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} data-testid={`ch-spread-${n}`}>
      <rect x={0} y={0} width={1400} height={800} fill="#ffffff" />
      {data ? <defs dangerouslySetInnerHTML={{ __html: data.defs }} /> : null}
      <clipPath id={`${scope}-trim`}>
        <rect x={TRIM.x} y={TRIM.y} width={SINGLE.has(n) ? PAGE.width : PAGE.width * 2} height={PAGE.height} />
      </clipPath>
      <g clipPath={`url(#${scope}-trim)`}>{layers}</g>
      {items.map((item) => {
        const spot = SPOTS[item.id];
        if (!spot) return null;
        return (
          <rect
            key={item.id}
            className="ch-hot"
            x={spot.x}
            y={spot.y}
            width={spot.w}
            height={spot.h}
            rx={6}
            tabIndex={0}
            role="button"
            aria-label={item.name}
            data-testid={`ch-item-${item.id}`}
            onClick={() => onItem?.(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onItem?.(item);
            }}
          />
        );
      })}
      {!quiet && onIndex && n === 3 && x < TRIM.x + PAGE.width
        ? CHILE_INDEX.map((entry) => (
            <rect
              key={entry.page}
              className="ch-hot"
              x={100}
              y={entry.y - 12}
              width={400}
              height={22}
              rx={4}
              tabIndex={0}
              role="button"
              aria-label={entry.label}
              data-testid={`ch-index-${entry.page}`}
              onClick={() => onIndex(entry.page)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onIndex(entry.page);
              }}
            />
          ))
        : null}
    </svg>
  );
});
