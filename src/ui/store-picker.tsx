import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { STORES, storeLedgerName, storeName } from "@/src/data/program";
import { copy } from "@/src/i18n/strings";
import {
  cream,
  ink,
  line,
  roast,
  sans,
  sansMedium,
  serif,
  smoke,
} from "@/src/ui/theme";

export function StorePicker({
  open,
  storeId,
  onClose,
  onChoose,
}: {
  open: boolean;
  storeId: string;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.veil} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.kicker}>{copy.stores.pickerKicker}</Text>
          <Text style={styles.title}>{copy.stores.pickerTitle}</Text>
          <Text style={styles.note}>{copy.stores.pickerNote}</Text>
          {STORES.map((store) => {
            const selected = store.id === storeId;
            return (
              <Pressable
                key={store.id}
                onPress={() => {
                  onChoose(store.id);
                  onClose();
                }}
                style={[styles.row, selected && styles.rowSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View>
                  <Text style={styles.name}>{storeName(store.id)}</Text>
                  <Text style={styles.label}>{storeLedgerName(store.id)}</Text>
                </View>
                <Text style={styles.mark}>
                  {selected
                    ? copy.stores.selected
                    : store.nearby
                      ? copy.stores.nearby
                      : ""}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  veil: {
    flex: 1,
    backgroundColor: "rgba(27,22,18,0.36)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: cream,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  kicker: {
    fontFamily: sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: smoke,
  },
  title: {
    fontFamily: serif,
    fontSize: 32,
    color: ink,
    marginTop: 4,
  },
  note: {
    fontFamily: sans,
    fontSize: 15,
    lineHeight: 21,
    color: ink,
    marginTop: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: line,
  },
  rowSelected: {
    backgroundColor: "rgba(122,67,40,0.06)",
  },
  name: {
    fontFamily: serif,
    fontSize: 20,
    color: ink,
  },
  label: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    marginTop: 2,
  },
  mark: {
    fontFamily: sansMedium,
    fontSize: 13,
    color: roast,
  },
});
