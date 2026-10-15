import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { BRAND, CLIPS } from "../core/photos";
import { LivingPhoto } from "../motion/living-photo";
import { useCopy } from "../i18n";
import { Roast } from "../motion/roast";
import { useAccount } from "../state/account";
import { Screen } from "../ui/screen";

/** The roast plays once under the logo, then the house opens. */
export function Opening() {
  const copy = useCopy();
  const navigate = useNavigate();
  const { ready, account } = useAccount();

  return (
    <Screen dark testId="opening">
      <LivingPhoto photo={CLIPS.roast!} radius={0} style={{ position: "absolute", inset: 0 }} interactive={false} drift={false}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 50% 45%, rgba(27,22,18,0.25), rgba(27,22,18,0.8))" }} />
      </LivingPhoto>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: "var(--sat)" }}>
        <motion.img
          src={BRAND.logoWhite}
          alt={copy.brand}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "min(70%, 300px)", height: "auto" }}
        />
        <div className="serif-italic" style={{ color: "#c9b9a8", fontSize: 16, marginTop: 2 }}>{copy.roastLine}</div>
        <div style={{ marginTop: 18 }}>
          <Roast
            onDone={() => {
              if (!ready) {
                window.setTimeout(() => navigate(account ? "/home" : "/welcome", { replace: true }), 200);
                return;
              }
              navigate(account ? "/home" : "/welcome", { replace: true });
            }}
          />
        </div>
      </div>
    </Screen>
  );
}
