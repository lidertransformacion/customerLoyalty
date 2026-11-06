import { AnimatePresence } from "motion/react";
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { productionBlocked } from "@/src/data/program";

import { menuOnly } from "./core/mode";
import { useCopy } from "./i18n";
import { ItemScreen } from "./screens/item";
import { MenuScreen } from "./screens/menu";
import { useAccount } from "./state/account";
import { LensFilter } from "./ui/glass";
import { Toast } from "./ui/toast";

// The house account only loads where the full app runs; the menu-only build never downloads it.
const Celebrate = lazy(() => import("./motion/celebrate").then((m) => ({ default: m.Celebrate })));
const Home = lazy(() => import("./screens/home").then((m) => ({ default: m.Home })));
const Landing = lazy(() => import("./screens/landing").then((m) => ({ default: m.Landing })));
const Opening = lazy(() => import("./screens/opening").then((m) => ({ default: m.Opening })));
const OrderScreen = lazy(() => import("./screens/order").then((m) => ({ default: m.OrderScreen })));
const SettingsScreen = lazy(() => import("./screens/settings").then((m) => ({ default: m.SettingsScreen })));
const SignupScreen = lazy(() => import("./screens/signup").then((m) => ({ default: m.SignupScreen })));
const WalletScreen = lazy(() => import("./screens/wallet").then((m) => ({ default: m.WalletScreen })));
const TabBar = lazy(() => import("./ui/tabbar").then((m) => ({ default: m.TabBar })));

function RequireAccount({ children }: { children: React.ReactElement }) {
  const { ready, account } = useAccount();
  if (!ready) return null;
  if (!account) return <Navigate to="/welcome" replace />;
  return children;
}

export function App() {
  const copy = useCopy();
  const location = useLocation();
  const { note, dismissNote, celebration, account, ready } = useAccount();

  useEffect(() => {
    document.documentElement.lang = document.documentElement.lang || "es";
    if (menuOnly) document.documentElement.style.setProperty("--tabbar", "0px");
  }, []);

  if (productionBlocked()) {
    return <div className="pad pad-top serif" style={{ fontSize: 22 }}>{copy.productionBlocked}</div>;
  }

  const tabbed = !menuOnly && ["/home", "/menu", "/table"].some((path) => location.pathname.startsWith(path));

  if (menuOnly) {
    return (
      <>
        <LensFilter />
        {/* No `initial={false}` here: it would block the first animation of everything on the first screen, including the loops (floating bags, steam, bubbles). The first screen skips its own entrance in `Screen`. */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname.split("/")[1] ?? ""}>
            <Route path="/" element={<MenuScreen />} />
            <Route path="/chile" element={<MenuScreen />} />
            <Route path="/menu" element={<Navigate to={{ pathname: "/", search: location.search }} replace />} />
            <Route path="/item/:id" element={<ItemScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
        <Toast note={note} onDismiss={dismissNote} />
      </>
    );
  }

  return (
    <Suspense fallback={null}>
      <LensFilter />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname.split("/")[1] ?? ""}>
          <Route path="/" element={ready && account && location.search === "" ? <Opening /> : <Opening />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/home" element={<RequireAccount><Home /></RequireAccount>} />
          <Route path="/menu" element={<MenuScreen />} />
          <Route path="/chile" element={<MenuScreen />} />
          <Route path="/item/:id" element={<ItemScreen />} />
          <Route path="/table" element={<OrderScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/wallet" element={<RequireAccount><WalletScreen /></RequireAccount>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {tabbed ? <TabBar /> : null}
      <Toast note={note} onDismiss={dismissNote} />
      <Celebrate trigger={celebration} />
    </Suspense>
  );
}
