import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { categoryById, itemById, pointsForItem } from "@/src/data/menu";
import { photoFor } from "@/src/data/photos";
import { pesos } from "@/src/format";
import { copy } from "@/src/i18n/strings";
import { useAccount } from "@/src/state/account";
import { Frame } from "@/src/ui/frame";
import { useFlight } from "@/src/ui/flight";
import {
  cream,
  ink,
  sans,
  sansMedium,
  serif,
  serifItalic,
  smoke,
} from "@/src/ui/theme";

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { postItem, addToTable } = useAccount();
  const { origin, target, phase, setTarget, returnHome, release } = useFlight();
  const photoRef = useRef<View>(null);
  const item = typeof id === "string" ? itemById(id) : undefined;

  useEffect(() => {
    if (phase !== "going") return undefined;
    const wait = setTimeout(() => release(), 1600);
    return () => clearTimeout(wait);
  }, [phase, release]);

  if (!item) {
    return (
      <Frame>
        <Text style={styles.missing}>{copy.menu.missingItem}</Text>
      </Frame>
    );
  }
  const chapter = categoryById(item.category);
  const points = pointsForItem(item);
  const photo = photoFor(chapter?.photo ?? "coffee.jpg");
  const inFlight =
    origin?.id === item.id &&
    target !== null &&
    (phase === "going" || phase === "returning");

  const measure = () => {
    photoRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setTarget({ x, y, width, height });
    });
  };

  const close = () => {
    if (origin?.id === item.id) returnHome(() => router.back());
    else router.back();
  };

  return (
    <Frame>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={close} accessibilityRole="button">
          <Text style={styles.close}>{copy.menu.close}</Text>
        </Pressable>
        <View
          ref={photoRef}
          collapsable={false}
          onLayout={measure}
          style={styles.photoFrame}
        >
          <Image source={photo} style={[styles.photo, inFlight && styles.photoHidden]} />
        </View>
        <Text style={styles.kicker}>{chapter?.name}</Text>
        <Text style={styles.name}>{item.name}</Text>
        {item.profile ? <Text style={styles.profile}>{item.profile}</Text> : null}
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>{pesos(item.price)}</Text>
        <Text style={styles.points}>{copy.menu.earnsAtCounter(points)}</Text>
        <Pressable
          onPress={() => {
            release();
            addToTable(item.id);
            router.push("/(tabs)/table");
          }}
          style={styles.ghost}
          accessibilityRole="button"
          testID="item-table"
        >
          <Text style={styles.ghostText}>{copy.menu.addToTable}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            release();
            postItem(item.id);
            router.push("/(tabs)/home");
          }}
          style={styles.button}
          accessibilityRole="button"
          testID="item-register"
        >
          <Text style={styles.buttonText}>{copy.menu.postAtRegister}</Text>
        </Pressable>
        <Text style={styles.foot}>{copy.menu.notCharged}</Text>
      </ScrollView>
    </Frame>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  close: {
    fontFamily: sansMedium,
    color: ink,
    fontSize: 15,
  },
  photoFrame: {
    marginTop: 14,
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 2,
  },
  photoHidden: {
    opacity: 0,
  },
  kicker: {
    fontFamily: sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: smoke,
    marginTop: 16,
  },
  name: {
    fontFamily: serif,
    fontSize: 36,
    color: ink,
    marginTop: 4,
  },
  profile: {
    fontFamily: sansMedium,
    fontSize: 13,
    letterSpacing: 1,
    color: "#7a4328",
    marginTop: 4,
  },
  description: {
    fontFamily: serifItalic,
    fontSize: 18,
    lineHeight: 26,
    color: ink,
    marginTop: 10,
  },
  price: {
    fontFamily: serif,
    fontSize: 28,
    color: ink,
    marginTop: 16,
  },
  points: {
    fontFamily: sans,
    fontSize: 15,
    lineHeight: 21,
    color: ink,
    marginTop: 6,
  },
  ghost: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: ink,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  ghostText: {
    fontFamily: sansMedium,
    color: ink,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    backgroundColor: ink,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: sansMedium,
    color: cream,
    fontSize: 16,
  },
  foot: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    marginTop: 12,
    lineHeight: 18,
  },
  missing: {
    fontFamily: serif,
    fontSize: 24,
    color: ink,
    padding: 24,
  },
});
