import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  isAccount,
  reduce,
  STORAGE_KEY,
  systemClock,
  type Account,
  type Action,
} from "../core/account";
import { haptics } from "../core/haptics";
import { useLocale } from "../i18n";
import { webStore } from "../core/storage";

export type Flash = { kind: "cup" | "eighth"; id: number } | null;

type Api = {
  ready: boolean;
  account: Account | null;
  note: string | null;
  flash: Flash;
  celebration: number;
  dispatch: (action: Action) => void;
  dismissNote: () => void;
};

const AccountContext = createContext<Api | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { copy } = useLocale();
  const copyRef = useRef(copy);
  copyRef.current = copy;
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [celebration, setCelebration] = useState(0);
  const accountRef = useRef<Account | null>(null);
  accountRef.current = account;
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    void webStore.getItem(STORAGE_KEY).then((raw) => {
      if (!alive) return;
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (isAccount(parsed)) setAccount(parsed);
        } catch {
          setAccount(null);
        }
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dispatch = useCallback((action: Action) => {
    const result = reduce(accountRef.current, action, systemClock, copyRef.current);
    accountRef.current = result.account;
    setAccount(result.account);
    if (result.account) void webStore.setItem(STORAGE_KEY, JSON.stringify(result.account));
    else void webStore.removeItem(STORAGE_KEY);

    const effect = result.effect;
    if (effect.note !== undefined) setNote(effect.note);
    if (effect.roast) {
      const id = Date.now();
      setFlash({ kind: effect.roast, id });
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(
        () => setFlash((current) => (current?.id === id ? null : current)),
        effect.roast === "eighth" ? 2600 : 1700,
      );
    }
    if (effect.celebrate) {
      setCelebration((n) => n + 1);
      haptics.success();
    } else if (effect.warn) {
      haptics.warn();
    } else {
      haptics.tap();
    }
  }, []);

  const dismissNote = useCallback(() => setNote(null), []);

  const value = useMemo<Api>(
    () => ({ ready, account, note, flash, celebration, dispatch, dismissNote }),
    [ready, account, note, flash, celebration, dispatch, dismissNote],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): Api {
  const value = useContext(AccountContext);
  if (!value) throw new Error("Account provider is missing.");
  return value;
}
