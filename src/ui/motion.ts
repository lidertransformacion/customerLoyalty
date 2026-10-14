import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (alive) setAllowed(!reduced);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduced) => {
        setAllowed(!reduced);
      },
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return allowed;
}
