import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CUPS_FOR_FILTER } from "@/src/data/program";
import { formatInteger } from "@/src/format";
import { line, roast } from "@/src/ui/theme";

let lastCounted = 0;

function rememberCount(value: number) {
  lastCounted = value;
}

export function Counter({
  value,
  onDisplay,
  style,
}: {
  value: number;
  onDisplay?: (shown: number) => void;
  style?: StyleProp<TextStyle>;
}) {
  const progress = useSharedValue(lastCounted);
  const [text, setText] = useState(() => formatInteger(lastCounted));
  const publish = useCallback(
    (shown: number) => {
      setText(formatInteger(shown));
      onDisplay?.(shown);
    },
    [onDisplay],
  );

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) runOnJS(publish)(current);
    },
  );

  useEffect(() => {
    const from = lastCounted;
    if (from === value) {
      publish(value);
      return;
    }
    progress.value = from;
    progress.value = withTiming(
      value,
      { duration: 880, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        runOnJS(rememberCount)(value);
        runOnJS(publish)(value);
      },
    );
  }, [progress, publish, value]);

  return <Text style={style}>{text}</Text>;
}

export function Rail({ progress: amount }: { progress: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(amount, {
      duration: 880,
      easing: Easing.out(Easing.cubic),
    });
  }, [amount, width]);

  const filled = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, width.value)) * 100}%`,
  }));

  return (
    <View style={styles.rail}>
      <Animated.View style={[styles.filled, filled]} />
    </View>
  );
}

function Cup({
  filled,
  fresh,
  marked,
}: {
  filled: boolean;
  fresh: boolean;
  marked: boolean;
}) {
  const scale = useSharedValue(1);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!fresh) return;
    scale.value = 0.35;
    y.value = -18;
    scale.value = withSpring(1, { damping: 7, stiffness: 210, mass: 0.55 });
    y.value = withSpring(0, { damping: 8, stiffness: 170, mass: 0.6 });
  }, [fresh, scale, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cup, filled && styles.cupFilled, style]}>
      {marked && !filled ? <Text style={styles.mark}>8</Text> : null}
    </Animated.View>
  );
}

export function Stamps({ stamps }: { stamps: number }) {
  const [from, setFrom] = useState(stamps);

  useEffect(() => {
    setFrom(stamps);
  }, [stamps]);

  return (
    <View style={styles.row}>
      {Array.from({ length: CUPS_FOR_FILTER }, (_, index) => (
        <Cup
          key={index}
          filled={index < stamps}
          fresh={stamps > from && index >= from && index < stamps}
          marked={index === CUPS_FOR_FILTER - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    height: 2,
    backgroundColor: line,
    marginTop: 12,
    overflow: "hidden",
  },
  filled: {
    height: 2,
    backgroundColor: roast,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  cup: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cupFilled: {
    backgroundColor: roast,
    borderColor: roast,
  },
  mark: {
    fontSize: 11,
    color: "#6a6a6a",
  },
});
