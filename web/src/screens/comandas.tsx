import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { dayOf, deliveredOrders, hourOf, isFresh, minutesWaiting, momentOf, pendingOrders, searchOrders, validPrinterIp, type BoardOrder, type PrintProblem } from "../core/comandas";
import { useCopy } from "../i18n";
import { useComandas, type Labels } from "../state/comandas";
import { Glass } from "../ui/glass";
import { Press } from "../ui/press";
import { Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";

import "./comandas.css";

const icon = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const PrinterIcon = () => (
  <svg {...icon}><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v6H7z" /></svg>
);
const CheckIcon = () => (
  <svg {...icon} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const BackIcon = () => (
  <svg {...icon}><path d="M9 14l-4-4 4-4" /><path d="M5 10h9a5 5 0 0 1 0 10h-3" /></svg>
);
const TrashIcon = () => (
  <svg {...icon}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v5M14 11v5" /></svg>
);
const SearchIcon = () => (
  <svg {...icon}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
);

function Brand() {
  return (
    <div className="cm-brand">
      <img src="/brand/logo-white.png" alt="Libertario" decoding="async" />
      <span aria-hidden="true" />
      <img className="cm-brand-sura" src="/brand/sura-white.png" alt="Sura" decoding="async" />
    </div>
  );
}

function Items({ order }: { order: BoardOrder }) {
  return (
    <ul className="cm-items">
      {order.items.map((item, index) => (
        <li key={index}>
          <strong>{item.quantity} × {item.name}</strong>
          {item.detail ? (
            <ul>
              {item.detail.split(" + ").map((part) => (
                <li key={part}>{part}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * The bar's board for the Sura orders. New tickets wait in a grid and print by themselves;
 * «Entregado» moves a ticket to the history, where «Devolver» brings it back.
 */
export function ComandasScreen() {
  const copy = useCopy();
  const c = copy.comandas;
  const labels = useMemo<Labels>(() => ({ house: c.ticketHouse, client: c.ticketClient, order: c.order, cedula: c.cedula, reprint: c.ticketReprint, test: c.testTicket }), [c]);
  const board = useComandas(labels);
  const [tab, setTab] = useState<"new" | "delivered">("new");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<"today" | "all">("today");
  const [settings, setSettings] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!board.notice) return;
    const timer = window.setTimeout(board.clearNotice, 5000);
    return () => window.clearTimeout(timer);
  }, [board.notice, board.clearNotice]);

  if (!board.session) return <Login board={board} />;

  const pending = pendingOrders(board.orders);
  const today = dayOf(now.toISOString());
  const delivered = deliveredOrders(board.orders).filter((order) => range === "all" || dayOf(order.deliveredAt) === today);
  const shown = searchOrders(tab === "new" ? pending : delivered, query);
  const noticeText = board.notice ? (c.notices as Record<string, string>)[board.notice.code] ?? c.notices["print-other"] : "";

  return (
    <Screen testId="comandas" className="full cm-screen">
      <header className="cm-top">
        <Brand />
        <div className="cm-title">
          <h1>{c.title}</h1>
          <p>{c.place}</p>
        </div>
        <div className="cm-top-actions">
          <span className={`cm-live${board.offline ? " off" : ""}`} data-testid="comandas-live">
            <i aria-hidden="true" />
            {board.offline ? c.offline : c.live}
          </span>
          <Press className={`cm-chip${board.printerReady ? " on" : ""}`} onClick={() => setSettings(true)} data-testid="comandas-printer">
            <PrinterIcon />
            <span>{board.printerReady ? (board.paperLow ? c.paperLow : c.printerOn) : c.printerOff}</span>
          </Press>
          <Press className="cm-chip quiet" onClick={board.logout} title={c.signedAs(board.session.name)} data-testid="comandas-signout">
            {c.signOut}
          </Press>
        </div>
      </header>

      <div className="cm-bar">
        <div className="cm-tabs" role="tablist">
          <Press role="tab" aria-selected={tab === "new"} className={tab === "new" ? "on" : ""} onClick={() => setTab("new")} data-testid="comandas-tab-new">
            {c.tabNew}
            <b data-testid="comandas-count">{pending.length}</b>
          </Press>
          <Press role="tab" aria-selected={tab === "delivered"} className={tab === "delivered" ? "on" : ""} onClick={() => setTab("delivered")} data-testid="comandas-tab-delivered">
            {c.tabDelivered}
          </Press>
        </div>
        {tab === "delivered" ? (
          <div className="cm-range" role="group">
            <Press className={range === "today" ? "on" : ""} onClick={() => setRange("today")} data-testid="comandas-range-today">{c.today}</Press>
            <Press className={range === "all" ? "on" : ""} onClick={() => setRange("all")} data-testid="comandas-range-all">{c.all}</Press>
          </div>
        ) : null}
        <label className="cm-search">
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search} aria-label={c.search} enterKeyHint="search" autoComplete="off" data-testid="comandas-search" />
          {query ? (
            <Press type="button" onClick={() => setQuery("")} aria-label={c.clearSearch} data-testid="comandas-search-clear">×</Press>
          ) : null}
        </label>
      </div>

      <div className="scroll cm-body">
        {!board.loaded ? (
          <p className="cm-empty" data-testid="comandas-loading">{board.offline ? c.noNetwork : c.loading}</p>
        ) : shown.length === 0 ? (
          <div className="cm-empty" data-testid="comandas-empty">
            <strong>{query ? c.emptySearch : tab === "new" ? c.emptyNew : c.emptyDelivered}</strong>
            {!query && tab === "new" ? <span>{c.emptyNewHint}</span> : null}
          </div>
        ) : tab === "new" ? (
          <div className="cm-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((order) => (
                <Ticket key={order.number} order={order} now={now} board={board} failed={board.unprinted[order.number]} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Glass strong className="cm-history" data-testid="comandas-history">
            <div className="cm-row head" aria-hidden="true">
              <span>{c.columns.order}</span>
              <span>{c.columns.delivered}</span>
              <span>{c.columns.person}</span>
              <span>{c.columns.service}</span>
              <span>{c.columns.products}</span>
              <span />
            </div>
            {shown.map((order) => (
              <div className="cm-row" key={order.number} data-testid={`comandas-delivered-${order.number}`}>
                <span className="cm-row-number">#{order.number}<small>{hourOf(order.at)}</small></span>
                <span>{momentOf(order.deliveredAt)}</span>
                <span className="cm-row-person"><strong>{order.name || "—"}</strong><small>{c.cedula} {order.cedula}</small></span>
                <span>{order.area}</span>
                <span className="cm-row-products">{order.items.map((item) => `${item.quantity} × ${item.name}${item.detail ? ` (${item.detail})` : ""}`).join(" · ")}</span>
                <span className="cm-row-actions">
                  <Press className="cm-ghost" onClick={() => void board.reprint(order)} disabled={Boolean(board.busy[order.number])} aria-label={`${c.reprint} #${order.number}`} data-testid={`comandas-reprint-${order.number}`}>
                    <PrinterIcon />
                  </Press>
                  <Press className="cm-ghost wide" onClick={() => void board.giveBack(order.number)} disabled={Boolean(board.busy[order.number])} data-testid={`comandas-return-${order.number}`}>
                    <BackIcon />
                    {c.giveBack}
                  </Press>
                </span>
              </div>
            ))}
          </Glass>
        )}
      </div>

      <AnimatePresence>
        {board.notice ? (
          <motion.div className={`cm-notice ${board.notice.kind}`} role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} data-testid="comandas-notice">
            {noticeText}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="cm-sheets">
        <Sheet open={settings} onClose={() => setSettings(false)} title={c.printerTitle}>
          <PrinterSettings board={board} onDone={() => setSettings(false)} />
        </Sheet>
      </div>
    </Screen>
  );
}

type Board = ReturnType<typeof useComandas>;

function Ticket({ order, now, board, failed }: { order: BoardOrder; now: Date; board: Board; failed: PrintProblem | undefined }) {
  const c = useCopy().comandas;
  const minutes = minutesWaiting(order, now);
  // a ticket is «new» for its first minute on the board
  const fresh = isFresh(order, now);
  const busy = board.busy[order.number];
  const [asking, setAsking] = useState(false);
  return (
    <motion.article
      layout
      className="cm-ticket-wrap"
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      data-testid={`comandas-ticket-${order.number}`}
    >
      <Glass strong className={`cm-ticket${fresh ? " fresh" : ""}`}>
        {fresh ? <span className="cm-fresh" data-testid={`comandas-fresh-${order.number}`}>{c.fresh}</span> : null}
        <header>
          <span className="cm-number">#{order.number}</span>
          <span className={`cm-wait${minutes >= 10 ? " late" : ""}`}>
            {hourOf(order.at)}
            <small>{c.waiting(minutes)}</small>
          </span>
        </header>
        <div className="cm-person">
          <strong data-testid={`comandas-name-${order.number}`}>{order.name || "—"}</strong>
          <span>{c.cedula} {order.cedula}</span>
          <em>{order.area}</em>
        </div>
        <Items order={order} />
        <p className={`cm-printed${failed ? " failed" : order.printedAt ? " ok" : ""}`} data-testid={`comandas-printstate-${order.number}`}>
          <PrinterIcon />
          {failed ? `${c.printFailed}: ${(c.notices as Record<string, string>)[`print-${failed}`]}` : order.printedAt ? c.printed(hourOf(order.printedAt)) : c.notPrinted}
        </p>
        {asking ? (
          <footer className="cm-ask" data-testid={`comandas-ask-${order.number}`}>
            <strong>{c.removeAsk}</strong>
            <Press className="cm-ghost wide" onClick={() => setAsking(false)} data-testid={`comandas-remove-no-${order.number}`}>
              {c.removeNo}
            </Press>
            <Press className="cm-deliver danger" onClick={() => void board.remove(order.number)} disabled={Boolean(busy)} data-testid={`comandas-remove-yes-${order.number}`}>
              <TrashIcon />
              {c.removeYes}
            </Press>
          </footer>
        ) : (
        <footer>
          <Press className="cm-ghost danger" onClick={() => setAsking(true)} disabled={Boolean(busy)} aria-label={`${c.remove} #${order.number}`} data-testid={`comandas-remove-${order.number}`}>
            <TrashIcon />
          </Press>
          <Press className="cm-ghost wide" onClick={() => void board.reprint(order)} disabled={Boolean(busy)} title={order.printedAt ? c.reprint : c.print} aria-label={`${order.printedAt ? c.reprint : c.print} #${order.number}`} data-testid={`comandas-reprint-${order.number}`}>
            <PrinterIcon />
            <span>{order.printedAt ? c.reprint : c.print}</span>
          </Press>
          <Press className="cm-deliver" onClick={() => void board.deliver(order.number)} disabled={Boolean(busy)} data-testid={`comandas-deliver-${order.number}`}>
            <CheckIcon />
            {c.deliver}
          </Press>
        </footer>
        )}
      </Glass>
    </motion.article>
  );
}

function Login({ board }: { board: Board }) {
  const c = useCopy().comandas;
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user.trim() && password && !board.entering) void board.login(user, password);
  };
  const error = board.loginError === "credentials" ? c.wrongLogin : board.loginError === "locked" ? c.lockedLogin : board.loginError ? c.noNetwork : "";
  return (
    <Screen testId="comandas-login" dark className="full cm-screen cm-login">
      <div className="scroll cm-login-body">
        <Brand />
        <Glass strong className="cm-login-card">
          <h1>{c.loginTitle}</h1>
          <p>{c.loginLead}</p>
          <form onSubmit={onSubmit}>
            <label>
              <span>{c.user}</span>
              <input value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} data-testid="comandas-user" />
            </label>
            <label>
              <span>{c.password}</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" data-testid="comandas-password" />
            </label>
            {error ? <p className="cm-login-error" role="alert" data-testid="comandas-login-error">{error}</p> : null}
            <Press type="submit" className="cm-deliver big" disabled={board.entering || !user.trim() || !password} data-testid="comandas-enter">
              {board.entering ? c.entering : c.enter}
            </Press>
          </form>
        </Glass>
      </div>
    </Screen>
  );
}

function PrinterSettings({ board, onDone }: { board: Board; onDone: () => void }) {
  const c = useCopy().comandas;
  const [ip, setIp] = useState(board.printer.ip);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"ok" | PrintProblem | null>(null);
  const ready = validPrinterIp(ip.trim());

  const test = async () => {
    board.setPrinter({ ip });
    setTesting(true);
    setResult(null);
    const answer = await board.testPrint();
    setTesting(false);
    setResult(answer.ok ? "ok" : answer.problem);
  };

  return (
    <div className="cm-settings">
      <p className="cm-settings-lead">{c.printerLead}</p>
      <label className="cm-field">
        <span>{c.printerIp}</span>
        <input value={ip} onChange={(event) => setIp(event.target.value)} onBlur={() => board.setPrinter({ ip })} inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="192.168.1.50" data-testid="comandas-printer-ip" />
        <small>{c.printerIpHint}</small>
      </label>
      <div className="cm-field">
        <span>{c.paper}</span>
        <div className="cm-range light" role="group">
          <Press className={board.printer.paper === "80" ? "on" : ""} onClick={() => board.setPrinter({ paper: "80" })} data-testid="comandas-paper-80">{c.paper80}</Press>
          <Press className={board.printer.paper === "58" ? "on" : ""} onClick={() => board.setPrinter({ paper: "58" })} data-testid="comandas-paper-58">{c.paper58}</Press>
        </div>
      </div>
      <Press className={`cm-switch${board.printer.auto ? " on" : ""}`} role="switch" aria-checked={board.printer.auto} onClick={() => board.setPrinter({ auto: !board.printer.auto })} data-testid="comandas-auto">
        <span>{c.auto}</span>
        <i aria-hidden="true" />
      </Press>
      {result ? (
        <p className={`cm-test ${result === "ok" ? "ok" : "bad"}`} role="status" data-testid="comandas-test-result">
          {result === "ok" ? c.testOk : `${(c.notices as Record<string, string>)[`print-${result}`]}${result === "unreachable" && ready ? ` ${c.certificate(ip.trim())}` : ""}`}
        </p>
      ) : null}
      <div className="cm-settings-actions">
        <Press className="cm-ghost wide" onClick={() => void test()} disabled={!ready || testing} data-testid="comandas-test">
          <PrinterIcon />
          {testing ? c.testing : c.test}
        </Press>
        <Press
          className="cm-deliver"
          onClick={() => {
            board.setPrinter({ ip });
            onDone();
          }}
          data-testid="comandas-printer-done"
        >
          {c.done}
        </Press>
      </div>
    </div>
  );
}
