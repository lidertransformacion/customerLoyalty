import type { PhotoSpec } from "../motion/living-photo";

/**
 * Studio photographs of the Sura menu: square, on white, the plate kept (Drive folder «Menú Sura»).
 * Published at /menu/su/su-p-<slug>.webp (640 px) and @2x by scripts/sura-studio.py.
 * Generated: run the script again rather than editing this file.
 */
export const SURA_STUDIO: Record<string, PhotoSpec> = {
  "su-p-americano": { src: "/menu/su/su-p-americano.webp", mood: "still", studio: true, native: 1024 },
  "su-p-arepa": { src: "/menu/su/su-p-arepa.webp", mood: "still", studio: true, native: 1024 },
  "su-p-completo-croissant": { src: "/menu/su/su-p-completo-croissant.webp", mood: "still", studio: true, native: 1024 },
  "su-p-completo-huevos": { src: "/menu/su/su-p-completo-huevos.webp", mood: "still", studio: true, native: 1024 },
  "su-p-ejecutivo-granola": { src: "/menu/su/su-p-ejecutivo-granola.webp", mood: "still", studio: true, native: 1024 },
  "su-p-ejecutivo": { src: "/menu/su/su-p-ejecutivo.webp", mood: "still", studio: true, native: 1024 },
  "su-p-galleta": { src: "/menu/su/su-p-galleta.webp", mood: "still", studio: true, native: 1024 },
  "su-p-huevos-fritos": { src: "/menu/su/su-p-huevos-fritos.webp", mood: "still", studio: true, native: 1024 },
  "su-p-huevos-revueltos": { src: "/menu/su/su-p-huevos-revueltos.webp", mood: "still", studio: true, native: 1024 },
  "su-p-infusion": { src: "/menu/su/su-p-infusion.webp", mood: "still", studio: true, native: 1024 },
  "su-p-jugo": { src: "/menu/su/su-p-jugo.webp", mood: "still", studio: true, native: 1024 },
  "su-p-latte-deslactosado": { src: "/menu/su/su-p-latte-deslactosado.webp", mood: "still", studio: true, native: 1024 },
  "su-p-latte": { src: "/menu/su/su-p-latte.webp", mood: "still", studio: true, native: 1024 },
  "su-p-pandeyuca": { src: "/menu/su/su-p-pandeyuca.webp", mood: "still", studio: true, native: 1024 },
};

/** The same photographs with their white turned transparent, for chapter cards and heroes on a white ground. */
export const SURA_COVERS: Record<string, PhotoSpec> = {
  "su-cover-ejecutivo-granola": { src: "/menu/su/su-cover-ejecutivo-granola.webp", mood: "still", cutout: true, studio: true, native: 1024 },
  "su-cover-portada-completos": { src: "/menu/su/su-cover-portada-completos.webp", mood: "still", cutout: true, studio: true, native: 1024 },
  "su-cover-portada-refrigerios": { src: "/menu/su/su-cover-portada-refrigerios.webp", mood: "still", cutout: true, studio: true, native: 1024 },
};
