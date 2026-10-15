import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { storeName } from "@/src/data/program";

import { GOOGLE_CLIENT_ID } from "../core/google";
import { readVisit } from "../core/market";
import { BRAND, photoSpec } from "../core/photos";
import { useCopy, useLocale } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

/** What a guest sees after scanning the QR: the pour, the logo, create an account or just look at the menu. */
export function Landing() {
  const copy = useCopy();
  const { lang, setLang, market } = useLocale();
  const navigate = useNavigate();
  const visit = readVisit();

  return (
    <Screen dark testId="landing">
      <LivingPhoto photo={photoSpec("filter.jpg")} radius={0} style={{ position: "absolute", inset: 0 }} interactive>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,22,18,0.55) 0%, rgba(27,22,18,0.15) 35%, rgba(27,22,18,0.35) 60%, rgba(27,22,18,0.96) 100%)" }} />
      </LivingPhoto>

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", width: "100%", maxWidth: 560, margin: "0 auto", padding: "calc(var(--sat) + 18px) 22px calc(var(--sab) + 22px)", color: "#fff" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="kicker" style={{ color: "rgba(255,255,255,0.75)" }}>{market.id === "CL" ? copy.market.chile : copy.market.colombia}</div>
          <Glass dark pill flat style={{ padding: 3 }}>
            {(["es", "en"] as const).map((option) => (
              <button key={option} onClick={() => setLang(option)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, background: lang === option ? "rgba(255,255,255,0.22)" : "transparent", color: "#fff" }} data-testid={`lang-${option}`}>
                {option.toUpperCase()}
              </button>
            ))}
          </Glass>
        </div>

        <motion.div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-start", paddingBottom: 18 }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 160, damping: 22 }}>
          <img src={BRAND.logoWhite} alt={copy.brand} style={{ width: "min(78%, 320px)", height: "auto", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }} data-testid="landing-logo" />
          <div className="kicker" style={{ color: "rgba(255,255,255,0.7)", marginTop: 18 }}>{copy.landing.kicker}</div>
          <div className="serif-italic" style={{ fontSize: 20, lineHeight: 1.3, marginTop: 6, color: "rgba(255,255,255,0.92)", maxWidth: 340 }}>{copy.landing.lead}</div>
          {visit.storeId || visit.table ? (
            <Glass dark pill style={{ marginTop: 14, padding: "10px 18px", fontSize: 14 }} data-testid="visit-chip">
              {visit.table ? copy.landing.scanned(storeName(visit.storeId ?? "calle-93"), visit.table) : copy.landing.atStore(storeName(visit.storeId ?? "calle-93"))}
            </Glass>
          ) : null}
        </motion.div>

        <motion.div style={{ display: "flex", flexDirection: "column", gap: 10 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 160, damping: 22 }}>
          <Press className="ink-button" style={{ background: "#fff", color: "var(--ink)" }} onClick={() => navigate("/signup")} data-testid="landing-signup">
            {GOOGLE_CLIENT_ID ? copy.landing.google : copy.landing.email}
          </Press>
          {GOOGLE_CLIENT_ID ? (
            <Press className="ghost-button" style={{ borderColor: "rgba(255,255,255,0.45)", color: "#fff" }} onClick={() => navigate("/signup?via=email")}>{copy.landing.email}</Press>
          ) : null}
          <Press className="ghost-button" style={{ borderColor: "rgba(255,255,255,0.45)", color: "#fff", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }} onClick={() => navigate("/menu")} data-testid="landing-menu">{copy.landing.viewMenu}</Press>
        </motion.div>
      </div>
    </Screen>
  );
}
