import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { addToCart, buildOrder, cartCount, cartLines, cleanCart, cleanCedula, cleanName, comboById, linesTotal, orderProblem, quantityOf, removeFromCart, sendOrder, type Cart, type OrderLine, type OrderProblem, type Picks, type SuraArea, type SuraCombo } from "../core/sura";

/** The cart lives while the tab does; the ID number and the area stay on the phone for the next breakfast. */
const CART_KEY = "libertario-sura-cart-v2";
const CEDULA_KEY = "libertario-sura-cedula-v1";
const NAME_KEY = "libertario-sura-name-v1";
import { readSuraArea, rememberSuraArea } from "./sura-area";

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
  /** Takes a line out of the order. */
  remove: (key: string) => void;
  /** The combo whose choices are being asked, if any. */
  choosing: SuraCombo | null;
  choose: (comboId: string) => void;
  closeChooser: () => void;
  name: string;
  setName: (text: string) => void;
  cedula: string;
  setCedula: (text: string) => void;
  area: SuraArea | null;
  /** A QR said where the guest is: the order does not ask. */
  areaFixed: boolean;
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
  const [name, setNameState] = useState(() => cleanName(read("local", NAME_KEY) ?? ""));
  const [choice] = useState(readSuraArea);
  const [area, setAreaState] = useState<SuraArea | null>(choice.area);
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
  const remove = useCallback((key: string) => setCart((current) => removeFromCart(current, key)), [setCart]);
  const choose = useCallback((comboId: string) => setChoosing(comboById(comboId) ?? null), []);
  const closeChooser = useCallback(() => setChoosing(null), []);
  const unitsOf = useCallback((comboId: string) => quantityOf(cart, comboId), [cart]);
  const setCedula = useCallback((text: string) => {
    const clean = cleanCedula(text);
    write("local", CEDULA_KEY, clean);
    setCedulaState(clean);
  }, []);
  const setName = useCallback((text: string) => {
    const clean = cleanName(text);
    write("local", NAME_KEY, clean);
    setNameState(clean);
  }, []);
  const setArea = useCallback((next: SuraArea) => {
    rememberSuraArea(next);
    setAreaState(next);
  }, []);

  // the bar reads Spanish, whatever language the guest reads
  const lines = useMemo(() => cartLines(cart), [cart]);
  const total = linesTotal(lines);
  const problem = orderProblem(lines, area, name, cedula);

  const send = useCallback(async () => {
    if (sending || problem || !area) return;
    setSending(true);
    setFailed(false);
    const result = await sendOrder(buildOrder(lines, area, name, cedula, attempt.current, new Date()), ORDERS_URL, (input, init) => fetch(input, init));
    setSending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setSent({ number: result.number, lines, total, area: area.name });
    write("session", CART_KEY, "[]");
    setCartState([]);
    attempt.current = newId();
  }, [sending, problem, area, lines, name, cedula, total]);

  const finish = useCallback(() => {
    setSent(null);
    setFailed(false);
  }, []);

  const value = useMemo<Api>(
    () => ({ cart, count: cartCount(cart), lines, total, quantityOf: unitsOf, add, remove, choosing, choose, closeChooser, name, setName, cedula, setCedula, area, areaFixed: choice.fixed, setArea, problem, sending, failed, sent, send, finish }),
    [cart, lines, total, unitsOf, add, remove, choosing, choose, closeChooser, name, setName, cedula, setCedula, area, choice.fixed, setArea, problem, sending, failed, sent, send, finish],
  );
  return <SuraContext.Provider value={value}>{children}</SuraContext.Provider>;
}

export function useSura(): Api {
  const value = useContext(SuraContext);
  if (!value) throw new Error("Sura provider is missing.");
  return value;
}
