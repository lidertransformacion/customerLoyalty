import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { copy as es } from "@/src/i18n/strings";

import {
  detectLang,
  detectMarket,
  formatMoney,
  MARKETS,
  rememberLang,
  rememberMarket,
  type Lang,
  type Market,
  type MarketId,
} from "../core/market";
import { en, type CopyOverride } from "./en";

export type Copy = typeof es;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && typeof value !== "function";
}

function merge<T>(base: T, over: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(over)) return (over === undefined ? base : over) as T;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(over)) {
    out[key] = merge((base as Record<string, unknown>)[key], over[key]);
  }
  return out as T;
}

const COPIES: Record<Lang, Copy> = {
  es,
  en: merge(es, en as CopyOverride),
};

type Api = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  copy: Copy;
  market: Market;
  setMarket: (id: MarketId) => void;
  money: (value: number) => string;
  date: (iso: string) => string;
};

const LocaleContext = createContext<Api | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang());
  const [marketId, setMarketId] = useState<MarketId>(() => detectMarket());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    rememberLang(next);
    document.documentElement.lang = next;
  }, []);

  const setMarket = useCallback((id: MarketId) => {
    setMarketId(id);
    rememberMarket(id);
  }, []);

  const value = useMemo<Api>(() => {
    const market = MARKETS[marketId];
    const text = COPIES[lang];
    return {
      lang,
      setLang,
      copy: text,
      market,
      setMarket,
      money: (amount) => formatMoney(amount, market),
      date: (iso) => {
        const d = new Date(iso);
        return `${d.getDate()} ${text.months[d.getMonth()] ?? ""} ${d.getFullYear()}`;
      },
    };
  }, [lang, marketId, setLang, setMarket]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Api {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("Locale provider is missing.");
  return value;
}

export function useCopy(): Copy {
  return useLocale().copy;
}
