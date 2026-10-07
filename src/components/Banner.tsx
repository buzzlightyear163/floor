import { useEffect } from "react";
import { store, useGame } from "@/store/store";

/** Stor notis-banderoll mitt på skärmen (TRADER HIRED., +0.05 SOL ...). */
export function Banner() {
  const banner = useGame((s) => s.banner);
  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => store.set({ banner: null }), 2600);
    return () => clearTimeout(id);
  }, [banner]);
  if (!banner) return null;
  return (
    <div key={banner.at} className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center">
      <div className="pop-in border-y-4 border-ink bg-secondary px-10 py-4 text-center">
        <div className="font-display text-[11px] text-accent">{banner.sub}</div>
        <div className="mt-2 font-display text-xl">{banner.title}</div>
      </div>
    </div>
  );
}
