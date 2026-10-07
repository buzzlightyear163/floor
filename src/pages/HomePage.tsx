import { useEffect, useState } from "react";
import { CaBar } from "@/components/CaBar";
import { GameScreen } from "@/screens/GameScreen";
import { TitleScreen } from "@/screens/TitleScreen";
import { eagerConnect } from "@/services/account";
import { store, useGame } from "@/store/store";

/** Route "/" — titelskärm ↔ spel med svart "wipe"-övergång. */
export default function HomePage() {
  const phase = useGame((s) => s.phase);
  const [ready, setReady] = useState(false);
  const [wipe, setWipe] = useState(false);

  useEffect(() => {
    store.hydrate();
    store.set({ phase: "title", panel: null, dialog: null });
    setReady(true);
    eagerConnect();
  }, []);

  if (!ready) return <div className="fixed inset-0 bg-ink" />;

  return (
    <>
      <CaBar />
      {phase === "title" ? (
        <TitleScreen
          onStart={() => {
            setWipe(true);
            setTimeout(() => {
              store.set({ phase: "game", panel: null });
              setTimeout(() => setWipe(false), 250);
            }, 450);
          }}
        />
      ) : (
        <GameScreen />
      )}
      {wipe && <div className="wipe-in fixed inset-0 z-[100] bg-ink" />}
    </>
  );
}
