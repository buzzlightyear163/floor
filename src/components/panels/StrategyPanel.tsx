import { useState } from "react";
import { Label, Panel, Portrait, PxButton } from "@/components/ui/pixel";
import { PERSONALITIES, PLAYBOOKS, archetypeById, playbookName } from "@/data/traders";
import { cn } from "@/lib/format";
import { closePanel, store, useTrader } from "@/store/store";
import type { PersonalityId, PlaybookId } from "@/store/types";

/** STRATEGY ROOM — personlighet, max 2 playbooks och custom directive. */
export function StrategyPanel({ id }: { id: string }) {
  const t = useTrader(id);
  const [personality, setPersonality] = useState<PersonalityId>(t?.personality ?? "calm");
  const [books, setBooks] = useState<PlaybookId[]>(t?.playbooks ?? []);
  const [directive, setDirective] = useState(t?.directive ?? "");
  if (!t) return null;

  const toggle = (pb: PlaybookId) =>
    setBooks((b) => (b.includes(pb) ? b.filter((x) => x !== pb) : b.length < 2 ? [...b, pb] : b));

  const lockIn = () => {
    store.updateTrader(t.id, {
      personality,
      playbooks: books,
      directive: directive.slice(0, 500),
      status: t.status === "paired" ? "configured" : t.status,
    });
    store.log(t.id, `Equipped ${books.join(" + ") || "no playbooks"}.`);
    closePanel();
    if (t.status === "paired") store.say("STRATEGIST", ["BUILD LOCKED IN.", "NEXT: THE RISK DEPT, SOUTH OF ANALYTICS."]);
  };

  const a = archetypeById(t.archetype);

  return (
    <Panel title={`STRATEGY ROOM · ${t.code}`} className="max-w-4xl">
      <div className="mb-4 flex items-center gap-3 border-b-2 border-ink pb-3">
        <Portrait look={{ ...a.look, headset: true }} size={3} />
        <div className="font-display text-[10px] leading-5">
          <div>{a.name}</div>
          <div className="text-muted-foreground">PLAYBOOK: {books.map(playbookName).join(" + ") || "—"}</div>
          <div className="text-muted-foreground">PERSONALITY: {personality.toUpperCase()}</div>
        </div>
      </div>

      <Label>PERSONALITY · PICK ONE</Label>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
        {PERSONALITIES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPersonality(p.id)}
            className={cn(
              "border-3 border-ink p-2 text-left",
              personality === p.id ? "bg-ink text-primary-foreground" : "bg-paper hover:bg-secondary",
            )}
          >
            <div className="font-display text-[9px]">{p.name}</div>
            <div className="text-lg leading-tight opacity-80">"{p.lines[0]}"</div>
          </button>
        ))}
      </div>

      <Label className="mt-5">PLAYBOOKS · EQUIP {books.length}/2</Label>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
        {PLAYBOOKS.map((pb) => {
          const on = books.includes(pb.id);
          return (
            <button
              key={pb.id}
              onClick={() => toggle(pb.id)}
              className={cn(
                "flex gap-2 border-3 border-ink p-2 text-left",
                on ? "bg-secondary shadow-[inset_0_0_0_3px_var(--accent)]" : "bg-paper hover:bg-muted",
                !on && books.length >= 2 && "opacity-50",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-ink font-display text-[10px] text-primary-foreground">
                {pb.glyph}
              </span>
              <span>
                <span className="block font-display text-[8px]">
                  {pb.name}
                  {on && " ✓"}
                </span>
                <span className="text-lg leading-tight">{pb.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Label className="mt-5">CUSTOM DIRECTIVE</Label>
      <textarea
        value={directive}
        onChange={(e) => setDirective(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Avoid markets with highly concentrated holder distribution..."
        className="px-inset mt-2 w-full p-2 text-xl outline-none focus:bg-paper"
      />
      <div className="mt-4 flex justify-end">
        <PxButton primary disabled={books.length === 0} onClick={lockIn}>
          {books.length ? "LOCK IN BUILD" : "EQUIP A PLAYBOOK"}
        </PxButton>
      </div>
    </Panel>
  );
}
