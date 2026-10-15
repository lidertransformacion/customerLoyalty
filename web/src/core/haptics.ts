/** Android vibrates; iOS Safari ignores it. Both stay silent when unsupported. */
function buzz(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* nothing to do */
  }
}

export const haptics = {
  tap: () => buzz(8),
  select: () => buzz([6, 30, 6]),
  success: () => buzz([10, 40, 18]),
  warn: () => buzz([30, 40, 30]),
};
