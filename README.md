# FLOOR — byggd på en rekonstruktion av buildafirm.company

Lokal, körbar implementation av **https://buildafirm.company/** byggd med
Vite + React + TypeScript (strict) + react-router-dom + Tailwind CSS v4.

Referensen är inte en vanlig innehållssajt utan ett **retro 2D tycoon-spel**: ett
pixelkontor ritat i `<canvas>` där du anställer traders, parar dem med "Super
Intelligence", ger dem strategi och risk-limits, finansierar deras plånbok och
sätter dem på skift. Projektet återskapar hela den frontend-upplevelsen: kartan,
möblerna, figurerna, animationerna, NPC-beteendet, alla 19 paneler och flödet.

> Varumärket är bytt till **FLOOR** ("Run your own SI trading floor"). Kontraktsadressen
> är fortfarande en platshållare — se `BRANDING_TODO.md`. Marknadsföringsbilder ligger i `marketing/`.

---

## Starta

**Windows:** dubbelklicka på `start.bat` (installerar dependencies första gången och startar dev-servern).

**Manuellt:**

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b + vite build → dist/
npm run preview    # servera dist/
```

Kräver Node.js **20.19+** eller **22.12+** (Vite 7).

---

## Routes

| Route | Innehåll |
|---|---|
| `/` | Titelskärm (animerat kontor i bakgrunden) → spelet |
| `*` | 404 "Page not found" (samma markup som referensens) |

Referensen är en single-route-app (TanStack Start). Alla "sidor" är paneler
(modaler) ovanpå kontoret och styrs av spel-state, inte av URL:en:

| Panel | Öppnas från |
|---|---|
| INTERVIEW (hire) | kandidaterna på HR-mattan |
| SI PAIRING STATION | SI-maskinen i labbet |
| STRATEGY ROOM | strategitavlan |
| RISK DEPT · CONFIG | risk-terminalen |
| THE VAULT | wallet-terminalen i valvet |
| TRADER (kort) | skrivbord, STAFF, ANALYTICS |
| ANALYTICS | analytics-/research-terminalen |
| LEADERBOARD TERMINAL | terminalen i founder office |
| THE STREET · PUBLIC DIRECTORY | receptionsterminalen, hissen (L), titelskärmen |
| PAUSED (meny) | ESC / ESC MENU |
| STAFF, LEDGER, SETTINGS, HOW IT WORKS | menyn / founder's desk |
| PHANTOM · ACCOUNT | HUD:ens PHANTOM-fält, menyn |
| ELEVATOR, LOCKED | hissen, låsta skrivbord/våningar |
| DAILY STAND-UP | mötesbordet |
| FOUNDER'S DESK | ditt skrivbord |

---

## Kontroller

`WASD` / piltangenter — gå · klick — gå dit · `E` — interagera · `ESC` — meny ·
`E`/`Enter`/`Space` — nästa rad i dialog. Titelskärmen: piltangenter + Enter.

---

## Projektstruktur

```
public/
  api/stats.json          fixture: publik statistik (firms open, leaderboard …)
  assets/brand/           logo.png, og-image.png
  assets/fonts/           Press Start 2P + VT323 (woff2, självhostade, OFL)
  favicon.png
marketing/                maskot (byst, transparent), X-avatar (1024×1024), X-banner (1500×500) och X-postbilder (1600×900: launch, now hiring)
src/
  config/brand.ts         ALLT som ska bytas vid rebrand (namn, logo, CA)
  config/demo.ts          demo-flaggor, stats-URL, explorer-länk
  data/traders.ts         arketyper, personligheter, playbooks, repliker
  game/map.ts             60×32-tilekarta: rum, dörrar, möbler, interaktioner, BFS
  game/sprites.ts         pixelfigur-renderer + palett
  game/engine.ts          OfficeEngine: loop, kamera, input, NPC/trader-AI, rendering
  store/                  extern store (useSyncExternalStore) + typer
  services/account.ts     Phantom-inloggning / demo-konto + sparning per konto
  services/vault.ts       trader-plånböcker, saldon, insättningar (demo)
  services/stats.ts       publik statistik (fixture, poll var 30 s)
  services/simulator.ts   demo-trades så att Analytics/Ledger har data
  services/phantom.ts     typning av window.phantom.solana
  components/             CaBar, Hud, Banner, OfficeCanvas, ui/pixel, panels/*
  screens/                TitleScreen, GameScreen, interact.ts
  pages/, routes/         HomePage, NotFoundPage, AppRoutes
  styles/index.css        Tailwind v4 + design tokens + pixel-utilities
```

---

## Dependencies

| Paket | Varför |
|---|---|
| react, react-dom, react-router-dom | grund |
| tailwindcss + @tailwindcss/vite | referensen är byggd med Tailwind v4 (samma klasser används) |
| clsx + tailwind-merge | `cn()`-hjälparen, som i referensen |
| qrcode | QR-kod för trader-plånbokens adress i The Vault |

Inga Solana-SDK:er behövs: referensen pratar direkt med Phantoms injicerade provider.

---

## Responsive

Samma breakpoint-beteende som referensen:

- **< 800 px**: canvas-skala 2× (annars 2.5× på titeln, 3× i spelet).
- **< 768 px (md)**: plats/mål-rutan nere till vänster och kontrollhjälpen döljs;
  målet visas i stället som en remsa under HUD:en. HUD-statistiken radbryts.
- Paneler: `max-h-[90vh]`, scroll inuti, grid som går från 1 → 2/3/4 kolumner (`sm`/`md`).
- Titelpanelen: `w-[min(440px,94vw)]`.

Verifierat visuellt vid 390, 867 och 1280 px.

---

## API / mock-data

| Referens (server-funktion) | Lokalt |
|---|---|
| Publik statistik + firmalista (GET, poll 30 s) | `public/api/stats.json` (`VITE_STATS_URL` kan peka på riktig endpoint) |
| Spara/ladda firm per konto | `localStorage` per publicKey |
| Skapa trader-plånbok | DEMO-adress (ogiltig på Solana, kan inte ta emot pengar) |
| Läsa saldon (poll 15 s) | lokala demo-saldon |
| Hämta blockhash + skicka transfer + bekräfta | simulerad insättning |
| Exportera privat nyckel | visar en platshållartext |
| Trades / P&L | `services/simulator.ts` genererar låtsas-trades (`VITE_DEMO_TRADES`) |

Alla ställen markerade **`TODO(backend)`** i koden.

## Auth

Referensen: Phantom `connect()` → `signMessage(nonce)` → server-session.
Lokalt:

- **Phantom installerat:** riktig `connect()` + `signMessage()` (gratis, flyttar inga pengar).
  Signaturen verifieras inte (ingen server) — `TODO(backend)`.
- **Ingen Phantom:** ett lokalt demo-konto skapas så att hela UI-flödet
  (idle → connecting → signing → connected → disconnect) går att testa.

Gäst-firman sparas i `localStorage` (`floor.save.v1`) och flyttas till kontot vid första inloggningen, precis som i referensen.

## Web3

- Kedja: Solana mainnet (endast etikett i UI).
- Plånbok: Phantom (`window.phantom.solana`).
- Explorer-länkar: Solscan (för riktiga adresser; inaktiverad för demo-adresser).
- **Inga transaktioner skickas.** Trader-plånböcker, saldon och insättningar är demo-state.
  Implementera aldrig privata nycklar i frontend — riktiga plånböcker hör hemma på servern.

---

## Ersatta element

- Namnet → **FLOOR** överallt (titel, skylt, ticker, dialoger, HUD, menyer). Spelarens firma heter nu "floor".
- Katalogen över alla spelare → **THE STREET** (var "THE FLOOR" i referensen).
- Titelknappar → `TAKE THE FLOOR` / `BACK TO THE FLOOR` / `VISIT THE STREET`.
- Logotypen → egen pixelmaskot: 80-tals Wall Street-mäklare (bakåtslickat hår, kritstrecksrandig kostym, röd slips med guldnål, tegelstenstelefon) — `public/assets/brand/logo.png`, byst i `marketing/floor-mascot.png`. Grundaren i spelet har samma kostym och slips.
- Kontraktsadressen i CA-baren → platshållare.
- OG-bild → screenshot av titelskärmen.

## Rebranda

1. Ändra `src/config/brand.ts` (namn, tagline, logo, kontraktsadress).
2. Byt `public/assets/brand/logo.png` (112×112, vit bakgrund — den blandas med `mix-blend-multiply`), `public/favicon.png` och `public/assets/brand/og-image.png`.
3. Uppdatera `<title>`/meta i `index.html`.
4. Färger: tokens i `src/styles/index.css` (`:root`). Kontorets palett: `src/game/sprites.ts` och `ROOMS[].floor` i `src/game/map.ts`.
5. Koppla riktiga tjänster i `src/services/*` och sätt `VITE_DEMO_MODE=false`.
