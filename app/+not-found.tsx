import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { copy } from "@/src/i18n/strings";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: copy.brand }} />
      <View style={styles.box}>
        <Text style={styles.title}>{copy.missingPage}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{copy.back}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  title: {
    fontSize: 22,
    color: "#1b1612",
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    fontSize: 16,
    color: "#7a4328",
  },
});
