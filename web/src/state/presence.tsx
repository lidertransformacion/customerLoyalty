import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { storeName, type StoreId } from "@/src/data/program";
import { copy } from "@/src/i18n/strings";

import { haptics } from "../core/haptics";
import {
  isLive,
  promoId,
  remainingMs,
  startPromo,
  type ActivePromo,
} from "../core/promo";
import { readJson, writeJson } from "../core/storage";
import { geoById, nearestStore, type LatLng, type Nearest } from "../core/stores";
import { useAccount } from "./account";
import { useCity } from "./catalog";

export type Permission = "idle" | "asking" | "granted" | "denied" | "unsupported";

type Api = {
  permission: Permission;
  position: LatLng | null;
  nearest: Nearest | null;
  simulated: StoreId | null;
  promo: ActivePromo | null;
  live: boolean;
  remaining: number;
  ask: () => void;
  simulate: (storeId: StoreId | null) => void;
  claim: () => void;
  dismiss: () => void;
};

const PresenceContext = createContext<Api | null>(null);

const PERMISSION_KEY = "libertario-presence-v1";
const PROMO_KEY = "libertario-promo-v1";

type StoredPermission = { permission: "granted" | "denied" };

function isStoredPermission(value: unknown): value is StoredPermission {
  return (
    !!value &&
    typeof value === "object" &&
    ((value as StoredPermission).permission === "granted" ||
      (value as StoredPermission).permission === "denied")
  );
}

function isPromo(value: unknown): value is ActivePromo {
  if (!value || typeof value !== "object") return false;
  const promo = value as Partial<ActivePromo>;
  return typeof promo.id === "string" && typeof promo.expiresAt === "string" && typeof promo.kind === "string";
}

function notify(title: string, body: string): void {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;
    new Notification(title, { body, icon: "/icons/icon-192.png", tag: "libertario-promo" });
  } catch {
    /* notifications are optional */
  }
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { account, dispatch } = useAccount();
  const { placeFromPosition } = useCity();
  const [permission, setPermission] = useState<Permission>("idle");
  const [position, setPosition] = useState<LatLng | null>(null);
  const [simulated, setSimulated] = useState<StoreId | null>(null);
  const [promo, setPromo] = useState<ActivePromo | null>(() => readJson(PROMO_KEY, isPromo));
  const [now, setNow] = useState(() => Date.now());
  const watchId = useRef<number | null>(null);
  const promoRef = useRef<ActivePromo | null>(promo);
  promoRef.current = promo;

  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }
    if (watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (fix) => {
        const next = { lat: fix.coords.latitude, lng: fix.coords.longitude };
        setPosition(next);
        placeFromPosition(next);
        setPermission("granted");
        writeJson(PERMISSION_KEY, { permission: "granted" });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermission("denied");
          writeJson(PERMISSION_KEY, { permission: "denied" });
        }
      },
      { enableHighAccuracy: false, maximumAge: 20_000, timeout: 15_000 },
    );
  }, [placeFromPosition]);

  useEffect(() => {
    const stored = readJson(PERMISSION_KEY, isStoredPermission);
    if (stored?.permission === "granted") startWatch();
    else if (stored?.permission === "denied") setPermission("denied");
    return () => {
      if (watchId.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [startWatch]);

  const ask = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission("asking");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch {
      /* optional */
    }
    startWatch();
  }, [startWatch]);

  const effective = useMemo<LatLng | null>(() => {
    if (simulated) {
      const geo = geoById(simulated);
      return { lat: geo.lat, lng: geo.lng };
    }
    return position;
  }, [position, simulated]);

  const nearest = useMemo(() => (effective ? nearestStore(effective) : null), [effective]);

  // Walking in starts the promo once per house per day, and moves the ledger to that house.
  useEffect(() => {
    if (!account || !nearest?.inside) return;
    const date = new Date();
    const id = promoId(nearest.store.id, date);
    const current = promoRef.current;
    if (current && current.id === id) return;
    const fresh = startPromo(nearest.store.id, date);
    setPromo(fresh);
    writeJson(PROMO_KEY, fresh);
    if (account.storeId !== nearest.store.id) {
      dispatch({ type: "chooseStore", storeId: nearest.store.id });
    }
    haptics.select();
    const text = copy.promo.catalog[fresh.kind];
    notify(`${copy.brand} · ${storeName(nearest.store.id)}`, `${text.title}. ${copy.promo.minutesLeft("10:00")}.`);
  }, [account, dispatch, nearest]);

  const live = isLive(promo, new Date(now));

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [live]);

  const claim = useCallback(() => {
    const current = promoRef.current;
    if (!current || !isLive(current, new Date())) return;
    dispatch({ type: "claimPromo", promo: current });
    const claimed = { ...current, claimed: true };
    setPromo(claimed);
    writeJson(PROMO_KEY, claimed);
  }, [dispatch]);

  const dismiss = useCallback(() => {
    const current = promoRef.current;
    if (!current) return;
    const closed = { ...current, claimed: true };
    setPromo(closed);
    writeJson(PROMO_KEY, closed);
  }, []);

  const simulate = useCallback((storeId: StoreId | null) => {
    setSimulated(storeId);
    if (storeId) haptics.select();
  }, []);

  const value = useMemo<Api>(
    () => ({
      permission,
      position,
      nearest,
      simulated,
      promo,
      live,
      remaining: promo ? remainingMs(promo, new Date(now)) : 0,
      ask,
      simulate,
      claim,
      dismiss,
    }),
    [permission, position, nearest, simulated, promo, live, now, ask, simulate, claim, dismiss],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence(): Api {
  const value = useContext(PresenceContext);
  if (!value) throw new Error("Presence provider is missing.");
  return value;
}
