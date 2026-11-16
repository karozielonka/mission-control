import { useEffect } from "react";
import { AlertTriangle, BadgeCheck, Bell, CheckCircle2, Eye, PencilLine, X, XCircle } from "lucide-react";
import { WATCHED_REPOS } from "@dashboard/shared";
import { cn } from "@/lib/utils";
import { ACTION_TONES, type ActionTone } from "@/lib/styles";
import { subscribeToAlerts, type PrAlert, type PrAlertKind } from "@/lib/api";
import { useContextStore } from "@/stores/context-store";
import { useNow } from "@/lib/use-now";
import { timeAgo } from "../formatters";

const MAX_ALERTS = 5;

const KIND_STYLE: Record<PrAlertKind, { tone: ActionTone; icon: React.ReactNode }> = {
  ci_passed: { tone: "green", icon: <CheckCircle2 className="h-4 w-4" /> },
  approved: { tone: "green", icon: <BadgeCheck className="h-4 w-4" /> },
  ci_failed: { tone: "red", icon: <XCircle className="h-4 w-4" /> },
  changes_requested: { tone: "red", icon: <PencilLine className="h-4 w-4" /> },
  conflict: { tone: "red", icon: <AlertTriangle className="h-4 w-4" /> },
  review_requested: { tone: "amber", icon: <Eye className="h-4 w-4" /> },
};

export function LiveAlerts() {
  const alerts = useContextStore(({ alerts }) => alerts);
  const setAlerts = useContextStore(({ setAlerts }) => setAlerts);
  const dismissAlert = useContextStore(({ dismissAlert }) => dismissAlert);
  const fetchPullRequests = useContextStore(({ fetchPullRequests }) => fetchPullRequests);
  const fetchReviewRequestedPRs = useContextStore(
    ({ fetchReviewRequestedPRs }) => fetchReviewRequestedPRs,
  );
  const now = useNow();

  useEffect(
    () =>
      subscribeToAlerts({
        onRecent: setAlerts,
        onAlerts: (fresh) => {
          setAlerts([...fresh, ...useContextStore.getState().alerts].slice(0, MAX_ALERTS));
          void fetchPullRequests([...WATCHED_REPOS]);
          void fetchReviewRequestedPRs();
        },
      }),
    [setAlerts, fetchPullRequests, fetchReviewRequestedPRs],
  );

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shrink-0">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-background/30">
        <Bell className="h-3.5 w-3.5 text-indigo-400" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          PR updates
        </p>
      </div>
      <div className="divide-y divide-border/60">
        {alerts.map((alert) => (
          <AlertRow
            key={alert.id}
            alert={alert}
            ago={timeAgo(alert.at, now)}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AlertRow({ alert, ago, onDismiss }: { alert: PrAlert; ago: string; onDismiss: () => void }) {
  const { tone, icon } = KIND_STYLE[alert.kind];
  const t = ACTION_TONES[tone];
  return (
    <div className={cn("group relative flex items-center gap-3 px-4 py-2.5 transition-colors", t.rowHover)}>
      <span aria-hidden className={cn("absolute inset-y-2 left-0 w-[2px] rounded-full", t.bar)} />
      <a
        href={alert.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 min-w-0 flex-1"
      >
        <div className={cn("p-1.5 rounded-md shrink-0", t.iconWrap, t.iconText)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground font-medium truncate">{alert.text}</p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {alert.repo} · {alert.title} · {ago}
          </p>
        </div>
      </a>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
