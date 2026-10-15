import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import { Glass } from "./glass";

type Props = { note: string | null; onDismiss: () => void };

/** A note from the house, at the top, gone when you tap it or after a while. */
export function Toast({ note, onDismiss }: Props) {
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [note, onDismiss]);

  return (
    <div style={{ position: "absolute", left: 14, right: 14, top: "calc(var(--sat) + 10px)", zIndex: 60, pointerEvents: "none" }}>
      <AnimatePresence>
        {note ? (
          <motion.div
            key={note}
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ pointerEvents: "auto" }}
          >
            <Glass dark lens onClick={onDismiss} style={{ padding: "14px 18px", fontSize: 15, lineHeight: 1.35 }} data-testid="note">
              {note}
            </Glass>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
