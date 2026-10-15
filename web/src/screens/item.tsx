import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";

import { catalogFor, translateCatalog } from "../core/catalog";
import { cornerById, cornerCatalog } from "../core/corners";

import { pointsForPrice } from "@/src/data/program";

import { menuOnly } from "../core/mode";
import { visualFor } from "../core/visuals";
import { useCopy, useLocale } from "../i18n";
import { LivingPhoto } from "../motion/living-photo";
import { Product } from "../motion/product";
import { useAccount } from "../state/account";
import { useCatalog } from "../state/catalog";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

/** One product. The photograph lives: it pours, sweats cold, steams or fizzes. Packs float in 3D. */
export function ItemScreen() {
  const copy = useCopy();
  const { money } = useLocale();
  const navigate = useNavigate();
  const { id, corner: cornerParam } = useParams();
  const { lang } = useLocale();
  const cityCatalog = useCatalog();
  const corner = cornerById(cornerParam);
  const catalog = corner ? cornerCatalog(translateCatalog(catalogFor(corner.cityId), lang), corner) : cityCatalog;
  const { account, dispatch } = useAccount();
  const item = catalog.items.find((entry) => entry.id === id);

  if (!item) {
    return (
      <Screen testId="item">
        <div className="pad pad-top">
          <div className="serif-italic" style={{ fontSize: 18 }}>{copy.menu.missingItem}</div>
          <button onClick={() => navigate(-1)} className="chip" style={{ marginTop: 12, background: "var(--cream)" }}>{copy.back}</button>
        </div>
      </Screen>
    );
  }

  const category = catalog.categories.find((c) => c.id === item.category);
  const visual = visualFor(item);
  const pairing = item.description.match(/(?:Maridaje|Pairing):\s*(.+?)\.?$/)?.[1];
  const inOrder = account?.order.find((line) => line.itemId === item.id)?.quantity ?? 0;
  const points = pointsForPrice(item.price);
  const dark = visual.kind === "photo";

  return (
    <Screen direction="up" testId="item" className="full">
      <div className="scroll" style={{ paddingBottom: 140 }}>
        <div style={{ position: "relative", height: visual.kind === "photo" ? "58dvh" : "50dvh", minHeight: 360, maxHeight: 620 }}>
          {visual.kind === "photo" ? (
            <LivingPhoto photo={visual.photo} radius={0} style={{ position: "absolute", inset: 0 }} testId={`living-${visual.photo.mood}`}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,22,18,0.35), rgba(27,22,18,0) 30%, rgba(27,22,18,0) 70%, rgba(255,255,255,1) 100%)" }} />
            </LivingPhoto>
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 50% 40%, #f6f1ea, #fff)", display: "grid", placeItems: "center", paddingTop: "var(--sat)" }}>
              <Product src={visual.src} size={Math.min(300, window.innerWidth * 0.7)} testId="product-3d" />
            </div>
          )}
          <button onClick={() => navigate(-1)} aria-label={copy.back} data-testid="item-back" style={{ position: "absolute", top: "calc(var(--sat) + 14px)", left: 16, zIndex: 2 }}>
            <Glass pill lens dark={dark} style={{ width: 44, height: 44, display: "grid", placeItems: "center", fontSize: 20 }}>←</Glass>
          </button>
        </div>

        <div className="pad" style={{ marginTop: -40, position: "relative", maxWidth: 760, marginLeft: "auto", marginRight: "auto", width: "100%" }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.1 }}>
            <Glass strong lens style={{ padding: 20, borderRadius: 28 }}>
              <div className="kicker">{category?.name}</div>
              <h1 className="serif" style={{ fontSize: 32, margin: "4px 0 0", lineHeight: 1.05 }}>{item.name}</h1>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {item.vegan ? <span className="chip" style={{ background: "rgba(111,143,75,0.14)", color: "var(--matcha)", minHeight: 30, fontSize: 12 }}>🌱 {copy.menu.plant}</span> : null}
                {item.nuts ? <span className="chip" style={{ background: "rgba(122,67,40,0.12)", color: "var(--roast)", minHeight: 30, fontSize: 12 }}>🥜</span> : null}
                {item.profile ? <span className="chip" style={{ background: "var(--cream)", minHeight: 30, fontSize: 12 }}>{item.profile}</span> : null}
                {visual.kind === "photo" && visual.photo.mood === "cold" ? <span className="chip" style={{ background: "rgba(120,180,255,0.18)", color: "#2a5a9a", minHeight: 30, fontSize: 12 }}>❄︎</span> : null}
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.45, margin: "14px 0 0" }}>{item.description.replace(/\s*(?:Maridaje|Pairing):.*$/, "")}</p>
              {pairing ? (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "var(--cream)", fontSize: 14 }}>
                  <span className="kicker" style={{ display: "block", marginBottom: 2 }}>{copy.book.pairing}</span>
                  {pairing}
                </div>
              ) : null}
              <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
                <div className="serif" style={{ fontSize: 30 }}>{money(item.price)}</div>
                {!menuOnly ? <div style={{ textAlign: "right", fontSize: 13, color: "var(--roast)", maxWidth: 170, lineHeight: 1.3 }}>{copy.menu.earnsAtCounter(points)}</div> : null}
              </div>
            </Glass>
          </motion.div>
          {!menuOnly ? <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 12, textAlign: "center" }}>{copy.menu.notCharged}</div> : null}
        </div>
      </div>

      <div className="dock" style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px calc(var(--sab) + 16px)", background: "linear-gradient(180deg, rgba(255,255,255,0), #fff 40%)", display: "flex", gap: 10 }}>
        {menuOnly ? (
          <Press className="ink-button" onClick={() => navigate(-1)} data-testid="item-back-bottom">{copy.back}</Press>
        ) : account ? (
          <>
            <Press className="ink-button" onClick={() => dispatch({ type: "addToTable", itemId: item.id })} data-testid="item-add">
              {copy.menu.addToTable}
              {inOrder ? <span style={{ background: "#fff", color: "var(--ink)", borderRadius: 999, padding: "2px 9px", fontSize: 13 }}>{inOrder}</span> : null}
            </Press>
            <Press className="ghost-button" style={{ width: "auto", padding: "0 18px" }} onClick={() => navigate("/table")} aria-label={copy.order.title} data-testid="item-go-order">→</Press>
          </>
        ) : (
          <Press className="ink-button" onClick={() => navigate("/signup")} data-testid="item-signup">{copy.order.createAccount}</Press>
        )}
      </div>
    </Screen>
  );
}
