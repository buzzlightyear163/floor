import { useSyncExternalStore } from "react";
import { MAX_TRADERS } from "@/data/traders";
import { DEMO_MODE } from "@/config/demo";
import type { ArchetypeId, GameState, RiskConfig, SavedState, Trader } from "./types";

export const DEFAULT_RISK: RiskConfig = {
  maxPosition: 10,
  maxDailyLoss: 15,
  maxOpen: 2,
  stopLoss: "STANDARD",
  takeProfit: "LADDER",
  reserve: 20,
};

export const INITIAL_STATE: GameState = {
  phase: "title",
  firmName: "NEW FLOOR",
  traders: [],
  ledger: [],
  panel: null,
  dialog: null,
  introSeen: false,
  banner: null,
  account: { publicKey: null, status: "idle", error: "" },
};

/** localStorage-nyckel för gäst-sparning (samma format som referensen). */
export const GUEST_SAVE_KEY = "floor.save.v1";

/**
 * Normaliserar sparad state. Referensen nollställer P&L-statistik vid laddning
 * (den levereras av servern) och flyttar traders utan plånbok tillbaka till
 * "risk". I demo-läget behålls demo-plånböcker och simulerad statistik.
 */
export function normalizeSaved(saved: SavedState) {
  const traders = (saved.traders ?? []).map((t): Trader => {
    const wallet = t.wallet && t.wallet.demo && !DEMO_MODE ? undefined : t.wallet;
    const needsWallet =
      !wallet && (t.status === "funded" || t.status === "onShift" || t.status === "offShift");
    return {
      ...t,
      wallet,
      pnl: DEMO_MODE ? t.pnl ?? 0 : 0,
      trades: DEMO_MODE ? t.trades ?? 0 : 0,
      wins: DEMO_MODE ? t.wins ?? 0 : 0,
      inPositions: 0,
      capital: wallet ? t.capital : 0,
      status: needsWallet ? "risk" : t.status,
    };
  });
  return {
    firmName: saved.firmName ?? "NEW FLOOR",
    traders,
    ledger: DEMO_MODE ? (saved.ledger ?? []).slice(-200) : [],
    introSeen: saved.introSeen ?? false,
  };
}

/** crypto.randomUUID finns bara i "secure contexts" (https/localhost) — fallback för LAN-IP. */
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let state: GameState = INITIAL_STATE;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** Sparar gäst-state lokalt (inloggade konton sparas via services/account). */
function persistGuest() {
  if (typeof window === "undefined" || state.account.publicKey) return;
  const { firmName, traders, ledger, introSeen } = state;
  try {
    localStorage.setItem(
      GUEST_SAVE_KEY,
      JSON.stringify({ firmName, traders, ledger: ledger.slice(-200), introSeen }),
    );
  } catch {
    /* ignore quota / privacy mode */
  }
}

type Patch = Partial<GameState> | ((s: GameState) => Partial<GameState>);

export const store = {
  get: () => state,

  set(patch: Patch) {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    emit();
    persistGuest();
  },

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  hydrate() {
    try {
      const raw = localStorage.getItem(GUEST_SAVE_KEY);
      if (raw) state = { ...state, ...normalizeSaved(JSON.parse(raw)) };
      emit();
    } catch {
      /* corrupt save */
    }
  },

  loadGuest() {
    state = { ...state, ...normalizeSaved({}), panel: null, dialog: null };
    store.hydrate();
  },

  reset() {
    localStorage.removeItem(GUEST_SAVE_KEY);
    state = { ...INITIAL_STATE, phase: "game", introSeen: true, account: state.account };
    emit();
  },

  updateTrader(id: string, patch: Partial<Trader> | ((t: Trader) => Partial<Trader>)) {
    store.set((s) => ({
      traders: s.traders.map((t) => (t.id === id ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t)),
    }));
  },

  log(id: string, msg: string) {
    store.updateTrader(id, (t) => ({ log: [...t.log.slice(-40), { t: Date.now(), msg }] }));
  },

  hire(archetype: ArchetypeId): Trader | null {
    const s = state;
    if (s.traders.length >= MAX_TRADERS) return null;
    const taken = new Set(s.traders.map((t) => t.desk));
    let desk = 0;
    while (taken.has(desk)) desk++;
    const n = s.traders.length + 1;
    const trader: Trader = {
      id: uid(),
      code: `TRADER_${String(n).padStart(3, "0")}`,
      archetype,
      personality: "calm",
      playbooks: [],
      directive: "",
      risk: { ...DEFAULT_RISK },
      capital: 0,
      inPositions: 0,
      status: "hired",
      desk,
      agentState: "IDLE",
      pnl: 0,
      trades: 0,
      wins: 0,
      log: [{ t: Date.now(), msg: "Hired." }],
    };
    store.set({ traders: [...s.traders, trader] });
    return trader;
  },

  say(speaker: string, lines: string[]) {
    store.set({ dialog: { speaker, lines, idx: 0 } });
  },

  bannerShow(title: string, sub: string) {
    store.set({ banner: { title, sub, at: Date.now() } });
  },
};

/** React-hook: prenumerera på en del av spel-state. */
export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(INITIAL_STATE),
  );
}

export interface Objective {
  text: string;
  target: string | null;
  traderId?: string;
}

/** Nästa steg i onboarding-flödet (visas i HUD + gul markör i kontoret). */
export function nextObjective(s: GameState): Objective {
  if (s.traders.length === 0) return { text: "HIRE YOUR FIRST TRADER IN HIRING / HR", target: "hire-1" };
  const t = s.traders.find((tr) => tr.status !== "onShift" && tr.status !== "offShift");
  if (!t) return { text: "YOUR FLOOR IS TRADING. HIRE MORE IN HR.", target: null };
  switch (t.status) {
    case "hired":
      return { text: `PAIR ${t.code} WITH SI IN THE LAB`, target: "si-machine", traderId: t.id };
    case "paired":
      return { text: "SET PERSONALITY + PLAYBOOKS IN STRATEGY", target: "strategy-board", traderId: t.id };
    case "configured":
      return { text: "CONFIGURE RISK IN THE RISK DEPT", target: "risk-terminal", traderId: t.id };
    case "risk":
      return { text: "CREATE + FUND A WALLET IN THE VAULT", target: "vault-terminal", traderId: t.id };
    case "funded":
      return { text: `PUT ${t.code} ON SHIFT AT THE VAULT`, target: "vault-terminal", traderId: t.id };
  }
  return { text: "", target: null };
}

/** Dagens samlade P&L från ledgern. */
export const todayPnl = (s: GameState) => {
  const today = new Date().toDateString();
  return s.ledger.filter((e) => new Date(e.t).toDateString() === today).reduce((sum, e) => sum + e.pnl, 0);
};

// Panel-hjälpare
export const closePanel = () => store.set({ panel: null });
export const openPanel = (panel: GameState["panel"]) => store.set({ panel });
export const useTrader = (id: string) => useGame((s) => s.traders.find((t) => t.id === id));
