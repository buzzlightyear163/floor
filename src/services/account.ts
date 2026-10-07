/**
 * Firm-konto = Phantom-plånbok.
 *
 * Referensen: connect → signMessage(nonce) → server-session → firm-state
 * sparas på servern per publicKey.
 *
 * Lokalt: connect (+ valfri signMessage) mot riktig Phantom om den finns,
 * annars ett lokalt demo-konto. Firm-state per konto sparas i localStorage.
 * TODO(backend): nonce/verify/session-token + server-lagring av state.
 */
import { DEMO_MODE } from "@/config/demo";
import { BRAND } from "@/config/brand";
import { randomBase58, sleep } from "@/lib/format";
import { GUEST_SAVE_KEY, normalizeSaved, store } from "@/store/store";
import type { Account, SavedState } from "@/store/types";
import { getPhantom, type PhantomProvider } from "./phantom";
import { refreshBalances } from "./vault";

const accountKey = (pk: string) => `floor.account.${pk}`;
const sessionKey = (pk: string) => `floor.session.${pk}`;
const DEMO_PK_KEY = "floor.demo.publicKey";

/** Aktuell "session" (publicKey) — motsvarar referensens session-token. */
let session: string | null = null;

const setAccount = (patch: Partial<Account>) => store.set((s) => ({ account: { ...s.account, ...patch } }));

function snapshot(): SavedState {
  const { firmName, traders, ledger, introSeen } = store.get();
  return { firmName, traders, ledger: ledger.slice(-200), introSeen };
}

/** Logga in på kontot: ladda kontots firm, eller migrera gäst-firman dit. */
function signIn(publicKey: string, demo: boolean) {
  let saved: SavedState | null = null;
  try {
    const raw = localStorage.getItem(accountKey(publicKey));
    saved = raw ? (JSON.parse(raw) as SavedState) : null;
  } catch {
    saved = null;
  }
  if (saved) {
    store.set({ ...normalizeSaved(saved), account: { publicKey, status: "connected", error: "", demo } });
  } else {
    // Första inloggningen: gäst-firman flyttas till kontot (utan plånböcker).
    const s = store.get();
    const migrated: SavedState = {
      firmName: s.firmName,
      traders: s.traders.map((t) => {
        const copy = { ...t };
        delete copy.wallet;
        return copy;
      }),
      ledger: s.ledger,
      introSeen: s.introSeen,
    };
    localStorage.removeItem(GUEST_SAVE_KEY);
    store.set({ ...normalizeSaved(migrated), account: { publicKey, status: "connected", error: "", demo } });
  }
  session = publicKey;
  localStorage.setItem(sessionKey(publicKey), "1");
  saveNow();
  void refreshBalances();
}

function signOut() {
  session = null;
  store.set({ account: { publicKey: null, status: "idle", error: "" }, panel: null });
  store.loadGuest();
}

async function guarded(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const cancelled = /reject|denied|cancel/i.test(msg);
    store.set((s) => ({
      account: {
        ...s.account,
        status: s.account.publicKey && session ? "connected" : "idle",
        publicKey: session ? s.account.publicKey : null,
        error: cancelled ? "REQUEST CANCELLED IN PHANTOM." : msg.toUpperCase(),
      },
    }));
  }
}

let listenersBound = false;
function bindProvider(provider: PhantomProvider) {
  if (listenersBound) return;
  listenersBound = true;
  provider.on("accountChanged", (pk) => {
    const next = pk ? String(pk) : null;
    const current = store.get().account.publicKey;
    if (!next) {
      if (current) signOut();
      return;
    }
    if (next !== current) {
      signOut();
      void guarded(() => login(provider, next));
    }
  });
  provider.on("disconnect", () => {
    if (store.get().account.publicKey) signOut();
  });
}

async function login(provider: PhantomProvider, publicKey: string) {
  if (localStorage.getItem(sessionKey(publicKey))) {
    signIn(publicKey, false);
    return;
  }
  setAccount({ status: "signing", publicKey, error: "" });
  const message = `Sign in to ${BRAND.name}.\n\nWallet: ${publicKey}\nNonce: ${randomBase58(16)}\n\nThis request will not trigger a transaction or cost any fees.`;
  // TODO(backend): skicka signaturen till servern för verifiering.
  await provider.signMessage(new TextEncoder().encode(message), "utf8");
  signIn(publicKey, false);
}

async function demoLogin() {
  setAccount({ status: "connecting", error: "" });
  await sleep(450);
  let pk = localStorage.getItem(DEMO_PK_KEY);
  if (!pk) {
    pk = `DEMO${randomBase58(40)}`;
    localStorage.setItem(DEMO_PK_KEY, pk);
  }
  setAccount({ status: "signing", publicKey: pk, error: "" });
  await sleep(700);
  signIn(pk, true);
}

/** "CONNECT PHANTOM" */
export function connectPhantom() {
  const provider = getPhantom();
  if (provider) {
    bindProvider(provider);
    setAccount({ status: "connecting", error: "" });
    return guarded(async () => {
      const { publicKey } = await provider.connect();
      await login(provider, publicKey.toString());
    });
  }
  if (DEMO_MODE) return guarded(demoLogin);
  window.open("https://phantom.app/", "_blank", "noopener");
  setAccount({ error: `PHANTOM NOT FOUND. INSTALL IT, OR OPEN ${BRAND.name} IN A NEW TAB.` });
  return Promise.resolve();
}

/** "DISCONNECT" */
export async function disconnectPhantom() {
  const { publicKey, demo } = store.get().account;
  saveNow();
  if (publicKey) localStorage.removeItem(sessionKey(publicKey));
  signOut();
  if (!demo) await getPhantom()?.disconnect().catch(() => {});
}

/** Tyst återanslutning vid sidladdning (om sessionen finns kvar). */
export function eagerConnect() {
  const provider = getPhantom();
  if (provider) {
    bindProvider(provider);
    provider
      .connect({ onlyIfTrusted: true })
      .then(({ publicKey }) => {
        const pk = publicKey.toString();
        if (localStorage.getItem(sessionKey(pk))) void guarded(() => login(provider, pk));
      })
      .catch(() => {});
    return;
  }
  if (DEMO_MODE) {
    const pk = localStorage.getItem(DEMO_PK_KEY);
    if (pk && localStorage.getItem(sessionKey(pk))) signIn(pk, true);
  }
}

// ---------------------------------------------------------------------------
// Spara kontots firm (debounce), motsvarar referensens server-save.
// ---------------------------------------------------------------------------
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaved = "";

export function saveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!session) return;
  const json = JSON.stringify(snapshot());
  if (json === lastSaved) return;
  lastSaved = json;
  try {
    localStorage.setItem(accountKey(session), json);
  } catch {
    lastSaved = "";
  }
}

function scheduleSave(delay = 1200) {
  if (!session) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, delay);
}

let prev = store.get();
store.subscribe(() => {
  const s = store.get();
  if (
    s.traders !== prev.traders ||
    s.firmName !== prev.firmName ||
    s.introSeen !== prev.introSeen ||
    s.ledger !== prev.ledger
  )
    scheduleSave();
  prev = s;
});

if (typeof window !== "undefined") window.addEventListener("beforeunload", saveNow);

export const hasSession = () => session !== null;
