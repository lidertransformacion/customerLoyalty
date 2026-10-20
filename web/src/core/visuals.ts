import type { MenuItem } from "@/src/data/menu";

import type { PhotoSpec } from "../motion/living-photo";
import { photoSpec, PRODUCT_IMAGES } from "./photos";

/**
 * What a product shows on its page and on its card.
 * product: the pack render from the store, in 3D.
 * photo: the chapter photograph, alive with its mood.
 */
export type Visual =
  | { kind: "product"; src: string; profile: string }
  | { kind: "photo"; photo: PhotoSpec };

const PHOTO_BY_CATEGORY: Record<string, string> = {
  coffee: "coffee.jpg",
  "cold-brew": "coffee.jpg",
  filter: "filter.jpg",
  espresso: "espresso.jpg",
  signature: "drinks.jpg",
  matcha: "matcha.jpg",
  "other-drinks": "drinks.jpg",
  eggs: "brunch.jpg",
  parfait: "sweet.jpg",
  toast: "toast.jpg",
  bakery: "bread.jpg",
  sandwiches: "sandwiches.jpg",
  bowls: "bowls.jpg",
  cakes: "cakes.jpg",
  cookies: "cookies.jpg",
  cocktails: "bar.jpg",
  extras: "coffee.jpg",
};

const PACKS = new Set(["coffee", "cl-coffee"]);

export function visualFor(item: MenuItem): Visual {
  if (PACKS.has(item.category)) {
    const profile = item.profile ?? "PAZ";
    return { kind: "product", src: PRODUCT_IMAGES[profile] ?? PRODUCT_IMAGES.PAZ!, profile };
  }
  if (item.photo) return { kind: "photo", photo: photoSpec(item.photo) };
  const name = PHOTO_BY_CATEGORY[item.category] ?? "coffee.jpg";
  const base = photoSpec(name);
  // Iced espresso drinks are cold, not hot.
  if (item.category === "espresso" && (item.id.startsWith("iced-") || item.id === "affogato")) {
    return { kind: "photo", photo: { ...photoSpec("coffee.jpg") } };
  }
  return { kind: "photo", photo: base };
}

/** A chapter's photograph: the Colombian chapters by id, any other menu by its own photo key. */
export function photoForCategory(categoryId: string, photo?: string): PhotoSpec {
  return photoSpec(PHOTO_BY_CATEGORY[categoryId] ?? photo ?? "coffee.jpg");
}

export function isPackChapter(categoryId: string): boolean {
  return PACKS.has(categoryId);
}
