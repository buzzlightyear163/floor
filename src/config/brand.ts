/**
 * Branding — allt som ska bytas vid rebrand samlas här.
 * Se BRANDING_TODO.md.
 *
 * OBS: Referensens varumärkesnamn, logotyp och kontraktsadress har ersatts
 * med neutrala platshållare. Byt ut dem mot ditt eget projekt.
 */
export const BRAND = {
  /** Spelets/projektets namn. */
  name: "FLOOR",
  /** Undertitel på titelskärmen. */
  tagline: "RUN YOUR OWN SI TRADING FLOOR",
  /** Logotyp på titelskärmen (112x112 pixel-art på vit bakgrund, visas med mix-blend-multiply). */
  logoUrl: "/assets/brand/logo.png",
  logoAlt: "FLOOR logo",
  /**
   * Kontraktsadress som visas i CA-baren högst upp.
   * TODO(branding): ersätt med din egen token-mint (44 tecken).
   */
  contractAddress: "YourTokenMintAddressGoesHere111111111111pump",
} as const;

/** Text som rullar på ticker-skärmarna i trading floor (canvas). */
export const TICKER_TEXT = `${BRAND.name}  ·  SOLANA MAINNET  ·  HIRE  ·  PAIR  ·  SHAPE  ·  LIMIT  ·  FUND  ·  SHIFT  ·  `;
