/**
 * Branding — allt som ska bytas vid rebrand samlas här.
 * Se BRANDING_TODO.md.
 *
 * Referensens varumärkesnamn, logotyp och kontraktsadress är ersatta med FLOOR:s egna.
 */
export const BRAND = {
  /** Spelets/projektets namn. */
  name: "FLOOR",
  /** Undertitel på titelskärmen. */
  tagline: "RUN YOUR OWN SI TRADING FLOOR",
  /** Logotyp på titelskärmen (112x112 pixel-art på vit bakgrund, visas med mix-blend-multiply). */
  logoUrl: "/assets/brand/logo.png",
  logoAlt: "FLOOR logo",
  /** $FLOOR token-mint (Solana) — visas i CA-baren högst upp, klick kopierar. */
  contractAddress: "pLrwC8WN66YiDwjg4dyZWYa4bqLvxtNMG9nUm3vpump",
} as const;

/** Text som rullar på ticker-skärmarna i trading floor (canvas). */
export const TICKER_TEXT = `${BRAND.name}  ·  SOLANA MAINNET  ·  HIRE  ·  PAIR  ·  SHAPE  ·  LIMIT  ·  FUND  ·  SHIFT  ·  `;
