import { ExternalLink } from "lucide-react";
import type { PullRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { AgePill } from "./badges";
import { staleness } from "./formatters";
import { getMergeLabel, getPRIcon } from "./pr-display";

export function PRGroup({
  icon,
  label,
  count,
  prs,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  prs: PullRequest[];
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-2 bg-muted/30 border-y border-border">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{count}</span>
      </div>
      <div className="divide-y divide-border">
        {prs.map((pr) => (
          <PRRow key={`${pr.repo}-${pr.number}`} pr={pr} />
        ))}
      </div>
    </>
  );
}

export function PRRow({ pr }: { pr: PullRequest }) {
  const s = staleness(pr.created_at);
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-accent/20 transition-colors group">
      {getPRIcon(pr.state)}
      <div className="flex-1 min-w-0">
        <p className="text-base text-foreground truncate">{pr.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-mono text-muted-foreground">#{pr.number}</span>
          {s.tier !== "fresh" && <AgePill since={pr.created_at} />}
          {getMergeLabel(pr.mergeable_state, pr.checks_state)}
          {pr.review_state === "changes_requested" && (
            <Badge className="text-[11px] px-1.5 py-0 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Changes requested
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground shrink-0">
        <span className="text-green-400">+{pr.additions}</span>
        <span className="text-red-400">-{pr.deletions}</span>
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
  );
}
