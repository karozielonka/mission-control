import { useEffect, useState } from "react";
import { Bug, ExternalLink, FlaskConical, Moon, Sparkles, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTheme, toggleTheme } from "@/lib/theme";
import { SENTRY_ENVS, type SentryEnv } from "@/config";
import { TESTING_EXCLUDED_PROJECTS } from "@/lib/constants";
import { levelColor } from "@/lib/styles";
import { useContextStore } from "@/stores/context-store";
import { useNow } from "@/lib/use-now";
import { HealthPill } from "../health-pill";
import { StaleIndicator } from "../stale-indicator";
import { IssueRowSkeleton, SentryRowSkeleton } from "../skeletons";
import { IssueTypeBadge } from "../badges";
import { ErrorNote } from "../error-note";
import { sentryScore, sentryTier, timeAgo } from "../formatters";

interface Props {
  sentryEnv: SentryEnv;
  setSentryEnv: (env: SentryEnv) => void;
  lastRefresh: Date;
  refreshing: boolean;
  onRefresh: () => void;
  onSuggestNext: () => void;
}

export function Header({
  sentryEnv,
  setSentryEnv,
  lastRefresh,
  refreshing,
  onRefresh,
  onSuggestNext,
}: Props) {
  const sentryIssuesByEnv = useContextStore(({sentryIssuesByEnv}) => sentryIssuesByEnv);
  const unassignedTestingIssues = useContextStore(({unassignedTestingIssues}) => unassignedTestingIssues);
  const cyclePickupCandidates = useContextStore(({cyclePickupCandidates}) => cyclePickupCandidates);
  const loading = useContextStore(({loading}) => loading);

  const errors = useContextStore(({errors}) => errors);
  const sentryIssues = sentryIssuesByEnv[sentryEnv] ?? [];
  const loadingSentry = loading[`sentryIssues_${sentryEnv}`];
  const sentryError = errors[`sentryIssues_${sentryEnv}`];

  const now = useNow();
  const [theme, setTheme] = useState(getTheme);
  const [openPill, setOpenPill] = useState<"sentry" | "testing" | null>(null);

  useEffect(() => {
    if (!openPill) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPill(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openPill]);

  const handleToggleTheme = () => setTheme(toggleTheme());

  const sortedSentryIssues = [...sentryIssues].sort((a, b) => sentryScore(b, now) - sentryScore(a, now));

  // Hide issues from excluded Linear projects (key prefix before the dash, e.g. "DD-143").
  const visibleTestingIssues = unassignedTestingIssues.filter(
    (issue) => !TESTING_EXCLUDED_PROJECTS.includes(issue.key.split("-")[0]),
  );

  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggleTheme}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <h2 className="font-display text-2xl font-bold tracking-[0.18em] uppercase text-foreground">
          Mission Control
        </h2>
      </div>
      <div className="flex items-center gap-1.5">
        <HealthPill
          icon={<Bug className="h-3.5 w-3.5" />}
          count={sentryIssues.length}
          loading={loadingSentry}
          tone="red"
          label="Sentry"
          open={openPill === "sentry"}
          onToggle={() => setOpenPill((cur) => (cur === "sentry" ? null : "sentry"))}
          onClose={() => setOpenPill(null)}
        >
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
            {SENTRY_ENVS.map((env) => {
              const isActive = env === sentryEnv;
              return (
                <button
                  key={env}
                  onClick={() => setSentryEnv(env)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60",
                  )}
                >
                  {env}
                </button>
              );
            })}
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1 min-h-0">
            {loadingSentry ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <SentryRowSkeleton key={i} />
                ))}
              </>
            ) : sentryError ? (
              <ErrorNote message={sentryError} />
            ) : sentryIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">No errors in {sentryEnv}</p>
            ) : (
              sortedSentryIssues.slice(0, 8).map((issue) => {
                const t = sentryTier(issue, now);
                return (
                  <div
                    key={issue.id}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-accent/20 transition-colors group"
                  >
                    <Bug className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", t.titleClass || "text-foreground")}>
                        {issue.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          className={cn("text-[11px] px-1 py-0", levelColor[issue.level] ?? levelColor.error)}
                        >
                          {issue.level}
                        </Badge>
                        <span
                          className={cn(
                            "text-[11px] font-mono font-medium px-1.5 py-0.5 rounded border",
                            t.pill,
                          )}
                        >
                          {issue.count.toLocaleString()}×
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(issue.last_seen, now)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </HealthPill>
        <HealthPill
          icon={<FlaskConical className="h-3.5 w-3.5" />}
          count={visibleTestingIssues.length}
          loading={loading.unassignedTestingIssues}
          tone="cyan"
          label="Testing (unassigned)"
          open={openPill === "testing"}
          onToggle={() => setOpenPill((cur) => (cur === "testing" ? null : "testing"))}
          onClose={() => setOpenPill(null)}
        >
          <div className="divide-y divide-border overflow-y-auto flex-1 min-h-0">
            {loading.unassignedTestingIssues ? (
              <>
                {[0, 1, 2].map((i) => (
                  <IssueRowSkeleton key={i} />
                ))}
              </>
            ) : errors.unassignedTestingIssues ? (
              <ErrorNote message={errors.unassignedTestingIssues} />
            ) : visibleTestingIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">No unassigned tickets in testing</p>
            ) : (
              visibleTestingIssues.map((issue) => (
                <div
                  key={issue.key}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">{issue.key}</span>
                      <IssueTypeBadge type={issue.issue_type} />
                      {issue.story_points != null && (
                        <span className="text-[11px] text-muted-foreground">
                          SP:{issue.story_points}
                        </span>
                      )}
                      <Badge className="text-[11px] px-1.5 py-0 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {issue.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground truncate mt-0.5">{issue.summary}</p>
                  </div>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </HealthPill>
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          onClick={onSuggestNext}
          disabled={cyclePickupCandidates.length === 0}
          title="Suggest next ticket to pick up"
          aria-label="Suggest next ticket"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <StaleIndicator lastRefresh={lastRefresh} refreshing={refreshing} onRefresh={onRefresh} />
      </div>
    </div>
  );
}
