import { motion } from "motion/react";

import { haptics } from "../core/haptics";

/** A consent or permission row: a square that fills with ink, a sentence, an optional link and error. */
export function Check({
  label,
  checked,
  error,
  onChange,
  testId,
  link,
  hint,
}: {
  label: string;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  testId: string;
  link?: { href: string; label: string };
  hint?: string;
}) {
  return (
    <div>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => {
          haptics.tap();
          onChange(!checked);
        }}
        data-testid={testId}
        style={{ display: "flex", gap: 14, alignItems: "flex-start", textAlign: "left", width: "100%", padding: "12px 0" }}
      >
        <motion.span
          style={{ width: 26, height: 26, borderRadius: 9, border: `1.5px solid ${error ? "var(--roast)" : "var(--ink)"}`, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}
          animate={{ background: checked ? "#1b1612" : "rgba(27,22,18,0)" }}
        >
          <motion.svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M2.5 7.5 5.5 10.5 11.5 4" initial={false} animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ duration: 0.25 }} />
          </motion.svg>
        </motion.span>
        <span style={{ fontSize: 15, lineHeight: 1.4 }}>
          {label}
          {hint ? <span style={{ display: "block", fontSize: 12, color: "var(--smoke)", marginTop: 2 }}>{hint}</span> : null}
        </span>
      </button>
      {link ? (
        <a href={link.href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--roast)", fontWeight: 500, marginLeft: 40 }}>
          {link.label} ↗
        </a>
      ) : null}
      {error ? <div style={{ fontSize: 13, color: "var(--roast)", marginLeft: 40, marginTop: 4 }}>{error}</div> : null}
    </div>
  );
}
