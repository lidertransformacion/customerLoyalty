import { STORES, storeName, type StoreId } from "@/src/data/program";
import { formatMeters } from "@/src/i18n/strings";

import { distanceMeters, geoById } from "../core/stores";
import { useCopy } from "../i18n";
import { useAccount } from "../state/account";
import { usePresence } from "../state/presence";
import { Press } from "../ui/press";
import { Sheet } from "../ui/sheet";

type Props = { open: boolean; onClose: () => void };

/** The houses, with the distance to each when location is on, and a way to simulate walking in. */
export function StorePicker({ open, onClose }: Props) {
  const copy = useCopy();
  const { account, dispatch } = useAccount();
  const presence = usePresence();
  const position = presence.position;

  return (
    <Sheet open={open} onClose={onClose} kicker={copy.stores.pickerKicker} title={copy.stores.pickerTitle}>
      <div style={{ fontSize: 14, color: "var(--smoke)", lineHeight: 1.4 }}>{copy.stores.pickerNote}</div>

      {presence.permission !== "granted" ? (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "var(--cream)" }}>
          <div style={{ fontWeight: 500 }}>{copy.presence.title}</div>
          <div style={{ fontSize: 13, color: "var(--smoke)", marginTop: 4, lineHeight: 1.4 }}>
            {presence.permission === "denied" ? copy.presence.denied : presence.permission === "unsupported" ? copy.presence.unsupported : copy.presence.ask}
          </div>
          {presence.permission === "idle" || presence.permission === "asking" ? (
            <Press className="ink-button" style={{ marginTop: 10, minHeight: 44 }} onClick={presence.ask} data-testid="presence-ask">
              {copy.presence.allow}
            </Press>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        {STORES.map((store) => {
          const geo = geoById(store.id);
          const meters = position ? distanceMeters(position, geo) : null;
          const selected = account?.storeId === store.id;
          const simulated = presence.simulated === store.id;
          return (
            <div key={store.id} className="row" style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <Press
                quiet
                className="grow"
                style={{ textAlign: "left" }}
                onClick={() => {
                  dispatch({ type: "chooseStore", storeId: store.id as StoreId });
                  onClose();
                }}
                data-testid={`store-${store.id}`}
              >
                <div className="serif" style={{ fontSize: 19 }}>{storeName(store.id)}</div>
                <div style={{ fontSize: 13, color: "var(--smoke)" }}>
                  {geo.address}
                  {meters !== null ? ` · ${formatMeters(meters)}` : ""}
                  {selected ? ` · ${copy.stores.selected}` : ""}
                </div>
              </Press>
              <button
                onClick={() => presence.simulate(simulated ? null : (store.id as StoreId))}
                className="chip"
                style={{ background: simulated ? "var(--ink)" : "var(--cream)", color: simulated ? "#fff" : "var(--ink)", fontSize: 12 }}
                data-testid={`simulate-${store.id}`}
                aria-label={copy.presence.simulate(storeName(store.id))}
              >
                {simulated ? copy.presence.stopSimulating : "📍"}
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 10, lineHeight: 1.4 }}>{copy.presence.demoNote}</div>
    </Sheet>
  );
}
