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
  cookies: "sweet.jpg",
  cocktails: "bar.jpg",
  extras: "coffee.jpg",
};

export function visualFor(item: MenuItem): Visual {
  if (item.image) return { kind: "product", src: item.image, profile: item.profile ?? "" };
  if (item.category === "coffee") {
    const profile = item.profile ?? "PAZ";
    return { kind: "product", src: PRODUCT_IMAGES[profile] ?? PRODUCT_IMAGES.PAZ!, profile };
  }
  const name = PHOTO_BY_CATEGORY[item.category] ?? "coffee.jpg";
  const base = photoSpec(name);
  // Iced espresso drinks are cold, not hot.
  if (item.category === "espresso" && (item.id.startsWith("iced-") || item.id === "affogato")) {
    return { kind: "photo", photo: { ...photoSpec("coffee.jpg") } };
  }
  return { kind: "photo", photo: base };
}

export function photoForCategory(categoryId: string): PhotoSpec {
  return photoSpec(PHOTO_BY_CATEGORY[categoryId] ?? "coffee.jpg");
}
