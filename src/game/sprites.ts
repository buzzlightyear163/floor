import type { Dir, Look } from "@/store/types";

/** Bläck-svart som används för konturer i hela kontoret. */
export const INK = "#1c1916";
const SHOE = "#2a2724";

/** Miljöpalett för kontoret. */
export const PAL = {
  wallFace: "#cfc1a1",
  wallFace2: "#c2b392",
  wallTop: "#3a3531",
  base: "#8a7a5c",
  wood: "#a57c52",
  woodD: "#7a5a3a",
  woodL: "#c39a68",
  metal: "#8d8a84",
  metalD: "#5f5c57",
  green: "#4f8a4b",
  red: "#b4463c",
  blue: "#4a6fa5",
  screen: "#1f2b24",
  screenOn: "#9fd08f",
  cream: "#f2ead6",
  gold: "#e0b13a",
} as const;

/** Mörkare nyans (78 %) av en hex-färg — används för kavajens skuggsida. */
export function darken(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const d = (v: number) => Math.max(0, Math.floor(v * 0.78));
  return `rgb(${d((n >> 16) & 255)},${d((n >> 8) & 255)},${d(n & 255)})`;
}

/**
 * Ritar en 12x18 px pixelfigur med fötterna vid (cx, cy).
 * @param frame  gångcykel (>= 0 när figuren rör sig, -1 när den står still)
 * @param sitting sittande pose (ingen skugga, inga ben)
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  look: Look,
  dir: Dir,
  frame: number,
  sitting = false,
) {
  const ox = Math.round(cx - 6);
  const oy = Math.round(cy - 18);
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, w, h);
  };
  const step = frame % 2;
  const style = look.hairStyle ?? 0;

  // Skugga + kontur
  if (!sitting) {
    ctx.fillStyle = "rgba(28,25,22,0.18)";
    ctx.fillRect(ox + 2, oy + 17, 8, 2);
  }
  px(1, -1, 10, 10, INK);
  if (style === 1) px(2, -2, 8, 2, INK);
  px(0, 8, 12, 7, INK);
  if (!sitting) px(2, 14, 8, 4, INK);

  // Ben
  if (!sitting) {
    const walking = frame >= 0;
    const left = walking && step ? 2 : 3;
    const right = walking && !step ? 2 : 3;
    px(3, 14, 2, left, SHOE);
    px(7, 14, 2, right, SHOE);
  }

  // Kropp
  px(1, 8, 10, 6, look.suit);
  px(1, 8, 1, 6, darken(look.suit));
  if (dir !== "up") {
    px(5, 8, 2, 2, look.shirt ?? "#f4efe4");
    px(5, 9, 2, 4, look.tie);
    if (look.tieBar) px(5, 11, 2, 1, look.tieBar);
  }
  px(1, 13, 1, 1, look.skin);
  px(10, 13, 1, 1, look.skin);

  // Huvud
  px(2, 0, 8, 8, look.hair);
  if (style === 1) {
    px(3, -1, 2, 1, look.hair);
    px(7, -1, 2, 1, look.hair);
  }
  if (dir === "down") {
    px(3, 3, 6, 5, look.skin);
    px(3, 3, 6, 1, look.hair);
    px(6, 3, 1, 2, look.hair);
    px(4, 5, 1, 2, INK);
    px(7, 5, 1, 2, INK);
  } else if (dir === "left") {
    px(2, 3, 5, 5, look.skin);
    px(2, 3, 5, 1, look.hair);
    px(3, 5, 1, 2, INK);
  } else if (dir === "right") {
    px(5, 3, 5, 5, look.skin);
    px(5, 3, 5, 1, look.hair);
    px(8, 5, 1, 2, INK);
  }
  if (style === 2 && dir !== "up") {
    px(2, 3, 1, 5, look.hair);
    px(9, 3, 1, 5, look.hair);
  }

  // Headset (SI-parade traders + grundaren)
  if (look.headset) {
    px(9, 0, 1, 4, "#7c7882");
    px(9, 4, 2, 3, "#3a383d");
    if (dir === "down" || dir === "left") px(6, 7, 3, 1, "#5a5760");
  }
}
