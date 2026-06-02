import { useMemo } from "react";
import { CheckCircle2, Clock, GitPullRequest } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useContextStore } from "@/stores/context-store";
import { PRGroup } from "../pr-row";
import { PRRowSkeleton } from "../skeletons";
import { ErrorNote } from "../error-note";

export function PullRequestsPanel() {
  const pullRequests = useContextStore(({pullRequests}) => pullRequests);
  const loading = useContextStore(({loading}) => loading);
  const error = useContextStore(({errors}) => errors.pullRequests);

  const groups = useMemo(() => {
    const sorted = [...pullRequests].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const readyToMerge: typeof sorted = [];
    const awaitingReview: typeof sorted = [];
    const drafts: typeof sorted = [];
    for (const pr of sorted) {
      if (pr.state === "draft") drafts.push(pr);
      else if (pr.review_state === "approved" && pr.state !== "closed" && pr.state !== "merged")
        readyToMerge.push(pr);
      else awaitingReview.push(pr);
    }
    return { readyToMerge, awaitingReview, drafts };
  }, [pullRequests]);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden flex flex-col min-h-0",
        pullRequests.length > 0 ? "border-green-500" : "border-green-500/40",
      )}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <GitPullRequest
            className={cn(
              "h-4 w-4",
              pullRequests.length > 0 ? "text-green-600" : "text-muted-foreground",
            )}
          />
          <h3
            className={cn(
              "font-display text-base font-semibold tracking-wide",
              pullRequests.length > 0 ? "text-green-700" : "text-foreground",
            )}
          >
            Pull Requests
          </h3>
        </div>
        <Badge
          className={cn(
            "text-[11px]",
            pullRequests.length > 0 ? "bg-green-100 text-green-700 border-green-300" : "",
          )}
          variant={pullRequests.length > 0 ? undefined : "secondary"}
        >
          {pullRequests.length}
        </Badge>
      </div>
      <div className="overflow-y-auto flex-1">
        {loading.pullRequests ? (
          <div className="divide-y divide-border">
            {[0, 1, 2, 3].map((i) => (
              <PRRowSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorNote message={error} />
        ) : pullRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No open pull requests</p>
        ) : (
          <>
            {groups.readyToMerge.length > 0 && (
              <PRGroup
                icon={<CheckCircle2 className="h-3 w-3 text-green-400" />}
                label="Ready to merge"
                count={groups.readyToMerge.length}
                prs={groups.readyToMerge}
              />
            )}
            {groups.awaitingReview.length > 0 && (
              <PRGroup
                icon={<Clock className="h-3 w-3 text-amber-400" />}
                label="Awaiting review"
                count={groups.awaitingReview.length}
                prs={groups.awaitingReview}
              />
            )}
            {groups.drafts.length > 0 && (
              <PRGroup
                icon={<GitPullRequest className="h-3 w-3 text-zinc-400" />}
                label="Drafts"
                count={groups.drafts.length}
                prs={groups.drafts}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
