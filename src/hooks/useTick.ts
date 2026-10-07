import { useEffect, useState } from "react";

/** Tvingar om-rendering med ett intervall (klockor, blinkande statistik). */
export function useTick(ms: number) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
