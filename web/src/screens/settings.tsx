import { useNavigate } from "react-router";

import { CITIES, type CityId } from "../core/catalog";
import { MARKETS, type MarketId } from "../core/market";
import { useCatalog, useCity } from "../state/catalog";
import { useCopy, useLocale } from "../i18n";
import { useAccount } from "../state/account";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

/** Language, country, city, and the way out. */
export function SettingsScreen() {
  const copy = useCopy();
  const { lang, setLang, market, setMarket, date } = useLocale();
  const { setCity } = useCity();
  const catalog = useCatalog();
  const { account, dispatch } = useAccount();
  const navigate = useNavigate();

  return (
    <Screen direction="up" testId="settings">
      <div className="pad pad-top row" style={{ justifyContent: "space-between" }}>
        <h1 className="serif" style={{ fontSize: 32, margin: 0 }}>{copy.settings.title}</h1>
        <button onClick={() => navigate(-1)} className="chip" style={{ background: "var(--cream)" }} data-testid="settings-close">{copy.web.close}</button>
      </div>
      <div className="scroll pad" style={{ paddingTop: 14, paddingBottom: 40 }}>
        {account ? (
          <Glass flat style={{ padding: 16, background: "var(--cream)", display: "flex", gap: 14, alignItems: "center" }}>
            {account.picture ? <img src={account.picture} alt="" width={48} height={48} style={{ borderRadius: 24 }} referrerPolicy="no-referrer" /> : <span className="serif" style={{ width: 48, height: 48, borderRadius: 24, background: "#fff", display: "grid", placeItems: "center", fontSize: 20, color: "var(--roast)" }}>{account.name.slice(0, 1)}</span>}
            <div>
              <div className="serif" style={{ fontSize: 20 }}>{account.name}</div>
              <div style={{ fontSize: 13, color: "var(--smoke)" }}>{account.email}</div>
              {account.createdAt ? <div style={{ fontSize: 12, color: "var(--smoke)" }}>{copy.web.memberSince(date(account.createdAt))}</div> : null}
            </div>
          </Glass>
        ) : null}

        <Section title={copy.market.language}>
          <Segmented
            options={[{ id: "es", label: copy.market.spanish }, { id: "en", label: copy.market.english }]}
            value={lang}
            onChange={(value) => setLang(value as "es" | "en")}
            testId="lang"
          />
        </Section>

        <Section title={copy.market.country}>
          <Segmented
            options={(Object.keys(MARKETS) as MarketId[]).map((id) => ({ id, label: MARKETS[id].country }))}
            value={market.id}
            onChange={(value) => setMarket(value as MarketId)}
            testId="market"
          />
          {!market.live ? <div style={{ fontSize: 13, color: "var(--smoke)", marginTop: 8 }}>{copy.market.soon}</div> : null}
        </Section>

        <Section title={copy.book.cover}>
          <Segmented
            options={CITIES.filter((city) => city.market === market.id || market.id === "CL").map((city) => ({ id: city.id, label: city.name }))}
            value={catalog.city.id}
            onChange={(value) => setCity(value as CityId)}
            testId="city"
          />
        </Section>

        {account ? (
          <Section title={copy.settings.account}>
            <div style={{ fontSize: 13, color: "var(--smoke)", marginBottom: 10 }}>{copy.settings.forgetHint}</div>
            <Press
              className="ghost-button"
              style={{ borderColor: "var(--roast)", color: "var(--roast)" }}
              onClick={() => {
                dispatch({ type: "forget" });
                navigate("/welcome", { replace: true });
              }}
              data-testid="forget"
            >
              {copy.settings.forget}
            </Press>
          </Section>
        ) : null}

        <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 30, textAlign: "center" }}>{copy.settings.version}</div>
      </div>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div className="kicker" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange, testId }: { options: { id: string; label: string }[]; value: string; onChange: (value: string) => void; testId: string }) {
  return (
    <Glass pill flat style={{ display: "flex", padding: 4, background: "var(--cream)" }}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          data-testid={`${testId}-${option.id}`}
          style={{ flex: 1, minHeight: 40, borderRadius: 999, fontWeight: 500, fontSize: 14, background: value === option.id ? "#fff" : "transparent", boxShadow: value === option.id ? "0 2px 10px -4px rgba(27,22,18,0.3)" : "none", transition: "background 0.2s" }}
        >
          {option.label}
        </button>
      ))}
    </Glass>
  );
}
