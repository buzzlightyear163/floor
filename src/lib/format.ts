import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** className-hjälpare (clsx + tailwind-merge), som i referensen. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1.234 / -1.234 (utan plustecken). */
export const fmt = (n: number, digits = 3) => `${n >= 0 ? "" : "-"}${Math.abs(n).toFixed(digits)}`;

/** +1.234 / -1.234 (alltid med tecken). */
export const fmtSigned = (n: number, digits = 3) => `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(digits)}`;

/** Förkortad adress: ABCD...WXYZ */
export const shortAddr = (a: string) => `${a.slice(0, 4)}...${a.slice(-4)}`;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const randomBase58 = (len: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => B58[b % B58.length]).join("");
};
