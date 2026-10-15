import { motion } from "motion/react";

type Props = { x?: number; y?: number; width?: number; color?: string; count?: number };

/** Three wisps that rise and dissolve, over anything hot. */
export function Steam({ x = 0, y = 0, width = 60, color = "rgba(255,255,255,0.7)", count = 3 }: Props) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: count }, (_, i) => {
        const offset = (i - (count - 1) / 2) * (width / count);
        return (
          <motion.path
            key={i}
            d="M0 0c-6-10 6-16 0-28s8-18 0-30"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0, x: offset, y: 0 }}
            animate={{ opacity: [0, 0.65, 0], y: [0, -26, -58], x: [offset, offset + 4, offset - 3], scale: [0.9, 1, 1.15] }}
            transition={{ duration: 2.6, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </g>
  );
}
