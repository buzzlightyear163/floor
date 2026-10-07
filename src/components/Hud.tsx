import { MAX_TRADERS } from "@/data/traders";
import { useTick } from "@/hooks/useTick";
import { fmtSigned, shortAddr } from "@/lib/format";
import { nextObjective, store, todayPnl, useGame } from "@/store/store";

function Stat({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="border-r-2 border-primary-foreground/20 px-3 py-1.5 last:border-0">
      <div className="font-display text-[7px] text-secondary/70">{k}</div>
      <div className={`font-display text-[10px] ${tone ?? ""}`}>{v}</div>
    </div>
  );
}

/** HUD: statistikrad överst, plats + mål nere till vänster, kontroller nere till höger. */
export function Hud({ location }: { location: string }) {
  useTick(1000);
  const s = useGame((st) => st);
  const capital = s.traders.reduce((sum, t) => sum + t.capital, 0);
  const onShift = s.traders.filter((t) => t.status === "onShift").length;
  const today = todayPnl(s);
  const obj = nextObjective(s);
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <div className="fixed left-2 right-2 top-9 z-20 flex items-stretch justify-between gap-2">
        <div className="flex flex-wrap items-stretch border-3 border-ink bg-ink text-primary-foreground shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
          <Stat k="FLOOR" v={s.firmName} />
          <Stat k="CAPITAL" v={`${capital.toFixed(2)} SOL`} />
          <Stat k="TRADERS" v={`${s.traders.length}/${MAX_TRADERS}`} />
          <Stat k="ON SHIFT" v={String(onShift)} tone={onShift ? "text-gain" : ""} />
          <Stat k="TODAY" v={fmtSigned(today, 3)} tone={today > 0 ? "text-gain" : today < 0 ? "text-loss" : ""} />
          <Stat k="TIME" v={time} />
          <button
            onClick={() => store.set({ panel: { type: "connect" } })}
            className="px-3 py-1.5 text-left hover:bg-primary-foreground/10"
          >
            <div className="font-display text-[7px] text-secondary/70">PHANTOM</div>
            <div className={`font-display text-[10px] ${s.account.publicKey ? "text-gain" : ""}`}>
              {s.account.publicKey ? shortAddr(s.account.publicKey) : "CONNECT"}
            </div>
          </button>
        </div>
        <button onClick={() => store.set({ panel: { type: "menu" } })} className="px-btn self-start">
          ESC MENU
        </button>
      </div>

      <div className="fixed bottom-3 left-3 z-20 hidden max-w-sm md:block">
        <div className="px-panel p-2">
          <div className="font-display text-[8px] text-accent">{location}</div>
          {obj.text && <div className="mt-1 font-display text-[9px] leading-4">! {obj.text}</div>}
        </div>
      </div>

      <div className="fixed bottom-3 right-3 z-20 hidden font-display text-[8px] leading-4 text-primary-foreground md:block">
        <div className="bg-ink/80 px-2 py-1">WASD MOVE · CLICK WALK · E INTERACT · ESC MENU</div>
      </div>

      {obj.text && (
        <div className="fixed left-1/2 top-24 z-20 -translate-x-1/2 bg-ink/85 px-2 py-1 font-display text-[8px] text-secondary md:hidden">
          ! {obj.text}
        </div>
      )}
    </>
  );
}
