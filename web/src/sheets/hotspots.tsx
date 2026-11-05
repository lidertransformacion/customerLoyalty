import { CHILE_INDEX, CHILE_ITEMS, PAGE, TRIM, type ChileItem } from "./data";
import hotspots from "./hotspots.json";

const SPOTS = hotspots as Record<string, { spread: number; x: number; y: number; w: number; h: number }>;

/**
 * The tap targets drawn over a printed spread: one per product on it, and the
 * index lines on the index page. Split from the renderer so the cover, which
 * takes no taps, never downloads the print's product table.
 */
export function SpreadHotspots({ n, view, onItem, onIndex }: { n: number; view: [number, number, number, number]; onItem?: (item: ChileItem) => void; onIndex?: (printedPage: number) => void }) {
  const [x, y, w, h] = view;
  const inView = (spot: { x: number; y: number; w: number; h: number }) => spot.x + spot.w / 2 > x && spot.x + spot.w / 2 < x + w && spot.y + spot.h / 2 > y && spot.y + spot.h / 2 < y + h;
  const items = onItem ? CHILE_ITEMS.filter((item) => item.spread === n && SPOTS[item.id] && inView(SPOTS[item.id]!)) : [];
  return (
    <>
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
      {onIndex && n === 3 && x < TRIM.x + PAGE.width
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
    </>
  );
}
