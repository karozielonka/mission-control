import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { STALE_REFRESH_MINUTES } from "@/lib/constants";
import { useNow } from "@/lib/use-now";

interface Props {
  lastRefresh: Date;
  refreshing: boolean;
  onRefresh: () => void;
}

export function StaleIndicator({ lastRefresh, refreshing, onRefresh }: Props) {
  const now = useNow();
  const minutesAgo = Math.floor((now - lastRefresh.getTime()) / 60_000);
  const isStale = minutesAgo >= STALE_REFRESH_MINUTES;

  const fullLabel =
    minutesAgo < 1
      ? "Just now"
      : minutesAgo < 60
        ? `${minutesAgo}m ago`
        : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`;

  const compact =
    minutesAgo < 1
      ? "now"
      : minutesAgo < 60
        ? `${minutesAgo}m`
        : `${Math.floor(minutesAgo / 60)}h${minutesAgo % 60 ? ` ${minutesAgo % 60}m` : ""}`;

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      title={`Refresh · updated ${fullLabel}`}
      aria-label={`Refresh (updated ${fullLabel})`}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 pl-2 pr-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50 text-[12px] font-medium tabular-nums",
        isStale && "text-orange-400",
      )}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
      <span className="flex items-center gap-1">
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60",
              isStale ? "bg-orange-400 animate-ping" : "bg-green-400",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              isStale ? "bg-orange-400" : "bg-green-400",
            )}
          />
        </span>
        {compact}
      </span>
    </button>
  );
}
