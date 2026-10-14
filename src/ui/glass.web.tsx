import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
};

export function Glass({ children, style, dark = false }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: dark ? "rgba(27,22,18,0.72)" : "rgba(255,255,255,0.58)",
          borderWidth: 1,
          borderColor: dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.9)",
          overflow: "hidden",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow: "0 14px 40px rgba(27,22,18,0.12)",
        } as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
