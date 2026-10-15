import { AnimatePresence, motion, useTransform } from "motion/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import type { MenuItem } from "@/src/data/menu";
import { REWARD_DEADLINE, REWARDS, pointsForPrice, pointsStillNeeded, storeName, type Reward } from "@/src/data/program";
import { dateFromKey, withSign } from "@/src/format";
import { formatMeters } from "@/src/i18n/strings";

import { haptics } from "../core/haptics";
import { BRAND, photoSpec, PRODUCT_IMAGES } from "../core/photos";
import { formatCountdown } from "../core/promo";
import { visualFor } from "../core/visuals";
import { useCopy, useLocale } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";
import { Roast } from "../motion/roast";
import { useTilt } from "../motion/tilt";
import { useAccount } from "../state/account";
import { useCatalog } from "../state/catalog";
import { usePresence } from "../state/presence";
import { Carousel } from "../ui/carousel";
import { Counter } from "../ui/counter";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Qr } from "../ui/qr";
import { Ring } from "../ui/ring";
import { Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";
import { Stamps } from "../ui/stamps";
import { StorePicker } from "./store-picker";

type Copy = ReturnType<typeof useCopy>;

function moment(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function greeting(copy: Copy): string {
  const m = moment();
  return m === "morning" ? copy.greeting.morning : m === "afternoon" ? copy.greeting.afternoon : copy.greeting.evening;
}

/** What the house suggests now: the hour picks the chapters, one or two items per chapter. */
const PICKS: Record<ReturnType<typeof moment>, string[]> = {
  morning: ["fil-paz-12", "cap-blend", "croix", "hue-gratin", "fw-so", "granola"],
  afternoon: ["cb-lata", "esp-so", "matcha-latte", "zanahoria", "iced-lat", "croix-almendra"],
  evening: ["bruma", "carajillo", "esencia", "affogato", "chai", "volcan"],
};

const ROASTS = ["paz-340", "libre-340", "rock-340", "punk-340", "impacto-340"];

/** The house: card, promo at the door, what to drink now, the roasts, cups, rewards and the ledger. */
export function Home() {
  const copy = useCopy();
  const { date, money } = useLocale();
  const navigate = useNavigate();
  const { account, dispatch, flash } = useAccount();
  const catalog = useCatalog();
  const presence = usePresence();
  const [storesOpen, setStoresOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const now = moment();
  const picks = useMemo(
    () => PICKS[now].map((id) => catalog.items.find((item) => item.id === id)).filter((item): item is MenuItem => !!item),
    [catalog, now],
  );
  const roasts = useMemo(
    () => ROASTS.map((id) => catalog.items.find((item) => item.id === id)).filter((item): item is MenuItem => !!item),
    [catalog],
  );
  if (!account) return null;

  const balance = shown ?? account.points;
  const next = REWARDS.find((reward) => reward.points > account.points);
  const progress = next ? Math.min(1, balance / next.points) : 1;
  const affordable = REWARDS.filter((reward) => account.points >= reward.points);
  const later = REWARDS.filter((reward) => account.points < reward.points);
  const firstName = account.name.split(" ")[0] ?? account.name;
  const funds = account.balance ?? 0;
  const orderCount = account.order.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <Screen testId="home">
      <div className="scroll with-tabs">
        {/* header */}
        <div className="pad pad-top row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <img src={BRAND.wordmark} alt={copy.brand} style={{ height: 26, width: "auto" }} />
          <div className="row" style={{ gap: 8 }}>
            <AnimatePresence>
              {orderCount > 0 ? (
                <motion.button
                  key="cart"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => navigate("/table")}
                  data-testid="home-order-badge"
                  style={{ height: 40, padding: "0 14px", borderRadius: 20, background: "var(--ink)", color: "#fff", fontSize: 13, fontWeight: 500 }}
                >
                  {copy.casa.inOrder(orderCount)}
                </motion.button>
              ) : null}
            </AnimatePresence>
            <button onClick={() => navigate("/settings")} aria-label={copy.casa.settings} data-testid="open-settings" style={{ width: 40, height: 40, borderRadius: 20, overflow: "hidden", display: "grid", placeItems: "center", background: "var(--cream)" }}>
              {account.picture ? <img src={account.picture} alt="" width={40} height={40} referrerPolicy="no-referrer" /> : <span className="serif" style={{ fontSize: 17, color: "var(--roast)" }}>{firstName.slice(0, 1)}</span>}
            </button>
          </div>
        </div>

        <div className="pad" style={{ marginTop: 14 }}>
          <div className="kicker">{greeting(copy)}</div>
          <h1 className="serif" style={{ fontSize: 34, margin: "2px 0 0", lineHeight: 1.05 }}>{firstName}</h1>
          <Press quiet onClick={() => setStoresOpen(true)} className="row" style={{ marginTop: 6, gap: 8 }} data-testid="open-stores">
            <span style={{ width: 8, height: 8, borderRadius: 4, background: presence.nearest?.inside ? "var(--matcha)" : "var(--roast)" }} />
            <span className="serif-italic" style={{ fontSize: 17, color: "var(--roast)" }}>{storeName(account.storeId)}</span>
            <span style={{ color: "var(--smoke)", fontSize: 13 }}>
              {presence.nearest
                ? presence.nearest.inside
                  ? copy.presence.atStore(storeName(presence.nearest.store.id))
                  : copy.presence.distance(formatMeters(presence.nearest.meters), storeName(presence.nearest.store.id))
                : "›"}
            </span>
          </Press>
        </div>

        {/* member card */}
        <div className="pad" style={{ marginTop: 16 }}>
          <MemberCard
            name={account.name}
            code={account.code}
            points={account.points}
            onDisplay={setShown}
            onOpen={() => setCounterOpen(true)}
            label={copy.casa.memberCard}
            hint={copy.casa.tapToShow}
            pointsLabel={copy.home.pointsLabel}
          />
        </div>

        {/* arrival promo */}
        <AnimatePresence>
          {presence.live && presence.promo ? (
            <motion.div key={presence.promo.id} className="pad" initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} style={{ marginTop: 14 }}>
              <LivingPhoto photo={{ ...visualForPromo(presence.promo.kind) }} radius={26} style={{ minHeight: 210 }} testId="promo-card">
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,22,18,0.15), rgba(27,22,18,0.82) 70%)" }} />
                <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "#fff" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="kicker" style={{ color: "rgba(255,255,255,0.75)" }}>{copy.promo.kicker} · {storeName(presence.promo.storeId)}</span>
                    <span className="serif" style={{ fontSize: 24, fontVariantNumeric: "tabular-nums" }} data-testid="promo-countdown">{formatCountdown(presence.remaining)}</span>
                  </div>
                  <div className="serif" style={{ fontSize: 28, lineHeight: 1.05, marginTop: 6 }}>{copy.promo.catalog[presence.promo.kind].title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>{copy.promo.catalog[presence.promo.kind].detail}</div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", marginTop: 12, overflow: "hidden" }}>
                    <motion.div style={{ height: "100%", background: "#ffb15a", transformOrigin: "left" }} animate={{ scaleX: presence.remaining / 600000 }} transition={{ duration: 1, ease: "linear" }} />
                  </div>
                  <div className="row" style={{ marginTop: 12, gap: 8 }}>
                    <Press className="ink-button" style={{ background: "#fff", color: "var(--ink)", minHeight: 44, flex: 1 }} onClick={presence.claim} data-testid="promo-claim">{copy.promo.activate}</Press>
                    <button onClick={presence.dismiss} style={{ color: "rgba(255,255,255,0.8)", padding: "0 10px", fontSize: 14 }}>{copy.web.close}</button>
                  </div>
                </div>
              </LivingPhoto>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* for today */}
        <div className="pad" style={{ marginTop: 26 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div className="kicker">{copy.casa.today}</div>
              <h2 className="serif" style={{ fontSize: 24, margin: "2px 0 0" }}>{now === "morning" ? copy.casa.todayMorning : now === "afternoon" ? copy.casa.todayAfternoon : copy.casa.todayEvening}</h2>
            </div>
            <button onClick={() => navigate("/menu")} style={{ color: "var(--roast)", fontWeight: 500, fontSize: 14 }} data-testid="start-order">{copy.casa.openMenu} →</button>
          </div>
          <Carousel testId="today-carousel">
            {picks.map((item) => (
              <PickCard
                key={item.id}
                item={item}
                price={money(item.price)}
                inOrder={account.order.find((line) => line.itemId === item.id)?.quantity ?? 0}
                earns={copy.menu.earns(pointsForPrice(item.price))}
                onOpen={() => navigate(`/item/${item.id}`)}
                onAdd={() => dispatch({ type: "addToTable", itemId: item.id })}
              />
            ))}
          </Carousel>
        </div>

        {/* roasts */}
        <div className="pad" style={{ marginTop: 10 }}>
          <div className="kicker">{copy.casa.roasting}</div>
          <div style={{ fontSize: 13, color: "var(--smoke)", marginTop: 2 }}>{copy.casa.roastingNote}</div>
          <Carousel testId="roast-carousel">
            {roasts.map((item) => (
              <Press key={item.id} quiet onClick={() => navigate(`/item/${item.id}`)} data-testid={`roast-${item.id}`} style={{ width: 150, textAlign: "center" }}>
                <Product src={PRODUCT_IMAGES[item.profile ?? "PAZ"] ?? PRODUCT_IMAGES.PAZ!} size={130} style={{ margin: "0 auto" }} />
                <div className="serif" style={{ fontSize: 17, marginTop: 2 }}>{item.profile}</div>
                <div style={{ fontSize: 12, color: "var(--smoke)" }}>{item.description.split(".")[0]}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{money(item.price)}</div>
              </Press>
            ))}
          </Carousel>
        </div>

        {/* balance + wallet */}
        <div className="pad" style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Glass flat style={{ padding: 14, background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Ring progress={progress} size={96} stroke={7}>
              <div style={{ textAlign: "center" }}>
                <Counter value={account.points} onDisplay={setShown} className="serif" style={{ fontSize: 26, lineHeight: 1, display: "block", fontVariantNumeric: "tabular-nums" }} />
                <div style={{ fontSize: 11, color: "var(--smoke)" }}>{copy.home.pointsLabel}</div>
              </div>
            </Ring>
            <div style={{ fontSize: 12, color: "var(--ink)", textAlign: "center", lineHeight: 1.3 }}>
              {next ? copy.home.nextReward(copy.rewards[next.id].name, pointsStillNeeded(balance, next.points)) : copy.home.allRewardsInReach}
            </div>
          </Glass>
          <Press quiet onClick={() => navigate("/wallet")} data-testid="open-wallet" style={{ textAlign: "left" }}>
            <Glass flat style={{ padding: 14, minHeight: "100%", background: "rgba(122,67,40,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--roast)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 15h2" /></svg>
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{copy.wallet.title}</div>
                <div style={{ fontSize: 12, color: "var(--smoke)" }}>{funds > 0 ? copy.wallet.homeNote : copy.wallet.homeEmpty}</div>
                <div className="serif" style={{ fontSize: 22, color: "var(--roast)", marginTop: 4, fontVariantNumeric: "tabular-nums" }} data-testid="home-wallet-balance">{funds > 0 ? money(funds) : copy.wallet.topUp}</div>
              </div>
            </Glass>
          </Press>
        </div>

        {/* cups */}
        <div className="pad" style={{ marginTop: 26 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>{copy.home.cupsTitle}</h2>
            <span style={{ fontSize: 13, color: "var(--roast)" }}>{account.stamps >= 8 ? copy.cups.full : copy.cups.left(8 - account.stamps)}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--smoke)", margin: "4px 0 12px" }}>{copy.home.cupsNote}</div>
          <Stamps stamps={account.stamps} />
        </div>

        {/* rewards */}
        <div className="pad" style={{ marginTop: 26 }}>
          <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>{copy.home.redeemTitle}</h2>
          <div style={{ fontSize: 13, color: "var(--smoke)", margin: "4px 0 6px" }}>{copy.home.redeemNote}</div>
          {affordable.length > 0 ? <div className="kicker" style={{ color: "var(--roast)", marginTop: 10 }}>{copy.home.canRedeemNow}</div> : null}
          {affordable.map((reward) => (
            <RewardRow key={reward.id} reward={reward} canRedeem onRedeem={() => dispatch({ type: "redeem", rewardId: reward.id })} />
          ))}
          {later.length > 0 ? <div className="kicker" style={{ marginTop: 10 }}>{copy.home.later}</div> : null}
          {later.map((reward) => (
            <RewardRow key={reward.id} reward={reward} canRedeem={false} missing={pointsStillNeeded(balance, reward.points)} onRedeem={() => dispatch({ type: "redeem", rewardId: reward.id })} />
          ))}
          <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 10 }}>{copy.home.rewardsUntil(dateFromKey(REWARD_DEADLINE))}</div>
        </div>

        {/* ledger */}
        <div className="pad" style={{ marginTop: 26 }}>
          <h2 className="serif" style={{ fontSize: 24, margin: "0 0 4px" }}>{copy.home.historyTitle}</h2>
          {account.movements.map((entry) => (
            <div key={entry.id} className="row" style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <div className="grow">
                <div style={{ fontWeight: 500, fontSize: 15 }}>{entry.label}</div>
                <div style={{ fontSize: 13, color: "var(--smoke)" }}>
                  {date(entry.date)}
                  {entry.store ? ` · ${entry.store}` : ""}
                </div>
              </div>
              <div className="serif" style={{ fontSize: 18, color: entry.points < 0 ? "var(--roast)" : "var(--ink)" }}>{withSign(entry.points)}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {flash ? (
          <motion.div key={flash.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(27,22,18,0.92)", display: "grid", placeItems: "center" }}>
            <Roast compact duration={flash.kind === "eighth" ? 2.2 : 1.4} line={flash.kind === "eighth" ? copy.notes.eighthCupToast : copy.cups.pour} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <StorePicker open={storesOpen} onClose={() => setStoresOpen(false)} />

      <Sheet open={counterOpen} onClose={() => setCounterOpen(false)} kicker={copy.web.counterTitle} title={copy.casa.scanTitle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingBottom: 8 }}>
          <div style={{ fontSize: 14, color: "var(--smoke)", textAlign: "center" }}>{copy.casa.scanLead}</div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} style={{ background: "#fff", padding: 14, borderRadius: 24, boxShadow: "0 20px 50px -24px rgba(27,22,18,0.5)" }}>
            <Qr value={`libertario:counter:${account.code}`} size={230} />
          </motion.div>
          <div className="serif" style={{ fontSize: 24, letterSpacing: 2 }} data-testid="counter-code">{account.code}</div>
          <div style={{ fontSize: 14 }}>{account.name}</div>
          <div style={{ fontSize: 12, color: "var(--smoke)" }}>{copy.casa.bright}</div>
        </div>
      </Sheet>
    </Screen>
  );
}

function visualForPromo(kind: "filterCroissant" | "doubleCup" | "afternoon") {
  return kind === "filterCroissant" ? photoSpec("filter.jpg") : kind === "doubleCup" ? photoSpec("espresso.jpg") : photoSpec("espresso.jpg");
}

/** The house card: ink glass with the logo, the balance and the counter code. It tilts in the hand. */
function MemberCard({ name, code, points, onDisplay, onOpen, label, hint, pointsLabel }: { name: string; code: string; points: number; onDisplay: (n: number) => void; onOpen: () => void; label: string; hint: string; pointsLabel: string }) {
  const tilt = useTilt<HTMLButtonElement>(8);
  const sheenX = useTransform(tilt.px, (v) => `${v * 100}%`);
  const sheenY = useTransform(tilt.py, (v) => `${v * 100}%`);
  return (
    <motion.button
      ref={tilt.ref}
      onClick={() => {
        haptics.select();
        onOpen();
      }}
      data-testid="open-counter"
      whileTap={{ scale: 0.985 }}
      style={{ display: "block", width: "100%", textAlign: "left", transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 26,
          padding: 20,
          minHeight: 190,
          color: "#fff",
          background: "linear-gradient(135deg, #2b211b 0%, #1b1612 55%, #3c2418 100%)",
          boxShadow: "0 30px 60px -30px rgba(27,22,18,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <motion.div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `radial-gradient(260px 180px at var(--mx) var(--my), rgba(255,255,255,0.22), rgba(255,255,255,0) 70%)`, ["--mx" as string]: sheenX, ["--my" as string]: sheenY, pointerEvents: "none" }} />
        <img src={BRAND.isotipoWhite} alt="" aria-hidden="true" style={{ position: "absolute", right: -30, bottom: -40, width: 220, opacity: 0.08, pointerEvents: "none" }} />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <img src={BRAND.logoWhite} alt="Libertario" style={{ height: 22, width: "auto", opacity: 0.95 }} />
          <span className="kicker" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
        </div>
        <div style={{ marginTop: 22 }}>
          <Counter value={points} onDisplay={onDisplay} className="serif" style={{ fontSize: 48, lineHeight: 1, fontVariantNumeric: "tabular-nums" }} />
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginLeft: 8 }}>{pointsLabel}</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", letterSpacing: 1.2 }}>{code}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 5 }}>
            <Qr value={`libertario:counter:${code}`} size={54} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>{hint}</div>
      </div>
    </motion.button>
  );
}

function PickCard({ item, price, earns, inOrder, onOpen, onAdd }: { item: MenuItem; price: string; earns: string; inOrder: number; onOpen: () => void; onAdd: () => void }) {
  const visual = visualFor(item);
  return (
    <div style={{ width: 196, flexShrink: 0 }} data-testid={`pick-${item.id}`}>
      <Press quiet onClick={onOpen} style={{ width: "100%", textAlign: "left" }}>
        {visual.kind === "photo" ? (
          <LivingPhoto photo={visual.photo} radius={22} style={{ height: 230 }} interactive={false}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,22,18,0) 45%, rgba(27,22,18,0.78))" }} />
            <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, color: "#fff" }}>
              <div className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>{item.name}</div>
              <div style={{ fontSize: 13, marginTop: 4, display: "flex", justifyContent: "space-between", paddingRight: 44 }}>
                <span style={{ fontWeight: 500 }}>{price}</span>
                <span style={{ color: "#ffd39a" }}>{earns}</span>
              </div>
            </div>
          </LivingPhoto>
        ) : (
          <div style={{ height: 230, borderRadius: 22, background: "var(--cream)", display: "grid", placeItems: "center" }}>
            <Product src={visual.src} size={150} />
          </div>
        )}
      </Press>
      <motion.button
        onClick={(event) => {
          event.stopPropagation();
          onAdd();
        }}
        whileTap={{ scale: 0.9 }}
        aria-label={item.name}
        data-testid={`add-${item.id}`}
        style={{ position: "relative", marginTop: -46, marginLeft: "auto", marginRight: 10, display: "block", width: 36, height: 36, borderRadius: 18, background: inOrder ? "var(--roast)" : "#fff", color: inOrder ? "#fff" : "var(--ink)", fontSize: 18, fontWeight: 500, boxShadow: "0 8px 18px -8px rgba(27,22,18,0.6)" }}
      >
        {inOrder ? inOrder : "+"}
      </motion.button>
    </div>
  );
}

function RewardRow({ reward, canRedeem, missing, onRedeem }: { reward: Reward; canRedeem: boolean; missing?: number; onRedeem: () => void }) {
  const copy = useCopy();
  return (
    <div className="row" style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
      <div className="grow">
        <div className="serif" style={{ fontSize: 19 }}>{copy.rewards[reward.id].name}</div>
        <div style={{ fontSize: 13, color: "var(--smoke)", marginTop: 2 }}>{copy.home.rewardMeta(reward.points, copy.rewards[reward.id].note)}</div>
        {!canRedeem && missing !== undefined && missing > 0 ? <div style={{ fontSize: 13, color: "var(--roast)", marginTop: 2 }}>{copy.home.missingPoints(missing)}</div> : null}
      </div>
      {canRedeem ? (
        <Press onClick={onRedeem} data-testid={`redeem-${reward.id}`} style={{ background: "var(--ink)", color: "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 500 }}>{copy.home.redeem}</Press>
      ) : (
        <Ring progress={missing !== undefined ? 1 - missing / reward.points : 1} size={40} stroke={4} />
      )}
    </div>
  );
}
