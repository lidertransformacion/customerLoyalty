import { copy, formatPoints } from "@/src/i18n/strings";

export function pesos(value: number): string {
  return `$${value.toLocaleString("es-CO")}`;
}

export function formatInteger(value: number): string {
  return formatPoints(value);
}

export function withSign(value: number): string {
  const text = Math.abs(value).toLocaleString("es-CO");
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return "0";
}

export function shortDate(iso: string): string {
  const date = new Date(iso);
  const month = copy.months[date.getMonth()] ?? "";
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

export function dateFromKey(key: string): string {
  const [year, month, day] = key.split("-");
  const index = Number(month) - 1;
  const name = copy.months[index] ?? "";
  return `${Number(day)} ${name} ${year}`;
}

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
