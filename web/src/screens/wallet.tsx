import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { storeName } from "@/src/data/program";

import type { TopUpMethod } from "../core/account";
import { haptics } from "../core/haptics";
import { useCopy, useLocale } from "../i18n";
import { useAccount } from "../state/account";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Qr } from "../ui/qr";
import { Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";

/** Amounts in COP. The presets are the chips; the minimum guards the custom field. */
const PRESETS = [20000, 50000, 100000] as const;
const MIN_TOP_UP = 5000;
const MAX_DIGITS = 8;
/** One second per PSE step: redirecting, bank approving, approved. */
const STEP_MS = 1000;
const STEPS = 3;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Flow = { amount: number; bank: string; reference: string };
type Receipt = { amount: number; method: TopUpMethod; via: string; reference: string; at: string };

function code(prefix: string, length = 6): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? "L";
  }
  return `${prefix}-${out}`;
}

function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

/**
 * The prepaid balance, the way a registered coffee card works: loaded at the counter or from the phone,
 * and paying with it earns double. This is a demo. The real PSE flow goes through Wompi or PayU from a backend.
 */
export function WalletScreen() {
  const copy = useCopy();
  const { money, date, market } = useLocale();
  const navigate = useNavigate();
  const { account, dispatch } = useAccount();
  const [method, setMethod] = useState<TopUpMethod>("register");
  const [preset, setPreset] = useState<number>(PRESETS[1]);
  const [custom, setCustom] = useState("");
  const [bank, setBank] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [stage, setStage] = useState(0);
  const [registerCode, setRegisterCode] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // The three PSE steps, then the top-up lands on the account and the receipt shows.
  useEffect(() => {
    if (!flow) return;
    const timers = [
      window.setTimeout(() => setStage(1), STEP_MS),
      window.setTimeout(() => setStage(2), STEP_MS * 2),
      window.setTimeout(() => {
        dispatch({ type: "topUp", amount: flow.amount, method: "pse", bank: flow.bank, reference: flow.reference });
        setReceipt({ amount: flow.amount, method: "pse", via: flow.bank, reference: flow.reference, at: new Date().toISOString() });
        setFlow(null);
      }, STEP_MS * 3),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [flow, dispatch]);

  if (!account) return null;

  const funds = account.balance ?? 0;
  const amount = custom ? Number(custom) : preset;
  const enough = amount >= MIN_TOP_UP;
  const movements = account.walletMovements ?? [];
  const house = storeName(account.storeId);

  const pay = () => {
    if (!enough || flow) return;
    if (!bank) {
      haptics.warn();
      setBankOpen(true);
      return;
    }
    setReceipt(null);
    setStage(0);
    setFlow({ amount, bank, reference: code("PSE") });
  };

  const showAtRegister = () => {
    if (!enough) return;
    haptics.select();
    setReceipt(null);
    setRegisterCode(code("CAJA", 4));
  };

  // In the store the register scans the code, takes the money and the balance lands. Here one tap stands in for the register.
  const registerConfirmed = () => {
    if (!registerCode) return;
    dispatch({ type: "topUp", amount, method: "register", storeId: account.storeId, reference: registerCode });
    setReceipt({ amount, method: "register", via: house, reference: registerCode, at: new Date().toISOString() });
    setRegisterCode(null);
  };

  return (
    <Screen direction="right" testId="wallet">
      <div className="pad pad-top row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="kicker">{copy.wallet.kicker}</div>
          <h1 className="serif" style={{ fontSize: 32, margin: "2px 0 0", lineHeight: 1.05 }}>{copy.wallet.title}</h1>
        </div>
        <button onClick={() => navigate("/home")} className="chip" style={{ background: "var(--cream)" }} data-testid="wallet-back">
          {copy.back}
        </button>
      </div>

      <div className="scroll" style={{ paddingBottom: "calc(var(--sab) + 40px)" }}>
        {/* balance */}
        <div className="pad" style={{ marginTop: 18 }}>
          <Glass lens style={{ padding: "20px 18px", background: "rgba(122,67,40,0.08)" }}>
            <div className="kicker">{copy.wallet.available}</div>
            <motion.div
              key={funds}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="serif"
              style={{ fontSize: 46, lineHeight: 1.05, marginTop: 4, fontVariantNumeric: "tabular-nums" }}
              data-testid="wallet-balance"
            >
              {money(funds)}
            </motion.div>
            <div style={{ fontSize: 13, color: "var(--smoke)", marginTop: 6, lineHeight: 1.4 }} data-testid="wallet-rule">
              {funds === 0 ? copy.wallet.empty : copy.wallet.earnsDouble}
            </div>
          </Glass>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {receipt ? (
            <motion.div
              key="receipt"
              className="pad"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              style={{ marginTop: 24 }}
            >
              <Glass lens style={{ padding: 18 }} data-testid="wallet-receipt">
                <div className="kicker">{copy.wallet.receiptKicker}</div>
                <div className="serif" style={{ fontSize: 26, marginTop: 4 }}>{receipt.method === "register" ? copy.wallet.registerReceipt : copy.wallet.receiptTitle}</div>
                <div style={{ marginTop: 10 }}>
                  <ReceiptLine label={copy.wallet.amount} value={money(receipt.amount)} />
                  <ReceiptLine label={receipt.method === "register" ? copy.wallet.atRegister : copy.wallet.bank} value={receipt.via} />
                  <ReceiptLine label={copy.wallet.reference} value={receipt.reference} testId="wallet-reference" spaced />
                  <ReceiptLine label={copy.wallet.date} value={date(receipt.at)} />
                </div>
                <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 12, lineHeight: 1.4 }}>{copy.wallet.earnsDouble}</div>
                <Press className="ink-button" style={{ marginTop: 14, minHeight: 48 }} onClick={() => setReceipt(null)} data-testid="wallet-done">
                  {copy.wallet.done}
                </Press>
              </Glass>
            </motion.div>
          ) : registerCode ? (
            <motion.div
              key="register"
              className="pad"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              style={{ marginTop: 24 }}
            >
              <Glass lens style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }} data-testid="wallet-register">
                <div className="kicker">{copy.wallet.registerTitle} · {house}</div>
                <div style={{ fontSize: 14, color: "var(--smoke)", lineHeight: 1.4 }}>{copy.wallet.registerLead(money(amount))}</div>
                <div style={{ background: "#fff", padding: 12, borderRadius: 20 }}>
                  <Qr value={`libertario:topup:${registerCode}:${amount}`} size={170} />
                </div>
                <div className="serif" style={{ fontSize: 24, letterSpacing: 2 }} data-testid="wallet-register-code">{registerCode}</div>
                <div className="serif" style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{money(amount)}</div>
                <Press className="ink-button" style={{ minHeight: 48, width: "100%" }} onClick={registerConfirmed} data-testid="wallet-register-confirm">
                  {copy.wallet.registerConfirm}
                </Press>
                <button onClick={() => setRegisterCode(null)} style={{ fontSize: 14, color: "var(--smoke)" }} data-testid="wallet-register-cancel">
                  {copy.web.close}
                </button>
              </Glass>
            </motion.div>
          ) : (
            <motion.div key="form" className="pad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: 24 }}>
              <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>{copy.wallet.topUpTitle}</h2>

              {/* how: at the counter or from the phone */}
              <div className="kicker" style={{ marginTop: 14 }}>{copy.wallet.method}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                {(["register", "pse"] as const).map((option) => {
                  const selected = method === option;
                  return (
                    <Press key={option} quiet onClick={() => setMethod(option)} data-testid={`topup-${option}`} style={{ textAlign: "left" }}>
                      <Glass flat style={{ padding: 14, minHeight: 92, background: selected ? "rgba(122,67,40,0.12)" : "var(--cream)", outline: selected ? "1.5px solid var(--roast)" : "none" }}>
                        <div style={{ fontWeight: 500, fontSize: 15 }}>{option === "register" ? copy.wallet.atRegister : copy.wallet.digital}</div>
                        <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 4, lineHeight: 1.35 }}>{option === "register" ? copy.wallet.atRegisterHint : copy.wallet.digitalHint}</div>
                      </Glass>
                    </Press>
                  );
                })}
              </div>

              {/* amount */}
              <div className="kicker" style={{ marginTop: 18 }}>{copy.wallet.pickAmount}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {PRESETS.map((value) => {
                  const selected = !custom && preset === value;
                  return (
                    <Press
                      key={value}
                      quiet
                      onClick={() => {
                        haptics.select();
                        setCustom("");
                        setPreset(value);
                      }}
                      data-testid={`amount-${value}`}
                      aria-pressed={selected}
                      style={{ flex: 1 }}
                    >
                      <Glass
                        pill
                        dark={selected}
                        flat={!selected}
                        style={{ minHeight: 44, display: "grid", placeItems: "center", fontWeight: 500, fontSize: 15, fontVariantNumeric: "tabular-nums", background: selected ? undefined : "var(--cream)" }}
                      >
                        {money(value)}
                      </Glass>
                    </Press>
                  );
                })}
              </div>
              <Glass flat className="glass-field" style={{ marginTop: 10, borderRadius: 18, background: "rgba(246,241,234,0.7)", outline: custom && !enough ? "1.5px solid var(--roast)" : "none" }}>
                <label htmlFor="wallet-custom">{copy.wallet.custom}</label>
                <div className="row" style={{ gap: 6 }}>
                  <span className="serif" style={{ fontSize: 26, color: custom ? "var(--ink)" : "#b8b2ab" }}>$</span>
                  <input
                    id="wallet-custom"
                    inputMode="numeric"
                    placeholder={copy.wallet.customPlaceholder}
                    value={custom ? Number(custom).toLocaleString(market.locale) : ""}
                    onChange={(event) => setCustom(event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS))}
                    className="serif"
                    style={{ fontSize: 26 }}
                    data-testid="amount-custom"
                  />
                </div>
              </Glass>
              <div style={{ fontSize: 12, color: custom && !enough ? "var(--roast)" : "var(--smoke)", margin: "6px 4px 0" }}>{copy.wallet.minimum(money(MIN_TOP_UP))}</div>

              {method === "pse" ? (
                <>
                  {/* bank */}
                  <div className="kicker" style={{ marginTop: 18 }}>{copy.wallet.bank}</div>
                  <Press quiet onClick={() => setBankOpen(true)} data-testid="wallet-bank" style={{ width: "100%", textAlign: "left", marginTop: 10 }}>
                    <Glass flat style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, background: "var(--cream)" }}>
                      <BankMark name={bank} />
                      <div className="grow">
                        <div style={{ fontWeight: 500, fontSize: 15 }}>{bank ?? copy.wallet.chooseBank}</div>
                        <div style={{ fontSize: 12, color: "var(--smoke)" }}>{copy.wallet.viaPse}</div>
                      </div>
                      <span style={{ color: "var(--smoke)", fontSize: 20 }}>›</span>
                    </Glass>
                  </Press>

                  <Press className="ink-button" style={{ marginTop: 18 }} onClick={pay} disabled={!enough || flow !== null} data-testid="wallet-pay">
                    {enough ? `${copy.wallet.pay} · ${money(amount)}` : copy.wallet.pay}
                  </Press>
                  <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 10, lineHeight: 1.4 }} data-testid="wallet-demo-note">{copy.wallet.demoNote}</div>
                </>
              ) : (
                <>
                  <Press className="ink-button" style={{ marginTop: 18 }} onClick={showAtRegister} disabled={!enough} data-testid="wallet-show-register">
                    {enough ? `${copy.wallet.atRegister} · ${money(amount)}` : copy.wallet.atRegister}
                  </Press>
                  <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 10, lineHeight: 1.4 }} data-testid="wallet-register-note">{copy.wallet.atRegisterHint} {copy.wallet.earnsDouble}</div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* movements */}
        <div className="pad" style={{ marginTop: 26 }} data-testid="wallet-movements">
          <h2 className="serif" style={{ fontSize: 24, margin: "0 0 4px" }}>{copy.wallet.movementsTitle}</h2>
          {movements.length === 0 ? <div style={{ fontSize: 13, color: "var(--smoke)" }}>{copy.wallet.noMovements}</div> : null}
          {movements.map((entry) => (
            <div key={entry.id} className="row" style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <div className="grow">
                <div style={{ fontWeight: 500, fontSize: 15 }}>{entry.label}</div>
                <div style={{ fontSize: 13, color: "var(--smoke)" }}>{date(entry.date)} · {entry.reference}</div>
              </div>
              <div className="serif" style={{ fontSize: 18, color: entry.amount < 0 ? "var(--roast)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {entry.amount < 0 ? `−${money(-entry.amount)}` : `+${money(entry.amount)}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* simulated PSE: redirecting, bank approving, approved */}
      <AnimatePresence>
        {flow ? (
          <motion.div
            key="pse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            style={{ position: "absolute", inset: 0, zIndex: 45, background: "var(--white)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", textAlign: "center" }}
            data-testid="wallet-flow"
          >
            <div className="kicker">{copy.wallet.flowKicker} · {flow.bank}</div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="serif"
                style={{ fontSize: 30, marginTop: 8, lineHeight: 1.1 }}
                data-testid="wallet-stage"
              >
                {copy.wallet.stepTitles[stage] ?? ""}
              </motion.div>
            </AnimatePresence>

            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 }} style={{ marginTop: 26, width: "100%", maxWidth: 320 }}>
              <Glass lens style={{ padding: 18 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--smoke)" }}>{copy.wallet.amount}</span>
                  <span className="serif" style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{money(flow.amount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(27,22,18,0.08)", marginTop: 14, overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", background: "var(--roast)", transformOrigin: "left" }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (stage + 1) / STEPS }}
                    transition={{ type: "spring", stiffness: 110, damping: 20 }}
                  />
                </div>
                <div style={{ display: "flex", marginTop: 12 }}>
                  {copy.wallet.steps.map((label, i) => (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <motion.span
                        style={{ width: 18, height: 18, borderRadius: 9, border: "2px solid var(--roast)" }}
                        animate={{ background: stage >= i ? "#7a4328" : "#ffffff", scale: stage === i ? 1.25 : 1 }}
                        transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      />
                      <span style={{ fontSize: 11, color: stage >= i ? "var(--ink)" : "var(--smoke)" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </Glass>
            </motion.div>
            <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 18, maxWidth: 300, lineHeight: 1.4 }}>{copy.wallet.demoNote}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Sheet open={bankOpen} onClose={() => setBankOpen(false)} kicker={copy.wallet.flowKicker} title={copy.wallet.bankTitle}>
        <div style={{ fontSize: 14, color: "var(--smoke)", lineHeight: 1.4 }}>{copy.wallet.bankNote}</div>
        <div style={{ marginTop: 8 }}>
          {copy.wallet.banks.map((name) => {
            const selected = bank === name;
            return (
              <Press
                key={name}
                quiet
                className="row"
                style={{ width: "100%", textAlign: "left", padding: "12px 0", borderTop: "1px solid var(--line)" }}
                onClick={() => {
                  haptics.select();
                  setBank(name);
                  setBankOpen(false);
                }}
                data-testid={`bank-${slug(name)}`}
              >
                <BankMark name={name} />
                <span className="grow serif" style={{ fontSize: 19 }}>{name}</span>
                {selected ? <span style={{ fontSize: 13, color: "var(--roast)" }}>{copy.wallet.selected}</span> : null}
              </Press>
            );
          })}
        </div>
      </Sheet>
    </Screen>
  );
}

/** A bank's initial in a cream circle. No logos: this is a demo. */
function BankMark({ name }: { name: string | null }) {
  return (
    <span className="serif" style={{ width: 36, height: 36, borderRadius: 18, background: name ? "#fff" : "rgba(27,22,18,0.06)", display: "grid", placeItems: "center", fontSize: 17, color: "var(--roast)", flexShrink: 0 }}>
      {name ? name.slice(0, 1) : "?"}
    </span>
  );
}

function ReceiptLine({ label, value, testId, spaced }: { label: string; value: string; testId?: string; spaced?: boolean }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
      <span style={{ fontSize: 13, color: "var(--smoke)" }}>{label}</span>
      <span className="serif" style={{ fontSize: 17, letterSpacing: spaced ? 1.5 : 0 }} data-testid={testId}>{value}</span>
    </div>
  );
}
