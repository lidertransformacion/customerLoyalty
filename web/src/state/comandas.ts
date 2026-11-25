import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { callBoard, cleanOrders, cleanPrinterIp, ordersToPrint, ticketLines, validPrinterIp, type BoardError, type BoardOrder, type Paper, type PrintProblem, type PrintResult } from "../core/comandas";
import { drawTicket, printOnEpson, ticketFontsReady } from "../print/ticket";
import { ORDERS_URL } from "./sura-url";

const SESSION_KEY = "libertario-sura-board-session-v1";
const PRINTER_KEY = "libertario-sura-board-printer-v1";
const EVERY = 8000;

export type Session = { token: string; user: string; name: string };
export type Printer = { ip: string; paper: Paper; auto: boolean };
export type Labels = { house: string; client: string; order: string; cedula: string; reprint: string; test: string };

function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* this device forgets; the board still works until the tab closes */
  }
}

function readSession(): Session | null {
  const value = readJson(SESSION_KEY) as Partial<Session> | null;
  return value && typeof value.token === "string" && typeof value.user === "string" ? { token: value.token, user: value.user, name: typeof value.name === "string" ? value.name : value.user } : null;
}
function readPrinter(): Printer {
  const value = readJson(PRINTER_KEY) as Partial<Printer> | null;
  const ip = value && typeof value.ip === "string" ? cleanPrinterIp(value.ip) : "";
  return { ip: validPrinterIp(ip) ? ip : "", paper: value?.paper === "58" ? "58" : "80", auto: value?.auto !== false };
}

/**
 * The bell for a new order. Browsers only let a page sound after someone has touched it, so the first touch
 * or key on the board wakes the sound up; from then on every new order rings.
 */
let audio: AudioContext | null = null;
function wakeSound() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    /* no sound on this device */
  }
}
function chime() {
  wakeSound();
  const context = audio;
  if (!context || context.state !== "running") return;
  // «something came in»: two bright rising notes, a bell with its octave on top, under half a second
  const notes: Array<[number, number, number]> = [
    [0, 1319, 0.11],
    [0.1, 1976, 0.3],
  ];
  for (const [delay, pitch, length] of notes) {
    for (const [multiple, level] of [[1, 0.6], [2, 0.22]] as const) {
      const tone = context.createOscillator();
      const volume = context.createGain();
      tone.type = "sine";
      tone.frequency.value = pitch * multiple;
      volume.gain.setValueAtTime(0.0001, context.currentTime + delay);
      volume.gain.exponentialRampToValueAtTime(level, context.currentTime + delay + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + length);
      tone.connect(volume).connect(context.destination);
      tone.start(context.currentTime + delay);
      tone.stop(context.currentTime + delay + length + 0.02);
    }
  }
}

/** The board of the bar: who is in, the orders as the sheet has them, and the printer of this device. */
export function useComandas(labels: Labels) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [loginError, setLoginError] = useState<BoardError | null>(null);
  const [entering, setEntering] = useState(false);
  const [printer, setPrinterState] = useState<Printer>(readPrinter);
  /** Orders whose ticket did not come out here, and why. */
  const [unprinted, setUnprinted] = useState<Record<number, PrintProblem>>({});
  const [busy, setBusy] = useState<Record<number, "deliver" | "return" | "cancel" | "print">>({});
  const [notice, setNotice] = useState<{ kind: "error" | "info"; code: string } | null>(null);
  const [paperLow, setPaperLow] = useState(false);

  useEffect(() => {
    window.addEventListener("pointerdown", wakeSound);
    window.addEventListener("keydown", wakeSound);
    return () => {
      window.removeEventListener("pointerdown", wakeSound);
      window.removeEventListener("keydown", wakeSound);
    };
  }, []);

  const tried = useRef(new Set<number>());
  const known = useRef<Set<number> | null>(null);
  const printing = useRef(false);
  const token = session?.token ?? "";

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const answer = await callBoard(ORDERS_URL, { ...body, token }, (input, init) => fetch(input, init));
      if (!answer.ok && answer.error === "session") {
        writeJson(SESSION_KEY, null);
        setSession(null);
      }
      return answer;
    },
    [token],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    const answer = await call({ action: "list" });
    if (!answer.ok) {
      if (answer.error === "network") setOffline(true);
      return;
    }
    setOffline(false);
    setLoaded(true);
    setOrders(cleanOrders(answer.orders));
  }, [call, token]);

  // the board keeps itself fresh while it is on screen
  useEffect(() => {
    if (!token) return;
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, EVERY);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, refresh]);

  const sendToPrinter = useCallback(
    async (order: BoardOrder, copy: boolean): Promise<PrintResult> => {
      await ticketFontsReady();
      const result = await printOnEpson(drawTicket(ticketLines(order, labels, copy), printer.paper), printer.ip);
      setUnprinted((current) => {
        const next = { ...current };
        if (result.ok) delete next[order.number];
        else next[order.number] = result.problem;
        return next;
      });
      if (result.ok) setPaperLow(result.paperLow);
      return result;
    },
    [labels, printer.ip, printer.paper],
  );

  // a new order sounds, and its ticket comes out by itself on the device that has the printer
  useEffect(() => {
    if (!loaded) return;
    const pending = orders.filter((order) => !order.delivered);
    if (known.current && pending.some((order) => !known.current!.has(order.number))) chime();
    known.current = new Set(orders.map((order) => order.number));

    if (!printer.auto || !printer.ip || printing.current) return;
    const queue = ordersToPrint(orders, tried.current);
    if (queue.length === 0) return;
    printing.current = true;
    void (async () => {
      for (const order of queue) {
        tried.current.add(order.number);
        // the sheet gives the ticket to one device only: two tablets do not print it twice
        const claim = await call({ action: "printed", number: order.number });
        if (!claim.ok || claim.claimed !== true) continue;
        const result = await sendToPrinter(order, false);
        if (!result.ok) await call({ action: "unprinted", number: order.number });
      }
      printing.current = false;
      void refresh();
    })();
  }, [orders, loaded, printer.auto, printer.ip, call, sendToPrinter, refresh]);

  const login = useCallback(async (user: string, password: string) => {
    setEntering(true);
    setLoginError(null);
    const answer = await callBoard(ORDERS_URL, { action: "login", user: user.trim().toLowerCase(), password }, (input, init) => fetch(input, init));
    setEntering(false);
    if (!answer.ok) {
      setLoginError(answer.error);
      return;
    }
    const next: Session = { token: String(answer.token), user: user.trim().toLowerCase(), name: typeof answer.name === "string" && answer.name ? answer.name : user.trim() };
    writeJson(SESSION_KEY, next);
    known.current = null;
    setLoaded(false);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    writeJson(SESSION_KEY, null);
    setSession(null);
    setOrders([]);
    setLoaded(false);
  }, []);

  const act = useCallback(
    async (kind: "deliver" | "return" | "cancel", number: number) => {
      setBusy((current) => ({ ...current, [number]: kind }));
      const answer = await call({ action: kind, number });
      if (answer.ok) {
        // the ticket moves at once; the next reading of the sheet confirms it
        if (kind === "cancel") setOrders((current) => current.filter((order) => order.number !== number));
        else setOrders((current) => current.map((order) => (order.number === number ? { ...order, delivered: kind === "deliver", deliveredAt: kind === "deliver" ? new Date().toISOString() : "" } : order)));
      } else {
        setNotice({ kind: "error", code: answer.error === "invoiced" ? "invoiced" : answer.error === "network" ? "network" : kind });
      }
      setBusy((current) => {
        const next = { ...current };
        delete next[number];
        return next;
      });
      void refresh();
    },
    [call, refresh],
  );

  const reprint = useCallback(
    async (order: BoardOrder) => {
      if (!printer.ip) {
        setNotice({ kind: "error", code: "noPrinter" });
        return;
      }
      setBusy((current) => ({ ...current, [order.number]: "print" }));
      const result = await sendToPrinter(order, Boolean(order.printedAt));
      if (result.ok) {
        if (!order.printedAt) await call({ action: "printed", number: order.number, force: true });
        setNotice({ kind: "info", code: "printed" });
        void refresh();
      } else {
        setNotice({ kind: "error", code: `print-${result.problem}` });
      }
      setBusy((current) => {
        const next = { ...current };
        delete next[order.number];
        return next;
      });
    },
    [printer.ip, sendToPrinter, call, refresh],
  );

  const setPrinter = useCallback((change: Partial<Printer>) => {
    setPrinterState((current) => {
      const next = { ...current, ...change };
      if (change.ip !== undefined) next.ip = cleanPrinterIp(change.ip);
      writeJson(PRINTER_KEY, next);
      return next;
    });
  }, []);

  /** A ticket that says the printer is set, so the bar knows before the first order. */
  const testPrint = useCallback(async (): Promise<PrintResult> => {
    await ticketFontsReady();
    const now = new Date().toISOString();
    const sample: BoardOrder = { number: 0, at: now, cedula: "0000000000", name: labels.test, area: "", items: [{ name: labels.test, detail: "", quantity: 1 }], delivered: false, deliveredAt: "", printedAt: "" };
    const result = await printOnEpson(drawTicket(ticketLines(sample, labels, false), printer.paper), printer.ip);
    if (result.ok) setPaperLow(result.paperLow);
    return result;
  }, [labels, printer.ip, printer.paper]);

  return useMemo(
    () => ({ session, login, logout, entering, loginError, orders, loaded, offline, refresh, deliver: (number: number) => act("deliver", number), giveBack: (number: number) => act("return", number), remove: (number: number) => act("cancel", number), reprint, busy, unprinted, printer, setPrinter, printerReady: validPrinterIp(printer.ip), testPrint, paperLow, notice, clearNotice: () => setNotice(null) }),
    [session, login, logout, entering, loginError, orders, loaded, offline, refresh, act, reprint, busy, unprinted, printer, setPrinter, testPrint, paperLow, notice],
  );
}
