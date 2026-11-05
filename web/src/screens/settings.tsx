import { useState } from "react";
import { useNavigate } from "react-router";

import { lealToPoints } from "@/src/data/program";

import { type Account, type Channel } from "../core/account";
import { CITIES, type CityId } from "../core/catalog";
import { haptics } from "../core/haptics";
import { MARKETS, type MarketId } from "../core/market";
import { useCatalog, useCity } from "../state/catalog";
import { useCopy, useLocale } from "../i18n";
import { useAccount } from "../state/account";
import { Check } from "../ui/check";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";

const CHANNELS: Channel[] = ["whatsapp", "email", "sms"];
const MAX_LEAL_DIGITS = 7;

/** The guest's own copy of the account, as a file. Nothing leaves the phone. */
function download(account: Account): void {
  const blob = new Blob([JSON.stringify(account, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "brujula-libertario.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Language, country, city, the permissions, the Leal balance, and the way out. */
export function SettingsScreen() {
  const copy = useCopy();
  const { lang, setLang, market, setMarket, date, money } = useLocale();
  const { setCity } = useCity();
  const catalog = useCatalog();
  const { account, dispatch } = useAccount();
  const navigate = useNavigate();
  const [leal, setLeal] = useState("");

  const lealPoints = Number(leal);
  const labels: Record<Channel, string> = { whatsapp: copy.legal.whatsapp, email: copy.legal.marketing, sms: copy.legal.sms };

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
          <Section title={copy.settings.permissions}>
            <div style={{ fontSize: 13, color: "var(--smoke)", marginBottom: 4 }}>{copy.legal.permissionsNote}</div>
            {CHANNELS.map((channel) => {
              const permission = account.permissions?.[channel];
              const on = permission?.on ?? (channel === "email" ? (account.consent?.marketing ?? false) : false);
              return (
                <Check
                  key={channel}
                  label={labels[channel]}
                  hint={permission ? copy.settings.savedAt(date(permission.at)) : copy.settings.off}
                  checked={on}
                  onChange={(value) => dispatch({ type: "setPermission", channel, on: value })}
                  testId={`permission-${channel}`}
                />
              );
            })}
          </Section>
        ) : null}

        {account ? (
          <Section title={copy.settings.fromLeal}>
            <div style={{ fontSize: 13, color: "var(--smoke)", marginBottom: 10, lineHeight: 1.4 }}>{copy.settings.lealLead}</div>
            {account.migratedFrom ? (
              <Glass flat style={{ padding: 14, background: "var(--cream)" }} data-testid="leal-migrated">
                <div className="serif" style={{ fontSize: 18 }}>{copy.notes.migrated(account.migratedFrom.lealPoints, account.migratedFrom.points)}</div>
                <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 4 }}>{date(account.migratedFrom.at)}</div>
              </Glass>
            ) : (
              <>
                <Glass flat className="glass-field" style={{ borderRadius: 18, background: "rgba(246,241,234,0.7)" }}>
                  <label htmlFor="leal-points">{copy.settings.lealPoints}</label>
                  <input
                    id="leal-points"
                    inputMode="numeric"
                    value={leal ? Number(leal).toLocaleString(market.locale) : ""}
                    onChange={(event) => setLeal(event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_LEAL_DIGITS))}
                    className="serif"
                    style={{ fontSize: 26 }}
                    data-testid="leal-points"
                  />
                </Glass>
                {lealPoints > 0 ? (
                  <div style={{ fontSize: 13, color: "var(--roast)", margin: "6px 4px 0" }} data-testid="leal-preview">
                    {copy.ledger.migrated(lealPoints, lealToPoints(lealPoints))}
                  </div>
                ) : null}
                <Press
                  className="ink-button"
                  style={{ marginTop: 12 }}
                  disabled={lealPoints <= 0}
                  onClick={() => {
                    haptics.select();
                    dispatch({ type: "migrateLeal", lealPoints });
                    setLeal("");
                  }}
                  data-testid="leal-migrate"
                >
                  {copy.settings.migrate}
                </Press>
              </>
            )}
          </Section>
        ) : null}

        {account ? (
          <Section title={copy.settings.account}>
            <div style={{ fontSize: 13, color: "var(--smoke)", marginBottom: 10 }}>{copy.settings.downloadHint}</div>
            <Press className="ghost-button" onClick={() => download(account)} data-testid="download-data">
              {copy.settings.download}
            </Press>
            <div style={{ fontSize: 13, color: "var(--smoke)", margin: "16px 0 10px" }}>{copy.settings.forgetHint}</div>
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

        <div style={{ fontSize: 12, color: "var(--smoke)", marginTop: 30, textAlign: "center" }}>
          {copy.settings.version}
          {account?.balance ? ` · ${money(account.balance)}` : ""}
        </div>
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
