/**
 * OfficeEngine — canvas-renderat pixelkontor.
 *
 * mode "title": kameran glider mellan rummen och demo-traders jobbar.
 * mode "game":  spelaren (grundaren) styrs med WASD/pilar eller klick,
 *               personal och anställda traders rör sig efter spelets state.
 */
import { TICKER_TEXT } from "@/config/brand";
import {
  ARCHETYPES,
  DESK_STATES,
  FOUNDER_LOOK,
  PERSONALITIES,
  STAFF_LOOKS,
  STATE_DURATION,
  STATE_LINES,
  archetypeById,
  personalityById,
} from "@/data/traders";
import { fmtSigned } from "@/lib/format";
import { nextObjective, store } from "@/store/store";
import type { AgentState, ArchetypeId, Dir, Look, PersonalityId, Trader, TraderStatus } from "@/store/types";
import {
  CANDIDATE_SPOTS,
  DESKS,
  DOOR_SET,
  FURNITURE,
  INTERACTABLES,
  MAP_H,
  MAP_W,
  ROOMS,
  ROOM_GRID,
  ROOM_LABELS,
  SPOTS,
  TILE,
  WORLD_H,
  WORLD_W,
  deskSeat,
  findPath,
  isBlocked,
  nearestFree,
  roomIndexAt,
  type Furniture,
  type Interactable,
  type Tile,
} from "./map";
import { INK, PAL, drawCharacter } from "./sprites";

export type EngineMode = "title" | "game";

export interface EngineOptions {
  mode: EngineMode;
  onNear?: (target: Interactable | null) => void;
  onLocation?: (roomName: string) => void;
}

type EntityKind = "player" | "staff" | "trader" | "candidate";

interface Point {
  x: number;
  y: number;
}

interface Entity {
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  look: Look;
  dir: Dir;
  path: Tile[];
  speed: number;
  anim: number;
  moving: boolean;
  sit: boolean;
  wait: number;
  timer: number;
  idleOffset: number;
  home?: Point;
  homeDir?: Dir;
  pois?: Point[];
  bubble?: { text: string; until: number };
  // traders
  traderId?: string;
  status?: TraderStatus;
  st?: AgentState;
  arrived?: boolean;
  trades?: number;
  pnl?: number;
  demo?: { archetype: ArchetypeId; personality: PersonalityId; desk: number };
}

const FONT = '"Press Start 2P"';
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Kamerans waypoints på titelskärmen (tile-koordinater). */
const TITLE_CAMERA: Point[] = [
  { x: 24, y: 23 },
  { x: 36, y: 7 },
  { x: 52, y: 22 },
  { x: 22, y: 6 },
  { x: 8, y: 20 },
];

export class OfficeEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: EngineOptions;
  private ents: Entity[] = [];
  private player: Entity | null = null;
  private keys = new Set<string>();
  private staticLayer: HTMLCanvasElement;
  private scale = 3;
  private cam = { x: 0, y: 0 };
  private t = 0;
  private raf = 0;
  private last = 0;
  private near: Interactable | null = null;
  private room = "";
  private guide: { x: number; y: number; door: boolean } | null = null;
  private guideT = 0;
  private elevatorOpen = 0;

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.opts = opts;
    this.staticLayer = document.createElement("canvas");
    this.staticLayer.width = WORLD_W;
    this.staticLayer.height = WORLD_H;
    this.drawStatic();
    // Rita om skyltarna när pixel-typsnittet laddats klart.
    document.fonts?.ready.then(() => this.drawStatic());
    this.spawnWorld();
  }

  // -------------------------------------------------------------------------
  // Värld
  // -------------------------------------------------------------------------
  private mk(e: Partial<Entity> & Pick<Entity, "id" | "kind" | "x" | "y" | "look">): Entity {
    return {
      dir: "down",
      path: [],
      speed: 2.6,
      anim: 0,
      moving: false,
      sit: false,
      wait: Math.random() * 3,
      timer: 0,
      idleOffset: Math.random() * 10,
      ...e,
    };
  }

  private spawnWorld() {
    const looks = STAFF_LOOKS;
    const wander: Point[] = [
      SPOTS.coffee,
      SPOTS.cooler,
      SPOTS.meeting,
      SPOTS.board,
      SPOTS.research,
      SPOTS.elevator,
      { x: 25, y: 22 },
      { x: 8, y: 9 },
    ];

    this.ents.push(
      this.mk({ id: "receptionist", kind: "staff", x: 6.5, y: 3.5, look: looks[0], home: SPOTS.reception, homeDir: "down", pois: [SPOTS.reception] }),
      this.mk({ id: "recruiter", kind: "staff", x: 17.5, y: 2.5, look: looks[1], home: SPOTS.hr, homeDir: "down", pois: [SPOTS.hr] }),
      this.mk({
        id: "labtech",
        kind: "staff",
        x: 33.5,
        y: 7.5,
        look: { ...looks[4], suit: "#e9e4d8", tie: "#4a6fa5" },
        pois: [{ x: 33, y: 7 }, { x: 41, y: 7 }, { x: 31, y: 9 }, { x: 40, y: 4 }],
      }),
      this.mk({ id: "analyst", kind: "staff", x: 40.5, y: 21.5, look: looks[2], pois: [SPOTS.social, SPOTS.research, { x: 38, y: 18 }, SPOTS.cooler] }),
      this.mk({
        id: "guard",
        kind: "staff",
        x: 54.5,
        y: 26.5,
        look: { ...looks[3], suit: "#3b4a5c" },
        pois: [{ x: 54, y: 26 }, { x: 50, y: 28 }, { x: 55, y: 21 }],
      }),
      this.mk({ id: "intern", kind: "staff", x: 20.5, y: 13.5, look: looks[2], pois: wander, speed: 3 }),
      this.mk({ id: "riskofficer", kind: "staff", x: 40.5, y: 27.5, look: looks[3], pois: [{ x: 40, y: 27 }, SPOTS.risk, { x: 42, y: 25 }] }),
    );

    if (this.opts.mode === "title") {
      // 7 demo-traders vid skrivborden
      ARCHETYPES.concat(ARCHETYPES.slice(0, 2)).forEach((a, i) => {
        const seat = deskSeat(i);
        const e = this.mk({
          id: `demo-${i}`,
          kind: "trader",
          x: seat.x + 0.5,
          y: seat.y + 0.5,
          look: { ...a.look, headset: true },
          demo: { archetype: a.id, personality: PERSONALITIES[i % 6].id, desk: i },
          speed: 2.4,
        });
        this.enterState(e, i % 2 ? "SCANNING" : "MONITORING");
        e.path = [];
        this.ents.push(e);
      });
      this.ents.push(this.mk({ id: "visitor", kind: "staff", x: 30.5, y: 13.5, look: looks[4], pois: wander }));
    } else {
      // Kandidater på HR-mattan, en per arketyp
      ARCHETYPES.forEach((a, i) => {
        const p = CANDIDATE_SPOTS[i];
        this.ents.push(
          this.mk({ id: `cand-${i}`, kind: "candidate", x: p.x + 0.5, y: p.y + 0.5, look: a.look, home: p, homeDir: "down" }),
        );
      });
      this.player = this.mk({ id: "player", kind: "player", x: SPOTS.start.x + 0.5, y: SPOTS.start.y + 0.5, look: FOUNDER_LOOK, speed: 7 });
      this.ents.push(this.player);
    }
  }

  // -------------------------------------------------------------------------
  // Livscykel
  // -------------------------------------------------------------------------
  start() {
    this.resize();
    window.addEventListener("resize", this.resize);
    if (this.opts.mode === "game") {
      window.addEventListener("keydown", this.onKey);
      window.addEventListener("keyup", this.onKeyUp);
      this.canvas.addEventListener("pointerdown", this.onClick);
    }
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onClick);
  }

  private resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const base = this.opts.mode === "title" ? (w < 800 ? 2 : 2.5) : w < 800 ? 2 : 3;
    this.scale = base * dpr;
  };

  private blocked() {
    const s = store.get();
    return !!(s.panel || s.dialog);
  }

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------
  private onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
      this.keys.add(k);
      if (this.player) this.player.path = [];
      if (k.startsWith("arrow")) e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onClick = (e: PointerEvent) => {
    if (!this.player || this.blocked()) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const wx = ((e.clientX - rect.left) * dpr) / this.scale + this.cam.x;
    const wy = ((e.clientY - rect.top) * dpr) / this.scale + this.cam.y;
    const free = nearestFree(Math.floor(wx / TILE), Math.floor(wy / TILE), [
      [0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [1, 1], [-1, 1],
    ]);
    if (!free) return;
    this.player.path = findPath(this.player.x, this.player.y, free[0], free[1]);
  };

  // -------------------------------------------------------------------------
  // Uppdatering
  // -------------------------------------------------------------------------
  private update(dt: number) {
    this.t += dt;
    if (this.opts.mode === "game") this.syncTraders();

    for (const e of this.ents) {
      if (e.kind === "player") this.updatePlayer(e, dt);
      else if (e.kind === "staff") this.updateStaff(e, dt);
      else if (e.kind === "trader") this.updateTrader(e, dt);
      else if (e.kind === "candidate") {
        e.dir =
          Math.sin(this.t * 0.7 + e.idleOffset) > 0.6
            ? "left"
            : Math.sin(this.t * 0.5 + e.idleOffset) < -0.7
              ? "right"
              : "down";
      }
      if (e.kind !== "player") this.followPath(e, dt);
      if (e.bubble && e.bubble.until < this.t) e.bubble = undefined;
    }

    // Hissdörrarna öppnas när någon står framför dem
    const atElevator = this.ents.some((e) => Math.abs(e.x - 57.5) < 1.6 && Math.abs(e.y - 13.5) < 1.2);
    this.elevatorOpen = Math.max(0, Math.min(1, this.elevatorOpen + (atElevator ? 1 : -1) * dt * 2.5));

    if (this.player) {
      this.guideT -= dt;
      if (this.guideT <= 0) {
        this.guideT = 0.25;
        this.updateGuide();
      }
      let best: Interactable | null = null;
      let bestDist = 99;
      for (const it of INTERACTABLES) {
        const d = Math.hypot(this.player.x - (it.x + 0.5), this.player.y - (it.y + 0.5));
        if (d < (it.r ?? 1.6) && d < bestDist) {
          bestDist = d;
          best = it;
        }
      }
      if (best?.id !== this.near?.id) {
        this.near = best;
        this.opts.onNear?.(best);
      }
      const idx = roomIndexAt(this.player.x, this.player.y);
      const name = idx >= 0 ? ROOMS[idx].name : "";
      if (name && name !== this.room) {
        this.room = name;
        this.opts.onLocation?.(name);
      }
    }
  }

  /** Gul guide-pil mot nästa mål (dörr eller interaktionspunkt). */
  private updateGuide() {
    const p = this.player!;
    const target = INTERACTABLES.find((i) => i.id === nextObjective(store.get()).target);
    if (!target || this.near?.id === target.id) {
      this.guide = null;
      return;
    }
    let tx = Math.floor(target.x + 0.5);
    let ty = Math.floor(target.y + 0.5);
    if (isBlocked(tx, ty)) {
      const free = nearestFree(tx, ty, [[0, 1], [0, 2], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1]]);
      if (free) [tx, ty] = free;
    }
    const path = findPath(p.x, p.y, tx, ty);
    const fromRoom = ROOM_GRID[Math.floor(p.y) * MAP_W + Math.floor(p.x)];
    const door = path.find((n) => DOOR_SET.has(n.y * MAP_W + n.x));
    const toRoom = ROOM_GRID[ty * MAP_W + tx];
    this.guide =
      door && fromRoom !== toRoom
        ? { x: door.x + 0.5, y: door.y + 0.5, door: true }
        : { x: target.x + 0.5, y: target.y, door: false };
  }

  private updatePlayer(e: Entity, dt: number) {
    let dx = 0;
    let dy = 0;
    if (this.blocked()) e.path = [];
    else {
      if (this.keys.has("w") || this.keys.has("arrowup")) dy -= 1;
      if (this.keys.has("s") || this.keys.has("arrowdown")) dy += 1;
      if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= 1;
      if (this.keys.has("d") || this.keys.has("arrowright")) dx += 1;
    }
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const step = e.speed * dt;
      const nx = e.x + (dx / len) * step;
      const ny = e.y + (dy / len) * step;
      if (this.free(nx, e.y)) e.x = nx;
      if (this.free(e.x, ny)) e.y = ny;
      e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      e.moving = true;
      e.anim += dt * 11;
    } else this.followPath(e, dt);
  }

  /** Kollisionskontroll för spelarens hitbox. */
  private free(x: number, y: number) {
    const r = 0.3;
    return (
      !isBlocked(Math.floor(x - r), Math.floor(y - 0.05)) &&
      !isBlocked(Math.floor(x + r), Math.floor(y - 0.05)) &&
      !isBlocked(Math.floor(x - r), Math.floor(y + 0.35)) &&
      !isBlocked(Math.floor(x + r), Math.floor(y + 0.35))
    );
  }

  private followPath(e: Entity, dt: number) {
    if (!e.path.length) {
      e.moving = false;
      return;
    }
    if (e.kind === "player") e.anim += dt * 3;
    const node = e.path[0];
    const tx = node.x + 0.5;
    const ty = node.y + 0.5;
    const dx = tx - e.x;
    const dy = ty - e.y;
    const dist = Math.hypot(dx, dy);
    const step = e.speed * dt;
    e.sit = false;
    if (dist <= step) {
      e.x = tx;
      e.y = ty;
      e.path.shift();
    } else {
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    }
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)
      e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    e.moving = true;
    e.anim += dt * 7;
  }

  private goto(e: Entity, p: Point) {
    e.path = findPath(e.x, e.y, p.x, p.y);
  }

  private say(e: Entity, text: string, seconds = 2.6) {
    e.bubble = { text, until: this.t + seconds };
  }

  private updateStaff(e: Entity, dt: number) {
    if (e.path.length) return;
    e.wait -= dt;
    if (e.home && e.pois?.length === 1) {
      e.dir = e.homeDir ?? "down";
      if (e.wait < 0) {
        e.wait = 6 + Math.random() * 8;
        const lines = e.id === "receptionist" ? ["WELCOME!", "PHONE'S RINGING.", "HI THERE."] : ["NOW HIRING.", "RESUMES...", "NEXT!"];
        if (Math.random() < 0.6) this.say(e, pick(lines));
      }
      return;
    }
    if (e.wait < 0 && e.pois) {
      this.goto(e, pick(e.pois));
      e.wait = 3 + Math.random() * 7;
      if (Math.random() < 0.25) this.say(e, pick(["COFFEE?", "MEETING AT 3.", "BUSY DAY.", "HMM.", "ON IT."]));
    }
  }

  /** Synka anställda traders (store) → entiteter i kontoret. */
  private syncTraders() {
    const traders = store.get().traders;
    const ids = new Set(traders.map((t) => t.id));
    this.ents = this.ents.filter((e) => e.kind !== "trader" || (e.traderId && ids.has(e.traderId)));

    for (const t of traders) {
      let e = this.ents.find((x) => x.traderId === t.id);
      const a = archetypeById(t.archetype);
      if (!e) {
        const spot = CANDIDATE_SPOTS[ARCHETYPES.indexOf(a)];
        e = this.mk({ id: t.id, kind: "trader", traderId: t.id, x: spot.x + 0.5, y: spot.y + 1.5, look: { ...a.look }, speed: 2.8 });
        e.trades = t.trades;
        e.pnl = t.pnl;
        this.say(e, "ON IT.");
        this.ents.push(e);
      }
      e.look = { ...a.look, headset: t.status !== "hired" };

      // Demo-trades: visa resultatet som grön/röd pratbubbla.
      if (e.trades !== undefined && t.trades > e.trades) this.say(e, `${fmtSigned(t.pnl - (e.pnl ?? 0), 4)}`, 3);
      e.trades = t.trades;
      e.pnl = t.pnl;

      if (e.status !== t.status) {
        const prev = e.status;
        e.status = t.status;
        switch (t.status) {
          case "hired":
            this.goto(e, SPOTS.lab);
            break;
          case "paired":
            this.goto(e, SPOTS.strategy);
            if (prev) this.say(e, "I CAN THINK.");
            break;
          case "configured":
            this.goto(e, SPOTS.risk);
            break;
          case "risk":
            this.goto(e, SPOTS.vault);
            break;
          case "funded":
            this.goto(e, SPOTS.vaultWait);
            if (prev) this.say(e, "FUNDED.", 3);
            break;
          case "offShift":
            this.goto(e, SPOTS.meeting);
            e.st = undefined;
            break;
          case "onShift":
            this.enterState(e, "SCANNING");
            this.say(e, "CLOCKING IN.");
            break;
        }
      }
    }
  }

  private traderInfo(e: Entity): { archetype: ArchetypeId; personality: PersonalityId; desk: number; trader: Trader | null } {
    if (e.demo) return { ...e.demo, trader: null };
    const t = store.get().traders.find((x) => x.id === e.traderId) ?? null;
    return { archetype: t?.archetype ?? "quant", personality: t?.personality ?? "calm", desk: t?.desk ?? 0, trader: t };
  }

  private destFor(state: AgentState, desk: number): Point {
    switch (state) {
      case "RESEARCHING":
        return SPOTS.research;
      case "SOCIAL":
        return SPOTS.social;
      case "REVIEWING RISK":
        return SPOTS.risk;
      case "COFFEE":
        return Math.random() < 0.5 ? SPOTS.coffee : SPOTS.cooler;
      case "IDLE":
        return pick([SPOTS.board, SPOTS.meeting, { x: 22 + Math.floor(Math.random() * 6), y: 22 }]);
      default:
        return deskSeat(desk);
    }
  }

  private enterState(e: Entity, state: AgentState) {
    const info = this.traderInfo(e);
    e.st = state;
    e.arrived = false;
    this.goto(e, this.destFor(state, info.desk));
    e.timer = STATE_DURATION[state] * (0.7 + Math.random() * 0.8);
    if (info.trader && !e.demo) store.updateTrader(info.trader.id, { agentState: state });
  }

  private nextState(e: Entity): AgentState {
    const books = this.traderInfo(e).trader?.playbooks ?? [];
    const r = Math.random();
    switch (e.st) {
      case "SCANNING":
        return r < 0.2
          ? books.includes("social")
            ? "SOCIAL"
            : "RESEARCHING"
          : r < 0.35
            ? books.includes("whale") || books.includes("launches")
              ? "RESEARCHING"
              : "SOCIAL"
            : r < 0.75
              ? "ANALYZING"
              : r < 0.88
                ? "COFFEE"
                : "IDLE";
      case "RESEARCHING":
      case "SOCIAL":
        return "ANALYZING";
      case "ANALYZING":
        return r < 0.5 ? "MONITORING" : "PASS";
      case "SIGNAL FOUND":
        return "REVIEWING RISK";
      case "REVIEWING RISK":
        return r < 0.7 ? "POSITION OPEN" : "PASS";
      case "POSITION OPEN":
        return "MONITORING";
      case "MONITORING":
        return "SCANNING";
      case "POSITION CLOSED":
      case "PASS":
        return r < 0.4 ? "COFFEE" : "SCANNING";
      default:
        return "SCANNING";
    }
  }

  private updateTrader(e: Entity, dt: number) {
    if (!e.demo && e.status !== "onShift") {
      if (!e.path.length) e.dir = "down";
      return;
    }
    if (!e.st || e.path.length) return;
    const info = this.traderInfo(e);
    const seat = deskSeat(info.desk);
    const atDesk = Math.floor(e.x) === seat.x && Math.floor(e.y) === seat.y;
    if (!e.arrived) {
      e.arrived = true;
      if (atDesk && DESK_STATES.includes(e.st)) {
        e.sit = true;
        e.dir = "up";
      } else {
        e.dir = e.st === "RESEARCHING" || e.st === "REVIEWING RISK" || e.st === "COFFEE" ? "up" : "down";
      }
      const personality = personalityById(info.personality);
      const line =
        Math.random() < 0.3 ? pick(personality.lines).toUpperCase() : pick(STATE_LINES[e.st]);
      if (Math.random() < 0.75) this.say(e, line, 2.4);
    }
    e.timer -= dt;
    if (e.timer <= 0) this.enterState(e, this.nextState(e));
  }

  // -------------------------------------------------------------------------
  // Statiskt lager (golv, väggar, möbler, skyltar) — ritas en gång
  // -------------------------------------------------------------------------
  private drawStatic() {
    const ctx = this.staticLayer.getContext("2d")!;
    const rect = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    rect(0, 0, WORLD_W, WORLD_H, PAL.wallTop);

    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const r = ROOM_GRID[ty * MAP_W + tx];
        const x = tx * TILE;
        const y = ty * TILE;
        if (r < 0) {
          const below = ty + 1 < MAP_H ? ROOM_GRID[(ty + 1) * MAP_W + tx] : -1;
          if (below >= 0) {
            // Väggens framsida
            rect(x, y, 16, 16, PAL.wallFace);
            rect(x, y, 16, 3, PAL.wallFace2);
            rect(x, y + 13, 16, 3, PAL.base);
            if (tx % 4 === 0) rect(x, y + 3, 1, 10, PAL.wallFace2);
          } else {
            rect(x, y, 16, 16, PAL.wallTop);
            rect(x, y, 16, 1, "#4a443e");
          }
          continue;
        }
        const room = ROOMS[r];
        const [a, b] = room.floor;
        if (DOOR_SET.has(ty * MAP_W + tx)) {
          rect(x, y, 16, 16, "#b8a682");
          rect(x, y + 7, 16, 2, "#a08e6a");
          continue;
        }
        if (room.pattern === "tile") {
          rect(x, y, 16, 16, (tx + ty) % 2 ? a : b);
          rect(x, y, 16, 1, "rgba(0,0,0,0.04)");
        } else if (room.pattern === "wood") {
          rect(x, y, 16, 16, a);
          rect(x, y + (tx % 2) * 8, 16, 1, b);
          rect(x + ((ty * 5) % 16), y, 1, 8, b);
        } else {
          rect(x, y, 16, 16, a);
          if ((tx * 7 + ty * 3) % 5 === 0) rect(x + 5, y + 9, 1, 1, b);
          if ((tx * 3 + ty * 11) % 4 === 0) rect(x + 11, y + 3, 1, 1, b);
        }
      }
    }

    for (const f of FURNITURE) this.drawFurniture(ctx, f);

    ctx.font = `6px ${FONT}`;
    ctx.textBaseline = "top";
    for (const [text, tx, ty] of ROOM_LABELS) {
      const w = Math.ceil(ctx.measureText(text).width) + 6;
      const x = tx * TILE + 3;
      const y = ty * TILE + 2;
      rect(x, y, w, 10, INK);
      ctx.fillStyle = PAL.cream;
      ctx.fillText(text, x + 3, y + 2);
    }
  }

  private drawFurniture(ctx: CanvasRenderingContext2D, f: Furniture) {
    const bx = f.x * TILE;
    const by = f.y * TILE;
    const w = f.w * TILE;
    const h = f.h * TILE;
    const o = (x: number, y: number, ww: number, hh: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(bx + x, by + y, ww, hh);
    };
    switch (f.kind) {
      case "window":
        o(2, 2, w - 4, 10, INK);
        o(3, 3, w - 6, 8, "#b8ccd3");
        o(3, 3, w - 6, 2, "#d7e4e8");
        o(w / 2 - 1, 3, 1, 8, INK);
        break;
      case "sign": {
        o(0, 1, w, 12, INK);
        o(1, 2, w - 2, 10, "#2b2724");
        const label = f.label ?? "";
        ctx.font = `8px ${FONT}`;
        ctx.fillStyle = PAL.cream;
        ctx.textBaseline = "top";
        ctx.fillText(label, bx + (w - ctx.measureText(label).width) / 2, by + 3);
        break;
      }
      case "desk":
        o(0, 2, w, 11, INK);
        o(1, 3, w - 2, 8, PAL.wood);
        o(1, 3, w - 2, 2, PAL.woodL);
        o(1, 11, w - 2, 3, PAL.woodD);
        o(18, 7, 10, 3, "#4a4640");
        o(19, 7, 8, 1, "#6a665f");
        o(2, 14, 2, 2, INK);
        o(w - 4, 14, 2, 2, INK);
        o(3, 20, 10, 9, INK);
        o(4, 21, 8, 7, "#3b3733");
        break;
      case "lockeddesk":
        ctx.globalAlpha = 0.45;
        o(0, 2, w, 11, INK);
        o(1, 3, w - 2, 8, "#9a948a");
        o(1, 11, w - 2, 3, "#6f6b65");
        ctx.globalAlpha = 1;
        o(w / 2 - 4, -2, 8, 8, INK);
        o(w / 2 - 3, 1, 6, 4, "#c9b26a");
        o(w / 2 - 2, -1, 4, 2, INK);
        break;
      case "plant":
        o(4, 9, 8, 7, INK);
        o(5, 10, 6, 5, "#9b6b45");
        o(2, 0, 12, 10, INK);
        o(3, 1, 10, 8, "#5e8a4f");
        o(5, -3, 6, 4, INK);
        o(6, -2, 4, 3, "#6f9e5c");
        o(5, 3, 2, 2, "#7fb06a");
        break;
      case "counter":
        o(0, -2, w, 18, INK);
        o(1, -1, w - 2, 5, PAL.woodL);
        o(1, 4, w - 2, 11, "#8a6a4a");
        for (let x = 8; x < w; x += 16) o(x, 6, 1, 8, PAL.woodD);
        break;
      case "sofa":
        o(0, 0, w, 16, INK);
        o(1, 1, w - 2, 6, "#6a3d30");
        o(1, 7, w - 2, 8, "#7f4a3a");
        o(1, 7, 3, 8, "#6a3d30");
        o(w - 4, 7, 3, 8, "#6a3d30");
        break;
      case "table":
        o(0, 1, w, h - 2, INK);
        o(1, 2, w - 2, h - 5, PAL.woodL);
        o(1, h - 4, w - 2, 2, PAL.woodD);
        break;
      case "coffee":
        o(1, -8, 14, 24, INK);
        o(2, -7, 12, 22, "#3a3633");
        o(4, -4, 8, 4, "#5a5550");
        o(5, 4, 6, 5, PAL.cream);
        break;
      case "cooler":
        o(3, -8, 10, 24, INK);
        o(4, -7, 8, 7, "#8fb3d1");
        o(4, 0, 8, 15, "#d5dadd");
        break;
      case "rack":
        o(0, -6, w, h + 6, INK);
        o(1, -5, w - 2, h + 4, "#2e2b29");
        for (let y = -3; y < h; y += 4) o(2, y, w - 4, 1, "#47433f");
        break;
      case "simachine":
        o(-2, -10, w + 4, h + 10, INK);
        o(-1, -9, w + 2, h + 8, "#4a4744");
        o(-1, -9, w + 2, 2, "#5f5b57");
        o(2, h - 6, w - 4, 3, "#33302d");
        for (let x = 4; x < w - 4; x += 6) o(x, h - 10, 3, 2, "#2a2724");
        break;
      case "pad":
        o(0, 0, w, 16, INK);
        o(1, 1, w - 2, 14, "#8d8a84");
        o(3, 3, w - 6, 10, "#a9a59d");
        break;
      case "board":
        o(0, 1, w, 13, INK);
        o(1, 2, w - 2, 11, "#2f3a33");
        break;
      case "terminal":
        o(1, -8, 14, 24, INK);
        o(2, -7, 12, 22, "#6a665f");
        o(3, -6, 10, 8, PAL.screen);
        o(3, 6, 10, 2, "#4a4640");
        break;
      case "vaultdoor": {
        o(0, 0, w, h, INK);
        o(1, 1, w - 2, h - 2, PAL.metalD);
        const cx = bx + w / 2;
        const cy = by + h / 2;
        const disc = (r: number, c: string) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };
        disc(21, INK);
        disc(19, "#a9a59d");
        disc(13, PAL.metal);
        ctx.fillStyle = INK;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.fillRect(Math.round(cx + Math.cos(a) * 10) - 1, Math.round(cy + Math.sin(a) * 10) - 1, 3, 3);
        }
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
        break;
      }
      case "safe":
        o(1, -2, 14, 18, INK);
        o(2, -1, 12, 16, "#6f6b65");
        o(10, 5, 2, 3, "#c9b26a");
        break;
      case "bookshelf":
        o(0, -8, w, 24, INK);
        o(1, -7, w - 2, 22, PAL.woodD);
        ["#b4463c", "#4a6fa5", "#4f8a4b", "#c9b26a", "#e6dcc4"].forEach((c, n) => {
          for (let r = 0; r < f.w; r++) {
            o(3 + r * 16 + n * 2, -5, 2, 7, c);
            o(4 + r * 16 + ((n * 3) % 10), 5, 2, 7, c);
          }
        });
        break;
      case "elevator":
        o(-1, -14, w + 2, 30, INK);
        o(0, -13, w, 28, PAL.metal);
        o(w / 2 - 3, -12, 6, 3, "#c9b26a");
        break;
      case "rug":
        o(0, 0, w, h, "#b39b72");
        o(2, 2, w - 4, h - 4, "#c4ad84");
        o(4, 4, w - 8, h - 8, "#b39b72");
        break;
      case "ticker":
        o(0, 2, w, 10, INK);
        o(1, 3, w - 2, 8, "#1f2420");
        break;
      case "cabinet":
        o(1, -6, 14, 22, INK);
        o(2, -5, 12, 20, "#8f8a80");
        o(2, 1, 12, 1, INK);
        o(2, 8, 12, 1, INK);
        o(7, -2, 3, 1, INK);
        o(7, 4, 3, 1, INK);
        break;
      case "chair":
        o(3, 4, 10, 9, INK);
        o(4, 5, 8, 7, "#3b3733");
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Rendering per frame
  // -------------------------------------------------------------------------
  private render() {
    const { ctx, canvas } = this;
    const s = this.scale;
    const vw = canvas.width / s;
    const vh = canvas.height / s;
    let cx: number;
    let cy: number;

    if (this.player) {
      cx = this.player.x * TILE - vw / 2;
      cy = this.player.y * TILE - vh / 2;
    } else {
      const i = Math.floor(this.t / 9) % TITLE_CAMERA.length;
      const a = TITLE_CAMERA[i];
      const b = TITLE_CAMERA[(i + 1) % TITLE_CAMERA.length];
      const k = Math.min(1, ((this.t % 9) / 9) * 1.6);
      const ease = k * k * (3 - 2 * k);
      cx = (a.x + (b.x - a.x) * ease) * TILE - vw / 2;
      cy = (a.y + (b.y - a.y) * ease) * TILE - vh / 2;
    }
    const maxX = WORLD_W - vw;
    const maxY = WORLD_H - vh;
    cx = maxX < 0 ? maxX / 2 : Math.max(0, Math.min(maxX, cx));
    cy = maxY < 0 ? maxY / 2 : Math.max(0, Math.min(maxY, cy));
    const follow = this.player ? 0.28 : 1;
    this.cam.x += (cx - this.cam.x) * follow;
    this.cam.y += (cy - this.cam.y) * follow;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAL.wallTop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const camX = Math.round(this.cam.x * s) / s;
    const camY = Math.round(this.cam.y * s) / s;
    ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s);
    ctx.drawImage(this.staticLayer, 0, 0);
    this.drawDynamic(ctx);

    const sorted = [...this.ents].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      const frame = e.moving ? Math.floor(e.anim) : -1;
      const bob = !e.moving && !e.sit && Math.sin(this.t * 2 + e.idleOffset) > 0.95 ? 1 : 0;
      drawCharacter(ctx, e.x * TILE, e.y * TILE + 6 - (e.sit ? 3 : 0) - bob, e.look, e.dir, frame, e.sit);
      if (e.kind === "player") {
        // Liten guldpil ovanför grundaren
        ctx.fillStyle = "#c9b26a";
        const y = e.y * TILE - 18 + Math.round(Math.sin(this.t * 5));
        ctx.fillRect(Math.round(e.x * TILE) - 2, y, 4, 2);
        ctx.fillRect(Math.round(e.x * TILE) - 1, y + 2, 2, 1);
      }
    }

    if (this.opts.mode === "game") {
      // "!"-markör över nästa mål
      const target = INTERACTABLES.find((i) => i.id === nextObjective(store.get()).target);
      if (target) {
        const x = Math.round((target.x + 0.5) * TILE);
        const y = Math.round(target.y * TILE - 22 + Math.abs(Math.sin(this.t * 4)) * -4);
        ctx.fillStyle = INK;
        ctx.fillRect(x - 4, y - 1, 9, 11);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(x - 3, y, 7, 9);
        ctx.fillStyle = INK;
        ctx.fillRect(x - 1, y + 1, 2, 4);
        ctx.fillRect(x - 1, y + 6, 2, 2);
      }
      // Blinkande ram runt närmaste interaktionspunkt
      if (this.near) {
        const n = this.near;
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 1;
        const pulse = Math.floor(this.t * 3) % 2;
        ctx.strokeRect(Math.round(n.x * TILE) - pulse + 0.5, Math.round(n.y * TILE) - 8 - pulse + 0.5, 16 + pulse * 2, 22 + pulse * 2);
      }
      this.drawGuide(ctx, camX, camY, vw, vh);
    }

    // Pratbubblor
    ctx.font = `6px ${FONT}`;
    ctx.textBaseline = "top";
    for (const e of sorted) {
      if (!e.bubble) continue;
      const w = Math.ceil(ctx.measureText(e.bubble.text).width) + 8;
      const x = Math.round(e.x * TILE - w / 2);
      const y = Math.round(e.y * TILE - 30 - (e.sit ? 0 : 2));
      ctx.fillStyle = INK;
      ctx.fillRect(x - 1, y - 1, w + 2, 13);
      ctx.fillStyle = PAL.cream;
      ctx.fillRect(x, y, w, 11);
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(e.x * TILE) - 1, y + 12, 3, 2);
      ctx.fillStyle = e.bubble.text.startsWith("+") ? PAL.green : e.bubble.text.startsWith("-") ? PAL.red : INK;
      ctx.fillText(e.bubble.text, x + 4, y + 3);
    }
  }

  private drawGuide(ctx: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number) {
    const g = this.guide;
    const s = store.get();
    if (!g || s.panel || s.dialog) return;
    const scale = this.scale;
    const wx = g.x * TILE;
    const wy = g.y * TILE;
    const sx = wx - camX;
    const sy = wy - camY;
    const bounce = Math.round(Math.abs(Math.sin(this.t * 5)) * 3);

    if (sx > 18 && sx < vw - 18 && sy > 38 && sy < vh - 18) {
      // Målet syns på skärmen — markera bara dörren
      if (!g.door) return;
      const x = Math.round(wx - 8);
      const y = Math.round(wy - 8);
      const p = Math.floor(this.t * 3) % 2;
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - p + 0.5, y - p + 0.5, 16 + p * 2, 16 + p * 2);
      this.arrow(ctx, Math.round(wx), Math.round(wy - 20 - bounce), Math.PI / 2);
      return;
    }
    // Målet utanför skärmen — pil i skärmkanten
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const ang = Math.atan2(sy - vh / 2, sx - vw / 2);
    const ex = Math.max(18, Math.min(vw - 18, sx));
    const ey = Math.max(46, Math.min(vh - 18, sy));
    const wob = Math.round(Math.cos(this.t * 6) * 2);
    this.arrow(ctx, Math.round(ex - Math.cos(ang) * wob), Math.round(ey - Math.sin(ang) * wob), ang);
    ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
  }

  /** Pixel-pil (snäppt till 45°) med svart kontur. */
  private arrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    const a = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) for (let j = -i; j <= i; j++) if (i > 1 || Math.abs(j) < 1) pts.push([2 - i, j]);
    for (let i = -6; i < -2; i++) for (let j = -1; j <= 1; j++) pts.push([i, j]);
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const paint = (color: string, grow: number) => {
      ctx.fillStyle = color;
      for (const [px, py] of pts) {
        const rx = Math.round(px * cos - py * sin);
        const ry = Math.round(px * sin + py * cos);
        ctx.fillRect(x + rx - grow, y + ry - grow, 1 + grow * 2, 1 + grow * 2);
      }
    };
    paint(INK, 1);
    paint(PAL.gold, 0);
  }

  /** Animerade detaljer: skärmar, rack-lampor, SI-maskinen, tickers, hiss, kaffe. */
  private drawDynamic(ctx: CanvasRenderingContext2D) {
    const t = this.t;
    const r = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const traders = this.opts.mode === "game" ? store.get().traders : [];

    // Skärmar på trader-skrivborden
    DESKS.forEach((d, i) => {
      const x = d.x * TILE;
      const y = d.y * TILE;
      const on = this.opts.mode === "title" ? i < 7 : traders.some((tr) => tr.desk === i && tr.status === "onShift");
      r(x + 1, y - 9, 15, 12, INK);
      r(x + 2, y - 8, 13, 9, on ? PAL.screen : "#3a3633");
      r(x + 7, y + 3, 3, 2, INK);
      if (on) {
        let prev = 0;
        for (let k = 0; k < 11; k++) {
          const v = Math.round(3 + Math.sin(t * 1.3 + k * 0.9 + i) * 2.5 + Math.sin(t * 0.4 + i * 3) * 1);
          r(x + 3 + k, y - 2 - v, 1, 1, v >= prev ? PAL.screenOn : "#e08070");
          prev = v;
        }
        if (Math.floor(t * 2 + i) % 3 === 0) r(x + 12, y - 7, 2, 1, PAL.gold);
      }
    });

    FURNITURE.forEach((f, i) => {
      const x = f.x * TILE;
      const y = f.y * TILE;
      if (f.kind === "terminal") {
        const lit = Math.floor(t * 1.5 + i) % 4 !== 0;
        r(x + 3, y - 6, 10, 8, PAL.screen);
        for (let k = 0; k < 3; k++)
          r(x + 4, y - 5 + k * 2, 2 + ((i * 3 + k * 5 + Math.floor(t * 2)) % 7), 1, lit ? PAL.screenOn : "#5f8a55");
      } else if (f.kind === "rack") {
        for (let k = -3; k < f.h * TILE; k += 4)
          r(x + 11, y + k + 1, 1, 1, Math.floor(t * 6 + k + i) % 3 === 0 ? PAL.red : PAL.green);
      } else if (f.kind === "simachine") {
        const w = f.w * TILE;
        r(x + 4, y - 6, w - 8, 14, INK);
        r(x + 5, y - 5, w - 10, 12, "#1d2a24");
        const glow = (Math.sin(t * 3) + 1) / 2;
        ctx.globalAlpha = 0.5 + glow * 0.5;
        r(x + w / 2 - 6, y - 1 - Math.round(glow * 2), 12, 4, "#9fd0c0");
        ctx.globalAlpha = 1;
        ctx.font = `5px ${FONT}`;
        ctx.fillStyle = PAL.screenOn;
        ctx.textBaseline = "top";
        ctx.fillText("S.I.", x + w / 2 - 9, y - 4);
        for (let k = 0; k < 6; k++) r(x + 6 + k * 9, y + 12, 2, 2, Math.floor(t * 4 + k) % 2 ? PAL.green : PAL.gold);
      } else if (f.kind === "board") {
        const w = f.w * TILE;
        ctx.strokeStyle = "#d9d2c0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
          const px = x + 6 + (k / 40) * (w * 0.45);
          const py = y + 9 - Math.sin(k * 0.4 + t * 0.6) * 3 - k * 0.06;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        for (let k = 0; k < 8; k++) {
          const bh = 2 + Math.round((Math.sin(t + k) + 1) * 2.5);
          r(x + w * 0.55 + k * 7, y + 12 - bh, 4, bh, k % 3 === 0 ? "#e08070" : PAL.screenOn);
        }
      } else if (f.kind === "ticker") {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 1, y + 3, f.w * TILE - 2, 8);
        ctx.clip();
        ctx.font = `5px ${FONT}`;
        ctx.textBaseline = "top";
        const width = Math.ceil(ctx.measureText(TICKER_TEXT).width);
        const off = (t * 14 + i * 40) % width;
        ctx.fillStyle = PAL.gold;
        ctx.fillText(TICKER_TEXT, x + 2 - off, y + 5);
        ctx.fillText(TICKER_TEXT, x + 2 - off + width, y + 5);
        ctx.restore();
      } else if (f.kind === "elevator") {
        const w = f.w * TILE;
        const open = Math.round(this.elevatorOpen * 12);
        r(x + 2, y - 8, w - 4, 22, "#2b2724");
        r(x + 2, y - 8, w / 2 - 2 - open, 22, "#b5b1a8");
        r(x + w / 2 + open, y - 8, w / 2 - 2 - open, 22, "#b5b1a8");
        r(x + w / 2 - 4, y - 12, 8, 3, Math.floor(t * 2) % 2 ? PAL.gold : "#8a7a3a");
      } else if (f.kind === "coffee") {
        if (Math.floor(t * 3) % 2) r(x + 7, y - 10 - (Math.floor(t * 4) % 3), 2, 2, "#d9d2c0");
        r(x + 11, y - 2, 2, 2, Math.floor(t) % 2 ? PAL.red : PAL.green);
      }
    });
  }
}
