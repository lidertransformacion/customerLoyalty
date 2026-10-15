import type { PhotoSpec } from "../motion/living-photo";

/** Category photography, served from /public/menu. The native app bundles the same files. */
export function photoUrl(name: string): string {
  return `/menu/${name}`;
}

export const coverPhoto = photoUrl("coffee.jpg");

/** Product renders from the Libertario store, served from /public/products. */
export const PRODUCT_IMAGES: Record<string, string> = {
  PAZ: "/products/paz-1.png",
  LIBRE: "/products/libre-1.png",
  ROCK: "/products/rock-1.png",
  PUNK: "/products/punk-1.png",
  IMPACTO: "/products/impacto-1.png",
  COMPETITION: "/products/rock-2.png",
};

export const BRAND = {
  logoWhite: "/brand/logo-white.png",
  logoDark: "/brand/logo.png",
  wordmark: "/brand/logo-light.png",
  isotipoWhite: "/brand/isotipo-white.png",
  isotipoDark: "/brand/isotipo-dark.png",
};

/**
 * How each photograph lives. Every point is a percentage of the photograph
 * itself (not of the frame), so the water lands on the coffee and the steam
 * leaves the cup whatever the size of the card.
 */
export const PHOTOS: Record<string, PhotoSpec> = {
  "filter.jpg": {
    src: photoUrl("filter.jpg"),
    mood: "pour",
    focus: "50% 40%",
    pours: [{ from: { x: 60.5, y: 33 }, to: { x: 64, y: 70 }, width: 1.7, color: "water", spiral: 5.5, body: false }],
    steam: [{ x: 50, y: 66 }, { x: 72, y: 68 }],
  },
  "matcha.jpg": {
    src: photoUrl("matcha.jpg"),
    mood: "pour",
    focus: "50% 45%",
    pours: [{ from: { x: 55, y: 22 }, to: { x: 54, y: 38 }, width: 2.2, color: "matcha", spiral: 1, speed: 0.8, body: false }],
    steam: [{ x: 22, y: 50 }, { x: 46, y: 66 }],
  },
  "toast.jpg": {
    src: photoUrl("toast.jpg"),
    mood: "pour",
    focus: "50% 50%",
    pours: [{ from: { x: 54, y: 0 }, to: { x: 54, y: 41 }, width: 1.1, color: "honey", spiral: 0.6, speed: 0.35, body: false }],
    steam: [{ x: 38, y: 40 }, { x: 62, y: 50 }],
  },
  "coffee.jpg": {
    src: photoUrl("coffee.jpg"),
    mood: "cold",
    focus: "50% 62%",
    sweat: [{ x: 10, y: 42, w: 36, h: 44 }, { x: 60, y: 46, w: 28, h: 44 }],
    fizz: [{ x: 14, y: 50, w: 28, h: 34 }],
  },
  "drinks.jpg": {
    src: photoUrl("drinks.jpg"),
    mood: "fizz",
    focus: "50% 60%",
    fizz: [{ x: 8, y: 52, w: 20, h: 26 }, { x: 38, y: 36, w: 24, h: 18 }, { x: 74, y: 46, w: 16, h: 32 }],
    sweat: [{ x: 8, y: 50, w: 20, h: 30 }, { x: 74, y: 44, w: 16, h: 36 }],
  },
  "bar.jpg": { src: photoUrl("bar.jpg"), mood: "fizz", focus: "50% 55%", fizz: [{ x: 35, y: 45, w: 30, h: 30 }] },
  "espresso.jpg": {
    src: photoUrl("espresso.jpg"),
    mood: "hot",
    focus: "50% 50%",
    steam: [{ x: 26, y: 20 }, { x: 66, y: 10 }, { x: 66, y: 33 }, { x: 26, y: 47 }, { x: 68, y: 59 }, { x: 24, y: 73 }, { x: 68, y: 87 }],
  },
  "brunch.jpg": { src: photoUrl("brunch.jpg"), mood: "hot", focus: "50% 55%", steam: [{ x: 46, y: 20 }, { x: 52, y: 26 }, { x: 68, y: 78 }, { x: 74, y: 84 }] },
  "bread.jpg": { src: photoUrl("bread.jpg"), mood: "hot", focus: "50% 55%", steam: [{ x: 74, y: 84 }, { x: 28, y: 54 }, { x: 64, y: 30 }, { x: 16, y: 10 }] },
  "sandwiches.jpg": { src: photoUrl("sandwiches.jpg"), mood: "hot", focus: "50% 55%", steam: [{ x: 40, y: 42 }, { x: 58, y: 48 }] },
  "cakes.jpg": { src: photoUrl("cakes.jpg"), mood: "still", focus: "50% 50%" },
  "sweet.jpg": { src: photoUrl("sweet.jpg"), mood: "still", focus: "50% 55%" },
  "bowls.jpg": { src: photoUrl("bowls.jpg"), mood: "still", focus: "50% 55%" },
};

/** Brand clips from the Libertario site, cut to short square loops in /public/video. */
export const CLIPS: Record<string, PhotoSpec> = {
  roast: { src: "/video/beans.jpg", video: "/video/beans.mp4", mood: "hot", focus: "50% 50%" },
  cherries: { src: "/video/cherries.jpg", video: "/video/cherries.mp4", mood: "still", focus: "50% 50%" },
};

export function photoSpec(name: string): PhotoSpec {
  return PHOTOS[name] ?? { src: photoUrl(name), mood: "still" };
}
