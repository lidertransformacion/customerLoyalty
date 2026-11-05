import type { MenuItem } from "@/src/data/menu";

/**
 * The name a product is sold under, without its size or its blend.
 * "Filtrado PAZ 12 oz", "PAZ 340 g" and "Cappuccino single origin" fold into their product,
 * so a chapter lists products and each one says how many options it comes in.
 */
export function baseName(name: string): string {
  return name
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:oz|g|ml|l)\b.*$/i, "")
    .replace(/\s+(?:blend|single origin)$/i, "")
    .trim();
}

export type ProductGroup = { name: string; lines: MenuItem[] };

/** Groups a chapter's lines by product, in the order the menu lists them. */
export function groupLines(items: readonly MenuItem[]): ProductGroup[] {
  const groups: ProductGroup[] = [];
  const byName = new Map<string, ProductGroup>();
  for (const item of items) {
    const name = baseName(item.name);
    let group = byName.get(name);
    if (!group) {
      group = { name, lines: [] };
      byName.set(name, group);
      groups.push(group);
    }
    group.lines.push(item);
  }
  return groups;
}

/** The lowest price among a product's options. */
export function fromPrice(group: ProductGroup): number {
  return Math.min(...group.lines.map((line) => line.price));
}
