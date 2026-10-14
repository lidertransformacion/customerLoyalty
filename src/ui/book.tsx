import { useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { coverPhoto, photoFor } from "@/src/data/photos";
import {
  menuChapters,
  pointsForItem,
  type Chapter,
} from "@/src/data/menu";
import { pesos } from "@/src/format";
import { copy } from "@/src/i18n/strings";
import { useMotionAllowed } from "@/src/ui/motion";
import {
  cream,
  ink,
  line,
  roast,
  sans,
  sansMedium,
  serif,
  serifItalic,
  shadow,
  smoke,
  white,
} from "@/src/ui/theme";

const PAGE_WIDTH = 340;

function Cover() {
  return (
    <View style={styles.cover}>
      <Image source={coverPhoto} style={styles.coverPhoto} />
      <View style={styles.coverVeil} />
      <Text style={styles.coverKicker}>{copy.brand}</Text>
      <Text style={styles.coverTitle}>{copy.menu.kicker}</Text>
      <Text style={styles.coverLine}>{copy.menu.coverLine}</Text>
    </View>
  );
}

function ChapterPage({ chapter }: { chapter: Chapter }) {
  return (
    <View style={styles.chapter}>
      <Image source={photoFor(chapter.category.photo)} style={styles.chapterPhoto} />
      <Text style={styles.chapterName}>{chapter.category.name}</Text>
      <Text style={styles.chapterIntro}>{chapter.category.intro}</Text>
      <View style={styles.rule} />
      {chapter.items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPoints}>
              {copy.menu.earns(pointsForItem(item))}
            </Text>
          </View>
          <Text style={styles.itemPrice}>{pesos(item.price)}</Text>
        </View>
      ))}
      {chapter.rest > 0 ? (
        <Text style={styles.rest}>{copy.menu.moreInList(chapter.rest)}</Text>
      ) : null}
    </View>
  );
}

export function Book({ onClose }: { onClose: () => void }) {
  const chapters = menuChapters();
  const total = chapters.length + 1;
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const turn = useSharedValue(0);
  const motion = useMotionAllowed();

  const release = () => {
    turn.value = 0;
    setBusy(false);
  };

  const next = () => {
    if (busy || page >= total - 1) return;
    setBusy(true);
    if (!motion) {
      setPage((n) => n + 1);
      setBusy(false);
      return;
    }
    turn.value = withTiming(
      -180,
      { duration: 680, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        runOnJS(setPage)(page + 1);
        runOnJS(release)();
      },
    );
  };

  const previous = () => {
    if (busy || page <= 0) return;
    setBusy(true);
    if (!motion) {
      setPage((n) => n - 1);
      setBusy(false);
      return;
    }
    turn.value = -180;
    setPage((n) => n - 1);
    turn.value = withTiming(
      0,
      { duration: 680, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(release)();
      },
    );
  };

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 12,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -36) next();
      else if (gesture.dx > 36) previous();
    },
  });

  const turnStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { translateX: PAGE_WIDTH / 2 },
      { rotateY: `${turn.value}deg` },
      { translateX: -PAGE_WIDTH / 2 },
    ],
  }));

  const veil = useAnimatedStyle(() => ({
    opacity: Math.min(0.42, Math.abs(turn.value) / 200),
  }));

  const current = page === 0 ? null : (chapters[page - 1] ?? null);
  const under = chapters[page] ?? null;

  return (
    <View style={styles.scene}>
      <View style={styles.head}>
        <Pressable onPress={onClose} accessibilityRole="button">
          <Text style={styles.close}>{copy.menu.close}</Text>
        </Pressable>
        <Text style={styles.count}>
          {page + 1} / {total}
        </Text>
      </View>
      <View style={styles.stand} {...pan.panHandlers}>
        <View style={styles.under}>
          {under ? <ChapterPage chapter={under} /> : <View style={styles.end} />}
        </View>
        <Animated.View style={[styles.pageShadow, turnStyle]}>
          <View style={styles.over}>
            {current ? <ChapterPage chapter={current} /> : <Cover />}
            <Animated.View pointerEvents="none" style={[styles.veil, veil]} />
          </View>
        </Animated.View>
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={previous}
          disabled={page === 0}
          accessibilityRole="button"
          testID="book-previous"
        >
          <Text style={[styles.control, page === 0 && styles.controlOff]}>
            {copy.menu.previous}
          </Text>
        </Pressable>
        <Pressable
          onPress={next}
          disabled={page >= total - 1}
          accessibilityRole="button"
          testID="book-next"
        >
          <Text style={[styles.control, page >= total - 1 && styles.controlOff]}>
            {copy.menu.turn}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: ink,
    paddingBottom: 28,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  close: {
    fontFamily: sansMedium,
    color: cream,
    fontSize: 15,
  },
  count: {
    fontFamily: sans,
    color: smoke,
    fontSize: 13,
  },
  stand: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  under: {
    position: "absolute",
    width: PAGE_WIDTH,
    height: 520,
    backgroundColor: white,
    borderRadius: 4,
    overflow: "hidden",
    ...shadow,
  },
  pageShadow: {
    width: PAGE_WIDTH,
    height: 520,
    borderRadius: 4,
    backgroundColor: white,
    ...shadow,
  },
  over: {
    flex: 1,
    backgroundColor: white,
    borderRadius: 4,
    overflow: "hidden",
    backfaceVisibility: "hidden",
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: ink,
  },
  end: {
    flex: 1,
    backgroundColor: "#2a211c",
  },
  cover: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 22,
  },
  coverPhoto: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
  },
  coverVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(27,22,18,0.46)",
  },
  coverKicker: {
    fontFamily: sansMedium,
    color: "#fff",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontSize: 12,
  },
  coverTitle: {
    fontFamily: serif,
    color: "#fff",
    fontSize: 48,
    marginTop: 6,
  },
  coverLine: {
    fontFamily: serifItalic,
    color: "#fff",
    fontSize: 18,
    marginTop: 8,
  },
  chapter: {
    flex: 1,
    padding: 18,
  },
  chapterPhoto: {
    width: "100%",
    height: 132,
    borderRadius: 2,
    marginBottom: 14,
  },
  chapterName: {
    fontFamily: serif,
    fontSize: 28,
    color: ink,
  },
  chapterIntro: {
    fontFamily: serifItalic,
    fontSize: 15,
    color: roast,
    marginTop: 2,
  },
  rule: {
    height: 1,
    backgroundColor: line,
    marginVertical: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 7,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontFamily: sansMedium,
    fontSize: 15,
    color: ink,
  },
  itemPoints: {
    fontFamily: sans,
    fontSize: 12,
    color: smoke,
    marginTop: 1,
  },
  itemPrice: {
    fontFamily: serif,
    fontSize: 16,
    color: ink,
  },
  rest: {
    fontFamily: serifItalic,
    fontSize: 14,
    color: smoke,
    marginTop: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  control: {
    fontFamily: sansMedium,
    color: cream,
    fontSize: 16,
  },
  controlOff: {
    color: "#5c5148",
  },
});
