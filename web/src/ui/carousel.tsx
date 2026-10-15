import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; gap?: number; padding?: number; testId?: string };

/** A row you can throw sideways with the thumb. It springs back at the ends. */
export function Carousel({ children, gap = 12, padding = 20, testId }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    const measure = () => {
      const v = viewport.current;
      const t = track.current;
      if (!v || !t) return;
      setLimit(Math.max(0, t.scrollWidth - v.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (track.current) observer.observe(track.current);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={viewport} style={{ overflow: "hidden", margin: `0 -${padding}px`, padding: `6px 0 10px` }} data-testid={testId}>
      <motion.div
        ref={track}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -limit, right: 0 }}
        dragElastic={0.12}
        dragTransition={{ power: 0.25, timeConstant: 220, bounceStiffness: 260, bounceDamping: 30 }}
        style={{ display: "flex", gap, padding: `0 ${padding}px`, width: "max-content", cursor: "grab", touchAction: "pan-y" }}
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
