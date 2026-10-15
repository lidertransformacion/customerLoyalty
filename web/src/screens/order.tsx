import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { storeName } from "@/src/data/program";
import { pointsForPrice } from "@/src/data/program";

import { orderTotal, type OrderMode } from "../core/account";
import { haptics } from "../core/haptics";
import { useCatalog } from "../state/catalog";
import { useCopy, useLocale } from "../i18n";
import { photoSpec } from "../core/photos";
import { LivingPhoto } from "../motion/living-photo";
import { useAccount } from "../state/account";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Qr } from "../ui/qr";
import { Screen } from "../ui/screen";

/** The order: what is on it, pick up or table, send. Then the receipt with the code. */
export function OrderScreen() {
  const copy = useCopy();
  const { money } = useLocale();
  const navigate = useNavigate();
  const { account, dispatch } = useAccount();
  const catalog = useCatalog();
  const [mode, setMode] = useState<OrderMode>(account?.table ? "table" : "pickup");
  const [sending, setSending] = useState(false);
  const [tableError, setTableError] = useState(false);

  if (!account) {
    return (
      <Screen testId="order">
        <div className="scroll with-tabs pad pad-top" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center", gap: 14 }}>
          <LivingPhoto photo={photoSpec("espresso.jpg")} radius={26} style={{ width: 220, height: 220 }} interactive={false} />
          <div className="serif" style={{ fontSize: 26 }}>{copy.order.needAccount}</div>
          <Press className="ink-button" onClick={() => navigate("/signup")} data-testid="order-signup">{copy.order.createAccount}</Press>
        </div>
      </Screen>
    );
  }

  const lines = account.order
    .map((line) => {
      const item = catalog.items.find((entry) => entry.id === line.itemId);
      return item ? { item, quantity: line.quantity } : null;
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);
  const total = orderTotal(account.order);

  const send = () => {
    if (mode === "table" && !account.table) {
      setTableError(true);
      haptics.warn();
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      dispatch({ type: "postOrder", mode });
      setSending(false);
    }, 900);
  };

  if (account.lastOrder) {
    return <Receipt />;
  }

  return (
    <Screen testId="order">
      <div className="scroll with-tabs">
        <div className="pad pad-top">
          <div className="kicker">{copy.order.kicker} · {storeName(account.storeId)}</div>
          <h1 className="serif" style={{ fontSize: 36, margin: "2px 0 0", lineHeight: 1.05 }}>{copy.order.title}</h1>
        </div>

        {lines.length === 0 ? (
          <div className="pad" style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
            <LivingPhoto photo={photoSpec("espresso.jpg")} radius={26} style={{ width: 220, height: 220 }} interactive={false} />
            <div className="serif-italic" style={{ fontSize: 18, color: "var(--smoke)", maxWidth: 280 }}>{copy.order.empty}</div>
            <Press className="ink-button" onClick={() => navigate("/menu")} data-testid="order-go-menu">{copy.order.goToMenu}</Press>
          </div>
        ) : (
          <>
            <div className="pad" style={{ marginTop: 14 }}>
              <AnimatePresence initial={false}>
                {lines.map(({ item, quantity }) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="row" style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
                      <div className="grow">
                        <div className="serif" style={{ fontSize: 18 }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: "var(--smoke)" }}>
                          {money(item.price * quantity)} · {copy.menu.earns(pointsForPrice(item.price) * quantity)}
                        </div>
                      </div>
                      <Glass pill flat style={{ display: "flex", alignItems: "center", background: "var(--cream)" }}>
                        <button onClick={() => dispatch({ type: "removeFromTable", itemId: item.id })} style={{ width: 38, height: 38, fontSize: 20 }} aria-label={copy.order.remove} data-testid={`minus-${item.id}`}>−</button>
                        <motion.span key={quantity} initial={{ scale: 1.4 }} animate={{ scale: 1 }} style={{ minWidth: 18, textAlign: "center", fontWeight: 500 }} data-testid={`qty-${item.id}`}>{quantity}</motion.span>
                        <button onClick={() => dispatch({ type: "addToTable", itemId: item.id })} style={{ width: 38, height: 38, fontSize: 20 }} aria-label={copy.order.add} data-testid={`plus-${item.id}`}>+</button>
                      </Glass>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--ink)", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{copy.order.subtotal}</div>
                  <div style={{ fontSize: 13, color: "var(--roast)" }}>{copy.order.earns(total.points)}</div>
                </div>
                <div className="serif" style={{ fontSize: 26 }} data-testid="order-total">{money(total.price)}</div>
              </div>
            </div>

            <div className="pad" style={{ marginTop: 10 }}>
              <div className="kicker">{copy.order.how}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                {(["pickup", "table"] as const).map((option) => {
                  const selected = mode === option;
                  return (
                    <Press key={option} quiet onClick={() => setMode(option)} data-testid={`mode-${option}`} style={{ textAlign: "left" }}>
                      <Glass flat style={{ padding: 14, minHeight: 96, background: selected ? "rgba(122,67,40,0.12)" : "var(--cream)", outline: selected ? "1.5px solid var(--roast)" : "none" }}>
                        <div style={{ fontWeight: 500, fontSize: 15 }}>{option === "pickup" ? copy.order.pickup : copy.order.table}</div>
                        <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 4, lineHeight: 1.35 }}>
                          {option === "pickup" ? copy.order.pickupHint : copy.order.tableHint(account.table || "—")}
                        </div>
                      </Glass>
                    </Press>
                  );
                })}
              </div>
              <AnimatePresence>
                {mode === "table" ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    <Glass flat className="glass-field" style={{ marginTop: 10, borderRadius: 18, background: "rgba(246,241,234,0.7)", outline: tableError ? "1.5px solid var(--roast)" : "none" }}>
                      <label htmlFor="table-number">{copy.order.tableNumber}</label>
                      <input
                        id="table-number"
                        inputMode="numeric"
                        value={account.table}
                        onChange={(event) => {
                          setTableError(false);
                          dispatch({ type: "setTable", table: event.target.value });
                        }}
                        data-testid="table-number"
                        className="serif"
                        style={{ fontSize: 28 }}
                      />
                    </Glass>
                    {tableError ? <div style={{ fontSize: 13, color: "var(--roast)", margin: "6px 4px 0" }}>{copy.order.tableMissing}</div> : null}
                    <button
                      onClick={() => {
                        haptics.select();
                        dispatch({ type: "setTable", table: account.table });
                        window.alert(copy.order.floorCalled(account.table || "—"));
                      }}
                      className="chip"
                      style={{ marginTop: 10, background: "var(--cream)" }}
                      data-testid="call-floor"
                    >
                      🔔 {copy.order.callFloor}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 12 }}>{copy.order.payAtCounter}</div>
            </div>
          </>
        )}
      </div>

      {lines.length > 0 ? (
        <div className="dock" style={{ position: "absolute", left: 0, right: 0, bottom: "calc(var(--tabbar) + var(--sab))", padding: "10px 20px 8px", background: "linear-gradient(180deg, rgba(255,255,255,0), #fff 45%)", zIndex: 10 }}>
          <Press className="ink-button" onClick={send} disabled={sending} data-testid="order-send">
            {sending ? copy.order.sending : copy.order.send}
          </Press>
        </div>
      ) : null}
    </Screen>
  );
}

function Receipt() {
  const copy = useCopy();
  const { account, dispatch } = useAccount();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const order = account?.lastOrder;

  useEffect(() => {
    const a = window.setTimeout(() => setStage(1), 2600);
    const b = window.setTimeout(() => setStage(2), 7000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  if (!account || !order) return null;
  const firstName = account.name.split(" ")[0] ?? account.name;

  return (
    <Screen testId="receipt">
      <div className="scroll with-tabs pad pad-top" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div className="kicker">{storeName(order.storeId)}</div>
        <motion.h1 className="serif" style={{ fontSize: 36, margin: "4px 0 0", lineHeight: 1.05 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {copy.order.sentTitle}
        </motion.h1>
        <div className="serif-italic" style={{ fontSize: 17, color: "var(--smoke)", marginTop: 8 }}>
          {order.mode === "pickup" ? copy.order.sentPickup(firstName) : copy.order.sentTable(order.table)}
        </div>

        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.15 }} style={{ marginTop: 18 }}>
          <Glass lens style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Qr value={`libertario:order:${order.code}`} size={150} />
            <div className="kicker">{copy.order.code}</div>
            <div className="serif" style={{ fontSize: 30, letterSpacing: 3 }} data-testid="order-code">{order.code}</div>
          </Glass>
        </motion.div>

        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 22, width: "100%", maxWidth: 320 }}>
          {copy.order.timeline.map((label, i) => (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
              {i > 0 ? <div style={{ position: "absolute", left: "-50%", right: "50%", top: 9, height: 2, background: "var(--line)" }}><motion.div style={{ height: "100%", background: "var(--roast)", transformOrigin: "left" }} animate={{ scaleX: stage >= i ? 1 : 0 }} transition={{ duration: 0.6 }} /></div> : null}
              <motion.span style={{ width: 20, height: 20, borderRadius: 10, border: "2px solid var(--roast)", zIndex: 1 }} animate={{ background: stage >= i ? "#7a4328" : "#ffffff", scale: stage === i ? 1.2 : 1 }} />
              <span style={{ fontSize: 12, color: stage >= i ? "var(--ink)" : "var(--smoke)" }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "var(--smoke)", marginTop: 8 }}>{stage >= 1 ? copy.order.preparing : copy.order.payAtCounter}</div>

        <div style={{ width: "100%", marginTop: 22, textAlign: "left" }}>
          {order.lines.map((line) => {
            const item = catalog.items.find((entry) => entry.id === line.itemId);
            if (!item) return null;
            return (
              <div key={line.itemId} className="row" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <span style={{ color: "var(--smoke)", width: 24 }}>{line.quantity}×</span>
                <span className="grow serif" style={{ fontSize: 17 }}>{item.name}</span>
              </div>
            );
          })}
          <div style={{ fontSize: 13, color: "var(--roast)", marginTop: 8 }}>{copy.order.earns(order.points)}</div>
        </div>

        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 22 }}>
          <Press className="ghost-button" onClick={() => { dispatch({ type: "clearLastOrder" }); navigate("/menu"); }} data-testid="order-again">{copy.order.again}</Press>
          <Press className="ink-button" onClick={() => { dispatch({ type: "clearLastOrder" }); navigate("/home"); }} data-testid="order-done">{copy.order.done}</Press>
        </div>
      </div>
    </Screen>
  );
}
