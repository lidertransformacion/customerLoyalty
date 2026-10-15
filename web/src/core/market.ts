/**
 * A market is a Libertario company: its country, currency, ID document and
 * data law. Colombia is live. Chile is configured so the same app can open
 * there; its catalog and houses arrive with the Chilean company.
 */
export type MarketId = "CO" | "CL";

export type Market = {
  id: MarketId;
  country: string;
  currency: "COP" | "CLP";
  locale: "es-CO" | "es-CL";
  timezone: string;
  phonePrefix: string;
  phonePattern: RegExp;
  idPattern: RegExp;
  dataLaw: string;
  policyUrl: string;
  live: boolean;
};

export const MARKETS: Record<MarketId, Market> = {
  CO: {
    id: "CO",
    country: "Colombia",
    currency: "COP",
    locale: "es-CO",
    timezone: "America/Bogota",
    phonePrefix: "+57",
    phonePattern: /^3\d{9}$/,
    idPattern: /^\d{6,10}$/,
    dataLaw: "Ley 1581 de 2012",
    policyUrl: "https://libertariocoffee.com/politica-de-datos",
    live: true,
  },
  CL: {
    id: "CL",
    country: "Chile",
    currency: "CLP",
    locale: "es-CL",
    timezone: "America/Santiago",
    phonePrefix: "+56",
    phonePattern: /^9\d{8}$/,
    idPattern: /^\d{7,8}-?[\dkK]$/,
    dataLaw: "Ley 19.628",
    policyUrl: "https://libertariocoffee.com/politica-de-datos",
    live: false,
  },
};

const MARKET_KEY = "libertario-market-v1";
const LANG_KEY = "libertario-lang-v1";

export type Lang = "es" | "en";

function isMarketId(value: unknown): value is MarketId {
  return value === "CO" || value === "CL";
}

/** URL `?pais=CL`, then what was chosen before, then the phone's region and clock. */
export function detectMarket(): MarketId {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("pais")?.toUpperCase();
    if (isMarketId(fromUrl)) {
      window.localStorage.setItem(MARKET_KEY, fromUrl);
      return fromUrl;
    }
    const stored = window.localStorage.getItem(MARKET_KEY);
    if (isMarketId(stored)) return stored;
    const region = new Intl.Locale(navigator.language).region;
    if (region === "CL") return "CL";
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone === "America/Santiago" || zone === "America/Punta_Arenas") return "CL";
  } catch {
    /* fall through */
  }
  return "CO";
}

export function rememberMarket(id: MarketId): void {
  try {
    window.localStorage.setItem(MARKET_KEY, id);
  } catch {
    /* nothing to do */
  }
}

export function detectLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "es") {
      window.localStorage.setItem(LANG_KEY, fromUrl);
      return fromUrl;
    }
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "es") return stored;
    return navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
  } catch {
    return "es";
  }
}

export function rememberLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* nothing to do */
  }
}

export function formatMoney(value: number, market: Market): string {
  return `$${value.toLocaleString(market.locale, { maximumFractionDigits: 0 })}`;
}

/** `birthday` is the form's YYYY-MM-DD. It is read as a local date so the day does not shift west of Greenwich. */
export function isAdult(birthday: string, today: Date): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const birth = new Date(year, month, day);
  if (Number.isNaN(birth.getTime()) || birth.getMonth() !== month || birth.getDate() !== day) return false;
  const eighteenth = new Date(year + 18, month, day);
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayLocal >= eighteenth;
}

/** The QR on a table opens `/?sede=zona-g&mesa=4`. */
export type Visit = { storeId: string | null; table: string | null };

export function readVisit(): Visit {
  try {
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get("sede");
    const table = params.get("mesa");
    if (storeId || table) {
      const visit = { storeId, table };
      window.sessionStorage.setItem("libertario-visit", JSON.stringify(visit));
      return visit;
    }
    const stored = window.sessionStorage.getItem("libertario-visit");
    if (stored) return JSON.parse(stored) as Visit;
  } catch {
    /* fall through */
  }
  return { storeId: null, table: null };
}
