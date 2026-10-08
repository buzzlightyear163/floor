# BRANDING_TODO

Delar som är neutrala platshållare och behöver ditt eget innehåll.
Ingen av dem hindrar projektet från att köras.

## Namn
- [x] Namn: **FLOOR** (`src/config/brand.ts`). Används i titeln, receptionsskylten,
      tickern, välkomstdialogen, "HOW IT WORKS" och Phantom-panelen.
- [x] `index.html` → `<title>`, `og:title`, `twitter:title`.
- [x] `package.json` → `name`.
- [ ] Kolla att $FLOOR, domän (t.ex. takethefloor.xyz) och X-handle (t.ex. @takethefloor) är lediga.

## Logo & bilder
- [x] `public/assets/brand/logo.png` — 112×112 px, FLOOR-maskoten (Wall Street-mäklaren, byst) på vit bakgrund.
- [x] `public/favicon.png` — 64×64 px.
- [x] `public/assets/brand/og-image.png` — 1200×630 px (screenshot av titelskärmen).
- [x] `marketing/floor-avatar.png` (X / pump.fun, 1024×1024), `marketing/floor-x-banner.png` (1500×500) och `marketing/floor-mascot.png` (byst, transparent).
- [x] X-postbilder 1600×900: `marketing/floor-launch-post.png`, `marketing/floor-now-hiring.png`.

## Text
- [x] `src/config/brand.ts` → `tagline`: "RUN YOUR OWN SI TRADING FLOOR".
- [ ] Meta-beskrivningar i `index.html`.
- [ ] Övrig spel-copy ligger i `src/data/traders.ts`, `src/screens/interact.ts` och panelerna.

## Token
- [x] `src/config/brand.ts` → `contractAddress`: `pLrwC8WN66YiDwjg4dyZWYa4bqLvxtNMG9nUm3vpump` (CA-baren högst upp).

## API / credentials
- [ ] `VITE_STATS_URL` — riktig endpoint för publik statistik (se `.env.example`).
- [ ] Backend för inloggning (nonce + signaturverifiering + session).
- [ ] Backend för trader-plånböcker (skapa, saldo, export) — **aldrig privata nycklar i frontend**.
- [ ] Transaktionsflöde (blockhash, `signAndSendTransaction`, bekräftelse).
- [ ] Riktiga trades/ledger i stället för `services/simulator.ts`.
- [ ] Sätt `VITE_DEMO_MODE=false` och `VITE_DEMO_TRADES=false` när allt ovan finns.

Sök efter `TODO(backend)` och `TODO(branding)` i `src/`.
