import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

import { areasBySite, type OrderProblem } from "../core/sura";
import { useCopy, useLocale } from "../i18n";
import { Stepper } from "../sheets/sura-add";
import { useSura } from "../state/sura";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";
import { useBack } from "../ui/use-back";

import "./sura.css";

/**
 * The order at Sura, on one screen and in three steps anyone can follow: what you
 * picked, where you are, your ID number. Then one button. What is missing is said
 * in plain words next to where it goes.
 */
export function SuraOrderScreen() {
  const copy = useCopy();
  const { lang } = useLocale();
  const navigate = useNavigate();
  const back = useBack("/");
  const { lines, change, area, setArea, cedula, setCedula, problem, sending, failed, sent, send, finish } = useSura();
  const [nudge, setNudge] = useState<OrderProblem | null>(null);
  const areaStep = useRef<HTMLElement>(null);
  const cedulaField = useRef<HTMLInputElement>(null);

  if (sent) {
    return (
      <Screen testId="sura-sent" direction="up" className="full su-screen">
        <div className="scroll su-sent">
          <motion.div className="su-check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }} />
            </svg>
          </motion.div>
          <h1 className="su-sent-title">{copy.sura.sentTitle}</h1>
          <p className="su-sent-body">{copy.sura.sentBody}</p>
          <Glass strong className="su-ticket">
            <span className="su-ticket-label">{copy.sura.sentNumber}</span>
            <span className="su-ticket-number" data-testid="sura-number">#{sent.number}</span>
            <ul>
              {sent.lines.map((line) => (
                <li key={line.key}>
                  <strong>{line.quantity} ×</strong> {line.name}
                  {line.detail ? <span>{line.detail}</span> : null}
                </li>
              ))}
            </ul>
            <span className="su-ticket-area">{copy.sura.sentArea(sent.area)}</span>
          </Glass>
        </div>
        <div className="dock su-dock">
          <Press
            className="su-send"
            onClick={() => {
              finish();
              navigate("/", { replace: true });
            }}
            data-testid="sura-done"
          >
            {copy.sura.done}
          </Press>
        </div>
      </Screen>
    );
  }

  const onSend = () => {
    if (problem === "area") {
      setNudge("area");
      areaStep.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (problem === "cedula") {
      setNudge("cedula");
      cedulaField.current?.focus();
      cedulaField.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setNudge(null);
    void send();
  };

  return (
    <Screen testId="sura-order" direction="up" className="full su-screen">
      <header className="su-head">
        <Press className="su-back" onClick={() => back()} aria-label={copy.back} data-testid="sura-back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Press>
        <h1>{copy.sura.title}</h1>
      </header>

      {lines.length === 0 ? (
        <div className="scroll su-empty" data-testid="sura-empty">
          <p className="su-empty-title">{copy.sura.empty}</p>
          <p>{copy.sura.emptyHint}</p>
          <Press className="su-send" onClick={() => navigate("/", { replace: true })} data-testid="sura-to-menu">
            {copy.sura.goToMenu}
          </Press>
        </div>
      ) : (
        <>
          <div className="scroll su-body">
            <section className="su-stepbox">
              <h2>{copy.sura.stepOrder}</h2>
              <Glass strong className="su-lines">
                {lines.map((line) => (
                  <div key={line.key} className="su-line" data-testid={`sura-line-${line.id}`}>
                    <div className="su-line-text">
                      <span className="su-line-name">{line.name}</span>
                      {line.detail ? <span className="su-line-detail">{line.detail}</span> : null}
                    </div>
                    <Stepper quantity={line.quantity} name={line.name} onLess={() => change(line.key, -1)} onMore={() => change(line.key, 1)} testId={line.key} />
                  </div>
                ))}
              </Glass>
              <Press className="su-more" onClick={() => navigate("/", { replace: true })} data-testid="sura-add-more">
                + {copy.sura.addMore}
              </Press>
            </section>

            <section className={`su-stepbox${nudge === "area" && !area ? " nudge" : ""}`} ref={areaStep}>
              <h2>{copy.sura.stepArea}</h2>
              <div className="su-sites" role="radiogroup" aria-label={copy.sura.stepArea}>
                {areasBySite().map((group) => (
                  <div key={group.site} className="su-site">
                    <h3>{group.site}</h3>
                    <div className="su-areas">
                      {group.areas.map((option) => (
                        <Press key={option.id} className={`su-area${area?.id === option.id ? " on" : ""}`} role="radio" aria-checked={area?.id === option.id} onClick={() => setArea(option)} data-testid={`sura-area-${option.id}`}>
                          {lang === "en" ? option.serviceEn : option.service}
                        </Press>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {nudge === "area" && !area ? <p className="su-missing" role="alert">{copy.sura.missingArea}</p> : null}
            </section>

            <section className={`su-stepbox${nudge === "cedula" && problem === "cedula" ? " nudge" : ""}`}>
              <h2>
                <label htmlFor="sura-cedula">{copy.sura.stepCedula}</label>
              </h2>
              <Glass strong className="su-cedula">
                <input
                  id="sura-cedula"
                  ref={cedulaField}
                  value={cedula}
                  onChange={(event) => setCedula(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder={copy.sura.cedulaPlaceholder}
                  data-testid="sura-cedula"
                />
              </Glass>
              {nudge === "cedula" && problem === "cedula" ? <p className="su-missing" role="alert">{copy.sura.missingCedula}</p> : <p className="su-hint">{copy.sura.cedulaHint}</p>}
              <p className="su-why">{copy.sura.cedulaWhy}</p>
            </section>
          </div>

          <div className="dock su-dock">
            {failed ? <p className="su-failed" role="alert" data-testid="sura-failed">{copy.sura.failed}</p> : null}
            <Press className="su-send" onClick={onSend} disabled={sending} data-testid="sura-send">
              {sending ? copy.sura.sending : copy.sura.send}
            </Press>
          </div>
        </>
      )}
    </Screen>
  );
}
