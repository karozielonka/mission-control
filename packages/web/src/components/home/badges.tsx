import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AGE_STALE_HOURS, AGE_WARM_HOURS } from "@/lib/constants";
import { issueTypeStyle } from "@/lib/styles";
import { staleness, timeAgo } from "./formatters";

export function AgePill({ since }: { since: string }) {
  const s = staleness(since);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border",
        s.pill,
      )}
      title={s.title}
    >
      <Clock className="h-2.5 w-2.5" />
      {s.label}
    </span>
  );
}

export function WaitingBadge({ since }: { since: string }) {
  const hours = (Date.now() - new Date(since).getTime()) / 3_600_000;
  const label = timeAgo(since);
  const [style, title] =
    hours > AGE_STALE_HOURS
      ? ["bg-red-100 text-red-700 border-red-200", "Waiting over 3 days"]
      : hours > AGE_WARM_HOURS
        ? ["bg-yellow-100 text-yellow-700 border-yellow-200", "Waiting over a day"]
        : ["bg-zinc-100 text-zinc-500 border-zinc-200", "Waiting less than a day"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border",
        style,
      )}
      title={title}
    >
      <Clock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export function IssueTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      className={cn("text-[11px] px-1.5 py-0", issueTypeStyle[type.toLowerCase()] ?? issueTypeStyle.task)}
    >
      {type}
    </Badge>
  );
}
