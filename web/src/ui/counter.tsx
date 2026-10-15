import { motion, useMotionValueEvent, useSpring, useTransform } from "motion/react";
import { useEffect, type CSSProperties } from "react";

import { formatPoints } from "@/src/i18n/strings";

type Props = {
  value: number;
  onDisplay?: (shown: number) => void;
  style?: CSSProperties;
  className?: string;
};

/** A balance that rolls to its new value instead of jumping. */
export function Counter({ value, onDisplay, style, className }: Props) {
  const spring = useSpring(value, { stiffness: 60, damping: 18, mass: 1 });
  const text = useTransform(spring, (v) => formatPoints(v));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (v) => onDisplay?.(Math.round(v)));

  return (
    <motion.span className={className} style={style} data-testid="balance">
      {text}
    </motion.span>
  );
}
