/**
 * The bar's board for the Sura orders: what the sheet answers, which tickets are new,
 * which were handed over, and the ticket as the Epson printer wants it.
 * Pure: no window, no DOM. The canvas that draws the ticket lives in `print/ticket.ts`.
 */

export type BoardItem = { name: string; detail: string; quantity: number };

export type BoardOrder = {
  number: number;
  /** When the order came in, ISO. */
  at: string;
  cedula: string;
  name: string;
  area: string;
  items: BoardItem[];
  delivered: boolean;
  /** When it was handed over, ISO, or "". */
  deliveredAt: string;
  /** When a ticket came out of a printer, ISO, or "". */
  printedAt: string;
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : typeof value === "number" ? String(value) : "";
}

function cleanItem(value: unknown): BoardItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const name = text(item.name, 80);
  const quantity = typeof item.quantity === "number" && item.quantity >= 1 && item.quantity <= 9 ? Math.floor(item.quantity) : 1;
  return name ? { name, detail: text(item.detail, 200), quantity } : null;
}

/** What the sheet sent, kept only if it has the shape of an order. */
export function cleanOrders(value: unknown): BoardOrder[] {
  if (!Array.isArray(value)) return [];
  const orders: BoardOrder[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const number = Number(row.number);
    if (!Number.isInteger(number) || number < 1) continue;
    const items = Array.isArray(row.items) ? row.items.map(cleanItem).filter((item): item is BoardItem => item !== null) : [];
    orders.push({
      number,
      at: text(row.at, 40),
      cedula: text(row.cedula, 15),
      name: text(row.name, 60),
      area: text(row.area, 80),
      items,
      delivered: row.delivered === true,
      deliveredAt: text(row.deliveredAt, 40),
      printedAt: text(row.printedAt, 40),
    });
  }
  return orders;
}

/** The new ones, oldest first: the one that has waited longest is the first to make. */
export function pendingOrders(orders: BoardOrder[]): BoardOrder[] {
  return orders.filter((order) => !order.delivered).sort((a, b) => a.number - b.number);
}

/** The handed-over ones, the latest first. */
export function deliveredOrders(orders: BoardOrder[]): BoardOrder[] {
  return orders.filter((order) => order.delivered).sort((a, b) => (b.deliveredAt || "").localeCompare(a.deliveredAt || "") || b.number - a.number);
}

/** Search by ID number (digits anywhere in it) or by a piece of the name. */
export function searchOrders(orders: BoardOrder[], query: string): BoardOrder[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return orders;
  const digits = clean.replace(/\D/g, "");
  const words = clean.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return orders.filter((order) => {
    if (digits && digits.length === clean.replace(/[\s.]/g, "").length) return order.cedula.includes(digits) || String(order.number) === digits;
    return order.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(words);
  });
}

/** The day of an ISO moment in the bar's own clock, as yyyy-mm-dd. */
export function dayOf(iso: string, zone = "America/Bogota"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** The hour of an ISO moment in the bar's own clock: «7:42 a. m.». */
export function hourOf(iso: string, zone = "America/Bogota"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

/** Day and hour for the history: «25 nov, 7:42 a. m.». */
export function momentOf(iso: string, zone = "America/Bogota"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", { timeZone: zone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

/** Whole minutes an order has waited. */
export function minutesWaiting(order: BoardOrder, now: Date): number {
  const from = new Date(order.at).getTime();
  if (Number.isNaN(from)) return 0;
  return Math.max(0, Math.floor((now.getTime() - from) / 60000));
}

/** An order is «new» during its first minute. */
export function isFresh(order: BoardOrder, now: Date): boolean {
  const from = new Date(order.at).getTime();
  return !Number.isNaN(from) && now.getTime() - from < 60000;
}

/**
 * The orders whose ticket should come out by itself now: new, never printed anywhere,
 * and not already tried from this screen (a printer without paper is not hammered).
 */
export function ordersToPrint(orders: BoardOrder[], tried: ReadonlySet<number>): BoardOrder[] {
  return pendingOrders(orders).filter((order) => !order.printedAt && !tried.has(order.number));
}

/* ───────────────────────────── the ticket ───────────────────────────── */

export type TicketLine = { text: string; size: "small" | "normal" | "big" | "huge"; bold?: boolean; align?: "left" | "center"; rule?: boolean; gap?: number };

/** The ticket of an order, top to bottom. `copy` says it is a reprint. */
export function ticketLines(order: BoardOrder, labels: { house: string; client: string; order: string; cedula: string; reprint: string }, copy = false): TicketLine[] {
  const lines: TicketLine[] = [
    { text: labels.house, size: "normal", bold: true, align: "center" },
    { text: labels.client, size: "small", align: "center" },
    { text: "", size: "small", rule: true, gap: 10 },
    { text: `${labels.order} #${order.number}`, size: "huge", bold: true, align: "center", gap: 6 },
    { text: [hourOf(order.at), order.area].filter(Boolean).join(" · "), size: "small", align: "center" },
    { text: "", size: "small", rule: true, gap: 10 },
  ];
  if (order.name) lines.push({ text: order.name, size: "big", bold: true });
  lines.push({ text: `${labels.cedula} ${order.cedula}`, size: "normal", gap: 4 });
  lines.push({ text: "", size: "small", rule: true, gap: 10 });
  for (const item of order.items) {
    lines.push({ text: `${item.quantity} × ${item.name}`, size: "big", bold: true, gap: 4 });
    for (const part of item.detail ? item.detail.split(" + ") : []) lines.push({ text: `   • ${part}`, size: "normal" });
  }
  if (copy) {
    lines.push({ text: "", size: "small", rule: true, gap: 10 });
    lines.push({ text: labels.reprint, size: "small", align: "center" });
  }
  return lines;
}

/* ───────────────────────────── the Epson printer ───────────────────────────── */

/** Dots across the paper: an 80 mm roll prints 512 here, a 58 mm one 384. */
export const PAPER_DOTS = { "80": 512, "58": 384 } as const;
export type Paper = keyof typeof PAPER_DOTS;

/** Greys of a drawn ticket (one byte a dot, 0 black … 255 white) into the one-bit raster ePOS takes, base64. */
export function rasterBase64(grey: ArrayLike<number>, width: number, height: number, encode: (binary: string) => string): string {
  const across = Math.ceil(width / 8);
  let binary = "";
  for (let y = 0; y < height; y += 1) {
    for (let block = 0; block < across; block += 1) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit += 1) {
        const x = block * 8 + bit;
        if (x < width && (grey[y * width + x] ?? 255) < 128) byte |= 0x80 >> bit;
      }
      binary += String.fromCharCode(byte);
    }
  }
  return encode(binary);
}

/**
 * The print job as Odoo's point of sale sends it (point_of_sale/…/epson_printer.js): a SOAP envelope with
 * one raster image and a cut. The image width is rounded up to whole bytes, as the raster is.
 */
export function eposJob(raster: string, width: number, height: number): string {
  const dots = Math.ceil(width / 8) * 8;
  return (
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>' +
    '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">' +
    `<image width="${dots}" height="${height}" align="center">${raster}</image>` +
    '<cut type="feed"/>' +
    "</epos-print></s:Body></s:Envelope>"
  );
}

/** Where a printer on the bar's network takes its jobs. `secure` is https (the certificate was accepted on this device). */
export function printerAddress(ip: string, secure: boolean): string {
  return `${secure ? "https" : "http"}://${ip}/cgi-bin/epos/service.cgi?devid=local_printer`;
}

/** An address a printer can have: four numbers, or a name on the network, with an optional port. */
export function cleanPrinterIp(textIn: string): string {
  return textIn.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").slice(0, 80);
}
export function validPrinterIp(ip: string): boolean {
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{2,5})?$/i.test(ip);
}

export type PrintProblem = "unreachable" | "cover" | "paper" | "device" | "other";
export type PrintResult = { ok: true; paperLow: boolean } | { ok: false; problem: PrintProblem; code: string };

const PAPER_OUT = 0x00080000;
const PAPER_LOW = 0x00020000;

/** What the printer answered: `<response success="true" code="" status="251658262"/>`. */
export function readPrinterAnswer(body: string): PrintResult {
  const tag = /<response\b[^>]*>/i.exec(body)?.[0];
  if (!tag) return { ok: false, problem: "other", code: "" };
  const attribute = (name: string) => new RegExp(`\\b${name}="([^"]*)"`, "i").exec(tag)?.[1] ?? "";
  const status = Number.parseInt(attribute("status"), 10) || 0;
  const code = attribute("code");
  if (attribute("success") === "true") return { ok: true, paperLow: (status & PAPER_LOW) === PAPER_LOW };
  if (code === "EPTR_COVER_OPEN") return { ok: false, problem: "cover", code };
  if (code === "EPTR_REC_EMPTY" || (status & PAPER_OUT) === PAPER_OUT) return { ok: false, problem: "paper", code };
  if (code === "DeviceNotFound") return { ok: false, problem: "device", code };
  return { ok: false, problem: "other", code };
}

/* ───────────────────────────── the sheet ───────────────────────────── */

export type BoardError = "network" | "session" | "credentials" | "locked" | "invoiced" | "missing" | "other";
export type BoardAnswer<T> = ({ ok: true } & T) | { ok: false, error: BoardError };

const ERRORS: Record<string, BoardError> = { sesion: "session", credenciales: "credentials", bloqueado: "locked", facturado: "invoiced", "no existe": "missing" };

/** One call to the sheet's web app. The body goes as text so the browser asks no permission first. */
export async function callBoard(url: string, body: Record<string, unknown>, post: typeof fetch): Promise<BoardAnswer<Record<string, unknown>>> {
  if (!url) return { ok: false, error: "network" };
  try {
    const response = await post(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow" });
    if (!response.ok) return { ok: false, error: "network" };
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return { ok: false, error: "other" };
    const answer = data as Record<string, unknown>;
    if (answer.ok === true) return { ...answer, ok: true };
    return { ok: false, error: ERRORS[String(answer.error)] ?? "other" };
  } catch {
    return { ok: false, error: "network" };
  }
}
