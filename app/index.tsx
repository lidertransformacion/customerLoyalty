import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { copy } from "@/src/i18n/strings";
import { useAccount } from "@/src/state/account";
import { Frame } from "@/src/ui/frame";
import { Roast } from "@/src/ui/roast";
import { serif, serifItalic } from "@/src/ui/theme";

export default function Opening() {
  const { ready, account } = useAccount();
  const readyRef = useRef(ready);
  const accountRef = useRef(account);
  const finished = useRef(false);
  const continued = useRef(false);
  readyRef.current = ready;
  accountRef.current = account;

  const go = () => {
    if (continued.current || !readyRef.current || !finished.current) return;
    continued.current = true;
    router.replace(accountRef.current ? "/(tabs)/home" : "/signup");
  };

  useEffect(() => {
    go();
  }, [account, ready]);

  return (
    <Frame dark>
      <StatusBar style="light" />
      <View style={styles.box} testID="opening">
        <Roast
          onDone={() => {
            finished.current = true;
            go();
          }}
        />
        <View style={styles.brand} pointerEvents="none">
          <Text style={styles.name}>{copy.brand}</Text>
          <Text style={styles.line}>{copy.roastLine}</Text>
        </View>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
  },
  brand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 72,
    alignItems: "center",
  },
  name: {
    fontFamily: serif,
    color: "#fff",
    fontSize: 40,
  },
  line: {
    fontFamily: serifItalic,
    color: "#e7e7e7",
    fontSize: 16,
    marginTop: 4,
  },
});
