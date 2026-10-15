import type { MenuFilter } from "../core/catalog";

/**
 * Where the guest was in the menu, kept while the app is open, so coming back
 * from a product lands on the same page of the book or the same spot of the
 * list instead of the cover.
 */
export const menuMemory: { page: number; filter: MenuFilter; listScroll: number; hintSeen: boolean } = {
  page: 0,
  filter: { text: "", category: null, ceiling: null, plant: false, noNuts: false },
  listScroll: 0,
  hintSeen: (() => {
    try {
      return window.localStorage.getItem("libertario-book-hint") === "1";
    } catch {
      return false;
    }
  })(),
};

export function markHintSeen(): void {
  menuMemory.hintSeen = true;
  try {
    window.localStorage.setItem("libertario-book-hint", "1");
  } catch {
    /* nothing */
  }
}
