import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

import { useReduced } from "./prefs";

/**
 * What was just opened comes closer, slowly: it starts a step back and keeps approaching for several
 * seconds, the way a plate is brought to the table. With reduced motion it is simply there.
 */
export function Approach({ children, style, id, from = 0.8, to = 1.06 }: { children: ReactNode; style?: CSSProperties; /** A new id starts the approach again (another product in the same window). */ id?: string; /** Where it starts and where it rests. A subject already framed to fill its space ends at 1, so nothing is cut. */ from?: number; to?: number }) {
  const reduced = useReduced();
  return (
    <motion.div
      key={id}
      style={{ ...style, transformOrigin: "50% 58%", willChange: "transform" }}
      initial={reduced ? false : { scale: from, opacity: 0 }}
      animate={{ scale: reduced ? 1 : to, opacity: 1 }}
      transition={{ scale: { duration: 9, ease: [0.2, 0.7, 0.2, 1] }, opacity: { duration: 0.7, ease: "easeOut" } }}
      data-testid="approach"
    >
      {children}
    </motion.div>
  );
}
