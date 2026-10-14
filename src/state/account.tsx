import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { itemById } from "@/src/data/menu";
import {
  CUPS_FOR_FILTER,
  INITIAL_STORE,
  isCup,
  pointsForPrice,
  pointsStillNeeded,
  REWARDS,
  storeById,
  storeLedgerName,
  storeName,
  WELCOME_BONUS,
  type Reward,
} from "@/src/data/program";
import { copy } from "@/src/i18n/strings";

const STORAGE_KEY = "libertario-home-v1";

export type Movement = {
  id: string;
  date: string;
  label: string;
  store: string | null;
  points: number;
};

export type TableLine = {
  itemId: string;
  quantity: number;
};

export type Account = {
  version: 1;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  code: string;
  points: number;
  stamps: number;
  storeId: string;
  table: string;
  order: TableLine[];
  movements: Movement[];
};

export type Signup = {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
};

type RoastFlash = { line: string } | null;

type AccountApi = {
  ready: boolean;
  account: Account | null;
  note: string | null;
  roast: RoastFlash;
  signUp: (signup: Signup) => void;
  chooseStore: (id: string) => void;
  setTable: (table: string) => void;
  postItem: (itemId: string) => void;
  addToTable: (itemId: string) => void;
  removeFromTable: (itemId: string) => void;
  postOrder: () => void;
  callFloor: () => void;
  redeem: (rewardId: string) => void;
  forget: () => void;
  dismissNote: () => void;
};

const AccountContext = createContext<AccountApi | null>(null);

function movement(
  label: string,
  points: number,
  store: string | null,
): Movement {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    label,
    store,
    points,
  };
}

function codeFor(idNumber: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let extra = "";
  for (let i = 0; i < 3; i += 1) {
    extra += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "L";
  }
  return `LBT-${idNumber.slice(-4)}-${extra}`;
}

function createAccount(signup: Signup): Account {
  return {
    version: 1,
    name: signup.name.trim(),
    phone: signup.phone.trim(),
    email: signup.email.trim(),
    idNumber: signup.idNumber.trim(),
    code: codeFor(signup.idNumber.trim()),
    points: WELCOME_BONUS,
    stamps: 0,
    storeId: INITIAL_STORE,
    table: "4",
    order: [],
    movements: [movement(copy.ledger.welcome, WELCOME_BONUS, null)],
  };
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<Account>;
  return (
    account.version === 1 &&
    typeof account.code === "string" &&
    typeof account.points === "number"
  );
}

function applyCups(
  stamps: number,
  cups: number,
): { stamps: number; eighths: number } {
  let count = stamps;
  let eighths = 0;
  for (let i = 0; i < cups; i += 1) {
    count += 1;
    if (count >= CUPS_FOR_FILTER) {
      eighths += 1;
      count = 0;
    }
  }
  return { stamps: count, eighths };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [roast, setRoast] = useState<RoastFlash>(null);

  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!alive) return;
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (isAccount(parsed)) setAccount(parsed);
        } catch {
          setAccount(null);
        }
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const save = useCallback((next: Account) => {
    setAccount(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const flashRoast = useCallback((line: string) => {
    setRoast({ line });
    const wait = line ? 2100 : 1500;
    setTimeout(() => setRoast(null), wait);
  }, []);

  const signUp = useCallback(
    (signup: Signup) => {
      const created = createAccount(signup);
      save(created);
      setNote(copy.signup.welcomeNote);
    },
    [save],
  );

  const chooseStore = useCallback(
    (id: string) => {
      if (!account) return;
      save({ ...account, storeId: id });
    },
    [account, save],
  );

  const setTable = useCallback(
    (table: string) => {
      if (!account) return;
      save({ ...account, table: table.replace(/\D/g, "").slice(0, 3) });
    },
    [account, save],
  );

  const closePurchase = useCallback(
    (
      current: Account,
      purchased: { name: string; price: number; category: string }[],
      order: TableLine[],
    ) => {
      const store = storeLedgerName(current.storeId);
      let points = current.points;
      const movements = [...current.movements];
      let cups = 0;
      for (const item of purchased) {
        const earned = pointsForPrice(item.price);
        points += earned;
        movements.unshift(movement(item.name, earned, store));
        if (isCup(item.category)) cups += 1;
      }
      const applied = applyCups(current.stamps, cups);
      for (let i = 0; i < applied.eighths; i += 1) {
        movements.unshift(movement(copy.ledger.eighthCup, 0, store));
      }
      save({
        ...current,
        points,
        stamps: applied.stamps,
        movements,
        order,
      });
      if (applied.eighths > 0) flashRoast(copy.notes.eighthCupToast);
      else if (cups > 0) flashRoast("");
    },
    [flashRoast, save],
  );

  const postItem = useCallback(
    (itemId: string) => {
      if (!account) return;
      const item = itemById(itemId);
      if (!item) return;
      closePurchase(account, [item], account.order);
      setNote(copy.notes.postedItem(item.name));
    },
    [account, closePurchase],
  );

  const addToTable = useCallback(
    (itemId: string) => {
      if (!account) return;
      const order = account.order.map((line) => ({ ...line }));
      const line = order.find((entry) => entry.itemId === itemId);
      if (line) line.quantity += 1;
      else order.push({ itemId, quantity: 1 });
      save({ ...account, order });
    },
    [account, save],
  );

  const removeFromTable = useCallback(
    (itemId: string) => {
      if (!account) return;
      const order = account.order
        .map((line) =>
          line.itemId === itemId
            ? { ...line, quantity: line.quantity - 1 }
            : line,
        )
        .filter((line) => line.quantity > 0);
      save({ ...account, order });
    },
    [account, save],
  );

  const postOrder = useCallback(() => {
    if (!account) return;
    const purchased = account.order.flatMap((line) => {
      const item = itemById(line.itemId);
      if (!item) return [];
      return Array.from({ length: line.quantity }, () => item);
    });
    if (purchased.length === 0) {
      setNote(copy.notes.emptyTable);
      return;
    }
    closePurchase(account, purchased, []);
    setNote(copy.notes.orderPosted);
  }, [account, closePurchase]);

  const callFloor = useCallback(() => {
    if (!account) return;
    const store = storeById(account.storeId);
    setNote(copy.notes.floorCall(account.table || "—", storeName(store.id)));
  }, [account]);

  const redeem = useCallback(
    (rewardId: string) => {
      if (!account) return;
      const reward: Reward | undefined = REWARDS.find(
        (item) => item.id === rewardId,
      );
      if (!reward) return;
      const missing = pointsStillNeeded(account.points, reward.points);
      if (missing > 0) {
        setNote(copy.notes.cannotRedeem(missing, copy.rewards[reward.id].name));
        return;
      }
      const store = storeLedgerName(account.storeId);
      const name = copy.rewards[reward.id].name;
      save({
        ...account,
        points: account.points - reward.points,
        movements: [
          movement(copy.ledger.redemption(name), -reward.points, store),
          ...account.movements,
        ],
      });
      setNote(copy.notes.redeemed(name, reward.points));
    },
    [account, save],
  );

  const forget = useCallback(() => {
    setAccount(null);
    setNote(null);
    void AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const dismissNote = useCallback(() => setNote(null), []);

  const value = useMemo<AccountApi>(
    () => ({
      ready,
      account,
      note,
      roast,
      signUp,
      chooseStore,
      setTable,
      postItem,
      addToTable,
      removeFromTable,
      postOrder,
      callFloor,
      redeem,
      forget,
      dismissNote,
    }),
    [
      account,
      addToTable,
      callFloor,
      chooseStore,
      dismissNote,
      forget,
      note,
      postItem,
      postOrder,
      ready,
      redeem,
      removeFromTable,
      roast,
      setTable,
      signUp,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount(): AccountApi {
  const value = useContext(AccountContext);
  if (!value) throw new Error("Account provider is missing.");
  return value;
}
