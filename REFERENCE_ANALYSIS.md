# Referensanalys — https://buildafirm.company/

Inspekterad 2026-10-06 (DOM, CSS-bundle, JS-bundles, nätverk, server-funktioner).

## Teknik

- TanStack Start (React 19, SSR) byggd med Vite/rolldown, hostad via Lovable.
- Tailwind CSS v4 (shadcn-liknande tokens) + egna pixel-utilities.
- Supabase-klient i bundlen (backend), server-funktioner via `/_serverFn/<hash>`.
- Analytics-script `/~flock.js` (ej återskapat).
- Fonts: Google Fonts *Press Start 2P* (rubriker/UI) och *VT323* (brödtext).

## Routes

| Route | Typ |
|---|---|
| `/` | enda routen — titelskärm + spel |
| `*` | 404 (TanStack-standard: "Page not found", "Go home") |

Ingen `sitemap.xml`, inga `<a href>` till interna sidor. Allt annat är paneler i spel-state.

## Layout

- `html, body { overflow: hidden; background: ink }` — fullskärms-canvas.
- Fast CA-bar överst: `h-7`, `bg-secondary`, `border-b-2`, 7 px pixeltext, klick = kopiera.
- **Titelskärm:** canvas (title-mode) + scanlines (50 %) + centrerad `px-panel`
  `w-[min(440px,94vw)] p-6`: logo 112 px i ram → `FIRM` 48 px `tracking-widest` →
  9 px tagline i accent → 4 knappar (gap 12) → 3 räknare (blinkande grön ruta).
- **Spel:** canvas (game-mode) + scanlines (40 %) + HUD `top-9 left-2 right-2`
  (svart statistikbox med 7 fält + `ESC MENU`), plats/mål-ruta nere till vänster,
  kontrollhjälp nere till höger, `[ E ] LABEL`-knapp `bottom-24`, dialogruta
  `bottom-4 w-[min(680px,94vw)]`, banner `top-1/3`, paneler `z-40`.

## Designsystem

| Token | Värde |
|---|---|
| `--background` | `oklch(93% .03 85)` |
| `--foreground` / `--primary` | `oklch(22% .01 60)` |
| `--ink` | `oklch(17% .008 60)` |
| `--paper` / `--card` | `oklch(97% .018 88)` |
| `--secondary` | `oklch(87% .04 82)` |
| `--muted` | `oklch(89% .025 85)` |
| `--muted-foreground` | `oklch(48% .02 70)` |
| `--accent` | `oklch(50% .06 55)` |
| `--gain` | `oklch(55% .12 145)` |
| `--loss` | `oklch(53% .15 28)` |
| `--radius` | `0` |

Komponent-utilities: `px-panel` (3 px ink-ram, inre 3 px secondary-ram, 6 px hård
skugga 55 %), `px-btn` (secondary, 3 px ram, 3 px skugga, 10 px font, aktiv = förskjuts
3 px), `px-btn-primary` (ink → accent på hover), `px-inset`, `px-titlebar`, `scanlines`.

Kontoret: 60×32 tiles à 16 px (960×512 world), 11 rum med egna golvmönster
(tile/wood/carpet), 26 dörröppningar, ~90 möbler ritade med `fillRect`.

## Breakpoints

| Bredd | Beteende |
|---|---|
| < 768 (`md`) | dölj plats- och kontrollrutor, visa mål-remsa `top-24` |
| < 800 | canvas-skala 2× |
| ≥ 800 | titel 2.5×, spel 3× (× devicePixelRatio) |
| `sm`/`md` | panel-grids 1 → 2/3/4 kolumner |

## Komponenter

CA-bar · Title panel · HUD · Location/objective box · Interact-knapp · Dialog ·
Banner · Panel (modal med titelrad) · PxButton · Label · Pips · Portrait (canvas-sprite)
· 19 paneler (se README).

## Animationer

| Namn | Detalj |
|---|---|
| `pop-in` | 0.26 s `steps(5)`: scale .6 → 1.08 → 1 |
| `wipe-in` | 0.5 s `steps(8)`: clip-path uppifrån (dialog + svart övergång title → spel) |
| `blink` | 1 s `step-end` opacity |
| Canvas | kamera glider mellan 5 waypoints (9 s, smoothstep) på titeln; följer spelaren (lerp .28) i spelet; skärmgrafer, rack-lampor, SI-maskinens puls, ticker-scroll, hissdörrar, kaffe-ånga, pratbubblor, gul guide-pil + "!"-markör |
| Figurer | 2-frame gångcykel, idle-bob, sittande pose vid skrivbord |

## Funktioner / spel-logik

- Onboarding: HIRE → PAIR → SHAPE → LIMIT → FUND → SHIFT (`nextObjective`).
- 5 arketyper, 6 personligheter, 6 playbooks (max 2), custom directive (500 tecken).
- Risk: max position, max daily loss, max open, stop loss, take profit, reserve.
- Traders on shift kör en state machine (SCANNING → ANALYZING → MONITORING …) och
  går mellan skrivbord, research, social, risk och kaffe.
- 8 skrivbord, max 8 traders; 4 låsta extra skrivbord.
- Sparning: gäst i `localStorage` (`firm.save.v1`), inloggad på servern per wallet.

## Externa integrationer

| Integration | Referens | Lokalt |
|---|---|---|
| Phantom | connect, signMessage, signAndSendTransaction, accountChanged | connect + signMessage, annars demo-konto |
| Server-funktioner | nonce, verify, session, save/load state, create wallet, export key, balances, blockhash, tx-status, stats | fixtures + demo-state, `TODO(backend)` |
| Solscan | explorer-länk | samma (endast riktiga adresser) |
| QR | `qrcode` → `solana:<address>` | samma |
| Analytics | `/~flock.js` | utelämnad |
