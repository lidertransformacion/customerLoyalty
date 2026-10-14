import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  REWARD_DEADLINE,
  REWARDS,
  pointsStillNeeded,
  rewardName,
  rewardNote,
  storeById,
  storeName,
  type Reward,
} from "@/src/data/program";
import { dateFromKey, shortDate, withSign } from "@/src/format";
import { copy } from "@/src/i18n/strings";
import { nativeFlags } from "@/src/native";
import { useAccount } from "@/src/state/account";
import { Counter, Rail, Stamps } from "@/src/ui/cinema";
import { Frame } from "@/src/ui/frame";
import { Glass } from "@/src/ui/glass";
import { Mark } from "@/src/ui/mark";
import { StorePicker } from "@/src/ui/store-picker";
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

export default function Home() {
  const { account, note, dismissNote, chooseStore, redeem, forget } =
    useAccount();
  const [storesOpen, setStoresOpen] = useState(false);
  const [shownPoints, setShownPoints] = useState<number | null>(null);
  if (!account) return null;

  const store = storeById(account.storeId);
  const shown = shownPoints ?? account.points;
  const next = REWARDS.find((reward) => reward.points > account.points);
  const progress = next ? Math.min(1, shown / next.points) : 1;
  const affordable = REWARDS.filter((reward) => account.points >= reward.points);
  const later = REWARDS.filter((reward) => account.points < reward.points);
  const nativeOff =
    !nativeFlags.geofence || !nativeFlags.alert || !nativeFlags.wallet;

  return (
    <Frame>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>{copy.home.kicker}</Text>
        <Text style={styles.name}>{account.name}</Text>
        <Pressable onPress={() => setStoresOpen(true)} accessibilityRole="button">
          <Text style={styles.store}>{storeName(store.id)}</Text>
        </Pressable>
        {!store.nearby ? (
          <Text style={styles.far}>
            {copy.home.awayFromStore(storeName(store.id))}
            <Text style={styles.link} onPress={() => chooseStore("zona-g")}>
              {copy.home.openNearest}
            </Text>
          </Text>
        ) : (
          <Text style={styles.near}>{copy.home.nearestStore}</Text>
        )}

        {note ? (
          <Pressable onPress={dismissNote} style={styles.note}>
            <Text style={styles.noteText}>{note}</Text>
          </Pressable>
        ) : null}

        <Counter
          value={account.points}
          onDisplay={setShownPoints}
          style={styles.balance}
        />
        <Text style={styles.balanceLabel}>{copy.home.pointsLabel}</Text>
        <Text style={styles.ruleText}>{copy.home.earnRule}</Text>
        <Rail progress={progress} />
        <Text style={styles.meta}>
          {next
            ? copy.home.nextReward(
                rewardName(next.id),
                pointsStillNeeded(shown, next.points),
              )
            : copy.home.allRewardsInReach}
        </Text>

        <View style={styles.slip}>
          <Text style={styles.slipKicker}>{copy.home.thisMonth}</Text>
          <Text style={styles.slipText}>{copy.home.nothingExpires}</Text>
          <Text style={styles.slipSoft}>
            {copy.home.rewardsUntil(dateFromKey(REWARD_DEADLINE))}
          </Text>
        </View>

        <Text style={styles.section}>{copy.home.cupsTitle}</Text>
        <Text style={styles.sectionNote}>{copy.home.cupsNote}</Text>
        <Stamps stamps={account.stamps} />

        <Text style={styles.section}>{copy.home.counterTitle}</Text>
        <Text style={styles.sectionNote}>{copy.home.counterNote}</Text>
        <Glass style={styles.mark}>
          <Mark value={`libertario:counter:${account.code}`} />
          <Text style={styles.code}>{account.code}</Text>
        </Glass>

        <Text style={styles.section}>{copy.home.redeemTitle}</Text>
        <Text style={styles.sectionNote}>{copy.home.redeemNote}</Text>
        {affordable.length > 0 ? (
          <Text style={styles.group}>{copy.home.canRedeemNow}</Text>
        ) : null}
        {affordable.map((reward) => (
          <RewardRow
            key={reward.id}
            reward={reward}
            canRedeem
            onRedeem={() => redeem(reward.id)}
          />
        ))}
        {later.length > 0 ? (
          <Text style={styles.group}>{copy.home.later}</Text>
        ) : null}
        {later.map((reward) => (
          <RewardRow
            key={reward.id}
            reward={reward}
            canRedeem={false}
            missing={pointsStillNeeded(shown, reward.points)}
            onRedeem={() => redeem(reward.id)}
          />
        ))}

        <Text style={styles.section}>{copy.home.historyTitle}</Text>
        {account.movements.map((entry) => (
          <View key={entry.id} style={styles.movement}>
            <View style={styles.movementText}>
              <Text style={styles.movementLabel}>{entry.label}</Text>
              <Text style={styles.movementPlace}>
                {shortDate(entry.date)}
                {entry.store ? ` · ${entry.store}` : ""}
              </Text>
            </View>
            <Text style={styles.movementPoints}>{withSign(entry.points)}</Text>
          </View>
        ))}

        {nativeOff ? <Text style={styles.native}>{copy.nativeNote}</Text> : null}
        <Pressable
          onPress={() => {
            forget();
            router.replace("/signup");
          }}
          accessibilityRole="button"
        >
          <Text style={styles.forget}>{copy.home.forgetPhone}</Text>
        </Pressable>
      </ScrollView>
      <StorePicker
        open={storesOpen}
        storeId={account.storeId}
        onClose={() => setStoresOpen(false)}
        onChoose={chooseStore}
      />
    </Frame>
  );
}

function RewardRow({
  reward,
  canRedeem,
  missing,
  onRedeem,
}: {
  reward: Reward;
  canRedeem: boolean;
  missing?: number;
  onRedeem: () => void;
}) {
  return (
    <View style={styles.reward}>
      <View style={styles.rewardText}>
        <Text style={styles.rewardName}>{rewardName(reward.id)}</Text>
        <Text style={styles.rewardNote}>
          {copy.home.rewardMeta(reward.points, rewardNote(reward.id))}
        </Text>
        {!canRedeem && missing !== undefined && missing > 0 ? (
          <Text style={styles.rewardMissing}>{copy.home.missingPoints(missing)}</Text>
        ) : null}
      </View>
      {canRedeem ? (
        <Pressable
          onPress={onRedeem}
          style={styles.redeem}
          accessibilityRole="button"
          testID={`redeem-${reward.id}`}
        >
          <Text style={styles.redeemText}>{copy.home.redeem}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 130,
  },
  kicker: {
    fontFamily: sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: smoke,
  },
  name: {
    fontFamily: serif,
    fontSize: 36,
    color: ink,
    marginTop: 4,
  },
  store: {
    fontFamily: serifItalic,
    fontSize: 18,
    color: roast,
    marginTop: 2,
  },
  far: {
    fontFamily: sans,
    fontSize: 14,
    lineHeight: 20,
    color: ink,
    marginTop: 10,
  },
  near: {
    fontFamily: sans,
    fontSize: 14,
    color: smoke,
    marginTop: 8,
  },
  link: {
    fontFamily: sansMedium,
    color: roast,
  },
  note: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: line,
    borderRadius: 12,
  },
  noteText: {
    fontFamily: sans,
    fontSize: 14,
    lineHeight: 20,
    color: ink,
  },
  balance: {
    fontFamily: serif,
    fontSize: 72,
    color: ink,
    marginTop: 18,
    lineHeight: 76,
  },
  balanceLabel: {
    fontFamily: sans,
    fontSize: 16,
    color: smoke,
    marginTop: -4,
  },
  ruleText: {
    fontFamily: sans,
    fontSize: 14,
    color: ink,
    marginTop: 12,
  },
  meta: {
    fontFamily: serifItalic,
    fontSize: 16,
    color: ink,
    marginTop: 8,
  },
  slip: {
    marginTop: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: line,
  },
  slipKicker: {
    fontFamily: sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: smoke,
  },
  slipText: {
    fontFamily: serif,
    fontSize: 20,
    color: ink,
    marginTop: 4,
  },
  slipSoft: {
    fontFamily: sans,
    fontSize: 14,
    color: smoke,
    marginTop: 4,
  },
  section: {
    fontFamily: serif,
    fontSize: 28,
    color: ink,
    marginTop: 28,
  },
  sectionNote: {
    fontFamily: sans,
    fontSize: 14,
    lineHeight: 20,
    color: smoke,
    marginTop: 4,
    marginBottom: 12,
  },
  mark: {
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  code: {
    fontFamily: sansMedium,
    letterSpacing: 1.4,
    color: ink,
    marginTop: 10,
  },
  group: {
    fontFamily: sansMedium,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: roast,
    marginTop: 8,
    marginBottom: 4,
  },
  reward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: line,
  },
  rewardText: {
    flex: 1,
  },
  rewardName: {
    fontFamily: serif,
    fontSize: 20,
    color: ink,
  },
  rewardNote: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    marginTop: 2,
  },
  rewardMissing: {
    fontFamily: sans,
    fontSize: 13,
    color: roast,
    marginTop: 2,
  },
  redeem: {
    backgroundColor: ink,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  redeemText: {
    fontFamily: sansMedium,
    color: cream,
    fontSize: 14,
  },
  movement: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: line,
  },
  movementText: {
    flex: 1,
  },
  movementLabel: {
    fontFamily: sansMedium,
    fontSize: 15,
    color: ink,
  },
  movementPlace: {
    fontFamily: sans,
    fontSize: 13,
    color: smoke,
    marginTop: 2,
  },
  movementPoints: {
    fontFamily: serif,
    fontSize: 18,
    color: ink,
  },
  native: {
    fontFamily: sans,
    fontSize: 13,
    lineHeight: 18,
    color: smoke,
    marginTop: 28,
  },
  forget: {
    fontFamily: sans,
    fontSize: 14,
    color: roast,
    marginTop: 18,
  },
});
