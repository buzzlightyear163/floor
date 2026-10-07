import { Label, Panel, PxButton } from "@/components/ui/pixel";
import { BRAND } from "@/config/brand";
import { DEMO_MODE } from "@/config/demo";
import { cn, shortAddr } from "@/lib/format";
import { connectPhantom, disconnectPhantom } from "@/services/account";
import { closePanel, openPanel, store, useGame } from "@/store/store";

/** PAUSED — ESC-menyn. */
export function MenuPanel() {
  const pk = useGame((s) => (s.account.status === "connected" ? s.account.publicKey : null));
  const items: [string, () => void][] = [
    ["YOUR FLOOR", closePanel],
    ["THE STREET", () => openPanel({ type: "floor" })],
    ["STAFF", () => openPanel({ type: "staff" })],
    ["LEDGER", () => openPanel({ type: "ledger" })],
    ["SETTINGS", () => openPanel({ type: "settings" })],
    ["HOW IT WORKS", () => openPanel({ type: "how" })],
    [pk ? `PHANTOM · ${shortAddr(pk)}` : "CONNECT PHANTOM", () => openPanel({ type: "connect" })],
    ["TITLE SCREEN", () => store.set({ panel: null, phase: "title" })],
  ];
  return (
    <Panel title="PAUSED" className="max-w-sm">
      <div className="flex flex-col gap-2">
        {items.map(([label, action], i) => (
          <PxButton key={label} primary={i === 0} onClick={action} className="text-left">
            {"> "}
            {label}
          </PxButton>
        ))}
      </div>
    </Panel>
  );
}

const HOW_STEPS: [string, string][] = [
  ["HIRE", "Interview archetypes in HR and hire a trader."],
  ["PAIR", "Pair them with Super Intelligence in the SI Lab."],
  ["SHAPE", "Pick a personality, equip 2 playbooks, add a directive."],
  ["LIMIT", "Set risk limits in the Risk Dept."],
  ["FUND", "Generate the trader's own Solana wallet in the Vault and send it SOL."],
  ["SHIFT", "Put them on shift. They take a desk on the Trading Floor."],
  ["WATCH", "Your floor runs. Check Analytics, the Ledger and the Leaderboard."],
  ["ACCOUNT", `Your Phantom wallet is your ${BRAND.name} account. Connect it from the menu.`],
];

/** HOW IT WORKS */
export function HowPanel() {
  return (
    <Panel title="HOW IT WORKS">
      <ol className="space-y-2">
        {HOW_STEPS.map(([k, v], i) => (
          <li key={k} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center bg-ink font-display text-[10px] text-primary-foreground">
              {i + 1}
            </span>
            <span>
              <b className="font-display text-[9px]">{k}</b> — {v}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 font-display text-[8px]">WASD / ARROWS MOVE · CLICK TO WALK · E INTERACT · ESC MENU</p>
    </Panel>
  );
}

/** PHANTOM · ACCOUNT */
export function ConnectPanel() {
  const account = useGame((s) => s.account);
  return (
    <Panel title={`PHANTOM · ${BRAND.name} ACCOUNT`} className="max-w-md">
      {account.status === "connected" && account.publicKey ? (
        <>
          <Label>SIGNED IN AS</Label>
          <div className="mt-1 font-display text-[12px]">{shortAddr(account.publicKey)}</div>
          <p className="mt-3 text-muted-foreground">
            {account.demo
              ? "Local demo account (no Phantom detected). Your floor is saved in this browser."
              : "Your floor is saved to this wallet. Switch accounts in Phantom to open a different floor."}
          </p>
          <PxButton className="mt-4" onClick={() => void disconnectPhantom()}>
            DISCONNECT
          </PxButton>
        </>
      ) : (
        <>
          <p>Your Phantom wallet is your {BRAND.name} account. Connect, then sign a short message to prove it's yours.</p>
          <p className="mt-2 text-muted-foreground">
            Signing is free. It never moves SOL or approves a transaction. {BRAND.name} never asks for your recovery phrase.
          </p>
          <PxButton primary className="mt-4" disabled={account.status !== "idle"} onClick={() => void connectPhantom()}>
            {account.status === "signing" ? "SIGN IN PHANTOM..." : account.status === "connecting" ? "CONNECTING..." : "CONNECT PHANTOM"}
          </PxButton>
          {DEMO_MODE && (
            <p className="mt-3 font-display text-[7px] leading-4 text-muted-foreground">
              DEMO MODE: WITHOUT PHANTOM A LOCAL DEMO ACCOUNT IS CREATED.
            </p>
          )}
        </>
      )}
      {account.error && <div className="mt-3 font-display text-[8px] leading-4 text-loss">{account.error}</div>}
    </Panel>
  );
}

const FLOORS: [string, string, boolean][] = [
  ["L", "LOBBY · THE STREET", false],
  ["1", "YOUR FLOOR (HERE)", false],
  ["2", "RESEARCH DEPARTMENT", true],
  ["3", "SOCIAL INTELLIGENCE", true],
  ["4", "SECOND TRADING FLOOR", true],
];

/** ELEVATOR */
export function ElevatorPanel() {
  return (
    <Panel title="ELEVATOR" className="max-w-sm">
      <div className="flex flex-col gap-2">
        {[...FLOORS].reverse().map(([key, name, locked]) => (
          <button
            key={key}
            onClick={() => (locked ? openPanel({ type: "locked", name }) : key === "L" ? openPanel({ type: "floor" }) : closePanel())}
            className={cn(
              "flex items-center gap-3 border-3 border-ink p-2 text-left",
              locked ? "bg-muted text-muted-foreground" : "bg-paper hover:bg-secondary",
            )}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border-3 border-ink font-display text-[10px]">{key}</span>
            <span className="font-display text-[9px]">{name}</span>
            {locked && <span className="ml-auto font-display text-[8px]">LOCKED</span>}
          </button>
        ))}
      </div>
    </Panel>
  );
}

/** LOCKED — ej öppnade delar av byggnaden. */
export function LockedPanel({ name }: { name: string }) {
  return (
    <Panel title="LOCKED" className="max-w-md">
      <div className="text-center">
        <div className="font-display text-[11px]">{name}</div>
        <div className="mx-auto my-4 grid h-16 w-16 place-items-center border-3 border-ink bg-secondary font-display text-xl">⌂</div>
        <p>This part of the building isn't open yet.</p>
        <PxButton primary className="mt-4" onClick={closePanel}>
          BACK
        </PxButton>
      </div>
    </Panel>
  );
}
