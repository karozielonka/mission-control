import { useEffect, useRef } from "react";
import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEALTH_TONES, type HealthTone } from "@/lib/styles";
import { Bone } from "./skeletons";

interface Props {
  icon: React.ReactNode;
  count: number;
  loading?: boolean;
  tone: HealthTone;
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function HealthPill({
  icon,
  count,
  loading,
  tone,
  label,
  open,
  onToggle,
  onClose,
  children,
}: Props) {
  const t = HEALTH_TONES[tone];
  const ref = useRef<HTMLDivElement>(null);
  const isZero = !loading && count === 0;

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${label}: ${loading ? "loading" : `${count} ${count === 1 ? "item" : "items"}`}`}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 px-2.5 rounded-md border transition-colors text-[12px] font-medium tabular-nums",
          open ? t.open : isZero ? t.zero : t.pill,
        )}
      >
        <span className={cn("flex items-center", open ? t.icon : isZero ? "text-zinc-500" : t.icon)}>
          {icon}
        </span>
        {loading ? <Bone className="h-3 w-4" /> : <span>{count.toLocaleString()}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[480px] max-h-[70vh] rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <span className={t.icon}>{icon}</span>
              <h3 className="font-display text-sm font-semibold tracking-wide text-foreground">
                {label}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
