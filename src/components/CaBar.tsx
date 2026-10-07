import { useState } from "react";
import { BRAND } from "@/config/brand";

/** Fast list högst upp med kontraktsadressen — klick kopierar. */
export function CaBar() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(BRAND.contractAddress).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          },
          () => {},
        );
      }}
      aria-label={`${BRAND.name} CA: copy contract address`}
      className="fixed inset-x-0 top-0 z-[110] flex h-7 items-center justify-center gap-2 border-b-2 border-ink bg-secondary px-2 font-display text-[7px] text-ink"
    >
      <span className="shrink-0">CA:</span>
      <span>{copied ? "COPIED TO CLIPBOARD!" : BRAND.contractAddress}</span>
    </button>
  );
}
