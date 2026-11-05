import { motion } from "motion/react";

type Props = { stamps: number; total: number };

/** The logbook row: one cup per stamp toward the next level. Each fills when it is earned; the last one opens the level. */
export function Stamps({ stamps, total }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }} data-testid="stamps">
      {Array.from({ length: total }, (_, index) => (
        <Cup key={index} filled={index < stamps} last={index === total - 1} mark={total} delay={index * 0.05} />
      ))}
    </div>
  );
}

function Cup({ filled, last, mark, delay }: { filled: boolean; last: boolean; mark: number; delay: number }) {
  const id = `cup-${last ? "last" : "n"}`;
  return (
    <svg width="38" height="42" viewBox="0 0 38 42" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d="M7 10h20l-2.4 22a4 4 0 0 1-4 3.6H13.4a4 4 0 0 1-4-3.6Z" />
        </clipPath>
      </defs>
      <path d="M7 10h20l-2.4 22a4 4 0 0 1-4 3.6H13.4a4 4 0 0 1-4-3.6Z" fill="#fff" stroke={filled ? "var(--roast)" : "var(--line)"} strokeWidth="1.4" />
      <path d="M27 14h3.5a4 4 0 0 1 0 8H26" fill="none" stroke={filled ? "var(--roast)" : "var(--line)"} strokeWidth="1.4" />
      <g clipPath={`url(#${id}-clip)`}>
        <motion.rect
          x="4"
          width="30"
          height="40"
          fill={last ? "var(--gold)" : "var(--roast)"}
          initial={false}
          animate={{ y: filled ? 14 : 40 }}
          transition={{ type: "spring", stiffness: 90, damping: 16, delay }}
        />
        <motion.ellipse
          cx="17"
          rx="12"
          ry="2.2"
          fill={last ? "#d9bf8f" : "#9c6a45"}
          initial={false}
          animate={{ cy: filled ? 14 : 40 }}
          transition={{ type: "spring", stiffness: 90, damping: 16, delay }}
        />
      </g>
      {last ? (
        <text x="17" y="7.5" textAnchor="middle" fontSize="8" fontFamily="var(--sans)" fontWeight="500" fill={filled ? "var(--roast)" : "var(--smoke)"}>
          {mark}
        </text>
      ) : null}
      {filled ? (
        <motion.path
          d="M13 6c0-2 2-2 2-4M17 6c0-2 2-2 2-4M21 6c0-2 2-2 2-4"
          fill="none"
          stroke="var(--roast-soft)"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: [0, 0.8, 0], y: [2, -2, -5] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: delay * 4, ease: "easeInOut" }}
        />
      ) : null}
    </svg>
  );
}
