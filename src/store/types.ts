export type Dir = "up" | "down" | "left" | "right";

export interface Look {
  hair: string;
  skin: string;
  suit: string;
  tie: string;
  shirt?: string;
  /** Valfri slipsnål (1 px rad över slipsen). */
  tieBar?: string;
  hairStyle?: 0 | 1 | 2;
  headset?: boolean;
}

export type ArchetypeId = "degen" | "quant" | "sniper" | "contrarian" | "survivor";
export type PersonalityId = "calm" | "confident" | "paranoid" | "aggressive" | "patient" | "chaotic";
export type PlaybookId = "momentum" | "whale" | "launches" | "social" | "reversal" | "preservation";

export type AgentState =
  | "IDLE"
  | "SCANNING"
  | "RESEARCHING"
  | "SOCIAL"
  | "ANALYZING"
  | "SIGNAL FOUND"
  | "REVIEWING RISK"
  | "POSITION OPEN"
  | "MONITORING"
  | "PASS"
  | "POSITION CLOSED"
  | "COFFEE";

export type TraderStatus = "hired" | "paired" | "configured" | "risk" | "funded" | "onShift" | "offShift";

export interface RiskConfig {
  maxPosition: number;
  maxDailyLoss: number;
  maxOpen: number;
  stopLoss: "TIGHT" | "STANDARD" | "WIDE";
  takeProfit: "QUICK" | "LADDER" | "LET RUN";
  reserve: number;
}

export interface TraderWallet {
  address: string;
  /** true = lokal demo-plånbok (ingen riktig nyckel). */
  demo?: boolean;
}

export interface LogEntry {
  t: number;
  msg: string;
}

export interface Trader {
  id: string;
  code: string;
  archetype: ArchetypeId;
  personality: PersonalityId;
  playbooks: PlaybookId[];
  directive: string;
  risk: RiskConfig;
  capital: number;
  inPositions: number;
  status: TraderStatus;
  desk: number;
  agentState: AgentState;
  pnl: number;
  trades: number;
  wins: number;
  log: LogEntry[];
  wallet?: TraderWallet;
}

export interface LedgerEntry {
  t: number;
  code: string;
  market: string;
  pnl: number;
}

export type Panel =
  | { type: "hire"; idx: number }
  | { type: "pair"; traderId: string }
  | { type: "strategy"; traderId: string }
  | { type: "risk"; traderId: string }
  | { type: "vault"; traderId: string }
  | { type: "trader"; traderId: string }
  | { type: "analytics" }
  | { type: "leaderboard" }
  | { type: "floor" }
  | { type: "menu" }
  | { type: "staff" }
  | { type: "ledger" }
  | { type: "settings" }
  | { type: "how" }
  | { type: "connect" }
  | { type: "elevator" }
  | { type: "meeting" }
  | { type: "founder" }
  | { type: "locked"; name: string };

export interface Dialog {
  speaker: string;
  lines: string[];
  idx: number;
}

export interface Banner {
  title: string;
  sub: string;
  at: number;
}

export type AccountStatus = "idle" | "connecting" | "signing" | "connected";

export interface Account {
  publicKey: string | null;
  status: AccountStatus;
  error: string;
  /** true när kontot är ett lokalt demo-konto (ingen Phantom hittades). */
  demo?: boolean;
}

export interface GameState {
  phase: "title" | "game";
  firmName: string;
  traders: Trader[];
  ledger: LedgerEntry[];
  panel: Panel | null;
  dialog: Dialog | null;
  introSeen: boolean;
  banner: Banner | null;
  account: Account;
}

/** Den del av state som sparas (localStorage / TODO(backend): server). */
export interface SavedState {
  firmName?: string;
  traders?: Trader[];
  ledger?: LedgerEntry[];
  introSeen?: boolean;
}
