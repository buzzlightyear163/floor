import { useEffect, useRef } from "react";
import { OfficeEngine, type EngineMode } from "@/game/engine";
import type { Interactable } from "@/game/map";

interface Props {
  mode: EngineMode;
  onNear?: (target: Interactable | null) => void;
  onLocation?: (room: string) => void;
}

/** Fullskärms-canvas som kör OfficeEngine. */
export function OfficeCanvas(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    if (!ref.current) return;
    const engine = new OfficeEngine(ref.current, {
      mode: props.mode,
      onNear: (t) => latest.current.onNear?.(t),
      onLocation: (r) => latest.current.onLocation?.(r),
    });
    engine.start();
    return () => engine.stop();
  }, [props.mode]);

  return <canvas ref={ref} className="fixed inset-0 block touch-none" />;
}
