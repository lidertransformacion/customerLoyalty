import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { addToCart, areaById, buildOrder, cartCount, cartLines, changeQuantity, cleanCart, cleanCedula, comboById, linesTotal, orderProblem, quantityOf, sendOrder, type Cart, type OrderLine, type OrderProblem, type Picks, type SuraArea, type SuraCombo } from "../core/sura";

/** The cart lives while the tab does; the ID number and the area stay on the phone for the next breakfast. */
const CART_KEY = "libertario-sura-cart-v2";
const CEDULA_KEY = "libertario-sura-cedula-v1";
const AREA_KEY = "libertario-sura-area-v1";

/** In development Vite answers this path itself (vite.config.ts), so the whole flow runs without the sheet. */
const ORDERS_URL = import.meta.env.VITE_SURA_ORDERS_URL || (import.meta.env.DEV ? "/api/sura-order" : "");

function read(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}
function write(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    /* the phone forgets; the order still works */
  }
}

function readCart(): Cart {
  try {
    return cleanCart(JSON.parse(read("session", CART_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

/** The area a QR carries (`?area=ips`) wins and is remembered; else the one chosen before. */
function readArea(): SuraArea | null {
  let fromUrl: string | null = null;
  try {
    fromUrl = new URLSearchParams(window.location.search).get("area");
  } catch {
    /* no address to read */
  }
  const area = areaById(fromUrl);
  if (area) {
    write("local", AREA_KEY, area.id);
    return area;
  }
  return areaById(read("local", AREA_KEY));
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** The order that just went: what the thank-you screen shows. */
export type SentOrder = { number: number; lines: OrderLine[]; total: number; area: string };

type Api = {
  cart: Cart;
  count: number;
  /** The cart as lines with the Spanish names the bar reads. */
  lines: OrderLine[];
  total: number;
  /** Units of a combo in the order, however it was chosen. */
  quantityOf: (comboId: string) => number;
  /** Puts a combo in the order with what was chosen in it. */
  add: (comboId: string, picks: Picks) => void;
  /** One more or one less of a line of the order. */
  change: (key: string, by: 1 | -1) => void;
  /** The combo whose choices are being asked, if any. */
  choosing: SuraCombo | null;
  choose: (comboId: string) => void;
  closeChooser: () => void;
  cedula: string;
  setCedula: (text: string) => void;
  area: SuraArea | null;
  setArea: (area: SuraArea) => void;
  problem: OrderProblem | null;
  sending: boolean;
  failed: boolean;
  sent: SentOrder | null;
  send: () => Promise<void>;
  /** Leaves the thank-you screen behind. */
  finish: () => void;
};

const SuraContext = createContext<Api | null>(null);

export function SuraProvider({ children }: { children: ReactNode }) {
  const [cart, setCartState] = useState<Cart>(readCart);
  const [cedula, setCedulaState] = useState(() => cleanCedula(read("local", CEDULA_KEY) ?? ""));
  const [area, setAreaState] = useState<SuraArea | null>(readArea);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState<SentOrder | null>(null);
  // one id per order: a second tap after a lost answer does not write the order twice
  const attempt = useRef(newId());

  const setCart = useCallback((change: (current: Cart) => Cart) => {
    setCartState((current) => {
      const next = change(current);
      if (next !== current) {
        write("session", CART_KEY, JSON.stringify(next));
        attempt.current = newId();
      }
      return next;
    });
  }, []);
  const [choosing, setChoosing] = useState<SuraCombo | null>(null);
  const add = useCallback(
    (comboId: string, picks: Picks) => {
      const combo = comboById(comboId);
      if (combo) setCart((current) => addToCart(current, combo, picks));
    },
    [setCart],
  );
  const change = useCallback((key: string, by: 1 | -1) => setCart((current) => changeQuantity(current, key, by)), [setCart]);
  const choose = useCallback((comboId: string) => setChoosing(comboById(comboId) ?? null), []);
  const closeChooser = useCallback(() => setChoosing(null), []);
  const unitsOf = useCallback((comboId: string) => quantityOf(cart, comboId), [cart]);
  const setCedula = useCallback((text: string) => {
    const clean = cleanCedula(text);
    write("local", CEDULA_KEY, clean);
    setCedulaState(clean);
  }, []);
  const setArea = useCallback((next: SuraArea) => {
    write("local", AREA_KEY, next.id);
    setAreaState(next);
  }, []);

  // the bar reads Spanish, whatever language the guest reads
  const lines = useMemo(() => cartLines(cart), [cart]);
  const total = linesTotal(lines);
  const problem = orderProblem(lines, area, cedula);

  const send = useCallback(async () => {
    if (sending || problem || !area) return;
    setSending(true);
    setFailed(false);
    const result = await sendOrder(buildOrder(lines, area, cedula, attempt.current, new Date()), ORDERS_URL, (input, init) => fetch(input, init));
    setSending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setSent({ number: result.number, lines, total, area: area.name });
    write("session", CART_KEY, "[]");
    setCartState([]);
    attempt.current = newId();
  }, [sending, problem, area, lines, cedula, total]);

  const finish = useCallback(() => {
    setSent(null);
    setFailed(false);
  }, []);

  const value = useMemo<Api>(
    () => ({ cart, count: cartCount(cart), lines, total, quantityOf: unitsOf, add, change, choosing, choose, closeChooser, cedula, setCedula, area, setArea, problem, sending, failed, sent, send, finish }),
    [cart, lines, total, unitsOf, add, change, choosing, choose, closeChooser, cedula, setCedula, area, setArea, problem, sending, failed, sent, send, finish],
  );
  return <SuraContext.Provider value={value}>{children}</SuraContext.Provider>;
}

export function useSura(): Api {
  const value = useContext(SuraContext);
  if (!value) throw new Error("Sura provider is missing.");
  return value;
}
