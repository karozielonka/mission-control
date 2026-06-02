import { useMemo, useState } from "react";
import { ExternalLink, Sparkles, XCircle } from "lucide-react";
import { useContextStore } from "@/stores/context-store";
import { rankPriority } from "../formatters";
import { IssueTypeBadge } from "../badges";

const MAX_SUGGESTIONS = 3;

interface Props {
  onClose: () => void;
}

export function SuggestionsPanel({ onClose }: Props) {
  const cyclePickupCandidates = useContextStore(({cyclePickupCandidates}) => cyclePickupCandidates);
  const [rejectedKeys, setRejectedKeys] = useState<Set<string>>(new Set());

  const suggestedIssues = useMemo(
    () =>
      [...cyclePickupCandidates]
        .filter((i) => !rejectedKeys.has(i.key))
        .sort((a, b) => rankPriority(a.priority) - rankPriority(b.priority))
        .slice(0, MAX_SUGGESTIONS),
    [cyclePickupCandidates, rejectedKeys],
  );

  if (suggestedIssues.length === 0) return null;

  const dismiss = (key: string) =>
    setRejectedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

  return (
    <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/5 shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2 border-b border-indigo-500/20">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">
            Suggested
          </span>
          <span className="text-[11px] text-muted-foreground">
            — dismiss any out-of-scope ticket to see the next candidate
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Close suggestions"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
      <div className="divide-y divide-indigo-500/20">
        {suggestedIssues.map((issue) => (
          <div key={issue.key} className="flex items-center gap-3 px-5 py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">{issue.key}</span>
                <IssueTypeBadge type={issue.issue_type} />
                <span className="text-[11px] text-indigo-400">{issue.priority}</span>
              </div>
              <p className="text-sm text-foreground truncate mt-0.5">{issue.summary}</p>
            </div>
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
              title="Open in Linear"
            >
              Open
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => dismiss(issue.key)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Out of scope — show next candidate"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
