import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { CORNERS, cornerPath } from "../core/corners";
import { BRAND, CLIPS } from "../core/photos";
import { useCopy, useLocale } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

/** The corners: one card per bar, each opening its own menu. */
export function CornersScreen() {
  const copy = useCopy();
  const { lang, setLang } = useLocale();
  const navigate = useNavigate();

  return (
    <Screen dark testId="corners">
      <LivingPhoto photo={CLIPS.roast!} radius={0} style={{ position: "absolute", inset: 0 }} interactive={false} drift={false}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,22,18,0.55), rgba(27,22,18,0.85) 45%, rgba(27,22,18,0.96))" }} />
      </LivingPhoto>
      <div className="scroll" style={{ position: "relative", padding: "calc(var(--sat) + 18px) 22px calc(var(--sab) + 28px)", color: "#fff", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <img src={BRAND.logoWhite} alt={copy.brand} style={{ height: 30, width: "auto" }} />
          <Glass dark pill flat style={{ padding: 3 }}>
            {(["es", "en"] as const).map((option) => (
              <button key={option} onClick={() => setLang(option)} data-testid={`lang-${option}`} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, background: lang === option ? "rgba(255,255,255,0.22)" : "transparent", color: "#fff" }}>
                {option.toUpperCase()}
              </button>
            ))}
          </Glass>
        </div>
        <div className="kicker" style={{ color: "rgba(255,255,255,0.7)", marginTop: 34 }}>{copy.corners.kicker}</div>
        <h1 className="serif" style={{ fontSize: 40, margin: "4px 0 0", lineHeight: 1 }}>{copy.corners.title}</h1>
        <div className="serif-italic" style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", marginTop: 8, maxWidth: 360 }}>{copy.corners.lead}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          {CORNERS.map((corner, i) => (
            <motion.div key={corner.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 240, damping: 26 }}>
              <Press quiet onClick={() => navigate(cornerPath(corner))} data-testid={`corner-${corner.id}`} style={{ width: "100%", textAlign: "left" }}>
                <Glass dark lens style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <img src={BRAND.isotipoWhite} alt="" style={{ width: 34, height: 34, opacity: 0.9 }} />
                  <div className="grow">
                    <div className="serif" style={{ fontSize: 22, lineHeight: 1.1 }}>{corner.name}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{copy.corners.at(corner.company)}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{copy.corners.open} →</span>
                </Glass>
              </Press>
            </motion.div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
