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
  // the same chapters in the Chile layout (core/colombia.ts)
  "co-coffee": "coffee.jpg",
  "co-cold": "coffee.jpg",
  "co-filter": "filter.jpg",
  "co-espresso": "espresso.jpg",
  "co-signature": "drinks.jpg",
  "co-matcha": "matcha.jpg",
  "co-other": "drinks.jpg",
  "co-eggs": "brunch.jpg",
  "co-parfait": "sweet.jpg",
  "co-toast": "toast.jpg",
  "co-bakery": "bread.jpg",
  "co-sandwiches": "sandwiches.jpg",
  "co-bowls": "bowls.jpg",
  "co-cakes": "cakes.jpg",
  "co-cookies": "cookies.jpg",
  "co-cocktails": "bar.jpg",
  "co-extras": "coffee.jpg",
  "co-formats": "coffee.jpg",
  "co-soup": "brunch.jpg",
};

const PACKS = new Set(["coffee", "cl-coffee", "co-coffee"]);

export function visualFor(item: MenuItem): Visual {
  // Its own studio photograph comes first: the real bag, the real plate.
  if (item.studio) return { kind: "photo", photo: photoSpec(item.studio) };
  if (PACKS.has(item.category)) {
    const profile = item.profile ?? "PAZ";
    return { kind: "product", src: PRODUCT_IMAGES[profile] ?? PRODUCT_IMAGES.PAZ!, profile };
  }
  if (item.photo) return { kind: "photo", photo: photoSpec(item.photo) };
  const name = PHOTO_BY_CATEGORY[item.category] ?? "coffee.jpg";
  const base = photoSpec(name);
  // Iced espresso drinks are cold, not hot.
  if ((item.category === "espresso" || item.category === "co-espresso") && (item.id.startsWith("iced-") || item.id === "affogato")) {
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
