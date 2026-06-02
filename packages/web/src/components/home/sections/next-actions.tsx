import { useMemo } from "react";
import { Bug, CheckCircle2, Eye, GitMerge, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SENTRY_ENV } from "@/config";
import { useContextStore } from "@/stores/context-store";
import { useNow } from "@/lib/use-now";
import { NextActionRow, type ActionItem } from "../next-action-row";
import { timeAgo } from "../formatters";

const MAX_ACTIONS = 3;

export function NextActions() {
  const pullRequests = useContextStore(({pullRequests}) => pullRequests);
  const reviewRequestedPRs = useContextStore(({reviewRequestedPRs}) => reviewRequestedPRs);
  const sentryIssuesByEnv = useContextStore(({sentryIssuesByEnv}) => sentryIssuesByEnv);
  const now = useNow();

  const nextActions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    // 1. PRs others want me to review — oldest first
    const reviewSorted = [...reviewRequestedPRs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    for (const pr of reviewSorted) {
      if (items.length >= MAX_ACTIONS) break;
      items.push({
        id: `review-${pr.repo}-${pr.number}`,
        tone: "amber",
        icon: <Eye className="h-4 w-4" />,
        primary: `Review ${pr.author}'s PR`,
        secondary: `${pr.repo}#${pr.number} · ${pr.title} · ${timeAgo(pr.created_at, now)}`,
        actionLabel: "Open PR",
        url: pr.url,
      });
    }

    // 2. My own approved PRs ready to merge
    if (items.length < MAX_ACTIONS) {
      const approved = pullRequests.filter(
        (pr) =>
          pr.review_state === "approved" &&
          pr.state !== "merged" &&
          pr.state !== "closed" &&
          pr.state !== "draft",
      );
      for (const pr of approved) {
        if (items.length >= MAX_ACTIONS) break;
        items.push({
          id: `merge-${pr.repo}-${pr.number}`,
          tone: "green",
          icon: <GitMerge className="h-4 w-4" />,
          primary: `Your PR #${pr.number} is approved`,
          secondary: `${pr.repo} · ${pr.title} · ready to merge`,
          actionLabel: "Merge",
          url: pr.url,
        });
      }
    }

    // 3. Top default-env Sentry errors by count
    if (items.length < MAX_ACTIONS) {
      const prodErrors = [...(sentryIssuesByEnv[DEFAULT_SENTRY_ENV] ?? [])].sort(
        (a, b) => b.count - a.count,
      );
      for (const err of prodErrors) {
        if (items.length >= MAX_ACTIONS) break;
        items.push({
          id: `sentry-${err.id}`,
          tone: "red",
          icon: <Bug className="h-4 w-4" />,
          primary: err.title,
          secondary: `${DEFAULT_SENTRY_ENV} · ${err.count.toLocaleString()}× · last seen ${timeAgo(err.last_seen, now)}`,
          actionLabel: "Open in Sentry",
          url: err.url,
        });
      }
    }

    return items;
  }, [reviewRequestedPRs, pullRequests, sentryIssuesByEnv, now]);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden shrink-0",
        nextActions.length === 0 ? "border-green-500/30" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-background/30">
        <Zap
          className={cn(
            "h-3.5 w-3.5",
            nextActions.length === 0 ? "text-green-400" : "text-amber-400",
          )}
        />
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Next {nextActions.length === 1 ? "Action" : "Actions"}
        </p>
        {nextActions.length > 0 && (
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Top {nextActions.length} {nextActions.length === 1 ? "thing" : "things"}
          </span>
        )}
      </div>
      {nextActions.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="p-1.5 rounded-md bg-green-500/10 text-green-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-foreground font-medium">You're clear.</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Nothing urgent right now — good time to pick up something new.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {nextActions.map((item) => (
            <NextActionRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
