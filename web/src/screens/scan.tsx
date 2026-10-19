import { BRAND, CLIPS } from "../core/photos";
import { useCopy } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Screen } from "../ui/screen";

/** What the root of the corners build shows: no menu, just the logo and the instruction to scan. */
export function ScanScreen() {
  const copy = useCopy();
  return (
    <Screen dark testId="scan">
      <LivingPhoto photo={CLIPS.roast!} radius={0} style={{ position: "absolute", inset: 0 }} interactive={false} drift={false}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 50% 45%, rgba(27,22,18,0.3), rgba(27,22,18,0.9))" }} />
      </LivingPhoto>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "calc(var(--sat) + 24px) 28px calc(var(--sab) + 28px)", color: "#fff", gap: 14 }}>
        <img src={BRAND.logoWhite} alt={copy.brand} style={{ width: "min(70%, 300px)", height: "auto", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }} />
        <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.6)", margin: "8px 0" }} />
        <div className="kicker" style={{ color: "rgba(255,255,255,0.7)" }}>{copy.corners.kicker}</div>
        <h1 className="serif" style={{ fontSize: 30, margin: 0, lineHeight: 1.1, maxWidth: 320 }}>{copy.corners.scanTitle}</h1>
        <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.8)", maxWidth: 300, lineHeight: 1.45 }}>{copy.corners.scanLead}</p>
      </div>
    </Screen>
  );
}
