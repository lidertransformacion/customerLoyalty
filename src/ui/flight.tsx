import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Image, StyleSheet, type ImageSourcePropType } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { shadow } from "@/src/ui/theme";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlightOrigin = Rect & {
  id: string;
  photo: ImageSourcePropType;
};

type Phase = "idle" | "going" | "returning";

type FlightState = {
  origin: FlightOrigin | null;
  target: Rect | null;
  phase: Phase;
};

type FlightApi = FlightState & {
  launch: (origin: FlightOrigin) => void;
  setTarget: (rect: Rect) => void;
  arrive: () => void;
  returnHome: (onDone: () => void) => void;
  release: () => void;
};

const FlightContext = createContext<FlightApi | null>(null);
const idle: FlightState = { origin: null, target: null, phase: "idle" };
const CURVE = Easing.bezier(0.22, 1, 0.36, 1);

export function FlightProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlightState>(idle);
  const onReturn = useRef<(() => void) | null>(null);

  const api = useMemo<FlightApi>(
    () => ({
      ...state,
      launch: (origin) => {
        onReturn.current = null;
        setState({ origin, target: null, phase: "going" });
      },
      setTarget: (rect) =>
        setState((previous) => {
          if (previous.phase !== "going" || previous.target) return previous;
          return { ...previous, target: rect };
        }),
      arrive: () =>
        setState((previous) =>
          previous.phase === "going" ? { ...previous, phase: "idle" } : previous,
        ),
      returnHome: (onDone) => {
        onReturn.current = onDone;
        setState((previous) =>
          previous.origin ? { ...previous, phase: "returning" } : previous,
        );
      },
      release: () => {
        const follow = onReturn.current;
        onReturn.current = null;
        setState(idle);
        follow?.();
      },
    }),
    [state],
  );

  return (
    <FlightContext.Provider value={api}>{children}</FlightContext.Provider>
  );
}

export function useFlight(): FlightApi {
  const value = useContext(FlightContext);
  if (!value) throw new Error("Flight provider is missing.");
  return value;
}

export function FlightLayer() {
  const { origin, target, phase, arrive, release } = useFlight();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const arriveRef = useRef(arrive);
  const releaseRef = useRef(release);
  arriveRef.current = arrive;
  releaseRef.current = release;
  const onArrive = useCallback(() => arriveRef.current(), []);
  const onRelease = useCallback(() => releaseRef.current(), []);

  useLayoutEffect(() => {
    if (!origin) return;
    if (phase === "going" && !target) {
      x.value = origin.x;
      y.value = origin.y;
      width.value = origin.width;
      height.value = origin.height;
      return;
    }
    if (!target) return;
    const curve = { duration: phase === "returning" ? 480 : 560, easing: CURVE };
    if (phase === "going") {
      x.value = origin.x;
      y.value = origin.y;
      width.value = origin.width;
      height.value = origin.height;
      x.value = withTiming(target.x, curve);
      y.value = withTiming(target.y, curve);
      width.value = withTiming(target.width, curve);
      height.value = withTiming(target.height, curve, (finished) => {
        if (finished) runOnJS(onArrive)();
      });
    } else if (phase === "returning") {
      x.value = withTiming(origin.x, curve);
      y.value = withTiming(origin.y, curve);
      width.value = withTiming(origin.width, curve);
      height.value = withTiming(origin.height, curve, (finished) => {
        if (finished) runOnJS(onRelease)();
      });
    }
  }, [height, onArrive, onRelease, origin, phase, target, width, x, y]);

  const style = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    width: width.value,
    height: height.value,
  }));

  if (!origin || (phase !== "going" && phase !== "returning")) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.flight, shadow, style]}>
      <Image source={origin.photo} style={styles.photo} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flight: {
    position: "absolute",
    zIndex: 30,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
