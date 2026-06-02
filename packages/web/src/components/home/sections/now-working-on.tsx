import { TrendingUp } from "lucide-react";
import { useContextStore } from "@/stores/context-store";
import { Bone } from "../skeletons";

const isReviewStatus = (s: string) => /review/i.test(s);

export function NowWorkingOn() {
  const myLinearIssues = useContextStore(({myLinearIssues}) => myLinearIssues);
  const loading = useContextStore(({loading}) => loading);

  const inProgressTickets = myLinearIssues.filter(
    ({status}) => status.toLowerCase() === "in progress" && !isReviewStatus(status),
  );

  return (
    <div className="rounded-xl border border-border bg-card flex items-center gap-3 px-3 py-1.5 shrink-0 min-h-[40px]">
      <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-border/60">
        <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium whitespace-nowrap">
          Now working on
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-thin">
        {loading.myLinearIssues ? (
          <Bone className="h-5 w-48" />
        ) : inProgressTickets.length === 0 ? (
          <span className="text-[11px] text-muted-foreground italic">Nothing in progress</span>
        ) : (
          inProgressTickets.map((issue) => (
            <a
              key={issue.key}
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors shrink-0 max-w-[360px]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 animate-pulse" />
              <span className="text-[11px] font-mono leading-none text-blue-300 shrink-0">
                {issue.key}
              </span>
              <span className="text-[12px] leading-none text-foreground/90 truncate">
                {issue.summary}
              </span>
              {issue.story_points != null && (
                <span className="text-[10px] leading-none text-muted-foreground shrink-0">
                  SP:{issue.story_points}
                </span>
              )}
            </a>
          ))
        )}
      </div>
      {!loading.myLinearIssues && inProgressTickets.length > 0 && (
        <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/70 pl-2 border-l border-border/60">
          {inProgressTickets.length}
        </span>
      )}
    </div>
  );
}
