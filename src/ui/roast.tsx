import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { copy } from "@/src/i18n/strings";
import { useMotionAllowed } from "@/src/ui/motion";
import { ink, serifItalic } from "@/src/ui/theme";

function Bean({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const turn = index * 45;
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 0.42, 1],
        ["#9aaf86", "#8a4b28", "#2a1810"],
      ),
      opacity: 0.45 + progress.value * 0.55,
      transform: [
        { rotate: `${turn}deg` },
        { translateY: -46 },
        { rotate: `${-turn}deg` },
        { scale: 0.82 + progress.value * 0.22 },
      ],
    };
  });

  return <Animated.View style={[styles.bean, style]} />;
}

export function Roast({
  line,
  onDone,
}: {
  line?: string;
  onDone?: () => void;
}) {
  const progress = useSharedValue(0);
  const sweep = useSharedValue(48);
  const motion = useMotionAllowed();

  const done = useRef(onDone);
  done.current = onDone;
  const notify = useCallback(() => {
    done.current?.();
  }, []);

  useEffect(() => {
    sweep.value = motion ? 48 : 0;
    const duration = motion ? 2000 : 280;
    progress.value = withTiming(
      1,
      { duration, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(notify)();
      },
    );
  }, [motion, notify, progress, sweep]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * sweep.value}deg` }],
  }));

  return (
    <View
      style={styles.box}
      accessibilityRole="image"
      accessibilityLabel={copy.roastLabel}
    >
      <Animated.View style={[styles.ring, ring]}>
        {Array.from({ length: 8 }, (_, index) => (
          <Bean key={index} index={index} progress={progress} />
        ))}
      </Animated.View>
      <View style={styles.core} />
      {line ? <Text style={styles.line}>{line}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ink,
  },
  ring: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  bean: {
    position: "absolute",
    width: 18,
    height: 26,
    borderRadius: 10,
  },
  core: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#c4a574",
  },
  line: {
    position: "absolute",
    bottom: 88,
    left: 32,
    right: 32,
    textAlign: "center",
    color: "#fff",
    fontFamily: serifItalic,
    fontSize: 22,
  },
});
