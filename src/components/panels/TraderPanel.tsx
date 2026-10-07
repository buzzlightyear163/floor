import { Label, Panel, Portrait, PxButton } from "@/components/ui/pixel";
import { archetypeById, playbookName } from "@/data/traders";
import { fmt, fmtSigned } from "@/lib/format";
import { closePanel, openPanel, store, useTrader } from "@/store/store";
import type { Panel as PanelT, TraderStatus } from "@/store/types";

const NEXT_SETUP: Partial<Record<TraderStatus, "pair" | "strategy" | "risk" | "vault">> = {
  hired: "pair",
  paired: "strategy",
  configured: "risk",
  risk: "vault",
  funded: "vault",
};

/** Trader-kort (klick på skrivbord / staff / analytics). */
export function TraderPanel({ id }: { id: string }) {
  const t = useTrader(id);
  if (!t) return null;
  const a = archetypeById(t.archetype);
  const winRate = t.trades ? Math.round((t.wins / t.trades) * 100) : 0;
  const next = NEXT_SETUP[t.status];
  const go = (type: "pair" | "strategy" | "risk" | "vault") => openPanel({ type, traderId: t.id } as PanelT);

  return (
    <Panel title={`${t.code} · ${a.name}`}>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="px-inset p-2">
          <Portrait look={{ ...a.look, headset: t.status !== "hired" }} size={6} />
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-y-1">
          <Label>STATUS</Label>
          <span>
            {t.status === "onShift" ? <b className="text-gain">ON SHIFT · {t.agentState}</b> : t.status.toUpperCase()}
          </span>
          <Label>PERSONALITY</Label>
          <span>{t.personality.toUpperCase()}</span>
          <Label>PLAYBOOKS</Label>
          <span>{t.playbooks.map(playbookName).join(" + ") || "—"}</span>
          <Label>DIRECTIVE</Label>
          <span className="italic">{t.directive || "—"}</span>
          <Label>CAPITAL</Label>
          <span>{fmt(t.capital)} SOL</span>
          <Label>P&amp;L</Label>
          <span className={t.pnl >= 0 ? "text-gain" : "text-loss"}>{fmtSigned(t.pnl)} SOL</span>
          <Label>TRADES</Label>
          <span>
            {t.trades} · WIN {winRate}%
          </span>
          <Label>DESK</Label>
          <span>#{t.desk + 1}</span>
        </div>
      </div>

      <Label className="mt-4">ACTIVITY</Label>
      <div className="px-inset mt-1 max-h-40 overflow-y-auto p-2">
        {[...t.log].reverse().map((l, i) => (
          <div key={i}>
            <span className="text-muted-foreground">
              {new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>{" "}
            {l.msg}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {next && (
          <PxButton primary onClick={() => go(next)}>
            CONTINUE SETUP
          </PxButton>
        )}
        {(t.status === "onShift" || t.status === "offShift") && (
          <>
            <PxButton onClick={() => go("strategy")}>PLAYBOOKS</PxButton>
            <PxButton onClick={() => go("risk")}>RISK</PxButton>
            <PxButton onClick={() => go("vault")}>WALLET</PxButton>
            <PxButton
              primary
              onClick={() => {
                store.updateTrader(t.id, { status: t.status === "onShift" ? "offShift" : "onShift" });
                closePanel();
              }}
            >
              {t.status === "onShift" ? "END SHIFT" : "PUT ON SHIFT"}
            </PxButton>
          </>
        )}
      </div>
    </Panel>
  );
}
