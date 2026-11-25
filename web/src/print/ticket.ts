import { eposJob, PAPER_DOTS, printerAddress, rasterBase64, readPrinterAnswer, type Paper, type PrintResult, type TicketLine } from "../core/comandas";

/** Type sizes on the ticket, in printer dots, for an 80 mm roll; a 58 mm roll scales them down. */
const SIZES = { small: 22, normal: 26, big: 34, huge: 64 } as const;
const MARGIN = 14;

function wrap(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  if (!text) return [""];
  const indent = /^\s*(•\s)?/.exec(text)?.[0] ?? "";
  const words = text.trim().split(/\s+/);
  const rows: string[] = [];
  let row = "";
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (row && context.measureText((rows.length ? " ".repeat(indent.length) : "") + next).width > width) {
      rows.push(row);
      row = word;
    } else {
      row = next;
    }
  }
  rows.push(row);
  const lead = text.startsWith("   ") ? "   " : "";
  return rows.map((value, index) => (index === 0 ? lead + value : lead + "  " + value));
}

/** Draws the ticket in black on white, exactly as wide as the paper prints. */
export function drawTicket(lines: TicketLine[], paper: Paper): HTMLCanvasElement {
  const width = PAPER_DOTS[paper];
  const scale = width / PAPER_DOTS["80"];
  const font = (line: TicketLine) => `${line.bold ? 700 : 500} ${Math.round(SIZES[line.size] * scale)}px "Outfit Variable", "Outfit", Arial, sans-serif`;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("no canvas");

  type Row = { text: string; line: TicketLine; height: number; before: number };
  const rows: Row[] = [];
  for (const line of lines) {
    const before = Math.round((line.gap ?? 0) * scale);
    if (line.rule) {
      rows.push({ text: "", line, height: Math.round(10 * scale), before });
      continue;
    }
    probe.font = font(line);
    const height = Math.round(SIZES[line.size] * scale * 1.28);
    wrap(probe, line.text, width - MARGIN * 2).forEach((text, index) => rows.push({ text, line, height, before: index === 0 ? before : 0 }));
  }
  const height = rows.reduce((sum, row) => sum + row.height + row.before, 0) + Math.round(70 * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#000";
  context.textBaseline = "top";
  let y = Math.round(10 * scale);
  for (const row of rows) {
    y += row.before;
    if (row.line.rule) {
      for (let x = MARGIN; x < width - MARGIN; x += 10) context.fillRect(x, y + Math.round(row.height / 2), 6, 2);
    } else {
      context.font = font(row.line);
      context.textAlign = row.line.align === "center" ? "center" : "left";
      context.fillText(row.text, row.line.align === "center" ? width / 2 : MARGIN, y);
    }
    y += row.height;
  }
  return canvas;
}

function greys(canvas: HTMLCanvasElement): Uint8Array {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const out = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < out.length; i += 1) out[i] = (pixels[i * 4] ?? 255) * 0.299 + (pixels[i * 4 + 1] ?? 255) * 0.587 + (pixels[i * 4 + 2] ?? 255) * 0.114;
  return out;
}

/** The fonts are in before the first ticket is drawn: a ticket in a fallback face is wider than the paper. */
export async function ticketFontsReady(): Promise<void> {
  try {
    await Promise.all([document.fonts.load('700 34px "Outfit Variable"'), document.fonts.load('500 26px "Outfit Variable"')]);
  } catch {
    /* the fallback face prints too */
  }
}

async function post(address: string, job: string, local: boolean): Promise<PrintResult> {
  const init: RequestInit & { targetAddressSpace?: string } = { method: "POST", body: job, signal: AbortSignal.timeout(15000) };
  // Chrome asks once for leave to reach a device on the local network from a public page
  // (a printer on this same machine is "loopback"; one on the bar's network is "local")
  if (local) init.targetAddressSpace = /^https?:\/\/(localhost|127\.|\[::1\])/i.test(address) ? "loopback" : "local";
  const response = await fetch(address, init);
  return readPrinterAnswer(await response.text());
}

/**
 * Sends a drawn ticket to an Epson on the bar's network, the way Odoo's point of sale does.
 * First over https (the printer's certificate was accepted on this device); if the printer does not
 * answer there, over the local network with the browser's leave.
 */
export async function printOnEpson(canvas: HTMLCanvasElement, ip: string): Promise<PrintResult> {
  const job = eposJob(rasterBase64(greys(canvas), canvas.width, canvas.height, (binary) => btoa(binary)), canvas.width, canvas.height);
  try {
    return await post(printerAddress(ip, true), job, false);
  } catch {
    try {
      return await post(printerAddress(ip, false), job, true);
    } catch {
      return { ok: false, problem: "unreachable", code: "" };
    }
  }
}
