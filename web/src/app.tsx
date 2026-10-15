import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { productionBlocked } from "@/src/data/program";

import { cornerIdFromPath } from "./core/corners";
import { menuOnly } from "./core/mode";
import { useCopy } from "./i18n";
import { Celebrate } from "./motion/celebrate";
import { CornersScreen } from "./screens/corners";
import { Home } from "./screens/home";
import { ItemScreen } from "./screens/item";
import { Landing } from "./screens/landing";
import { MenuScreen } from "./screens/menu";
import { Opening } from "./screens/opening";
import { OrderScreen } from "./screens/order";
import { SettingsScreen } from "./screens/settings";
import { SignupScreen } from "./screens/signup";
import { WalletScreen } from "./screens/wallet";
import { useAccount } from "./state/account";
import { LensFilter } from "./ui/glass";
import { TabBar } from "./ui/tabbar";
import { Toast } from "./ui/toast";

/** `/corner-sura` and `/corners-sura` are the same bar as `/corner/sura`; anything else goes home. */
function Fallback() {
  const location = useLocation();
  const id = cornerIdFromPath(location.pathname);
  return <Navigate to={id ? { pathname: `/corner/${id}`, search: location.search } : "/"} replace />;
}

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

  const tabbed = !menuOnly && ["/home", "/menu", "/table"].some((path) => location.pathname.startsWith(path)) && !location.pathname.startsWith("/corner");

  if (menuOnly) {
    return (
      <>
        <LensFilter />
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname.split("/")[1] ?? ""}>
            <Route path="/" element={<MenuScreen />} />
            <Route path="/menu" element={<Navigate to={{ pathname: "/", search: location.search }} replace />} />
            <Route path="/item/:id" element={<ItemScreen />} />
            <Route path="/corners" element={<CornersScreen />} />
            <Route path="/corner/:corner" element={<MenuScreen />} />
            <Route path="/corner/:corner/item/:id" element={<ItemScreen />} />
            <Route path="*" element={<Fallback />} />
          </Routes>
        </AnimatePresence>
        <Toast note={note} onDismiss={dismissNote} />
      </>
    );
  }

  return (
    <>
      <LensFilter />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname.split("/")[1] ?? ""}>
          <Route path="/" element={ready && account && location.search === "" ? <Opening /> : <Opening />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/home" element={<RequireAccount><Home /></RequireAccount>} />
          <Route path="/menu" element={<MenuScreen />} />
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
    </>
  );
}
