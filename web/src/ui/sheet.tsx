import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { Glass } from "./glass";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  kicker?: string;
  dark?: boolean;
};

/** A bottom sheet you can throw away with the thumb. */
export function Sheet({ open, onClose, children, title, kicker, dark }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="sheet"
          style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "flex-end" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="cerrar"
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(27,22,18,0.28)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{ position: "relative", width: "100%", padding: "0 10px calc(var(--sab) + 10px)" }}
          >
            <Glass strong dark={dark} style={{ borderRadius: 32, maxHeight: "78dvh", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "grid", placeItems: "center", paddingTop: 10 }}>
                <span style={{ width: 40, height: 5, borderRadius: 3, background: dark ? "rgba(255,255,255,0.4)" : "rgba(27,22,18,0.18)" }} />
              </div>
              {kicker || title ? (
                <div style={{ padding: "12px 22px 0" }}>
                  {kicker ? <div className="kicker">{kicker}</div> : null}
                  {title ? (
                    <h2 className="serif" style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 500 }}>
                      {title}
                    </h2>
                  ) : null}
                </div>
              ) : null}
              <div className="scroll" style={{ padding: "12px 22px 18px" }}>{children}</div>
            </Glass>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
