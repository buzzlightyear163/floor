import { useEffect, useState } from "react";
import { Label, Panel, PxButton } from "@/components/ui/pixel";
import { DEMO_MODE, NETWORK_LABEL, explorerUrl } from "@/config/demo";
import { archetypeById } from "@/data/traders";
import { cn, fmt, shortAddr } from "@/lib/format";
import { connectPhantom } from "@/services/account";
import { createWallet, exportWalletKey, fundWallet, isDemoAddress, refreshBalances } from "@/services/vault";
import { closePanel, store, useGame, useTrader } from "@/store/store";

type ExportState = null | "confirm" | "loading" | { key: string };

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message.toUpperCase() : fallback);

/** THE VAULT — trader-plånbok, saldo, insättning, export och "on shift". */
export function VaultPanel({ id }: { id: string }) {
  const t = useTrader(id);
  const account = useGame((s) => s.account);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [fullAddr, setFullAddr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const [exp, setExp] = useState<ExportState>(null);
  const [reveal, setReveal] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const address = t?.wallet?.address;

  const closeExport = () => {
    setExp(null);
    setReveal(false);
    setKeyCopied(false);
  };

  useEffect(() => () => setExp(null), []);
  useEffect(() => {
    if (!address) return;
    void refreshBalances();
    import("qrcode")
      .then((m) => m.toDataURL(`solana:${address}`, { margin: 1, width: 132, color: { dark: "#2b2724", light: "#f2ead6" } }))
      .then(setQr)
      .catch(() => {});
  }, [address]);

  if (!t) return null;
  const connected = account.status === "connected";
  const demoWallet = !!address && isDemoAddress(address);

  const generate = async () => {
    setBusy("GENERATING TRADER WALLET");
    setError("");
    try {
      const w = await createWallet(t.id);
      store.updateTrader(t.id, { wallet: w, capital: 0 });
      store.log(t.id, `Trader wallet created: ${shortAddr(w.address)}.`);
      store.bannerShow("WALLET CREATED", `${t.code} · ${shortAddr(w.address)}`);
    } catch (e) {
      setError(errMsg(e, "COULD NOT CREATE WALLET."));
    }
    setBusy("");
  };

  const send = async (amt: number) => {
    if (!address || !(amt > 0) || amt > 1000) return;
    setError("");
    try {
      await fundWallet(address, amt, setBusy);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(/reject|denied|cancel/i.test(m) ? "TRANSFER CANCELLED IN PHANTOM." : m.toUpperCase());
    }
    setBusy("");
  };

  const refresh = async () => {
    setBusy("CHECKING CHAIN");
    await refreshBalances();
    setBusy("");
  };

  const copy = () => {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const putOnShift = () => {
    store.updateTrader(t.id, { status: "onShift" });
    store.log(t.id, "On shift.");
    closePanel();
    store.bannerShow(`${t.code}`, "NOW ON SHIFT");
  };

  const available = t.capital * (1 - t.risk.reserve / 100);

  return (
    <Panel title={`THE VAULT · ${t.code}`}>
      {t.wallet ? (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-[110px_1fr] content-start gap-y-2">
              <Label>TRADER</Label>
              <span>
                {t.code} · {archetypeById(t.archetype).name}
              </span>
              <Label>WALLET</Label>
              <span className="break-all">{fullAddr ? t.wallet.address : shortAddr(t.wallet.address)}</span>
              <Label>NETWORK</Label>
              <span>{demoWallet ? `${NETWORK_LABEL} (DEMO)` : NETWORK_LABEL}</span>
              <Label>BALANCE</Label>
              <span className="font-display text-[12px]">{t.capital.toFixed(4)} SOL</span>
              <Label>AVAILABLE</Label>
              <span>
                {fmt(available)} SOL <span className="text-muted-foreground">({t.risk.reserve}% RESERVE)</span>
              </span>
            </div>
            {qr && (
              <img
                src={qr}
                alt="Wallet address QR code"
                className="mx-auto h-[132px] w-[132px] border-3 border-ink [image-rendering:pixelated]"
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <PxButton onClick={copy}>{copied ? "COPIED!" : "COPY ADDRESS"}</PxButton>
            <PxButton onClick={() => setFullAddr((v) => !v)}>{fullAddr ? "SHORT ADDRESS" : "VIEW FULL ADDRESS"}</PxButton>
            <PxButton disabled={!!busy} onClick={refresh}>
              REFRESH BALANCE
            </PxButton>
            {demoWallet ? (
              <PxButton disabled title="TODO(backend): explorer for real wallets">
                EXPLORER
              </PxButton>
            ) : (
              <a className="px-btn" href={explorerUrl(t.wallet.address)} target="_blank" rel="noreferrer">
                EXPLORER
              </a>
            )}
            {connected && (
              <PxButton
                onClick={() => {
                  setError("");
                  setExp("confirm");
                }}
              >
                EXPORT PRIVATE KEY
              </PxButton>
            )}
          </div>

          {exp && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" onClick={closeExport}>
              <div className="px-panel w-full max-w-md bg-card p-0" onClick={(e) => e.stopPropagation()}>
                <div className="px-titlebar">{exp === "confirm" || exp === "loading" ? "EXPORT WALLET" : "PRIVATE KEY"}</div>
                <div className="p-4">
                  {exp === "confirm" || exp === "loading" ? (
                    <>
                      <p>Anyone with this private key has full control of this trader wallet and its funds.</p>
                      <div className="mt-4 flex justify-end gap-2">
                        <PxButton onClick={closeExport}>CANCEL</PxButton>
                        <PxButton
                          primary
                          disabled={exp === "loading"}
                          onClick={async () => {
                            setExp("loading");
                            try {
                              const r = await exportWalletKey(t.id);
                              if (r.address !== t.wallet?.address) throw new Error("KEY DOES NOT MATCH WALLET.");
                              setExp({ key: r.privateKey });
                            } catch (e) {
                              setError(errMsg(e, "EXPORT FAILED."));
                              closeExport();
                            }
                          }}
                        >
                          {exp === "loading" ? "EXPORTING..." : "EXPORT"}
                        </PxButton>
                      </div>
                    </>
                  ) : (
                    <>
                      <Label>WALLET {shortAddr(t.wallet.address)}</Label>
                      <div className="px-inset mt-2 break-all p-2 font-mono text-sm select-all">
                        {reveal ? exp.key : "•".repeat(44)}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <PxButton onClick={() => setReveal((v) => !v)}>{reveal ? "HIDE" : "REVEAL"}</PxButton>
                        <PxButton
                          onClick={() => {
                            void navigator.clipboard.writeText(exp.key);
                            setKeyCopied(true);
                            setTimeout(() => setKeyCopied(false), 1500);
                          }}
                        >
                          {keyCopied ? "COPIED!" : "COPY PRIVATE KEY"}
                        </PxButton>
                        <PxButton primary onClick={closeExport}>
                          DONE
                        </PxButton>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <Label className="mt-4">FUND FROM PHANTOM</Label>
          {connected ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {[0.01, 0.05, 0.1].map((v) => (
                <PxButton key={v} disabled={!!busy} onClick={() => send(v)}>
                  {v} SOL
                </PxButton>
              ))}
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="AMOUNT"
                className="px-inset w-28 p-2 text-xl outline-none"
              />
              <PxButton disabled={!!busy || !amount} onClick={() => send(parseFloat(amount))}>
                SEND
              </PxButton>
            </div>
          ) : (
            <PxButton className="mt-2" onClick={() => void connectPhantom()}>
              CONNECT PHANTOM
            </PxButton>
          )}
          <p className="mt-2 text-muted-foreground">
            {demoWallet
              ? "DEMO MODE: this is not a real Solana wallet. Funding is simulated locally — never send real SOL to it."
              : "Or send SOL to this address from any Solana wallet. The balance updates when the deposit lands on-chain."}
          </p>
          {busy && (
            <div className="mt-2 font-display text-[9px] text-accent">
              {busy}
              <span className="blink">...</span>
            </div>
          )}
        </>
      ) : (
        <div className="bg-ink p-5 text-center font-display text-[10px] leading-7 text-gain">
          {busy ? (
            <div>
              {busy}
              <span className="blink">...</span>
            </div>
          ) : (
            <div className="text-primary-foreground">NO WALLET ON FILE FOR {t.code}.</div>
          )}
          {connected ? (
            <PxButton primary className="mt-4" disabled={!!busy} onClick={generate}>
              GENERATE WALLET
            </PxButton>
          ) : (
            <>
              <div className="mt-2 text-[8px] leading-5 text-secondary">
                TRADER WALLETS BELONG TO YOUR FLOOR. CONNECT PHANTOM TO SIGN IN.
              </div>
              <PxButton primary className="mt-3" disabled={account.status !== "idle"} onClick={() => void connectPhantom()}>
                {account.status === "signing" ? "SIGN IN PHANTOM..." : account.status === "connecting" ? "CONNECTING..." : "CONNECT PHANTOM"}
              </PxButton>
            </>
          )}
          {DEMO_MODE && !connected && (
            <div className="mt-2 text-[7px] leading-4 text-muted-foreground">DEMO MODE: NO PHANTOM? A LOCAL DEMO ACCOUNT IS USED.</div>
          )}
        </div>
      )}

      {(error || account.error) && (
        <div className={cn("mt-3 font-display text-[8px] leading-4 text-loss")}>{error || account.error}</div>
      )}

      <div className="mt-4 flex justify-end">
        {t.status === "funded" && (
          <PxButton primary onClick={putOnShift}>
            PUT TRADER ON SHIFT
          </PxButton>
        )}
      </div>
    </Panel>
  );
}
