import type { AgentState, ArchetypeId, Look, PersonalityId, PlaybookId } from "@/store/types";

export interface Archetype {
  id: ArchetypeId;
  name: string;
  traits: string[];
  blurb: string;
  tendencies: string[];
  stats: { risk: number; speed: number; patience: number; discipline: number };
  look: Look;
  volatility: number;
  aggression: number;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "degen",
    name: "THE DEGEN",
    traits: ["AGGRESSIVE", "MOMENTUM", "HIGH RISK"],
    blurb: "Lives for the green candle. Sleeps when the market sleeps (never).",
    tendencies: ["Chases breakouts", "Sizes up on strength", "Fast entries"],
    stats: { risk: 5, speed: 5, patience: 1, discipline: 2 },
    look: { hair: "#c25a2c", skin: "#f2c39b", suit: "#3d5a80", tie: "#e0b13a", hairStyle: 1 },
    volatility: 1.8,
    aggression: 0.8,
  },
  {
    id: "quant",
    name: "THE QUANT",
    traits: ["CALCULATED", "DATA-DRIVEN", "SYSTEMATIC"],
    blurb: "Speaks fluent spreadsheet. Trusts the model, not the vibes.",
    tendencies: ["Statistical edges", "Consistent sizing", "Many small trades"],
    stats: { risk: 3, speed: 3, patience: 4, discipline: 5 },
    look: { hair: "#2a2522", skin: "#e9b892", suit: "#5a5753", tie: "#4a6fa5", hairStyle: 0 },
    volatility: 0.9,
    aggression: 0.5,
  },
  {
    id: "sniper",
    name: "THE SNIPER",
    traits: ["PATIENT", "EARLY", "SELECTIVE"],
    blurb: "Waits hours for one shot. Usually takes it.",
    tendencies: ["Few, precise entries", "Early opportunities", "Hard passes"],
    stats: { risk: 3, speed: 4, patience: 5, discipline: 4 },
    look: { hair: "#4a3a2c", skin: "#c98f63", suit: "#2f3b2f", tie: "#8a2b2b", hairStyle: 2 },
    volatility: 1.3,
    aggression: 0.35,
  },
  {
    id: "contrarian",
    name: "THE CONTRARIAN",
    traits: ["OPPORTUNISTIC", "REVERSALS", "AGAINST EXTREMES"],
    blurb: "If everyone is buying, they are already selling.",
    tendencies: ["Fades euphoria", "Buys panic", "Mean reversion"],
    stats: { risk: 4, speed: 3, patience: 3, discipline: 3 },
    look: { hair: "#d9d2c4", skin: "#f0c8a5", suit: "#6b3d2e", tie: "#2a2522", hairStyle: 1 },
    volatility: 1.4,
    aggression: 0.55,
  },
  {
    id: "survivor",
    name: "THE SURVIVOR",
    traits: ["DEFENSIVE", "PRESERVATION", "LOW RISK"],
    blurb: "Has seen every crash. Still here. That is the strategy.",
    tendencies: ["Tight stops", "Small size", "Cash is a position"],
    stats: { risk: 1, speed: 2, patience: 4, discipline: 5 },
    look: { hair: "#7a7570", skin: "#dba67e", suit: "#4a4642", tie: "#4f8a4b", hairStyle: 0 },
    volatility: 0.6,
    aggression: 0.3,
  },
];

export const archetypeById = (id: ArchetypeId): Archetype =>
  ARCHETYPES.find((a) => a.id === id) ?? ARCHETYPES[1];

export interface Personality {
  id: PersonalityId;
  name: string;
  lines: string[];
}

export const PERSONALITIES: Personality[] = [
  { id: "calm", name: "CALM", lines: ["All good. Nothing urgent.", "Steady. Watching.", "Breathe. Then decide."] },
  { id: "confident", name: "CONFIDENT", lines: ["I know this setup.", "Easy entry.", "Told you."] },
  { id: "paranoid", name: "PARANOID", lines: ["Something feels off.", "Who is selling?!", "Checking again..."] },
  { id: "aggressive", name: "AGGRESSIVE", lines: ["Momentum is accelerating.", "Size up.", "GO GO GO."] },
  { id: "patient", name: "PATIENT", lines: ["No setup yet. Waiting.", "Not yet.", "Good things wait."] },
  { id: "chaotic", name: "CHAOTIC", lines: ["This looks stupid. I like it.", "Coin flip? Coin flip.", "lol. lmao. entering."] },
];

export const personalityById = (id: PersonalityId): Personality =>
  PERSONALITIES.find((p) => p.id === id) ?? PERSONALITIES[0];

export interface Playbook {
  id: PlaybookId;
  name: string;
  desc: string;
  glyph: string;
}

export const PLAYBOOKS: Playbook[] = [
  { id: "momentum", name: "MOMENTUM", desc: "Follows accelerating markets.", glyph: ">>" },
  { id: "whale", name: "WHALE WATCHER", desc: "Monitors large-wallet activity.", glyph: "~W" },
  { id: "launches", name: "NEW LAUNCHES", desc: "Focuses on newly created markets.", glyph: "+*" },
  { id: "social", name: "SOCIAL", desc: "Uses social activity as a signal.", glyph: "@!" },
  { id: "reversal", name: "REVERSAL", desc: "Looks for extremes and reversals.", glyph: "<>" },
  { id: "preservation", name: "CAPITAL PRESERVATION", desc: "Prioritizes avoiding catastrophic loss.", glyph: "[]" },
];

export const playbookName = (id: PlaybookId) => PLAYBOOKS.find((p) => p.id === id)?.name ?? id;

/** Pratbubblor per agent-state. */
export const STATE_LINES: Record<AgentState, string[]> = {
  IDLE: ["STRETCH.", "...", "QUIET MARKET."],
  SCANNING: ["SCANNING...", "NOTHING YET.", "WATCHING."],
  RESEARCHING: ["CHECKING WALLETS.", "DIGGING IN."],
  SOCIAL: ["CHATTER RISING.", "READING THE ROOM."],
  ANALYZING: ["VOLUME MOVING.", "HMM."],
  "SIGNAL FOUND": ["SIGNAL FOUND.", "ON IT."],
  "REVIEWING RISK": ["RISK CHECK.", "SIZE OK?"],
  "POSITION OPEN": ["ENTERED.", "IN."],
  MONITORING: ["WATCHING.", "HOLDING."],
  PASS: ["PASS.", "RISK TOO HIGH."],
  "POSITION CLOSED": ["CLOSED.", "BOOKED."],
  COFFEE: ["COFFEE.", "BRB."],
};

/** Tid (sekunder) i varje agent-state innan nästa väljs (x 0.7–1.5). */
export const STATE_DURATION: Record<AgentState, number> = {
  IDLE: 4,
  SCANNING: 6,
  RESEARCHING: 5,
  SOCIAL: 5,
  ANALYZING: 4,
  "SIGNAL FOUND": 1.5,
  "REVIEWING RISK": 3,
  "POSITION OPEN": 2.5,
  MONITORING: 8,
  PASS: 2,
  "POSITION CLOSED": 2,
  COFFEE: 4,
};

/** States där tradern sitter vid sitt skrivbord. */
export const DESK_STATES: AgentState[] = [
  "SCANNING",
  "ANALYZING",
  "POSITION OPEN",
  "MONITORING",
  "PASS",
  "POSITION CLOSED",
  "SIGNAL FOUND",
];

/** Personalens utseenden (reception, HR, labb, analytiker, vakt ...). */
export const STAFF_LOOKS: Look[] = [
  { hair: "#6b3d2e", skin: "#f2c39b", suit: "#a0866a", tie: "#7a2b2b", hairStyle: 2 },
  { hair: "#2a2522", skin: "#8d5a3b", suit: "#e6dcc4", tie: "#4a6fa5", hairStyle: 0 },
  { hair: "#e0b13a", skin: "#f0c8a5", suit: "#4f6a4b", tie: "#2a2522", hairStyle: 1 },
  { hair: "#3a2a22", skin: "#c98f63", suit: "#2a2827", tie: "#b4463c", hairStyle: 0 },
  { hair: "#8a8580", skin: "#e9b892", suit: "#5a6f8a", tie: "#e6dcc4", hairStyle: 2 },
];

/** Spelarens (grundarens) utseende — matchar FLOOR-maskoten (Wall Street-mäklaren). */
export const FOUNDER_LOOK: Look = {
  hair: "#1d1b1e",
  skin: "#f2c39b",
  suit: "#4a4a52",
  tie: "#c8322b",
  tieBar: "#e0b13a",
  headset: false,
  hairStyle: 0,
};

export const MAX_TRADERS = 8;
