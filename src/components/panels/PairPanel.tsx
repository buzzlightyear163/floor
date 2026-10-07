import { useState } from "react";
import { Panel, PxButton } from "@/components/ui/pixel";
import { sleep } from "@/lib/format";
import { closePanel, store, useTrader } from "@/store/store";

const PAIR_STEPS = ["PROCESSING", "INITIALIZING MEMORY", "LOADING REASONING", "ESTABLISHING IDENTITY"];

/** Parningssekvens (referensen kör den här lokalt också, 1.1 s per steg). */
async function* pairSequence() {
  for (const step of PAIR_STEPS) {
    yield step;
    await sleep(1100);
  }
}

/** SI PAIRING STATION */
export function PairPanel({ id }: { id: string }) {
  const t = useTrader(id);
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<"ready" | "run" | "done">(t?.status === "hired" ? "ready" : "done");
  if (!t) return null;

  const begin = async () => {
    setPhase("run");
    for await (const step of pairSequence()) setLines((l) => [...l, step]);
    store.updateTrader(t.id, { status: "paired" });
    store.log(t.id, "Paired with Super Intelligence.");
    setPhase("done");
  };
  const progress = phase === "done" ? 100 : (lines.length / PAIR_STEPS.length) * 100;

  return (
    <Panel title="SI PAIRING STATION">
      <div className="bg-ink p-4 font-display text-[10px] leading-6 text-gain">
        <div className="text-primary-foreground">{t.code}</div>
        <div>{phase === "ready" ? "STANDING ON PAIRING PAD." : "PAIRING WITH SUPER INTELLIGENCE..."}</div>
        {lines.map((l, i) => (
          <div key={l}>
            {"> "}
            {l}
            {i === lines.length - 1 && phase === "run" ? <span className="blink">_</span> : " ... OK"}
          </div>
        ))}
        {phase === "done" && <div className="pop-in mt-2 text-primary-foreground">PAIR COMPLETE.</div>}
        <div className="mt-3 h-4 border-2 border-gain">
          <div className="h-full bg-gain transition-[width] duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {phase === "ready" && (
          <PxButton primary onClick={begin}>
            BEGIN PAIRING
          </PxButton>
        )}
        {phase === "done" && (
          <PxButton
            primary
            onClick={() => {
              closePanel();
              store.say("LAB TECH", [`${t.code} IS NOW AN ACTIVE SI TRADER.`, "TAKE THEM TO THE STRATEGY ROOM."]);
            }}
          >
            CONTINUE
          </PxButton>
        )}
      </div>
    </Panel>
  );
}
