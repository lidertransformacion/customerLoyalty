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

import { courtesyFor, type Courtesy } from "../core/courtesy";
import { haptics } from "../core/haptics";
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
  courtesy: Courtesy | null;
  live: boolean;
  ask: () => void;
  simulate: (storeId: StoreId | null) => void;
  claim: () => void;
  dismiss: () => void;
};

const PresenceContext = createContext<Api | null>(null);

const PERMISSION_KEY = "libertario-presence-v1";
const COURTESY_KEY = "libertario-courtesy-v1";

type StoredPermission = { permission: "granted" | "denied" };

function isStoredPermission(value: unknown): value is StoredPermission {
  return (
    !!value &&
    typeof value === "object" &&
    ((value as StoredPermission).permission === "granted" ||
      (value as StoredPermission).permission === "denied")
  );
}

/** The courtesy on the table now, and the ids already activated or closed. Nothing is offered twice. */
type StoredCourtesy = { current: Courtesy | null; seen: string[] };

function isStoredCourtesy(value: unknown): value is StoredCourtesy {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredCourtesy>;
  return Array.isArray(stored.seen) && (stored.current === null || typeof stored.current === "object");
}

function notify(title: string, body: string): void {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;
    new Notification(title, { body, icon: "/icons/icon-192.png", tag: "libertario-courtesy" });
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
  const [stored, setStored] = useState<StoredCourtesy>(
    () => readJson(COURTESY_KEY, isStoredCourtesy) ?? { current: null, seen: [] },
  );
  const watchId = useRef<number | null>(null);
  const storedRef = useRef(stored);
  storedRef.current = stored;

  const remember = useCallback((next: StoredCourtesy) => {
    setStored(next);
    writeJson(COURTESY_KEY, next);
  }, []);

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

  // Walking in: the ledger moves to that house, and if the house has something for the guest, it shows. No clock on it.
  useEffect(() => {
    if (!account || !nearest?.inside) return;
    if (account.storeId !== nearest.store.id) {
      dispatch({ type: "chooseStore", storeId: nearest.store.id });
    }
    const current = storedRef.current;
    if (current.current && !current.current.claimed) return;
    const fresh = courtesyFor(account, nearest.store.id, new Date(), current.seen);
    if (!fresh) return;
    remember({ ...current, current: fresh });
    haptics.select();
    const text = copy.courtesy.catalog[fresh.kind];
    notify(`${copy.brand} · ${storeName(nearest.store.id)}`, `${text.title(storeName(nearest.store.id))}. ${text.detail}`);
  }, [account, dispatch, nearest, remember]);

  const courtesy = stored.current;
  const live = !!courtesy && !courtesy.claimed;

  const claim = useCallback(() => {
    const current = storedRef.current.current;
    if (!current || current.claimed) return;
    dispatch({ type: "claimCourtesy", courtesy: current });
    remember({ current: { ...current, claimed: true }, seen: [...storedRef.current.seen, current.id] });
  }, [dispatch, remember]);

  const dismiss = useCallback(() => {
    const current = storedRef.current.current;
    if (!current) return;
    remember({ current: null, seen: [...storedRef.current.seen, current.id] });
  }, [remember]);

  const simulate = useCallback((storeId: StoreId | null) => {
    setSimulated(storeId);
    if (storeId) haptics.select();
  }, []);

  const value = useMemo<Api>(
    () => ({ permission, position, nearest, simulated, courtesy, live, ask, simulate, claim, dismiss }),
    [permission, position, nearest, simulated, courtesy, live, ask, simulate, claim, dismiss],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence(): Api {
  const value = useContext(PresenceContext);
  if (!value) throw new Error("Presence provider is missing.");
  return value;
}
