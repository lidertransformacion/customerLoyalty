import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
} from "@expo-google-fonts/fraunces";
import { Outfit_400Regular, Outfit_500Medium } from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { productionBlocked } from "@/src/data/program";
import { copy } from "@/src/i18n/strings";
import { AccountProvider, useAccount } from "@/src/state/account";
import { FlightLayer, FlightProvider } from "@/src/ui/flight";
import { Roast } from "@/src/ui/roast";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, error] = useFonts({
    Fraunces: Fraunces_500Medium,
    FrauncesItalic: Fraunces_500Medium_Italic,
    Outfit: Outfit_400Regular,
    OutfitMedium: Outfit_500Medium,
  });

  useEffect(() => {
    if (ready || error) void SplashScreen.hideAsync();
  }, [error, ready]);

  if (!ready && !error) return null;
  if (productionBlocked()) {
    return (
      <View style={styles.block}>
        <Text style={styles.blockText}>{copy.productionBlocked}</Text>
      </View>
    );
  }

  return (
    <AccountProvider>
      <FlightProvider>
        <View style={styles.root}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: "#fff" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="book" options={{ animation: "fade" }} />
            <Stack.Screen
              name="item/[id]"
              options={{ animation: "fade", animationDuration: 320 }}
            />
          </Stack>
          <RoastLayer />
          <FlightLayer />
        </View>
      </FlightProvider>
    </AccountProvider>
  );
}

function RoastLayer() {
  const { roast } = useAccount();
  if (!roast) return null;
  return (
    <View style={styles.layer} pointerEvents="auto">
      <Roast line={roast.line || undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  block: {
    flex: 1,
    backgroundColor: "#1b1612",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  blockText: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
  },
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
});
