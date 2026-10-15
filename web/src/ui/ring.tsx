import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
};

/** A progress ring. The arc springs to its new length. */
export function Ring({ progress, size = 120, stroke = 8, color = "var(--roast)", track = "rgba(27,22,18,0.08)", children }: Props) {
  const r = (size - stroke) / 2;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: clamped }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div>
    </div>
  );
}
