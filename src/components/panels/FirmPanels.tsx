import { useState } from "react";
import { Label, Panel, Portrait, PxButton } from "@/components/ui/pixel";
import { MAX_TRADERS, archetypeById, personalityById } from "@/data/traders";
import { cn, fmt, fmtSigned } from "@/lib/format";
import { useStats } from "@/services/stats";
import { openPanel, store, todayPnl, useGame } from "@/store/store";

/** ANALYTICS / RESEARCH — equity curve, senaste 40 trades och trader-tabell. */
export function AnalyticsPanel() {
  const ledger = useGame((s) => s.ledger);
  const traders = useGame((s) => s.traders);
  const last = ledger.slice(-40);
  const maxAbs = Math.max(0.001, ...last.map((e) => Math.abs(e.pnl)));
  let run = 0;
  const equity = ledger.map((e) => (run += e.pnl));
  const maxEq = Math.max(0.001, ...equity.map(Math.abs));

  return (
    <Panel title="ANALYTICS" className="max-w-4xl">
      <Label>EQUITY CURVE</Label>
      <div className="px-inset mt-1 flex h-28 items-end gap-px p-2">
        {equity.slice(-80).map((v, i) => (
          <div
            key={i}
            className={cn("flex-1", v >= 0 ? "bg-gain" : "bg-loss")}
            style={{ height: `${Math.max(2, (Math.abs(v) / maxEq) * 100)}%` }}
          />
        ))}
        {!equity.length && <span className="m-auto text-muted-foreground">NO CLOSED TRADES YET.</span>}
      </div>

      <Label className="mt-4">LAST 40 TRADES</Label>
      <div className="px-inset mt-1 flex h-20 items-center gap-1 p-2">
        {last.map((e, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-center">
            <div
              className={cn(e.pnl >= 0 ? "bg-gain self-stretch" : "bg-loss self-stretch translate-y-full")}
              style={{ height: `${(Math.abs(e.pnl) / maxAbs) * 50}%` }}
            />
          </div>
        ))}
      </div>

      <Label className="mt-4">TRADERS</Label>
      <table className="mt-1 w-full text-left">
        <thead className="font-display text-[8px]">
          <tr>
            <th>CODE</th>
            <th>STATE</th>
            <th>TRADES</th>
            <th>WIN%</th>
            <th className="text-right">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {traders.map((t) => (
            <tr
              key={t.id}
              className="cursor-pointer border-t-2 border-dashed border-muted-foreground/40 hover:bg-secondary"
              onClick={() => openPanel({ type: "trader", traderId: t.id })}
            >
              <td>{t.code}</td>
              <td>{t.status === "onShift" ? t.agentState : t.status.toUpperCase()}</td>
              <td>{t.trades}</td>
              <td>{t.trades ? Math.round((t.wins / t.trades) * 100) : 0}</td>
              <td className={cn("text-right", t.pnl >= 0 ? "text-gain" : "text-loss")}>{fmtSigned(t.pnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/** LEADERBOARD TERMINAL (founder office). */
export function LeaderboardPanel() {
  const stats = useStats();
  const firmName = useGame((s) => s.firmName);
  const traders = useGame((s) => s.traders);
  const connected = useGame((s) => s.account.status === "connected");
  const rows = (stats?.firms ?? []).map((f) => ({ ...f, you: connected && f.name === firmName }));
  if (!connected && traders.length)
    rows.push({ name: firmName, traders: traders.length, onShift: traders.filter((t) => t.status === "onShift").length, you: true });
  rows.sort((a, b) => b.onShift - a.onShift || b.traders - a.traders);

  return (
    <Panel title="LEADERBOARD TERMINAL" className="max-w-4xl">
      <div className="bg-ink p-3 text-primary-foreground">
        <table className="w-full text-left">
          <thead className="font-display text-[8px] text-secondary">
            <tr>
              <th>#</th>
              <th>FLOOR</th>
              <th>TRADERS</th>
              <th className="text-right">ON SHIFT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name + i} className={cn(r.you && "bg-accent")}>
                <td>{i + 1}</td>
                <td>
                  {r.name}
                  {r.you ? " (YOU)" : ""}
                </td>
                <td>{r.traders}</td>
                <td className="text-right">{r.onShift}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="py-3 text-center">
                  {stats ? "NO FLOORS ON THE BOARD YET." : "LOADING..."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** THE STREET · PUBLIC DIRECTORY — alla floors som minikontor. */
export function FloorPanel() {
  const stats = useStats();
  const firms = stats?.firms ?? [];
  return (
    <Panel title="THE STREET · PUBLIC DIRECTORY" className="max-w-5xl">
      {!firms.length && <p>{stats ? "No floors have opened yet. Be the first." : "Loading..."}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {firms.map((f, idx) => (
          <div key={f.name + idx} className="border-3 border-ink bg-secondary">
            <div className="relative grid h-16 grid-cols-4 gap-1 border-b-3 border-ink bg-ink p-1.5">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full",
                    i < f.onShift ? "bg-gain/70" : i < f.traders ? "bg-secondary" : "bg-muted-foreground/30",
                    i < f.onShift && (i * (idx + 1)) % 5 === 1 && "blink",
                  )}
                />
              ))}
            </div>
            <div className="p-2 leading-tight">
              <div className="font-display text-[8px]">{f.name}</div>
              <div className="mt-1 flex justify-between">
                <span>{f.traders} TRADERS</span>
                <span>{f.onShift} ON SHIFT</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** STAFF · n/8 */
export function StaffPanel() {
  const traders = useGame((s) => s.traders);
  return (
    <Panel title={`STAFF · ${traders.length}/${MAX_TRADERS}`}>
      {!traders.length && <p>No traders yet. Visit HIRING / HR.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {traders.map((t) => (
          <button
            key={t.id}
            onClick={() => openPanel({ type: "trader", traderId: t.id })}
            className="flex items-center gap-3 border-3 border-ink bg-paper p-2 text-left hover:bg-secondary"
          >
            <Portrait look={{ ...archetypeById(t.archetype).look, headset: t.status !== "hired" }} size={3} />
            <div>
              <div className="font-display text-[9px]">{t.code}</div>
              <div>
                {archetypeById(t.archetype).name} · {t.status === "onShift" ? t.agentState : t.status.toUpperCase()}
              </div>
              <div className={t.pnl >= 0 ? "text-gain" : "text-loss"}>{fmtSigned(t.pnl)} SOL</div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/** LEDGER — avslutade trades. */
export function LedgerPanel() {
  const ledger = useGame((s) => s.ledger);
  return (
    <Panel title="LEDGER">
      {!ledger.length && <p>No closed trades yet.</p>}
      <table className="w-full text-left">
        <tbody>
          {[...ledger]
            .reverse()
            .slice(0, 120)
            .map((e, i) => (
              <tr key={i} className="border-b-2 border-dashed border-muted-foreground/30">
                <td className="text-muted-foreground">{new Date(e.t).toLocaleTimeString()}</td>
                <td>{e.code}</td>
                <td>{e.market}</td>
                <td className={cn("text-right", e.pnl >= 0 ? "text-gain" : "text-loss")}>{fmtSigned(e.pnl)} SOL</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Panel>
  );
}

/** DAILY STAND-UP (meeting room). */
export function MeetingPanel() {
  const traders = useGame((s) => s.traders);
  return (
    <Panel title="DAILY STAND-UP">
      {!traders.length && <p>The room is empty. Hire someone first.</p>}
      <div className="space-y-2">
        {traders.map((t) => {
          const p = personalityById(t.personality);
          return (
            <div key={t.id} className="flex items-center gap-3">
              <Portrait look={{ ...archetypeById(t.archetype).look, headset: true }} size={3} />
              <div className="px-inset flex-1 p-2">
                <b className="font-display text-[8px]">{t.code}:</b> "{p.lines[(t.trades + t.code.length) % p.lines.length]}"
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** FOUNDER'S DESK */
export function FounderPanel() {
  const s = useGame((st) => st);
  const capital = s.traders.reduce((sum, t) => sum + t.capital, 0);
  const today = todayPnl(s);
  return (
    <Panel title="FOUNDER'S DESK" className="max-w-md">
      <div className="grid grid-cols-[140px_1fr] gap-y-1">
        <Label>FLOOR</Label>
        <span>{s.firmName}</span>
        <Label>TRADERS</Label>
        <span>
          {s.traders.length}/{MAX_TRADERS}
        </span>
        <Label>ON SHIFT</Label>
        <span>{s.traders.filter((t) => t.status === "onShift").length}</span>
        <Label>CAPITAL</Label>
        <span>{fmt(capital)} SOL</span>
        <Label>TODAY</Label>
        <span className={today >= 0 ? "text-gain" : "text-loss"}>{fmtSigned(today)} SOL</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PxButton onClick={() => openPanel({ type: "staff" })}>STAFF</PxButton>
        <PxButton onClick={() => openPanel({ type: "ledger" })}>LEDGER</PxButton>
        <PxButton onClick={() => openPanel({ type: "settings" })}>RENAME FLOOR</PxButton>
      </div>
    </Panel>
  );
}

/** SETTINGS — byt firmanamn / återställ. */
export function SettingsPanel() {
  const firmName = useGame((s) => s.firmName);
  const [name, setName] = useState(firmName);
  const [confirm, setConfirm] = useState(false);
  return (
    <Panel title="SETTINGS" className="max-w-md">
      <Label>FLOOR NAME</Label>
      <div className="mt-1 flex gap-2">
        <input
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          className="px-inset flex-1 p-2 text-xl outline-none"
        />
        <PxButton primary onClick={() => store.set({ firmName: name.trim() || "NEW FLOOR" })}>
          SAVE
        </PxButton>
      </div>
      <Label className="mt-6">DANGER</Label>
      <PxButton
        className="mt-1"
        onClick={() => {
          if (confirm) {
            store.reset();
            store.set({ panel: null });
          } else setConfirm(true);
        }}
      >
        {confirm ? "CONFIRM: CLOSE FLOOR & RESTART" : "RESET FLOOR"}
      </PxButton>
    </Panel>
  );
}
