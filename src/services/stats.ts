/**
 * Publik statistik: firms open, traders on shift, traders hired + firmalistan.
 * Referensen hämtar detta från en server-funktion var 30:e sekund.
 * Lokalt: fixture i public/api/stats.json. TODO(backend): riktig endpoint.
 */
import { useEffect, useState } from "react";
import { STATS_URL } from "@/config/demo";

export interface FirmSummary {
  name: string;
  traders: number;
  onShift: number;
}

export interface PublicStats {
  firmsOpen: number;
  tradersOnShift: number;
  tradersHired: number;
  firms: FirmSummary[];
}

let cache: PublicStats | null = null;

export async function fetchStats(): Promise<PublicStats> {
  const res = await fetch(STATS_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return (await res.json()) as PublicStats;
}

export function useStats(): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(cache);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchStats()
        .then((s) => {
          cache = s;
          if (alive) setStats(s);
        })
        .catch(() => {});
    void load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return stats;
}
