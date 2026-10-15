import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";

export type Tilt<T extends HTMLElement = HTMLDivElement> = {
  ref: RefObject<T | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  /** Pointer position inside the element, 0..1, for sheens and parallax. */
  px: MotionValue<number>;
  py: MotionValue<number>;
};

/**
 * Tilts an element toward the pointer, or with the phone's gyroscope.
 * Springs bring it back to rest when the pointer leaves.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(max = 10): Tilt<T> {
  const ref = useRef<T | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawPx = useMotionValue(0.5);
  const rawPy = useMotionValue(0.35);
  const rotateX = useSpring(rawX, { stiffness: 140, damping: 16, mass: 0.8 });
  const rotateY = useSpring(rawY, { stiffness: 140, damping: 16, mass: 0.8 });
  const px = useSpring(rawPx, { stiffness: 120, damping: 20 });
  const py = useSpring(rawPy, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      rawPx.set(x);
      rawPy.set(y);
      rawY.set((x - 0.5) * 2 * max);
      rawX.set(-(y - 0.5) * 2 * max);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
      rawPx.set(0.5);
      rawPy.set(0.35);
    };
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null || event.gamma === undefined || event.beta === undefined) return;
      const gx = Math.max(-1, Math.min(1, event.gamma / 30));
      const gy = Math.max(-1, Math.min(1, (event.beta - 40) / 30));
      rawY.set(gx * max);
      rawX.set(-gy * max);
      rawPx.set(0.5 + gx * 0.4);
      rawPy.set(0.35 + gy * 0.3);
    };
    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onOrientation, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [max, rawPx, rawPy, rawX, rawY]);

  return { ref, rotateX, rotateY, px, py };
}
