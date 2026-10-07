import { useCallback, useEffect, useState } from "react";
import { Banner } from "@/components/Banner";
import { Hud } from "@/components/Hud";
import { OfficeCanvas } from "@/components/OfficeCanvas";
import { PanelHost } from "@/components/panels/PanelHost";
import { BRAND } from "@/config/brand";
import type { Interactable } from "@/game/map";
import { store, useGame } from "@/store/store";
import { interact } from "./interact";

/** Själva spelet: kontoret, HUD, interaktionsknapp, dialogruta och paneler. */
export function GameScreen() {
  const [near, setNear] = useState<Interactable | null>(null);
  const [location, setLocation] = useState("RECEPTION");
  const panel = useGame((s) => s.panel);
  const dialog = useGame((s) => s.dialog);
  const introSeen = useGame((s) => s.introSeen);

  // Välkomstdialog första gången
  useEffect(() => {
    if (introSeen) return;
    store.set({ introSeen: true });
    setTimeout(
      () => store.say("RECEPTION", [`WELCOME TO ${BRAND.name}.`, "EVERY FLOOR STARTS WITH ONE TRADER.", "HIRE YOUR FIRST."]),
      600,
    );
  }, [introSeen]);

  const advance = useCallback(() => {
    const d = store.get().dialog;
    if (!d) return;
    store.set({ dialog: d.idx + 1 < d.lines.length ? { ...d, idx: d.idx + 1 } : null });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") e.target.blur();
        return;
      }
      const k = e.key.toLowerCase();
      const s = store.get();
      if (k === "escape") {
        if (s.dialog) return store.set({ dialog: null });
        return store.set({ panel: s.panel ? null : { type: "menu" } });
      }
      if (k === "e" || k === "enter" || k === " ") {
        if (s.dialog) {
          e.preventDefault();
          return advance();
        }
        if (!s.panel && near && k === "e") interact(near.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [near, advance]);

  return (
    <div className="fixed inset-0">
      <OfficeCanvas mode="game" onNear={setNear} onLocation={setLocation} />
      <div className="scanlines fixed inset-0 opacity-40" />
      <Hud location={location} />
      {near && !panel && !dialog && (
        <button
          onClick={() => interact(near.id)}
          className="px-btn px-btn-primary pop-in fixed bottom-24 left-1/2 z-30 -translate-x-1/2"
        >
          [ E ] {near.label}
        </button>
      )}
      {dialog && (
        <button
          onClick={advance}
          className="px-panel wipe-in fixed bottom-4 left-1/2 z-50 w-[min(680px,94vw)] -translate-x-1/2 p-4 text-left"
        >
          <div className="mb-1 font-display text-[9px] text-accent">{dialog.speaker}</div>
          <div className="font-display text-[12px] leading-6">{dialog.lines[dialog.idx]}</div>
          <div className="blink mt-1 text-right font-display text-[9px]">▼ E</div>
        </button>
      )}
      <Banner />
      <PanelHost />
    </div>
  );
}
