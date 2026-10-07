/**
 * Demo-läge.
 *
 * Referensen kör inloggning (Phantom signMessage), trader-plånböcker,
 * insättningar och statistik via egna server-funktioner. Den lokala
 * implementationen har ingen backend, så de flödena körs här som demo-state.
 *
 * TODO(backend): koppla services/* mot riktiga endpoints och sätt DEMO_MODE=false.
 */
const env = import.meta.env;

/** Demo-plånböcker och simulerade insättningar (inga riktiga transaktioner). */
export const DEMO_MODE = env.VITE_DEMO_MODE !== "false";

/** Simulerade avslutade trades för traders on shift (fyller Analytics/Ledger). */
export const DEMO_TRADES = env.VITE_DEMO_TRADES !== "false";

/** Endpoint för publik statistik (titelskärm, leaderboard, "The Floor"). */
export const STATS_URL = env.VITE_STATS_URL || "/api/stats.json";

/** Nätverksnamn som visas i UI. */
export const NETWORK_LABEL = "SOLANA MAINNET";

/** Explorer-länk för en adress. */
export const explorerUrl = (address: string) => `https://solscan.io/account/${address}`;
