/**
 * Kontorskartan: 60 x 32 tiles à 16 px (960 x 512 px world).
 * Rum, dörrar, möbler, interaktionspunkter och BFS-pathfinding.
 */

import { BRAND } from "@/config/brand";

export const TILE = 16;
export const MAP_W = 60;
export const MAP_H = 32;
export const WORLD_W = MAP_W * TILE; // 960
export const WORLD_H = MAP_H * TILE; // 512

export type FloorPattern = "tile" | "wood" | "carpet";

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: [string, string];
  pattern: FloorPattern;
}

export const ROOMS: Room[] = [
  { id: "reception", name: "RECEPTION", x: 1, y: 1, w: 13, h: 10, floor: ["#ece3cd", "#e2d7bd"], pattern: "tile" },
  { id: "hiring", name: "HIRING / HR", x: 15, y: 1, w: 14, h: 10, floor: ["#d8bd92", "#ccb084"], pattern: "wood" },
  { id: "lab", name: "SI PAIRING LAB", x: 30, y: 1, w: 14, h: 10, floor: ["#d2d0c8", "#c6c4bb"], pattern: "tile" },
  { id: "strategy", name: "STRATEGY ROOM", x: 45, y: 1, w: 14, h: 10, floor: ["#dfd2b3", "#d5c8a8"], pattern: "carpet" },
  { id: "hall", name: "HALLWAY", x: 1, y: 12, w: 58, h: 3, floor: ["#e7dec8", "#ddd3bb"], pattern: "tile" },
  { id: "founder", name: "FOUNDER OFFICE", x: 1, y: 16, w: 10, h: 7, floor: ["#c7a477", "#bc996b"], pattern: "wood" },
  { id: "meeting", name: "MEETING ROOM", x: 1, y: 24, w: 10, h: 7, floor: ["#d6c7a6", "#cdbd9b"], pattern: "carpet" },
  { id: "trading", name: "TRADING FLOOR", x: 12, y: 16, w: 24, h: 15, floor: ["#d9ceb4", "#d0c4a9"], pattern: "carpet" },
  { id: "analytics", name: "ANALYTICS", x: 37, y: 16, w: 10, h: 7, floor: ["#dcd8cc", "#d1ccbf"], pattern: "tile" },
  { id: "risk", name: "RISK DEPT", x: 37, y: 24, w: 10, h: 7, floor: ["#d9cfba", "#cfc4ad"], pattern: "tile" },
  { id: "vault", name: "THE VAULT", x: 48, y: 16, w: 11, h: 15, floor: ["#c8c3b7", "#bdb7aa"], pattern: "tile" },
];

/** Dörröppningar i väggarna (tile-koordinater). */
export const DOORS: [number, number][] = [
  [7, 11], [8, 11], [21, 11], [22, 11], [36, 11], [37, 11], [51, 11], [52, 11],
  [5, 15], [6, 15], [22, 15], [23, 15], [24, 15], [25, 15], [41, 15], [42, 15], [49, 15], [50, 15],
  [5, 23], [6, 23], [41, 23], [42, 23],
  [11, 27], [11, 28], [36, 27], [36, 28],
];

export type FurnitureKind =
  | "window" | "sign" | "counter" | "sofa" | "plant" | "terminal" | "rug" | "bookshelf"
  | "rack" | "simachine" | "pad" | "desk" | "board" | "table" | "coffee" | "cooler"
  | "elevator" | "cabinet" | "lockeddesk" | "ticker" | "vaultdoor" | "safe" | "chair";

export interface Furniture {
  kind: FurnitureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  solid: boolean;
  label?: string;
}

const furn = (kind: FurnitureKind, x: number, y: number, w = 1, h = 1, solid = true, label?: string): Furniture => ({
  kind, x, y, w, h, solid, label,
});

/** Trader-skrivborden på trading floor (8 st). */
export const DESKS = [
  { x: 14, y: 19 }, { x: 19, y: 19 }, { x: 24, y: 19 }, { x: 29, y: 19 },
  { x: 14, y: 24 }, { x: 19, y: 24 }, { x: 24, y: 24 }, { x: 29, y: 24 },
];

/** Tile där en trader står/sitter vid sitt skrivbord. */
export const deskSeat = (desk: number) => {
  const d = DESKS[desk] ?? DESKS[0];
  return { x: d.x, y: d.y + 1 };
};

export const FURNITURE: Furniture[] = [
  ...[3, 10, 18, 25, 33, 40, 48, 55].map((x) => furn("window", x, 0, 2, 1, false)),
  // Reception
  furn("sign", 4, 0, 4, 1, false, BRAND.name),
  furn("counter", 4, 4, 5, 1),
  furn("sofa", 2, 8, 3, 1),
  furn("plant", 1, 1),
  furn("plant", 13, 1),
  furn("plant", 13, 9),
  furn("terminal", 11, 2, 1, 1, true, "THE STREET"),
  furn("rug", 5, 6, 4, 3, false),
  // Hiring / HR
  furn("counter", 16, 3, 3, 1),
  furn("bookshelf", 24, 1, 3, 1),
  furn("plant", 28, 1),
  furn("rug", 16, 5, 11, 3, false),
  furn("sign", 20, 0, 3, 1, false, "HIRE"),
  // SI lab
  furn("rack", 30, 1, 1, 2),
  furn("rack", 31, 1, 1, 2),
  furn("rack", 42, 1, 1, 2),
  furn("rack", 43, 1, 1, 2),
  furn("simachine", 35, 2, 4, 2),
  furn("pad", 36, 5, 2, 1, false),
  furn("desk", 31, 8, 2, 1),
  furn("desk", 40, 8, 2, 1),
  furn("rack", 30, 5, 1, 2),
  furn("rack", 43, 5, 1, 2),
  // Strategy room
  furn("board", 47, 0, 10, 1, false),
  furn("terminal", 51, 2, 1, 1, true, "STRATEGY"),
  furn("table", 48, 5, 7, 2),
  furn("plant", 45, 1),
  furn("plant", 58, 1),
  furn("plant", 45, 9),
  // Hallway
  furn("coffee", 10, 12),
  furn("cooler", 30, 12),
  furn("plant", 1, 12),
  furn("plant", 44, 12),
  furn("elevator", 57, 12, 2, 1),
  // Founder office
  furn("bookshelf", 1, 16, 3, 1),
  furn("table", 4, 18, 3, 1),
  furn("terminal", 9, 17, 1, 1, true, "LEADERBOARD"),
  furn("plant", 10, 21),
  furn("cabinet", 1, 21),
  // Meeting room
  furn("table", 3, 26, 5, 2),
  furn("plant", 1, 24),
  furn("plant", 10, 30),
  // Trading floor
  ...DESKS.map((d) => furn("desk", d.x, d.y, 2, 1)),
  ...[14, 19, 24, 29].map((x) => furn("lockeddesk", x, 28, 2, 1)),
  furn("ticker", 13, 15, 8, 1, false),
  furn("ticker", 32, 15, 3, 1, false),
  furn("plant", 12, 16),
  furn("plant", 35, 16),
  furn("plant", 12, 30),
  furn("plant", 35, 30),
  // Analytics
  furn("terminal", 38, 17, 1, 1, true, "ANALYTICS"),
  furn("terminal", 39, 17, 1, 1, true),
  furn("terminal", 44, 17, 1, 1, true, "RESEARCH"),
  furn("desk", 40, 20, 2, 1),
  furn("plant", 46, 16),
  // Risk dept
  furn("terminal", 44, 25, 1, 1, true, "RISK"),
  furn("cabinet", 37, 24),
  furn("cabinet", 38, 24),
  furn("plant", 46, 30),
  furn("table", 39, 28, 3, 1),
  // Vault
  furn("vaultdoor", 51, 16, 5, 3),
  furn("terminal", 49, 21, 1, 1, true, "WALLET"),
  furn("counter", 52, 24, 4, 1),
  furn("safe", 57, 25),
  furn("safe", 57, 26),
  furn("safe", 57, 27),
  furn("safe", 57, 28),
  furn("plant", 48, 30),
];

/** Namngivna platser som NPC:er och traders går till. */
export const SPOTS = {
  lab: { x: 36, y: 5 },
  strategy: { x: 51, y: 3 },
  board: { x: 53, y: 3 },
  risk: { x: 44, y: 26 },
  vault: { x: 49, y: 22 },
  vaultWait: { x: 53, y: 21 },
  coffee: { x: 10, y: 13 },
  cooler: { x: 30, y: 13 },
  research: { x: 44, y: 18 },
  social: { x: 40, y: 21 },
  meeting: { x: 5, y: 28 },
  elevator: { x: 57, y: 13 },
  reception: { x: 6, y: 3 },
  hr: { x: 17, y: 2 },
  start: { x: 7, y: 7 },
} as const;

/** Kandidaternas platser på HR-mattan (en per arketyp). */
export const CANDIDATE_SPOTS = [17, 19, 21, 23, 25].map((x) => ({ x, y: 6 }));

export interface Interactable {
  id: string;
  x: number;
  y: number;
  label: string;
  /** Interaktionsradie i tiles (default 1.6). */
  r?: number;
}

export const INTERACTABLES: Interactable[] = [
  { id: "receptionist", x: 6, y: 3, label: "TALK", r: 2.3 },
  { id: "floor-directory", x: 11, y: 2, label: "THE STREET" },
  ...CANDIDATE_SPOTS.map((p, i) => ({ id: `hire-${i}`, x: p.x, y: p.y, label: "INTERVIEW" })),
  { id: "hr-desk", x: 17, y: 2, label: "HR DESK", r: 2.3 },
  { id: "si-machine", x: 36.5, y: 4, label: "SI PAIRING", r: 2.4 },
  { id: "strategy-board", x: 51, y: 2, label: "STRATEGY", r: 1.9 },
  { id: "risk-terminal", x: 44, y: 25, label: "RISK CONFIG" },
  { id: "vault-terminal", x: 49, y: 21, label: "VAULT" },
  { id: "analytics-terminal", x: 38.5, y: 17, label: "ANALYTICS", r: 1.9 },
  { id: "research-terminal", x: 44, y: 17, label: "RESEARCH" },
  { id: "leaderboard", x: 9, y: 17, label: "LEADERBOARD" },
  { id: "founder-desk", x: 5, y: 18, label: "YOUR DESK", r: 2 },
  { id: "meeting-table", x: 5, y: 26.5, label: "STAND-UP", r: 2.4 },
  { id: "elevator", x: 57.5, y: 12, label: "ELEVATOR", r: 1.9 },
  ...DESKS.map((d, i) => ({ id: `desk-${i}`, x: d.x + 0.5, y: d.y, label: "DESK", r: 1.8 })),
  ...[14, 19, 24, 29].map((x, i) => ({ id: `locked-desk-${i}`, x: x + 0.5, y: 28, label: "LOCKED", r: 1.6 })),
  { id: "coffee", x: 10, y: 12, label: "COFFEE" },
];

/** Rumsskyltar som ritas på väggarna (text, tile x, tile y). */
export const ROOM_LABELS: [string, number, number][] = [
  ["RECEPTION", 9, 11],
  ["HIRING / HR", 23, 11],
  ["SI LAB", 38, 11],
  ["STRATEGY", 53, 11],
  ["FOUNDER", 7, 15],
  ["TRADING FLOOR", 26, 15],
  ["ANALYTICS", 43, 15],
  ["THE VAULT", 54, 15],
  ["MEETING", 7, 23],
  ["RISK", 43, 23],
];

// ---------------------------------------------------------------------------
// Grids
// ---------------------------------------------------------------------------

/** Rumsindex per tile (-1 = vägg). */
export const ROOM_GRID = new Int8Array(MAP_W * MAP_H).fill(-1);
ROOMS.forEach((room, idx) => {
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++) ROOM_GRID[y * MAP_W + x] = idx;
});

export const DOOR_SET = new Set(DOORS.map(([x, y]) => y * MAP_W + x));
const HALL_IDX = ROOMS.findIndex((r) => r.id === "hall");
DOORS.forEach(([x, y]) => (ROOM_GRID[y * MAP_W + x] = HALL_IDX));

/** 1 = blockerad tile (vägg eller solid möbel). */
const SOLID = new Uint8Array(MAP_W * MAP_H);
for (let i = 0; i < SOLID.length; i++) SOLID[i] = ROOM_GRID[i] === -1 ? 1 : 0;
FURNITURE.forEach((f) => {
  if (!f.solid) return;
  for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) SOLID[y * MAP_W + x] = 1;
});

export const isBlocked = (x: number, y: number) =>
  x < 0 || y < 0 || x >= MAP_W || y >= MAP_H || SOLID[y * MAP_W + x] === 1;

export const roomAt = (x: number, y: number): Room | null => {
  const idx = ROOM_GRID[Math.floor(y) * MAP_W + Math.floor(x)];
  return idx >= 0 ? ROOMS[idx] : null;
};

export const roomIndexAt = (x: number, y: number) => ROOM_GRID[Math.floor(y) * MAP_W + Math.floor(x)];

export interface Tile {
  x: number;
  y: number;
}

/** BFS-pathfinding (4-riktningar). Returnerar tiles exklusive start. */
export function findPath(fx: number, fy: number, tx: number, ty: number): Tile[] {
  fx = Math.floor(fx);
  fy = Math.floor(fy);
  tx = Math.floor(tx);
  ty = Math.floor(ty);
  if (isBlocked(tx, ty)) return [];
  const start = fy * MAP_W + fx;
  const goal = ty * MAP_W + tx;
  if (start === goal) return [];

  const prev = new Int32Array(MAP_W * MAP_H).fill(-1);
  prev[start] = start;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur === goal) break;
    const cx = cur % MAP_W;
    const cy = (cur / MAP_W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isBlocked(nx, ny)) continue;
      const ni = ny * MAP_W + nx;
      if (prev[ni] === -1) {
        prev[ni] = cur;
        queue.push(ni);
      }
    }
  }
  if (prev[goal] === -1) return [];
  const path: Tile[] = [];
  let cur = goal;
  while (cur !== start) {
    path.push({ x: cur % MAP_W, y: (cur / MAP_W) | 0 });
    cur = prev[cur];
  }
  return path.reverse();
}

/** Hitta närmaste fria tile runt (x,y) enligt given offset-ordning. */
export function nearestFree(x: number, y: number, offsets: [number, number][]): [number, number] | null {
  if (!isBlocked(x, y)) return [x, y];
  const hit = offsets.map(([dx, dy]) => [x + dx, y + dy] as [number, number]).find(([nx, ny]) => !isBlocked(nx, ny));
  return hit ?? null;
}
