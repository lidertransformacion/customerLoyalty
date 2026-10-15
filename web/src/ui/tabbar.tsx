import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";

import { haptics } from "../core/haptics";
import { useCopy } from "../i18n";
import { Glass } from "./glass";

const PLACES = [
  { to: "/home", key: "home", icon: HouseIcon },
  { to: "/menu", key: "menu", icon: BookIcon },
  { to: "/table", key: "table", icon: TableIcon },
] as const;

export function TabBar() {
  const copy = useCopy();
  const location = useLocation();
  const navigate = useNavigate();
  const active = PLACES.findIndex((place) => location.pathname.startsWith(place.to));
  if (active < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(560px, 100%)",
        bottom: 0,
        padding: `0 ${18}px calc(var(--sab) + 12px)`,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <Glass pill lens style={{ pointerEvents: "auto" }}>
        <div style={{ display: "flex", position: "relative", padding: 6 }} role="tablist">
          {PLACES.map((place, index) => {
            const Icon = place.icon;
            const selected = index === active;
            return (
              <button
                key={place.to}
                role="tab"
                aria-selected={selected}
                data-testid={`place-${place.to.slice(1)}`}
                onClick={() => {
                  if (selected) return;
                  haptics.select();
                  navigate(place.to);
                }}
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 50,
                  borderRadius: 999,
                  color: selected ? "var(--ink)" : "var(--smoke)",
                  fontWeight: selected ? 500 : 400,
                  fontSize: 15,
                }}
              >
                {selected ? (
                  <motion.span
                    layoutId="tab-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 999,
                      background: "rgba(122,67,40,0.12)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                    }}
                  />
                ) : null}
                <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon active={selected} />
                  {copy.tabs[place.key]}
                </span>
              </button>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

function HouseIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5c-1.6-1.4-3.8-1.8-7-1.5v13c3.2-.3 5.4.1 7 1.5 1.6-1.4 3.8-1.8 7-1.5V5c-3.2-.3-5.4.1-7 1.5Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

function TableIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="8" rx="8" ry="3" />
      <path d="M6 10.5V18M18 10.5V18M4 18h4M16 18h4" />
    </svg>
  );
}
