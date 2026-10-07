import { useEffect, useRef, useState, type ReactNode } from "react";
import { OfficeCanvas } from "@/components/OfficeCanvas";
import { FloorPanel } from "@/components/panels/FirmPanels";
import { HowPanel } from "@/components/panels/SystemPanels";
import { BRAND } from "@/config/brand";
import { useTick } from "@/hooks/useTick";
import { cn, shortAddr } from "@/lib/format";
import { connectPhantom } from "@/services/account";
import { useStats } from "@/services/stats";
import { store, useGame } from "@/store/store";

/** Öppnar en panel ovanpå titelskärmen och stänger overlayn när panelen stängs. */
function TitleOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    store.set({ panel: { type: "floor" } });
    return store.subscribe(() => {
      if (!store.get().panel) cb.current();
    });
  }, []);
  return <>{children}</>;
}

/** Titelskärmen: animerat kontor i bakgrunden + meny-panel. */
export function TitleScreen({ onStart }: { onStart: () => void }) {
  useTick(1000);
  const [sel, setSel] = useState(0);
  const [overlay, setOverlay] = useState<"" | "floor" | "how">("");
  const hasFirm = useGame((s) => s.traders.length > 0);
  const stats = useStats();
  const account = useGame((s) => s.account);

  const items: [string, () => void][] = [
    [hasFirm ? "BACK TO THE FLOOR" : "TAKE THE FLOOR", onStart],
    [
      account.publicKey
        ? `PHANTOM · ${shortAddr(account.publicKey)}`
        : account.status === "signing"
          ? "SIGN IN PHANTOM..."
          : "CONNECT PHANTOM",
      () => {
        if (!account.publicKey && account.status === "idle") void connectPhantom();
      },
    ],
    ["VISIT THE STREET", () => setOverlay("floor")],
    ["HOW IT WORKS", () => setOverlay("how")],
  ];

  // Tangentbordsnavigering i menyn
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlay) {
        if (e.key === "Escape") setOverlay("");
        return;
      }
      if (e.key === "ArrowDown" || e.key === "s") setSel((i) => (i + 1) % items.length);
      if (e.key === "ArrowUp" || e.key === "w") setSel((i) => (i + items.length - 1) % items.length);
      if (e.key === "Enter" || e.key === " ") items[sel][1]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useGame((s) => s.panel);

  const counters: [string, number | undefined][] = [
    ["TRADERS ON SHIFT", stats?.tradersOnShift],
    ["FLOORS OPEN", stats?.firmsOpen],
    ["TRADERS HIRED", stats?.tradersHired],
  ];

  return (
    <div className="fixed inset-0">
      <OfficeCanvas mode="title" />
      <div className="scanlines fixed inset-0 opacity-50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="px-panel pop-in w-[min(440px,94vw)] p-6 text-center">
          <div className="mx-auto w-fit border-3 border-ink bg-paper p-1">
            <img src={BRAND.logoUrl} alt={BRAND.logoAlt} className="h-28 w-28 mix-blend-multiply [image-rendering:pixelated]" />
          </div>
          <h1 className="mt-4 font-display text-5xl tracking-widest">{BRAND.name}</h1>
          <p className="mt-3 font-display text-[9px] leading-4 text-accent">{BRAND.tagline}</p>
          <div className="mt-6 flex flex-col gap-3">
            {items.map(([label, action], i) => (
              <button key={label} onMouseEnter={() => setSel(i)} onClick={action} className={cn("px-btn", sel === i && "px-btn-primary")}>
                {sel === i ? "▶ " : ""}[ {label} ]
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 border-t-3 border-dashed border-ink pt-4">
            {counters.map(([label, value]) => (
              <div key={label}>
                <div className="font-display text-[11px]">
                  <span className="blink mr-1 inline-block h-2 w-2 bg-gain" />
                  {value === undefined ? "–" : Number(value).toLocaleString()}
                </div>
                <div className="mt-1 font-display text-[6px] leading-3 text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          {account.error && <p className="mt-3 font-display text-[8px] leading-4 text-loss">{account.error}</p>}
        </div>
      </div>
      {overlay === "floor" && (
        <TitleOverlay onClose={() => setOverlay("")}>
          <FloorPanel />
        </TitleOverlay>
      )}
      {overlay === "how" && (
        <TitleOverlay onClose={() => setOverlay("")}>
          <HowPanel />
        </TitleOverlay>
      )}
    </div>
  );
}
