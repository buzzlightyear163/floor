/**
 * Demo-trading (endast DEMO_TRADES).
 *
 * Referensens traders handlar på servern; klienten visar bara animeringar.
 * För att Analytics, Ledger och P&L ska gå att demonstrera lokalt genererar
 * den här modulen avslutade låtsas-trades för traders som är on shift och
 * har kapital. Inga riktiga marknader eller pengar inblandade.
 * TODO(backend): ersätt med riktiga fills/ledger från servern.
 */
import { DEMO_TRADES } from "@/config/demo";
import { archetypeById } from "@/data/traders";
import { fmtSigned } from "@/lib/format";
import { store } from "@/store/store";
import { adjustDemoBalance, isDemoAddress, setKnownBalance } from "./vault";

const MARKETS = ["$BLIP", "$MOTH", "$GRUB", "$ZORP", "$KELP", "$NOVA", "$FIZZ", "$OOMPH", "$DUSK", "$TACO", "$WOBL", "$QUARK"];

function tick() {
  const s = store.get();
  if (s.account.status !== "connected") return;
  for (const t of s.traders) {
    if (t.status !== "onShift" || t.capital <= 0) continue;
    // ~1 avslutad trade per 45 s och trader (snabbare för aggressiva arketyper)
    const a = archetypeById(t.archetype);
    if (Math.random() > 0.06 + a.aggression * 0.06) continue;

    const size = t.capital * (t.risk.maxPosition / 100);
    const drift = 0.03 + (t.playbooks.includes("preservation") ? 0.01 : 0);
    const ret = (Math.random() * 2 - 1) * 0.35 * a.volatility + drift;
    const pnl = Math.round(size * ret * 1e6) / 1e6;
    if (pnl === 0) continue;

    const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];
    store.set((st) => ({ ledger: [...st.ledger.slice(-199), { t: Date.now(), code: t.code, market, pnl }] }));
    store.updateTrader(t.id, (tr) => ({
      pnl: tr.pnl + pnl,
      trades: tr.trades + 1,
      wins: tr.wins + (pnl > 0 ? 1 : 0),
      capital: Math.max(0, tr.capital + pnl),
    }));
    if (t.wallet && isDemoAddress(t.wallet.address)) setKnownBalance(t.wallet.address, adjustDemoBalance(t.wallet.address, pnl));
    store.log(t.id, `Closed ${market} ${fmtSigned(pnl, 4)} SOL.`);
  }
}

let started = false;
export function startDemoTrading() {
  if (!DEMO_TRADES || started || typeof window === "undefined") return;
  started = true;
  setInterval(tick, 4000);
}
