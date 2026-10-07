/**
 * The Vault — trader-plånböcker, saldon och insättningar.
 *
 * Referensen skapar en riktig Solana-plånbok per trader på servern, läser
 * saldon från kedjan, bygger en SystemProgram-transfer som signeras i Phantom
 * och kan exportera trader-plånbokens privata nyckel.
 *
 * Lokalt (DEMO_MODE): plånböckerna är DEMO-adresser som INTE är giltiga
 * Solana-adresser (så ingen kan skicka riktiga pengar till dem), och
 * insättningar simuleras. Inga transaktioner skickas någonsin.
 * TODO(backend): createWallet / balances / blockhash / tx-status / exportKey.
 */
import { DEMO_MODE } from "@/config/demo";
import { randomBase58, shortAddr, sleep } from "@/lib/format";
import { store } from "@/store/store";

const DEMO_BAL_KEY = "floor.demo.balances";

function readDemoBalances(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_BAL_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function writeDemoBalances(b: Record<string, number>) {
  try {
    localStorage.setItem(DEMO_BAL_KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

/** Justera ett demo-saldo (används även av den simulerade trading-motorn). */
export function adjustDemoBalance(address: string, delta: number): number {
  const b = readDemoBalances();
  b[address] = Math.max(0, (b[address] ?? 0) + delta);
  writeDemoBalances(b);
  return b[address];
}

export const isDemoAddress = (a: string) => a.startsWith("DEMO0");

function requireAccount() {
  if (store.get().account.status !== "connected") throw new Error("CONNECT PHANTOM FIRST.");
}

/** GENERATE WALLET */
export async function createWallet(_traderId: string): Promise<{ address: string; demo?: boolean }> {
  requireAccount();
  if (!DEMO_MODE) throw new Error("WALLET BACKEND NOT CONFIGURED."); // TODO(backend)
  await sleep(900);
  // "0" och "O" finns inte i base58 → adressen kan aldrig ta emot riktiga SOL.
  return { address: `DEMO0WALLET0${randomBase58(32)}`, demo: true };
}

/** EXPORT PRIVATE KEY */
export async function exportWalletKey(traderId: string): Promise<{ address: string; privateKey: string }> {
  requireAccount();
  const t = store.get().traders.find((x) => x.id === traderId);
  if (!t?.wallet) throw new Error("NO WALLET ON FILE.");
  if (!DEMO_MODE) throw new Error("WALLET BACKEND NOT CONFIGURED."); // TODO(backend)
  await sleep(600);
  return { address: t.wallet.address, privateKey: "DEMO-MODE · THIS WALLET HAS NO PRIVATE KEY · TODO(backend)" };
}

const lastKnown = new Map<string, number>();

/** Markera ett saldo som redan känt (så att trade-P&L inte tolkas som insättning). */
export const setKnownBalance = (address: string, balance: number) => lastKnown.set(address, balance);

/** Läs saldon för alla trader-plånböcker och upptäck insättningar. */
export async function refreshBalances() {
  if (store.get().account.status !== "connected") return;
  const traders = store.get().traders.filter((t) => t.wallet?.address);
  if (!traders.length) return;

  // TODO(backend): hämta riktiga saldon. Demo: lokala saldon.
  const balances = readDemoBalances();

  for (const t of traders) {
    const address = t.wallet!.address;
    const bal = balances[address];
    if (bal === undefined) continue;
    const before = lastKnown.get(address);
    lastKnown.set(address, bal);
    const delta = bal - (before ?? t.capital);
    const patch: { capital: number; status?: "funded" } = { capital: bal };
    if (bal > 0 && t.status === "risk") patch.status = "funded";
    if (bal !== t.capital || patch.status) store.updateTrader(t.id, patch);
    if (delta > 1e-7 && bal > 0) {
      store.log(t.id, `Deposit detected: +${delta.toFixed(4)} SOL (balance ${bal.toFixed(4)} SOL).`);
      store.bannerShow(`+${delta.toFixed(4)} SOL`, `DEPOSIT DETECTED · ${t.code}`);
    }
  }
}

/** FUND FROM PHANTOM — skicka SOL från grundarens plånbok till traderns. */
export async function fundWallet(address: string, amount: number, onStatus: (s: string) => void) {
  requireAccount();
  if (!(amount > 0)) throw new Error("AMOUNT MUST BE POSITIVE.");
  if (!DEMO_MODE || !isDemoAddress(address)) throw new Error("TRANSFERS ARE DISABLED IN THIS BUILD."); // TODO(backend)
  onStatus("APPROVE IN PHANTOM");
  await sleep(900);
  onStatus("CONFIRMING ON-CHAIN");
  await sleep(1500);
  adjustDemoBalance(address, amount);
  await refreshBalances();
  return `demo-${randomBase58(24)}`;
}

export const describeWallet = (address: string) => shortAddr(address);

let started = false;
/** Polla saldon var 15:e sekund (som referensen). */
export function startBalancePolling() {
  if (started || typeof window === "undefined") return;
  started = true;
  setInterval(() => void refreshBalances(), 15_000);
}
