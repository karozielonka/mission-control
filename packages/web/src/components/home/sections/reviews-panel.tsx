import { useMemo } from "react";
import { ExternalLink, Eye, GitBranch, GitPullRequest } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useContextStore } from "@/stores/context-store";
import { prBadge } from "@/lib/styles";
import { AgePill, IssueTypeBadge, WaitingBadge } from "../badges";
import { branchMatchesIssueKey } from "../formatters";
import { getPRIcon } from "../pr-display";
import { IssueRowSkeleton, PRRowSkeleton } from "../skeletons";

const isReviewStatus = (s: string) => /review/i.test(s);

export function ReviewsPanel() {
  const myLinearIssues = useContextStore(({myLinearIssues}) => myLinearIssues);
  const reviewRequestedPRs = useContextStore(({reviewRequestedPRs}) => reviewRequestedPRs);
  const pullRequests = useContextStore(({pullRequests}) => pullRequests);
  const loading = useContextStore(({loading}) => loading);

  const codeReviewTickets = useMemo(
    () => myLinearIssues.filter((t) => isReviewStatus(t.status)),
    [myLinearIssues],
  );
  const sortedReviewRequestedPRs = useMemo(
    () =>
      [...reviewRequestedPRs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [reviewRequestedPRs],
  );

  const total = codeReviewTickets.length + reviewRequestedPRs.length;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden flex flex-col min-h-0",
        total > 0 ? "border-amber-500" : "border-amber-500/40",
      )}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Eye className={cn("h-4 w-4", total > 0 ? "text-amber-600" : "text-muted-foreground")} />
          <h3
            className={cn(
              "font-display text-base font-semibold tracking-wide",
              total > 0 ? "text-amber-700" : "text-foreground",
            )}
          >
            Reviews
          </h3>
        </div>
        <Badge
          className={cn(
            "text-[11px]",
            total > 0 ? "bg-amber-100 text-amber-700 border-amber-300" : "",
          )}
          variant={total > 0 ? undefined : "secondary"}
        >
          {total}
        </Badge>
      </div>
      <div className="overflow-y-auto flex-1">
        <MineInCodeReview
          tickets={codeReviewTickets}
          loading={!!loading.myLinearIssues}
          pullRequests={pullRequests}
        />
        <AwaitingMyReview
          prs={sortedReviewRequestedPRs}
          loading={!!loading.reviewRequestedPRs}
        />
      </div>
    </div>
  );
}

function MineInCodeReview({
  tickets,
  loading,
  pullRequests,
}: {
  tickets: ReturnType<typeof useContextStore.getState>["myLinearIssues"];
  loading: boolean;
  pullRequests: ReturnType<typeof useContextStore.getState>["pullRequests"];
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Mine in code review
          </span>
          <span className="text-[10px] text-muted-foreground/60 normal-case tracking-normal">
            · Linear
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{tickets.length}</span>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <>
            {[0, 1].map((i) => (
              <IssueRowSkeleton key={i} />
            ))}
          </>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-3">No tickets in code review</p>
        ) : (
          tickets.map((issue) => {
            const matchedPr = pullRequests.find((pr) =>
              branchMatchesIssueKey(pr.head_ref, issue.key),
            );
            const prUrl = issue.pr_url ?? matchedPr?.url;
            return (
              <div
                key={issue.key}
                className="flex items-center gap-3 px-5 py-3 hover:bg-accent/20 transition-colors group"
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
                    {issue.status_changed_at && <WaitingBadge since={issue.status_changed_at} />}
                  </div>
                  <p className="text-base text-foreground truncate mt-0.5">{issue.summary}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {prUrl && (
                    <a
                      href={prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 transition-colors"
                      title="Open Pull Request"
                    >
                      <GitPullRequest className="h-3 w-3" />
                      Open PR
                    </a>
                  )}
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function AwaitingMyReview({
  prs,
  loading,
}: {
  prs: ReturnType<typeof useContextStore.getState>["reviewRequestedPRs"];
  loading: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-2 bg-muted/30 border-y border-border">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Awaiting my review
          </span>
          <span className="text-[10px] text-muted-foreground/60 normal-case tracking-normal">
            · GitHub
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{prs.length}</span>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <>
            {[0, 1].map((i) => (
              <PRRowSkeleton key={i} />
            ))}
          </>
        ) : prs.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-3">No PRs awaiting your review</p>
        ) : (
          prs.map((pr) => (
            <div
              key={`${pr.repo}-${pr.number}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-accent/20 transition-colors group"
            >
              {getPRIcon(pr.state)}
              <div className="flex-1 min-w-0">
                <p className="text-base text-foreground truncate">{pr.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {pr.repo}#{pr.number}
                  </span>
                  <Badge className={cn("text-[11px] px-1.5 py-0", prBadge[pr.state] ?? prBadge.open)}>
                    {pr.state}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">by {pr.author}</span>
                  <AgePill since={pr.created_at} />
                </div>
              </div>
              <a
                href={pr.url}
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
    </>
  );
}
