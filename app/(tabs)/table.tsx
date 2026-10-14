import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { itemById, pointsForItem } from "@/src/data/menu";
import { storeById, storeName } from "@/src/data/program";
import { pesos } from "@/src/format";
import { copy } from "@/src/i18n/strings";
import { useAccount } from "@/src/state/account";
import { Frame } from "@/src/ui/frame";
import { Mark } from "@/src/ui/mark";
import {
  cream,
  ink,
  line,
  roast,
  sans,
  sansMedium,
  serif,
  serifItalic,
  smoke,
} from "@/src/ui/theme";

export default function Table() {
  const {
    account,
    note,
    dismissNote,
    setTable,
    removeFromTable,
    postOrder,
    callFloor,
  } = useAccount();
  if (!account) return null;
  const store = storeById(account.storeId);
  const lines = account.order
    .map((line) => {
      const item = itemById(line.itemId);
      return item ? { item, quantity: line.quantity } : null;
    })
    .filter(
      (line): line is { item: NonNullable<ReturnType<typeof itemById>>; quantity: number } =>
        line !== null,
    );

  return (
    <Frame>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>{copy.table.kicker}</Text>
        <Text style={styles.title}>{copy.table.title(account.table || "—")}</Text>
        <Text style={styles.lead}>{copy.table.lead(storeName(store.id))}</Text>
        {note ? (
          <Pressable onPress={dismissNote} style={styles.note}>
            <Text style={styles.noteText}>{note}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.label}>{copy.table.numberLabel}</Text>
        <TextInput
          value={account.table}
          onChangeText={setTable}
          keyboardType="number-pad"
          style={styles.input}
          accessibilityLabel={copy.table.numberA11y}
          testID="table-number"
        />
        <View style={styles.mark}>
          <Mark
            value={`libertario:table:${account.storeId}:${account.table || "0"}`}
            size={148}
          />
        </View>
        <Text style={styles.code}>{copy.table.codeNote}</Text>
        <Text style={styles.section}>{copy.table.orderTitle}</Text>
        {lines.length === 0 ? (
          <Text style={styles.empty}>{copy.table.empty}</Text>
        ) : null}
        {lines.map(({ item, quantity }) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>
                {quantity} · {item.name}
              </Text>
              <Text style={styles.rowSoft}>
                {copy.table.linePoints(
                  pesos(item.price * quantity),
                  pointsForItem(item) * quantity,
                )}
              </Text>
            </View>
            <Pressable
              onPress={() => removeFromTable(item.id)}
              accessibilityRole="button"
            >
              <Text style={styles.remove}>{copy.table.remove}</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={callFloor}
          style={styles.ghost}
          accessibilityRole="button"
          testID="table-call"
        >
          <Text style={styles.ghostText}>{copy.table.callFloor}</Text>
        </Pressable>
        <Pressable
          onPress={postOrder}
          style={styles.button}
          accessibilityRole="button"
          testID="table-post"
        >
          <Text style={styles.buttonText}>{copy.table.postOrder}</Text>
        </Pressable>
        <Text style={styles.foot}>{copy.table.footnote}</Text>
      </ScrollView>
    </Frame>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140,
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
    fontSize: 42,
    color: ink,
    marginTop: 4,
  },
  lead: {
    fontFamily: serifItalic,
    fontSize: 17,
    lineHeight: 24,
    color: ink,
    marginTop: 6,
  },
  note: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: line,
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontFamily: sans,
    fontSize: 14,
    lineHeight: 20,
    color: ink,
  },
  label: {
    fontFamily: sansMedium,
    fontSize: 13,
    color: smoke,
    marginTop: 20,
  },
  input: {
    fontFamily: serif,
    fontSize: 32,
    color: ink,
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingVertical: 4,
  },
  mark: {
    alignItems: "center",
    marginTop: 22,
  },
  code: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    textAlign: "center",
    marginTop: 8,
  },
  section: {
    fontFamily: serif,
    fontSize: 28,
    color: ink,
    marginTop: 26,
  },
  empty: {
    fontFamily: serifItalic,
    fontSize: 16,
    color: smoke,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: line,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontFamily: sansMedium,
    fontSize: 16,
    color: ink,
  },
  rowSoft: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    marginTop: 2,
  },
  remove: {
    fontFamily: sans,
    color: roast,
    fontSize: 14,
  },
  ghost: {
    marginTop: 18,
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
    lineHeight: 18,
    color: smoke,
    marginTop: 12,
  },
});
