import { areaById, type SuraArea } from "../core/sura";

/** The service the guest orders from, kept on the phone; and whether a QR set it (then it is not asked again). */
const AREA_KEY = "libertario-sura-area-v1";
const FROM_QR_KEY = "libertario-sura-area-qr-v1";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* the phone forgets; the order still works */
  }
}

export type AreaChoice = { area: SuraArea | null; fixed: boolean };

/**
 * The area a QR carries (`?area=c100-muestras`) wins, is remembered and is fixed: the menu shows only what that
 * service may order and the order does not ask where the guest is. Without one, the area chosen by hand before.
 */
export function readSuraArea(): AreaChoice {
  let fromUrl: string | null = null;
  try {
    fromUrl = new URLSearchParams(window.location.search).get("area");
  } catch {
    /* no address to read */
  }
  const scanned = areaById(fromUrl);
  if (scanned) {
    write(AREA_KEY, scanned.id);
    write(FROM_QR_KEY, "1");
    return { area: scanned, fixed: true };
  }
  const stored = areaById(read(AREA_KEY));
  return { area: stored, fixed: !!stored && read(FROM_QR_KEY) === "1" };
}

/** An area chosen by hand on the order screen. */
export function rememberSuraArea(area: SuraArea): void {
  write(AREA_KEY, area.id);
  write(FROM_QR_KEY, "");
}
