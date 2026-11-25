import { describe, expect, it } from "vitest";

import { isFresh, callBoard, cleanOrders, cleanPrinterIp, dayOf, deliveredOrders, eposJob, minutesWaiting, ordersToPrint, pendingOrders, printerAddress, rasterBase64, readPrinterAnswer, searchOrders, ticketLines, validPrinterIp, type BoardOrder } from "./comandas";

const order = (number: number, change: Partial<BoardOrder> = {}): BoardOrder => ({ number, at: "2026-11-25T12:42:00.000Z", cedula: "1020304050", name: "Ana María Gómez", area: "Chequeos ejecutivos", items: [{ name: "Desayuno completo", detail: "Croissant + Parfait + Latte + Huevos revueltos", quantity: 1 }], delivered: false, deliveredAt: "", printedAt: "", ...change });
const labels = { house: "LIBERTARIO", client: "Convenio Sura", order: "Pedido", cedula: "C.C.", reprint: "Reimpresión" };

describe("the bar's board", () => {
  it("keeps only what has the shape of an order", () => {
    const orders = cleanOrders([{ number: 3, at: "x", cedula: 123456, name: "Luis", area: "Toma de muestras", items: [{ name: "Refrigerio", detail: "Arepa + Infusión", quantity: 1 }, { nope: true }], delivered: true, deliveredAt: "y" }, { number: "abc" }, null]);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ number: 3, cedula: "123456", delivered: true, printedAt: "" });
    expect(orders[0]!.items).toEqual([{ name: "Refrigerio", detail: "Arepa + Infusión", quantity: 1 }]);
    expect(cleanOrders("nothing")).toEqual([]);
  });

  it("shows the new ones oldest first and the delivered ones latest first", () => {
    const all = [order(3), order(1), order(2, { delivered: true, deliveredAt: "2026-11-25T13:00:00Z" }), order(4, { delivered: true, deliveredAt: "2026-11-25T14:00:00Z" })];
    expect(pendingOrders(all).map((o) => o.number)).toEqual([1, 3]);
    expect(deliveredOrders(all).map((o) => o.number)).toEqual([4, 2]);
  });

  it("finds by ID number, by order number and by name without accents", () => {
    const all = [order(1), order(2, { cedula: "79555111", name: "José Pérez" })];
    expect(searchOrders(all, "5551").map((o) => o.number)).toEqual([2]);
    expect(searchOrders(all, "jose").map((o) => o.number)).toEqual([2]);
    expect(searchOrders(all, "1").map((o) => o.number)).toEqual([1, 2]);
    expect(searchOrders(all, "  ")).toHaveLength(2);
    expect(searchOrders(all, "zzz")).toEqual([]);
  });

  it("reads days and waits in Bogotá's clock", () => {
    expect(dayOf("2026-11-26T03:30:00.000Z")).toBe("2026-11-25");
    expect(minutesWaiting(order(1), new Date("2026-11-25T12:55:30.000Z"))).toBe(13);
    expect(minutesWaiting(order(1, { at: "nope" }), new Date())).toBe(0);
    expect(isFresh(order(1), new Date("2026-11-25T12:42:59.000Z"))).toBe(true);
    expect(isFresh(order(1), new Date("2026-11-25T12:43:00.000Z"))).toBe(false);
    expect(isFresh(order(1, { at: "nope" }), new Date())).toBe(false);
  });

  it("prints by itself only what is new, unprinted and not tried here", () => {
    const all = [order(1, { printedAt: "x" }), order(2), order(3), order(4, { delivered: true })];
    expect(ordersToPrint(all, new Set([3])).map((o) => o.number)).toEqual([2]);
  });
});

describe("the ticket", () => {
  it("lists the order, who asked and every part of the combo", () => {
    const texts = ticketLines(order(12), labels).map((line) => line.text);
    expect(texts).toContain("Pedido #12");
    expect(texts).toContain("Ana María Gómez");
    expect(texts).toContain("C.C. 1020304050");
    expect(texts).toContain("1 × Desayuno completo");
    expect(texts).toContain("   • Huevos revueltos");
    expect(texts).not.toContain("Reimpresión");
    expect(ticketLines(order(12), labels, true).map((line) => line.text)).toContain("Reimpresión");
  });

  it("packs the drawing eight dots to a byte, black as one", () => {
    // 10 dots wide, 2 rows: the first row all black, the second only its last dot
    const grey = new Uint8Array(20).fill(255);
    for (let x = 0; x < 10; x += 1) grey[x] = 0;
    grey[19] = 0;
    const bytes: number[] = [];
    rasterBase64(grey, 10, 2, (binary) => {
      for (const char of binary) bytes.push(char.charCodeAt(0));
      return "";
    });
    expect(bytes).toEqual([0xff, 0xc0, 0x00, 0x40]);
  });

  it("sends the job Odoo sends: one image and a cut in an ePOS envelope", () => {
    const job = eposJob("QUJD", 10, 2);
    expect(job).toContain('<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">');
    expect(job).toContain('<image width="16" height="2" align="center">QUJD</image><cut type="feed"/>');
    expect(printerAddress("192.168.1.50", true)).toBe("https://192.168.1.50/cgi-bin/epos/service.cgi?devid=local_printer");
    expect(printerAddress("192.168.1.50", false)).toMatch(/^http:\/\//);
  });

  it("understands what the printer answers", () => {
    expect(readPrinterAnswer('<response success="true" code="" status="251658262"/>')).toEqual({ ok: true, paperLow: false });
    expect(readPrinterAnswer(`<response success="true" code="" status="${0x00020000}"/>`)).toEqual({ ok: true, paperLow: true });
    expect(readPrinterAnswer('<response success="false" code="EPTR_COVER_OPEN" status="0"/>')).toMatchObject({ ok: false, problem: "cover" });
    expect(readPrinterAnswer('<response success="false" code="EPTR_REC_EMPTY" status="0"/>')).toMatchObject({ ok: false, problem: "paper" });
    expect(readPrinterAnswer('<response success="false" code="DeviceNotFound" status="0"/>')).toMatchObject({ ok: false, problem: "device" });
    expect(readPrinterAnswer("<html>404</html>")).toMatchObject({ ok: false, problem: "other" });
  });

  it("takes a printer address with or without its scheme", () => {
    expect(cleanPrinterIp(" https://192.168.1.50/ ")).toBe("192.168.1.50");
    expect(validPrinterIp("192.168.1.50")).toBe(true);
    expect(validPrinterIp("epson-barra.local:8043")).toBe(true);
    expect(validPrinterIp("")).toBe(false);
    expect(validPrinterIp("no vale")).toBe(false);
  });
});

describe("the calls to the sheet", () => {
  const post = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

  it("passes what the sheet answers and names what went wrong", async () => {
    expect(await callBoard("/x", { action: "list" }, post({ ok: true, orders: [] }))).toEqual({ ok: true, orders: [] });
    expect(await callBoard("/x", {}, post({ ok: false, error: "sesion" }))).toEqual({ ok: false, error: "session" });
    expect(await callBoard("/x", {}, post({ ok: false, error: "credenciales" }))).toEqual({ ok: false, error: "credentials" });
    expect(await callBoard("/x", {}, post({ ok: false, error: "facturado" }))).toEqual({ ok: false, error: "invoiced" });
    expect(await callBoard("/x", {}, post({}, false))).toEqual({ ok: false, error: "network" });
    expect(await callBoard("", {}, post({ ok: true }))).toEqual({ ok: false, error: "network" });
    expect(await callBoard("/x", {}, (async () => { throw new Error("offline"); }) as unknown as typeof fetch)).toEqual({ ok: false, error: "network" });
  });
});
