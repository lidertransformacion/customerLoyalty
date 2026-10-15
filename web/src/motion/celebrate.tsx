import { useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

const BEAN = "M0-7c-2.6 0-4.2 3.2-4.2 7s1.6 7 4.2 7 4.2-3.2 4.2-7-1.6-7-4.2-7Zm0 1.6c.7 1.6.7 9.2 0 10.8";

type Props = { trigger: number };

/** Beans and sparks burst from the middle of the screen when something is earned. One CSS keyframe per piece. */
export function Celebrate({ trigger }: Props) {
  const reduced = useReducedMotion();
  if (reduced || trigger === 0) return null;
  const pieces = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2 + (trigger % 7) * 0.3;
    const distance = 120 + ((i * 31) % 90);
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 60,
      rotate: (i * 73) % 360,
      bean: i % 3 !== 0,
      color: i % 4 === 0 ? "#c4a574" : i % 4 === 1 ? "#7a4328" : i % 4 === 2 ? "#3c2418" : "#ff9a4a",
      delay: (i % 5) * 0.03,
    };
  });
  return (
    <svg
      key={trigger}
      viewBox="-200 -200 400 400"
      style={{ position: "absolute", left: "50%", top: "45%", width: 400, height: 400, marginLeft: -200, marginTop: -200, pointerEvents: "none", zIndex: 70, overflow: "visible" }}
      aria-hidden="true"
    >
      {pieces.map((piece, i) => (
        <g
          key={i}
          className="burst"
          style={{ "--dx": `${piece.dx}px`, "--dy": `${piece.dy}px`, "--r": `${piece.rotate}deg`, animationDelay: `${piece.delay}s` } as CSSProperties}
        >
          {piece.bean ? <path d={BEAN} fill={piece.color} /> : <circle r="3" fill={piece.color} />}
        </g>
      ))}
    </svg>
  );
}
