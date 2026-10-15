import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

import { haptics } from "../core/haptics";

type Props = HTMLMotionProps<"button"> & {
  children?: ReactNode;
  quiet?: boolean;
};

/** A button that gives way under the thumb. */
export function Press({ children, quiet, onPointerDown, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: quiet ? 0.985 : 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.6 }}
      onPointerDown={(event) => {
        haptics.tap();
        onPointerDown?.(event);
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
