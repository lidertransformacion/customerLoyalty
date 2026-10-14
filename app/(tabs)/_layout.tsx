import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { copy } from "@/src/i18n/strings";
import { useAccount } from "@/src/state/account";
import { Glass } from "@/src/ui/glass";
import { ink, sans, sansMedium } from "@/src/ui/theme";

const PLACES = [
  { name: "home", title: copy.tabs.home },
  { name: "menu", title: copy.tabs.menu },
  { name: "table", title: copy.tabs.table },
] as const;

export default function TabsLayout() {
  const { ready, account } = useAccount();
  const insets = useSafeAreaInsets();
  if (!ready) return <View style={styles.wait} />;
  if (!account) return <Redirect href="/signup" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 74 + insets.bottom,
        },
      }}
      tabBar={({ state, navigation }) => (
        <Bar
          index={state.index}
          routes={state.routes}
          go={(name) => navigation.navigate(name)}
        />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="table" />
    </Tabs>
  );
}

function Bar({
  index,
  routes,
  go,
}: {
  index: number;
  routes: { key: string; name: string }[];
  go: (name: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const mark = useSharedValue(index);

  useEffect(() => {
    mark.value = withSpring(index, {
      damping: 16,
      stiffness: 220,
      mass: 0.6,
    });
  }, [index, mark]);

  const pill = useAnimatedStyle(() => ({
    transform: [
      { translateX: mark.value * (width / Math.max(routes.length, 1)) },
    ],
  }));
  const slot = width / Math.max(routes.length, 1);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Glass style={styles.glass}>
        <View
          style={styles.rail}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
          {width > 0 ? (
            <Animated.View style={[styles.pill, { width: slot }, pill]} />
          ) : null}
          {routes.map((route, i) => {
            const place = PLACES.find((item) => item.name === route.name);
            const active = index === i;
            return (
              <Pressable
                key={route.key}
                onPress={() => go(route.name)}
                style={styles.place}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`place-${route.name}`}
              >
                <Text style={[styles.text, active && styles.textActive]}>
                  {place?.title ?? route.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wait: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bar: {
    paddingHorizontal: 22,
  },
  glass: {
    borderRadius: 28,
  },
  rail: {
    flexDirection: "row",
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 22,
    backgroundColor: "rgba(122,67,40,0.1)",
  },
  place: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  text: {
    fontFamily: sans,
    fontSize: 15,
    color: "#6a6a6a",
  },
  textActive: {
    fontFamily: sansMedium,
    color: ink,
  },
});
