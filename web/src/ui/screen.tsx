import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { useReduced } from "../motion/prefs";

type Props = {
  children: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
  direction?: "fade" | "up" | "right";
  testId?: string;
  className?: string;
};

/** A full screen that arrives and leaves the way native screens do. */
export function Screen({ children, dark, style, direction = "fade", testId, className }: Props) {
  const reduced = useReduced();
  const enter =
    direction === "up"
      ? { opacity: 0, y: 28 }
      : direction === "right"
        ? { opacity: 0, x: 40 }
        : { opacity: 0, scale: 0.985 };
  return (
    <motion.div
      className={className ? `screen ${className}` : "screen"}
      data-testid={testId}
      style={{ background: dark ? "var(--ink)" : "var(--white)", ...style }}
      initial={reduced ? { opacity: 0 } : enter}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
