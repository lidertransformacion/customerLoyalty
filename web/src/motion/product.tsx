import { motion, useReducedMotion, useTransform } from "motion/react";
import type { CSSProperties } from "react";

import { useTilt } from "./tilt";

type Props = {
  src: string;
  alt?: string;
  size?: number;
  style?: CSSProperties;
  /** Floats up and down slowly. */
  float?: boolean;
  testId?: string;
};

/**
 * A product render in space: it tilts toward the pointer or with the phone,
 * floats over its own shadow, and a sheen crosses the pack as it turns.
 */
export function Product({ src, alt = "", size = 220, style, float = true, testId }: Props) {
  const reduced = useReducedMotion();
  const tilt = useTilt(reduced ? 0 : 14);
  const sheenX = useTransform(tilt.px, [0, 1], ["-40%", "140%"]);
  const shadowX = useTransform(tilt.rotateY, [-14, 14], [-10, 10]);

  return (
    <motion.div
      ref={tilt.ref}
      data-testid={testId}
      style={{ position: "relative", width: size, height: size * 1.12, transformPerspective: 900, transformStyle: "preserve-3d", ...style }}
    >
      <motion.div
        aria-hidden="true"
        style={{ position: "absolute", left: "14%", right: "14%", bottom: "2%", height: "9%", borderRadius: "50%", background: "radial-gradient(50% 50% at 50% 50%, rgba(27,22,18,0.35), rgba(27,22,18,0) 70%)", x: shadowX, filter: "blur(2px)" }}
        animate={float && !reduced ? { scaleX: [1, 0.88, 1], opacity: [0.9, 0.6, 0.9] } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ position: "absolute", inset: 0, rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d" }}
        animate={float && !reduced ? { y: [0, -9, 0] } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src={src} alt={alt} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "92%", objectFit: "contain", filter: "drop-shadow(0 18px 24px rgba(27,22,18,0.28))" }} />
        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "4% 8% 10%",
            pointerEvents: "none",
            background: "linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 70%)",
            backgroundSize: "60% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPositionX: sheenX,
            mixBlendMode: "soft-light",
            maskImage: `url(${src})`,
            WebkitMaskImage: `url(${src})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
