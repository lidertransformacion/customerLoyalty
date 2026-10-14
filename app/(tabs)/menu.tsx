import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  categories,
  filterMenu,
  pointsForItem,
  type MenuItem,
} from "@/src/data/menu";
import { photoFor } from "@/src/data/photos";
import { storeById, storeName } from "@/src/data/program";
import { pesos } from "@/src/format";
import { copy } from "@/src/i18n/strings";
import { useAccount } from "@/src/state/account";
import { Frame } from "@/src/ui/frame";
import { useFlight } from "@/src/ui/flight";
import { StorePicker } from "@/src/ui/store-picker";
import {
  ink,
  line,
  roast,
  sans,
  sansMedium,
  serif,
  serifItalic,
  smoke,
} from "@/src/ui/theme";

const CEILINGS = [
  { id: "all", label: copy.menu.priceAll, ceiling: null },
  { id: "15", label: copy.menu.priceTo15, ceiling: 15000 },
  { id: "30", label: copy.menu.priceTo30, ceiling: 30000 },
] as const;

export default function Menu() {
  const { account, chooseStore } = useAccount();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [ceiling, setCeiling] = useState<number | null>(null);
  const [plant, setPlant] = useState(false);
  const [noNuts, setNoNuts] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);

  const visible = useMemo(
    () => filterMenu({ text, category, ceiling, plant, noNuts }),
    [category, ceiling, noNuts, plant, text],
  );

  if (!account) return null;
  const store = storeById(account.storeId);
  const chapters = categories.filter((item) => item.id !== "extras");

  return (
    <Frame>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{copy.menu.kicker}</Text>
          <Pressable onPress={() => setStoresOpen(true)}>
            <Text style={styles.title}>{storeName(store.id)}</Text>
          </Pressable>
          {!store.nearby ? (
            <Text style={styles.far}>
              {copy.menu.away(storeName(store.id))}
              <Text style={styles.link} onPress={() => chooseStore("zona-g")}>
                {copy.menu.openNearest}
              </Text>
            </Text>
          ) : null}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={copy.menu.searchPlaceholder}
            placeholderTextColor={smoke}
            style={styles.search}
            testID="menu-search"
            accessibilityLabel={copy.menu.searchLabel}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            <Word
              active={category === null}
              onPress={() => setCategory(null)}
              text={copy.menu.allCategories}
            />
            {chapters.map((item) => (
              <Word
                key={item.id}
                active={category === item.id}
                onPress={() =>
                  setCategory(category === item.id ? null : item.id)
                }
                text={item.name}
              />
            ))}
          </ScrollView>
          <View style={styles.index}>
            {CEILINGS.map((item) => (
              <Word
                key={item.id}
                active={ceiling === item.ceiling}
                onPress={() => setCeiling(item.ceiling)}
                text={item.label}
              />
            ))}
            <Word
              active={plant}
              onPress={() => setPlant((value) => !value)}
              text={copy.menu.plant}
            />
            <Word
              active={noNuts}
              onPress={() => setNoNuts((value) => !value)}
              text={copy.menu.noNuts}
            />
          </View>
          <Pressable
            onPress={() => router.push("/book")}
            accessibilityRole="button"
            testID="open-book"
          >
            <Text style={styles.openBook}>{copy.menu.openBook}</Text>
          </Pressable>
        </View>
        <FlatList
          style={styles.listFlex}
          data={visible}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          windowSize={5}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{copy.menu.empty}</Text>
          }
          renderItem={({ item }) => <Row item={item} />}
        />
      </View>
      <StorePicker
        open={storesOpen}
        storeId={account.storeId}
        onClose={() => setStoresOpen(false)}
        onChoose={chooseStore}
      />
    </Frame>
  );
}

function Word({
  active,
  text,
  onPress,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.word, active && styles.wordActive]}>{text}</Text>
    </Pressable>
  );
}

function Row({ item }: { item: MenuItem }) {
  const photoRef = useRef<View>(null);
  const { launch } = useFlight();
  const photo = photoFor(
    categories.find((entry) => entry.id === item.category)?.photo ?? "coffee.jpg",
  );
  const open = () => {
    const node = photoRef.current;
    if (!node) {
      router.push(`/item/${item.id}`);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width > 0) launch({ id: item.id, x, y, width, height, photo });
      router.push(`/item/${item.id}`);
    });
  };
  return (
    <Pressable onPress={open} style={styles.row} accessibilityRole="button">
      <View ref={photoRef} collapsable={false}>
        <Image source={photo} style={styles.photo} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowPoints}>{copy.menu.earns(pointsForItem(item))}</Text>
      </View>
      <Text style={styles.rowPrice}>{pesos(item.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 24,
    paddingBottom: 130,
  },
  listFlex: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  kicker: {
    fontFamily: sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: smoke,
  },
  title: {
    fontFamily: serif,
    fontSize: 40,
    color: ink,
    marginTop: 2,
  },
  far: {
    fontFamily: sans,
    fontSize: 14,
    lineHeight: 20,
    color: ink,
    marginTop: 8,
  },
  link: {
    fontFamily: sansMedium,
    color: roast,
  },
  search: {
    fontFamily: sans,
    fontSize: 16,
    color: ink,
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingVertical: 10,
    marginTop: 16,
  },
  rail: {
    gap: 16,
    paddingVertical: 14,
  },
  index: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 4,
  },
  word: {
    fontFamily: sans,
    fontSize: 15,
    color: smoke,
  },
  wordActive: {
    fontFamily: sansMedium,
    color: ink,
    textDecorationLine: "underline",
  },
  openBook: {
    fontFamily: serifItalic,
    fontSize: 18,
    color: roast,
    marginTop: 18,
    marginBottom: 8,
  },
  empty: {
    fontFamily: serifItalic,
    fontSize: 18,
    color: smoke,
    marginTop: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: line,
  },
  photo: {
    width: 58,
    height: 58,
    borderRadius: 2,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontFamily: sansMedium,
    fontSize: 16,
    color: ink,
  },
  rowPoints: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    marginTop: 2,
  },
  rowPrice: {
    fontFamily: serif,
    fontSize: 16,
    color: ink,
  },
});
