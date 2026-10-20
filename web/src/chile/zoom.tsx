import { forwardRef, useCallback, useImperativeHandle, useRef, useState, type ReactNode } from "react";

export type ZoomHandle = { toggle: () => void };

type View = { s: number; x: number; y: number };

/**
 * Pinch, drag and a magnifier button over the printed page, so the small
 * print reads well on a phone. While zoomed, page-turn gestures are held back;
 * taps on items still go through.
 */
export const ZoomStage = forwardRef<ZoomHandle, { width: number; height: number; children: ReactNode; onZoomed: (zoomed: boolean) => void }>(function ZoomStage({ width, height, children, onZoomed }, handle) {
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: "pinch" | "pan"; start: View; dist: number; mid: { x: number; y: number }; moved: boolean } | null>(null);

  const clamp = useCallback(
    (next: View): View => {
      const s = Math.min(4, Math.max(1, next.s));
      return { s, x: Math.min(0, Math.max(width - width * s, next.x)), y: Math.min(0, Math.max(height - height * s, next.y)) };
    },
    [height, width],
  );
  const apply = useCallback(
    (next: View) => {
      const value = clamp(next);
      if ((value.s > 1.01) !== (viewRef.current.s > 1.01)) onZoomed(value.s > 1.01);
      viewRef.current = value;
      setView(value);
    },
    [clamp, onZoomed],
  );

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = box.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const zoomAt = (point: { x: number; y: number }, s: number) => {
    const current = viewRef.current;
    const content = { x: (point.x - current.x) / current.s, y: (point.y - current.y) / current.s };
    apply({ s, x: point.x - content.x * s, y: point.y - content.y * s });
  };

  const onDown = (event: React.PointerEvent) => {
    pointers.current.set(event.pointerId, local(event));
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { kind: "pinch", start: viewRef.current, dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), mid: { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }, moved: true };
      event.stopPropagation();
    } else if (viewRef.current.s > 1) {
      gesture.current = { kind: "pan", start: viewRef.current, dist: 0, mid: local(event), moved: false };
      event.stopPropagation();
    }
  };

  const onMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, local(event));
    const g = gesture.current;
    if (!g) return;
    event.stopPropagation();
    if (g.kind === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const mid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
      const s = Math.min(4, Math.max(1, (g.start.s * dist) / Math.max(1, g.dist)));
      const content = { x: (g.mid.x - g.start.x) / g.start.s, y: (g.mid.y - g.start.y) / g.start.s };
      apply({ s, x: mid.x - content.x * s, y: mid.y - content.y * s });
    } else if (g.kind === "pan") {
      const p = local(event);
      if (Math.hypot(p.x - g.mid.x, p.y - g.mid.y) > 6) g.moved = true;
      apply({ s: g.start.s, x: g.start.x + p.x - g.mid.x, y: g.start.y + p.y - g.mid.y });
    }
  };

  const onUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (g) event.stopPropagation();
    if (pointers.current.size === 0) {
      gesture.current = null;
      if (viewRef.current.s < 1.06) apply({ s: 1, x: 0, y: 0 });
    } else if (g?.kind === "pinch" && pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      gesture.current = { kind: "pan", start: viewRef.current, dist: 0, mid: p!, moved: true };
    }
  };

  useImperativeHandle(handle, () => ({
    toggle: () => {
      if (viewRef.current.s > 1.01) apply({ s: 1, x: 0, y: 0 });
      else zoomAt({ x: width / 2, y: height * 0.4 }, 2.2);
    },
  }));

  const zoomed = view.s > 1.01;
  return (
    <div
      ref={box}
      style={{ position: "relative", width, height, touchAction: "none" }}
      onPointerDownCapture={onDown}
      onPointerMoveCapture={onMove}
      onPointerUpCapture={onUp}
      onPointerCancelCapture={onUp}
      onWheel={(event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        zoomAt(local(event), viewRef.current.s * (event.deltaY < 0 ? 1.15 : 1 / 1.15));
      }}
      onClickCapture={(event) => {
        // a drag that moved is not a tap on an item
        if (gesture.current?.moved) event.stopPropagation();
      }}
      data-testid="ch-zoom"
      data-zoom={view.s.toFixed(2)}
    >
      <div style={{ position: "absolute", inset: 0, overflow: zoomed ? "hidden" : "visible", borderRadius: zoomed ? 10 : 0 }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transition: gesture.current ? "none" : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)" }}>{children}</div>
      </div>
    </div>
  );
});
