import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";

import { shadow, white } from "@/src/ui/theme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
};

export function Glass({ children, style, dark = false }: Props) {
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          {
            backgroundColor: dark ? "rgba(27,22,18,0.94)" : white,
            borderWidth: 1,
            borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(27,22,18,0.06)",
            overflow: "hidden",
            ...shadow,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={dark ? 32 : 26}
      tint={dark ? "dark" : "light"}
      style={[
        {
          overflow: "hidden",
          borderWidth: 1,
          borderColor: dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.62)",
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}
