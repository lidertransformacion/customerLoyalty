/**
 * Whether to hold back motion. The house wants its coffee to move, so the
 * operating system's "reduce motion" switch does not turn the experience off;
 * it only tones down the gyroscope tilt. Flip `MOTION_ALWAYS` to false to
 * honor the system setting everywhere again.
 */
import { useReducedMotion } from "motion/react";

export const MOTION_ALWAYS = true;

export function useReduced(): boolean {
  const system = useReducedMotion();
  return MOTION_ALWAYS ? false : Boolean(system);
}

export function useTiltAllowed(): boolean {
  const system = useReducedMotion();
  return !system;
}
