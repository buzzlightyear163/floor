import { useState, type ReactNode } from "react";
import { Label, Panel, Pips, PxButton } from "@/components/ui/pixel";
import { cn } from "@/lib/format";
import { DEFAULT_RISK, closePanel, store, useTrader } from "@/store/store";
import type { RiskConfig } from "@/store/types";

function Row({ label, hint, children }: { label: string; hint: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-1 border-b-2 border-dashed border-muted-foreground/40 py-2 sm:grid-cols-[200px_1fr_90px]">
      <Label className="text-foreground">{label}</Label>
      {children}
      <span className="text-right font-display text-[10px]">{hint}</span>
    </div>
  );
}

function Segmented<K extends "stopLoss" | "takeProfit">({
  value,
  options,
  onPick,
}: {
  value: RiskConfig[K];
  options: RiskConfig[K][];
  onPick: (v: RiskConfig[K]) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={cn("border-2 border-ink px-2 font-display text-[8px] leading-7", value === o ? "bg-ink text-primary-foreground" : "bg-paper")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** RISK DEPT — limits som binder tradern. */
export function RiskPanel({ id }: { id: string }) {
  const t = useTrader(id);
  const [risk, setRisk] = useState<RiskConfig>(t?.risk ?? DEFAULT_RISK);
  if (!t) return null;
  const set = <K extends keyof RiskConfig>(k: K, v: RiskConfig[K]) => setRisk((r) => ({ ...r, [k]: v }));

  const save = () => {
    store.updateTrader(t.id, { risk, status: t.status === "configured" ? "risk" : t.status });
    store.log(t.id, "Risk limits set.");
    closePanel();
    if (t.status === "configured") store.say("RISK OFFICER", ["LIMITS ARE ON FILE.", "LAST STOP: THE VAULT. CREATE THEIR WALLET."]);
  };

  return (
    <Panel title={`RISK DEPT · ${t.code} · CONFIG`}>
      <p className="mb-2 text-muted-foreground">These limits bind the trader once it starts working the desk.</p>
      <Row label="MAX POSITION SIZE" hint={`${risk.maxPosition}%`}>
        <Pips max={10} value={risk.maxPosition / 5} onChange={(v) => set("maxPosition", v * 5)} />
      </Row>
      <Row label="MAX DAILY LOSS" hint={`${risk.maxDailyLoss}%`}>
        <Pips max={10} tone="loss" value={risk.maxDailyLoss / 5} onChange={(v) => set("maxDailyLoss", v * 5)} />
      </Row>
      <Row label="MAX OPEN POSITIONS" hint={`${risk.maxOpen}`}>
        <Pips max={5} value={risk.maxOpen} onChange={(v) => set("maxOpen", v)} />
      </Row>
      <Row label="STOP LOSS" hint={risk.stopLoss}>
        <Segmented<"stopLoss"> value={risk.stopLoss} options={["TIGHT", "STANDARD", "WIDE"]} onPick={(v) => set("stopLoss", v)} />
      </Row>
      <Row label="TAKE PROFIT" hint={risk.takeProfit}>
        <Segmented<"takeProfit"> value={risk.takeProfit} options={["QUICK", "LADDER", "LET RUN"]} onPick={(v) => set("takeProfit", v)} />
      </Row>
      <Row label="RESERVE CAPITAL" hint={`${risk.reserve}%`}>
        <Pips max={10} tone="gain" value={risk.reserve / 10} onChange={(v) => set("reserve", v * 10)} />
      </Row>
      <div className="mt-4 flex justify-end">
        <PxButton primary onClick={save}>
          SAVE LIMITS
        </PxButton>
      </div>
    </Panel>
  );
}
