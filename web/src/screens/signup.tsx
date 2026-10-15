import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import type { Signup } from "../core/account";
import { GOOGLE_CLIENT_ID, renderGoogleButton, type GoogleProfile } from "../core/google";
import { haptics } from "../core/haptics";
import { isAdult } from "../core/market";
import { useCopy, useLocale } from "../i18n";
import { useAccount } from "../state/account";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

type Form = {
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  birthday: string;
  adult: boolean;
  data: boolean;
  terms: boolean;
  marketing: boolean;
};

const EMPTY: Form = { name: "", email: "", phone: "", idNumber: "", birthday: "", adult: false, data: false, terms: false, marketing: false };

type Errors = Partial<Record<keyof Form, string>>;

/** Three steps: who you are, how we reach you, what you accept. Google fills the first one. */
export function SignupScreen() {
  const copy = useCopy();
  const { market, lang } = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { dispatch } = useAccount();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [google, setGoogle] = useState<GoogleProfile | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBox = useRef<HTMLDivElement>(null);
  const viaEmail = params.get("via") === "email";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || viaEmail || !googleBox.current) return;
    let alive = true;
    void renderGoogleButton(googleBox.current, lang, (profile) => {
      if (!alive) return;
      setGoogle(profile);
      setForm((previous) => ({ ...previous, name: profile.name, email: profile.email }));
      haptics.success();
    }).then((ok) => alive && setGoogleReady(ok));
    return () => {
      alive = false;
    };
  }, [lang, viaEmail]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const validate = (which: number): Errors => {
    const found: Errors = {};
    if (which === 0) {
      if (form.name.trim().length < 2) found.name = copy.signup.nameError;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = copy.signup.emailError;
    }
    if (which === 1) {
      if (!market.phonePattern.test(form.phone.trim())) found.phone = copy.signup.phoneError;
      if (!market.idPattern.test(form.idNumber.trim())) found.idNumber = market.id === "CL" ? copy.legal.rutError : copy.signup.idError;
      if (!form.birthday) found.birthday = copy.legal.birthdayError;
      else if (!isAdult(form.birthday, new Date())) found.birthday = copy.legal.underage;
    }
    if (which === 2) {
      if (!form.adult) found.adult = copy.legal.required;
      if (!form.data) found.data = copy.legal.required;
      if (!form.terms) found.terms = copy.legal.required;
    }
    return found;
  };

  const next = () => {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      haptics.warn();
      return;
    }
    if (step < 2) {
      setDirection(1);
      setStep(step + 1);
      return;
    }
    const signup: Signup = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      idNumber: form.idNumber,
      birthday: form.birthday,
      consent: { adult: form.adult, data: form.data, terms: form.terms, marketing: form.marketing },
      provider: google ? "google" : "email",
      ...(google?.picture ? { picture: google.picture } : {}),
      market: market.id,
    };
    dispatch({ type: "signUp", signup });
    navigate("/home", { replace: true });
  };

  const back = () => {
    if (step === 0) {
      navigate(-1);
      return;
    }
    setDirection(-1);
    setStep(step - 1);
  };

  const titles = [copy.legal.identity, copy.legal.contact, copy.legal.consent];

  return (
    <Screen direction="right" testId="signup">
      <div className="pad pad-top" style={{ paddingBottom: 8 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <button onClick={back} className="chip" style={{ paddingLeft: 0 }} aria-label={copy.legal.back} data-testid="signup-back">
            ← {copy.legal.back}
          </button>
          <span className="kicker">{copy.legal.step(step + 1, 3)}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}
            >
              <motion.div
                style={{ height: "100%", background: "var(--roast)", transformOrigin: "left" }}
                initial={false}
                animate={{ scaleX: i < step ? 1 : i === step ? 1 : 0, opacity: i <= step ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </motion.div>
          ))}
        </div>
        <h1 className="serif" style={{ fontSize: 38, margin: "16px 0 0", lineHeight: 1 }}>{titles[step]}</h1>
      </div>

      <div className="scroll pad" style={{ paddingBottom: 140 }}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}
          >
            {step === 0 ? (
              <>
                {GOOGLE_CLIENT_ID && !viaEmail ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div ref={googleBox} style={{ minHeight: 44, width: "100%", display: "flex", justifyContent: "center" }} />
                    {!googleReady ? <div style={{ fontSize: 13, color: "var(--smoke)" }}>{copy.landing.noGoogle}</div> : null}
                  </div>
                ) : null}
                {google ? (
                  <Glass flat style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    {google.picture ? <img src={google.picture} alt={copy.legal.picture} width={40} height={40} style={{ borderRadius: 20 }} /> : null}
                    <div style={{ fontSize: 13, color: "var(--smoke)" }}>{copy.legal.fromGoogle}</div>
                  </Glass>
                ) : null}
                <Field label={copy.signup.name} value={form.name} error={errors.name} onChange={(v) => set("name", v)} autoComplete="name" testId="signup-name" />
                <Field label={copy.signup.email} value={form.email} error={errors.email} onChange={(v) => set("email", v)} type="email" autoComplete="email" testId="signup-email" />
                <div style={{ fontSize: 13, color: "var(--smoke)", lineHeight: 1.4 }}>{copy.signup.lead}</div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Field label={copy.legal.phoneFor(market.phonePrefix)} value={form.phone} error={errors.phone} onChange={(v) => set("phone", v)} type="tel" autoComplete="tel-national" inputMode="numeric" testId="signup-phone" />
                <Field
                  label={market.id === "CL" ? copy.legal.rut : copy.signup.idNumber}
                  hint={copy.legal.idFor(market.country)}
                  value={form.idNumber}
                  error={errors.idNumber}
                  onChange={(v) => set("idNumber", v)}
                  inputMode={market.id === "CL" ? "text" : "numeric"}
                  testId="signup-id"
                />
                <Field label={copy.legal.birthday} hint={copy.legal.birthdayHint} value={form.birthday} error={errors.birthday} onChange={(v) => set("birthday", v)} type="date" testId="signup-birthday" />
                <div style={{ fontSize: 13, color: "var(--smoke)", lineHeight: 1.4 }}>{copy.signup.footnote}</div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Check label={copy.legal.adult} checked={form.adult} error={errors.adult} onChange={(v) => set("adult", v)} testId="consent-adult" />
                <Check label={copy.legal.data(market.dataLaw)} checked={form.data} error={errors.data} onChange={(v) => set("data", v)} testId="consent-data" link={{ href: market.policyUrl, label: copy.legal.policy }} />
                <Check label={copy.legal.terms} checked={form.terms} error={errors.terms} onChange={(v) => set("terms", v)} testId="consent-terms" />
                <Check label={copy.legal.marketing} checked={form.marketing} onChange={(v) => set("marketing", v)} testId="consent-marketing" />
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="dock" style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px calc(var(--sab) + 16px)", background: "linear-gradient(180deg, rgba(255,255,255,0), #fff 40%)" }}>
        <Press className="ink-button" onClick={next} data-testid="signup-next">
          {step < 2 ? copy.legal.next : copy.signup.submit}
        </Press>
      </div>
    </Screen>
  );
}

function Field({
  label,
  hint,
  value,
  error,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  testId,
}: {
  label: string;
  hint?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
  testId: string;
}) {
  return (
    <div>
      <Glass flat className="glass-field" style={{ borderRadius: 18, background: "rgba(246,241,234,0.7)", outline: error ? "1.5px solid var(--roast)" : "none" }}>
        <label htmlFor={testId}>{label}</label>
        <input id={testId} value={value} onChange={(event) => onChange(event.target.value)} type={type} inputMode={inputMode} autoComplete={autoComplete} data-testid={testId} />
      </Glass>
      {hint && !error ? <div style={{ fontSize: 12, color: "var(--smoke)", margin: "6px 4px 0" }}>{hint}</div> : null}
      {error ? <div style={{ fontSize: 13, color: "var(--roast)", margin: "6px 4px 0" }}>{error}</div> : null}
    </div>
  );
}

function Check({
  label,
  checked,
  error,
  onChange,
  testId,
  link,
}: {
  label: string;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  testId: string;
  link?: { href: string; label: string };
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
        <span style={{ fontSize: 15, lineHeight: 1.4 }}>{label}</span>
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
