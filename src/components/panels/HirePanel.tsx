import { useState } from "react";
import { Label, Panel, Pips, Portrait, PxButton } from "@/components/ui/pixel";
import { ARCHETYPES, MAX_TRADERS } from "@/data/traders";
import { store, useGame } from "@/store/store";

/** HIRING / HR — intervju med kandidaterna (en per arketyp). */
export function HirePanel({ idx }: { idx: number }) {
  const [i, setI] = useState(idx);
  const count = useGame((s) => s.traders.length);
  const a = ARCHETYPES[i];
  const full = count >= MAX_TRADERS;

  const hire = () => {
    const t = store.hire(a.id);
    if (!t) return;
    store.set({ panel: null });
    store.bannerShow("TRADER HIRED.", `${t.code} · ${a.name}`);
    store.say("RECRUITER", [`${a.name} IS NOW ${t.code}.`, "THEY'RE HEADING TO THE SI PAIRING LAB.", "MEET THEM THERE."]);
  };

  return (
    <Panel title={`INTERVIEW · ${i + 1}/${ARCHETYPES.length}`}>
      <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
        <div className="px-inset flex flex-col items-center p-3">
          <Portrait look={a.look} size={8} />
          <div className="mt-2 font-display text-[10px]">{a.name}</div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {a.traits.map((tr) => (
              <span key={tr} className="border-2 border-ink bg-secondary px-2 font-display text-[8px] leading-6">
                {tr}
              </span>
            ))}
          </div>
          <p className="text-2xl">"{a.blurb}"</p>
          <div className="grid grid-cols-[110px_1fr] items-center gap-y-2">
            {Object.entries(a.stats).map(([k, v]) => (
              <div key={k} className="contents">
                <Label>{k.toUpperCase()}</Label>
                <Pips value={v} tone={k === "risk" && v >= 4 ? "loss" : "ink"} />
              </div>
            ))}
          </div>
          <div>
            <Label>TENDENCIES</Label>
            <ul className="mt-1">
              {a.tendencies.map((t) => (
                <li key={t}>&gt; {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <PxButton onClick={() => setI((i + ARCHETYPES.length - 1) % ARCHETYPES.length)}>&lt; PREV</PxButton>
          <PxButton onClick={() => setI((i + 1) % ARCHETYPES.length)}>NEXT &gt;</PxButton>
        </div>
        <PxButton primary disabled={full} onClick={hire}>
          {full ? "ALL DESKS FULL" : "HIRE"}
        </PxButton>
      </div>
    </Panel>
  );
}
