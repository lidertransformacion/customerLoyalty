import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ink, margin, paper } from "@/src/ui/theme";

export function Frame({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <View style={[styles.outer, dark && styles.outerDark]}>
      <SafeAreaView
        style={[styles.inner, dark && styles.innerDark]}
        edges={["top", "left", "right"]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: margin,
    alignItems: "center",
  },
  outerDark: {
    backgroundColor: ink,
  },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    backgroundColor: paper,
  },
  innerDark: {
    backgroundColor: ink,
  },
});
