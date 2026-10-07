import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { drawCharacter } from "@/game/sprites";
import { cn } from "@/lib/format";
import { closePanel } from "@/store/store";
import type { Dir, Look } from "@/store/types";

/** Modal-panel med titelrad och [X] (referensens alla rum-dialoger). */
export function Panel({
  title,
  children,
  onClose,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const close = onClose ?? closePanel;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-3"
      onPointerDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className={cn("px-panel pop-in flex max-h-[90vh] w-full max-w-3xl flex-col", className)}>
        <div className="px-titlebar flex items-center justify-between px-3 py-2">
          <span>{title}</span>
          <button onClick={close} className="px-2 hover:text-secondary" aria-label="Close">
            [X]
          </button>
        </div>
        <div className="overflow-y-auto p-4 text-xl leading-tight">{children}</div>
      </div>
    </div>
  );
}

/** Pixel-knapp. */
export function PxButton({
  children,
  primary,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button {...rest} className={cn("px-btn", primary && "px-btn-primary", className)}>
      {children}
    </button>
  );
}

/** Liten etikett i pixeltypsnitt. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("font-display text-[9px] tracking-wider text-muted-foreground", className)}>{children}</div>;
}

/** Rad med fyrkantiga "pips" (stats, risk-reglage). */
export function Pips({
  value,
  max = 5,
  onChange,
  tone = "ink",
}: {
  value: number;
  max?: number;
  onChange?: (v: number) => void;
  tone?: "ink" | "gain" | "loss";
}) {
  const fill = tone === "gain" ? "bg-gain" : tone === "loss" ? "bg-loss" : "bg-ink";
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i + 1)}
          className={cn("h-4 w-4 border-2 border-ink", i < value ? fill : "bg-paper", onChange && "cursor-pointer hover:bg-accent")}
          aria-label={`${i + 1}`}
        />
      ))}
    </div>
  );
}

/** Animerat porträtt av en pixelfigur (ritas med samma sprite som kontoret). */
export function Portrait({ look, size = 6, className }: { look: Look; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(size, 0, 0, size, 0, 0);
      const dir: Dir = Math.sin(t * 0.8) > 0.85 ? "left" : Math.sin(t * 0.6) < -0.9 ? "right" : "down";
      drawCharacter(ctx, 8, 21 - (Math.floor(t * 2) % 2), look, dir, -1);
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [look, size]);
  return <canvas ref={ref} width={16 * size} height={22 * size} className={className} />;
}
