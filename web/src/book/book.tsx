import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReduced } from "../motion/prefs";

import "./book.css";

type Props = {
  pages: ReactNode[];
  index: number;
  onIndex: (next: number) => void;
  spread: boolean;
  verso: (page: number) => ReactNode;
  /** Every few seconds the page lifts a little by itself, so the gesture suggests itself. */
  nudge?: boolean;
  /** A turn asked for from outside, like the cover button. A new id runs a new turn. */
  command?: { id: number; direction: "forward" | "back" } | null;
  /** Extra class on the book, for a menu with its own paper. */
  className?: string;
};

type Turn = { direction: "forward" | "back"; dragging: boolean } | null;

/**
 * A book you turn with the thumb.
 * On a phone, one page: it folds over its left edge. On a wide screen, a
 * spread: the right page folds onto the left, and its back is the next page.
 */
export function Book({ pages, index, onIndex, spread, verso, nudge = false, command = null, className }: Props) {
  const reduced = useReduced();
  const angle = useMotionValue(0);
  const [turn, setTurn] = useState<Turn>(null);
  const turnRef = useRef<Turn>(null);
  const box = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; id: number; started: boolean; moved: boolean; last: number; time: number; velocity: number } | null>(null);
  const step = spread ? 2 : 1;
  const last = spread ? Math.max(0, pages.length - 2 + ((pages.length - 2) % 2)) : pages.length - 1;
  const canForward = index + step <= (spread ? pages.length - 1 : last);
  const canBack = index - step >= 0;

  const setTurnBoth = useCallback((next: Turn) => {
    turnRef.current = next;
    setTurn(next);
  }, []);

  const finish = useCallback(
    (direction: "forward" | "back", complete: boolean) => {
      const target = direction === "forward" ? (complete ? 180 : 0) : complete ? 0 : 180;
      const velocity = Math.abs(angle.getVelocity());
      animate(angle, target, {
        type: "spring",
        stiffness: 110 + Math.min(velocity * 0.1, 120),
        damping: 22,
        mass: 0.9,
        restDelta: 0.2,
        onComplete: () => {
          if (complete) onIndex(direction === "forward" ? index + step : index - step);
          angle.set(0);
          setTurnBoth(null);
        },
      });
    },
    [angle, index, onIndex, setTurnBoth, step],
  );

  const begin = useCallback(
    (direction: "forward" | "back", dragging: boolean) => {
      if (turnRef.current) return false;
      if (direction === "forward" && !canForward) return false;
      if (direction === "back" && !canBack) return false;
      angle.set(direction === "forward" ? 0 : 180);
      setTurnBoth({ direction, dragging });
      return true;
    },
    [angle, canBack, canForward, setTurnBoth],
  );

  const flip = useCallback(
    (direction: "forward" | "back") => {
      if (!begin(direction, false)) return;
      if (reduced) {
        angle.set(direction === "forward" ? 180 : 0);
        onIndex(direction === "forward" ? index + step : index - step);
        angle.set(0);
        setTurnBoth(null);
        return;
      }
      finish(direction, true);
    },
    [angle, begin, finish, index, onIndex, reduced, setTurnBoth, step],
  );

  // Pointer handling: horizontal drags turn, vertical ones scroll the page, taps go through.
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId, started: false, moved: false, last: event.clientX, time: performance.now(), velocity: 0 };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    const width = (box.current?.clientWidth ?? 360) / (spread ? 2 : 1);
    if (!g.started) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      const direction = dx < 0 ? "forward" : "back";
      if (nudging.current && turnRef.current?.direction === "forward" && direction === "forward") {
        nudging.current.stop();
        nudging.current = null;
        setTurnBoth({ direction: "forward", dragging: true });
      } else if (!begin(direction, true)) {
        gesture.current = null;
        return;
      }
      g.started = true;
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        /* capture is best effort */
      }
    }
    g.moved = true;
    const now = performance.now();
    g.velocity = (event.clientX - g.last) / Math.max(1, now - g.time);
    g.last = event.clientX;
    g.time = now;
    const current = turnRef.current;
    if (!current) return;
    if (current.direction === "forward") {
      angle.set(Math.max(0, Math.min(180, (-dx / width) * 180)));
    } else {
      angle.set(Math.max(0, Math.min(180, 180 - (dx / width) * 180)));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || !g.started) {
      // A tap near an edge turns the page; anywhere else it reaches the content.
      if (g && !g.moved && box.current) {
        const rect = box.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const target = event.target as HTMLElement;
        if (target.closest("button, a, input")) return;
        if (x > 0.84) flip("forward");
        else if (x < 0.16) flip("back");
      }
      return;
    }
    const current = turnRef.current;
    if (!current) return;
    const value = angle.get();
    const fast = Math.abs(g.velocity) > 0.45;
    if (current.direction === "forward") {
      finish("forward", fast ? g.velocity < 0 : value > 60);
    } else {
      finish("back", fast ? g.velocity > 0 : value < 120);
    }
  };

  const nudging = useRef<{ stop: () => void } | null>(null);
  useEffect(() => {
    if (!nudge || reduced) return;
    const timer = window.setInterval(() => {
      if (turnRef.current || gesture.current) return;
      if (!begin("forward", false)) return;
      const controls = animate(angle, [0, 22, 0], {
        duration: 1.5,
        ease: "easeInOut",
        onComplete: () => {
          nudging.current = null;
          if (turnRef.current && !turnRef.current.dragging) {
            angle.set(0);
            setTurnBoth(null);
          }
        },
      });
      nudging.current = controls;
    }, 3200);
    return () => window.clearInterval(timer);
  }, [angle, begin, nudge, reduced, setTurnBoth]);

  const lastCommand = useRef<number>(0);
  useEffect(() => {
    if (!command || command.id === lastCommand.current) return;
    lastCommand.current = command.id;
    if (nudging.current) {
      nudging.current.stop();
      nudging.current = null;
      angle.set(0);
      setTurnBoth(null);
    }
    flip(command.direction);
  }, [angle, command, flip, setTurnBoth]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") flip("forward");
      if (event.key === "ArrowLeft") flip("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip]);

  const rotateY = useTransform(angle, (a) => -a);
  // Which face is toward the reader. Not left to backface-visibility alone:
  // WebKit without 3D compositing paints the back face over the front.
  const frontShown = useTransform(angle, (a) => (a < 90 ? "visible" : "hidden"));
  const backShown = useTransform(angle, (a) => (a >= 90 ? "visible" : "hidden"));
  const frontShade = useTransform(angle, [0, 90, 180], [0, 0.42, 0]);
  const backShade = useTransform(angle, [0, 90, 180], [0, 0.35, 0]);
  const underShadow = useTransform(angle, [0, 30, 100, 180], [0, 0.35, 0.55, 0]);
  const underShadowX = useTransform(angle, (a) => `${100 - (a / 180) * 100}%`);
  const lift = useTransform(angle, [0, 90, 180], [0, 36, 0]);
  const curl = useTransform(angle, [0, 90, 180], [0, 1.5, 0]);

  const pageAt = (i: number) => pages[i] ?? null;

  // Which pages sit underneath and which one moves.
  let baseLeft: number | null = null;
  let baseRight: number;
  let frontPage: number | null = null;
  let backPage: number | null = null;
  if (spread) {
    if (turn?.direction === "forward") {
      baseLeft = index;
      baseRight = index + 3;
      frontPage = index + 1;
      backPage = index + 2;
    } else if (turn?.direction === "back") {
      baseLeft = index - 2;
      baseRight = index - 1;
      frontPage = index - 1;
      backPage = index;
    } else {
      baseLeft = index;
      baseRight = index + 1;
    }
  } else if (turn?.direction === "forward") {
    baseRight = index + 1;
    frontPage = index;
  } else if (turn?.direction === "back") {
    baseRight = index;
    frontPage = index - 1;
  } else {
    baseRight = index;
  }

  return (
    <div
      ref={box}
      className={`book${spread ? " spread" : ""}${className ? ` ${className}` : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        const current = turnRef.current;
        gesture.current = null;
        if (current) finish(current.direction, false);
      }}
      data-testid="book"
      data-page={index}
    >
      {spread && baseLeft !== null ? (
        <div className="book-page left" key={`l-${baseLeft}`}>
          {pageAt(baseLeft)}
        </div>
      ) : null}
      <div className="book-page right" key={`r-${baseRight}`}>
        {pageAt(baseRight)}
        {turn ? (
          <motion.div
            className="book-shade"
            style={{
              opacity: underShadow,
              background: "linear-gradient(90deg, rgba(27,22,18,0.0), rgba(27,22,18,0.5))",
              backgroundSize: "40% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPositionX: underShadowX,
            }}
          />
        ) : null}
      </div>

      {turn && frontPage !== null ? (
        <motion.div
          className="book-turning"
          style={{ rotateY, z: lift, skewY: curl }}
        >
          <motion.div className="book-face front" style={{ visibility: frontShown }}>
            {pageAt(frontPage)}
            <motion.div
              className="book-shade"
              style={{ opacity: frontShade, background: "linear-gradient(270deg, rgba(27,22,18,0.55), rgba(27,22,18,0.05) 60%)" }}
            />
          </motion.div>
          <motion.div className="book-face back" style={{ visibility: backShown }}>
            {backPage !== null ? pageAt(backPage) : verso(frontPage)}
            <motion.div
              className="book-shade"
              style={{ opacity: backShade, background: "linear-gradient(90deg, rgba(27,22,18,0.5), rgba(27,22,18,0.05) 60%)" }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </div>
  );
}
