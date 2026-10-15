import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import { copy } from "@/src/i18n/strings";
import { useReduced } from "./prefs";

type Props = {
  onDone?: () => void;
  line?: string;
  compact?: boolean;
  duration?: number;
};

const BEAN = "M0-13c-5 0-8 6-8 13s3 13 8 13 8-6 8-13-3-13-8-13Zm0 3c1.4 3 1.4 17 0 20";
const GREEN = "#9aaf86";
const YELLOW = "#c9b26a";
const TAN = "#a8743f";
const BROWN = "#6b3a1f";
const DARK = "#2a1810";

/**
 * The roast. Green beans tumble in the drum, turn yellow, then brown, then
 * crack: sparks fly, smoke rises. It ends when the beans are dark.
 */
export function Roast({ onDone, line, compact, duration = 2.8 }: Props) {
  const reduced = useReduced();
  const done = useRef(onDone);
  done.current = onDone;
  const total = reduced ? 0.4 : duration;
  const size = compact ? 160 : 260;

  useEffect(() => {
    const timer = window.setTimeout(() => done.current?.(), total * 1000 + 150);
    return () => window.clearTimeout(timer);
  }, [total]);

  const beans = Array.from({ length: 9 }, (_, i) => ({
    angle: (i / 9) * 360,
    radius: 62 + (i % 3) * 10,
    tilt: (i * 37) % 90,
    delay: (i % 4) * 0.06,
  }));

  return (
    <div style={{ display: "grid", placeItems: "center", position: "relative" }} role="img" aria-label={copy.roastLabel}>
      <svg width={size} height={size} viewBox="-130 -130 260 260" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="roast-heat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#b84d1a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1b1612" stopOpacity="0" />
          </radialGradient>
        </defs>

        <motion.circle
          r="118"
          fill="url(#roast-heat)"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 0.4, 1, 0.8], scale: [0.7, 0.9, 1.08, 1] }}
          transition={{ duration: total, times: [0, 0.3, 0.72, 1], ease: "easeInOut" }}
        />

        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: reduced ? 0 : 150 }}
          transition={{ duration: total, ease: [0.3, 0, 0.2, 1] }}
        >
          {beans.map((bean, i) => (
            <g key={i} transform={`rotate(${bean.angle}) translate(0 ${-bean.radius}) rotate(${bean.tilt})`}>
              <motion.path
                d={BEAN}
                strokeWidth="1.2"
                strokeLinecap="round"
                initial={{ fill: GREEN, stroke: "#6f8a5a", scale: 0.88 }}
                animate={{
                  fill: [GREEN, YELLOW, TAN, BROWN, DARK],
                  stroke: ["#6f8a5a", "#9a8550", "#6b3a1f", "#3a2010", "#120a05"],
                  scale: [0.88, 0.92, 1.02, 1.12, 1.06],
                }}
                transition={{ duration: total, times: [0, 0.3, 0.52, 0.72, 1], ease: "easeInOut", delay: bean.delay }}
              />
            </g>
          ))}
        </motion.g>

        <motion.circle
          r="7"
          fill="#ffb15a"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.9, 1, 0.7], scale: [1, 1.3, 1.1, 1] }}
          transition={{ duration: total, ease: "easeInOut" }}
        />

        {!reduced
          ? Array.from({ length: 14 }, (_, i) => {
              const angle = (i / 14) * Math.PI * 2 + 0.3;
              const distance = 70 + (i % 5) * 16;
              return (
                <motion.circle
                  key={i}
                  r={1.6 + (i % 3) * 0.6}
                  fill={i % 2 ? "#ffb15a" : "#ff7a2a"}
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: [0, Math.cos(angle) * distance, Math.cos(angle) * (distance + 30)],
                    y: [0, Math.sin(angle) * distance, Math.sin(angle) * (distance + 30) - 10],
                  }}
                  transition={{ duration: 0.9, delay: total * 0.62 + (i % 4) * 0.07, ease: "easeOut" }}
                />
              );
            })
          : null}

        {!reduced
          ? [0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d="M0 0c-8-12 8-20 0-34s10-22 0-36"
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ opacity: 0, x: -14 + i * 14, y: -70 }}
                animate={{ opacity: [0, 0.5, 0], y: [-70, -130, -170], x: [-14 + i * 14, -8 + i * 14, -20 + i * 14] }}
                transition={{ duration: 1.8, delay: total * 0.66 + i * 0.22, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
              />
            ))
          : null}
      </svg>
      {line ? (
        <motion.div
          className="serif-italic"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ color: "#fff", fontSize: 22, textAlign: "center", marginTop: 6 }}
        >
          {line}
        </motion.div>
      ) : null}
    </div>
  );
}
