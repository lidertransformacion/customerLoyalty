import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import type { MenuItem } from "@/src/data/menu";

import { photoSpec } from "../core/photos";
import { comboById, picksComplete, type Picks, type SuraCombo } from "../core/sura";
import { useCopy, useLocale } from "../i18n";
import { useSura } from "../state/sura";
import { Press } from "../ui/press";
import { Sheet } from "../ui/sheet";

import "../screens/sura.css";

const PLUS = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
const CHECK = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const TRASH = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>;

/** The bin that takes a combo out of the order. */
export function RemoveButton({ lineKey: key, name, testId }: { lineKey: string; name: string; testId: string }) {
  const copy = useCopy();
  const { remove } = useSura();
  return (
    <Press className="su-trash" onClick={() => remove(key)} aria-label={copy.sura.removeOne(name)} data-no-turn="true" data-testid={`sura-remove-${testId}`}>
      {TRASH}
    </Press>
  );
}

/**
 * How a combo gets into the order: one button that says «Agregar». The order holds one combo, once, so there
 * is no counting: a combo with choices opens the chooser, one without goes straight in, and choosing another
 * replaces it. Once it is in, the button says so and a bin takes it out. `big` is the one on the combo's page.
 */
export function AddControl({ item, big = false }: { item: MenuItem; big?: boolean }) {
  const copy = useCopy();
  const { cart, add, choose } = useSura();
  const combo = comboById(item.id);
  if (!combo) return null;
  const line = cart.find((entry) => entry.comboId === combo.id);

  if (line) {
    return (
      <div className={`su-in${big ? " big" : ""}`} data-no-turn="true" data-testid={`sura-in-${combo.id}`}>
        {/* a card is narrow: there it says «Agregado»; the combo's own page has room for the tick and the whole phrase */}
        <span>
          {big ? CHECK : null}
          {big ? copy.sura.added : copy.sura.addedShort}
        </span>
        <RemoveButton lineKey={line.key} name={item.name} testId={combo.id} />
      </div>
    );
  }
  return (
    <Press className={`su-add${big ? " big" : ""}`} onClick={() => (combo.choices.length === 0 ? add(combo.id, {}) : choose(combo.id))} data-no-turn="true" data-testid={`sura-add-${combo.id}`}>
      {PLUS}
      {big ? copy.sura.addToOrder : copy.sura.add}
    </Press>
  );
}

/**
 * What a combo asks before it goes in: one group per choice, each option a big button with its photograph.
 * «Agregar a mi pedido» waits until every group has one.
 */
export function ComboChooser() {
  const copy = useCopy();
  const { lang } = useLocale();
  const { choosing, closeChooser, add } = useSura();
  const [picks, setPicks] = useState<Picks>({});
  const [nudge, setNudge] = useState(false);
  // the sheet keeps showing the combo while it slides away
  const [shown, setShown] = useState<SuraCombo | null>(null);
  useEffect(() => {
    if (!choosing) return;
    setShown(choosing);
    setPicks({});
    setNudge(false);
  }, [choosing]);

  const combo = choosing ?? shown;
  const english = lang === "en";
  const ready = combo ? picksComplete(combo, picks) : false;
  return (
    <Sheet open={!!choosing} onClose={closeChooser} title={combo ? (english ? combo.nameEn : combo.name) : undefined}>
      {combo ? (
        <div className="su-chooser" data-testid="sura-chooser">
          {combo.choices.map((choice) => (
            <section key={choice.id} className={nudge && !picks[choice.id] ? "nudge" : undefined}>
              <h3>{english ? choice.titleEn : choice.title}</h3>
              <div className="su-options" role="radiogroup" aria-label={english ? choice.titleEn : choice.title}>
                {choice.options.map((option) => {
                  const on = picks[choice.id] === option.id;
                  return (
                    <Press key={option.id} className={`su-option${on ? " on" : ""}`} role="radio" aria-checked={on} onClick={() => setPicks((current) => ({ ...current, [choice.id]: option.id }))} data-testid={`sura-pick-${choice.id}-${option.id}`}>
                      <img src={photoSpec(option.photo).src} alt="" decoding="async" />
                      <span>{english ? option.nameEn : option.name}</span>
                    </Press>
                  );
                })}
              </div>
            </section>
          ))}
          {nudge && !ready ? <p className="su-missing" role="alert">{copy.sura.pickAll}</p> : null}
          <Press
            className={`su-send${ready ? "" : " waiting"}`}
            onClick={() => {
              if (!ready) {
                setNudge(true);
                return;
              }
              add(combo.id, picks);
              closeChooser();
            }}
            data-testid="sura-chooser-add"
          >
            {copy.sura.addToOrder}
          </Press>
        </div>
      ) : null}
    </Sheet>
  );
}

/** The order, always one tap away: it rises from the foot of the menu as soon as something is in it. */
export function CartBar() {
  const copy = useCopy();
  const navigate = useNavigate();
  const { count } = useSura();

  // the sheets leave room at their foot while the bar is up
  useEffect(() => {
    document.documentElement.classList.toggle("sura-cart", count > 0);
    return () => document.documentElement.classList.remove("sura-cart");
  }, [count]);

  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div className="su-bar" initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}>
          <Press className="su-bar-button" onClick={() => navigate("/pedido")} data-testid="sura-cart">
            <motion.span key={count} className="su-bar-count" initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
              {count}
            </motion.span>
            <span className="su-bar-label">{copy.sura.seeOrder}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Press>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
