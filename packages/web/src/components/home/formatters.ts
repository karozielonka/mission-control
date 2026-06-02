import {
  AGE_STALE_HOURS,
  AGE_WARM_HOURS,
  SENTRY_SCORE_HIGH,
  SENTRY_SCORE_MED,
} from "@/lib/constants";
import { priorityRank } from "@/lib/styles";

export type StalenessTier = "fresh" | "warm" | "stale";

export interface Staleness {
  tier: StalenessTier;
  label: string;
  pill: string;
  title: string;
}

// `now` is passed in (see useNow) so these helpers stay pure — given the same
// inputs they always return the same output, and they re-run when the shared
// ticker advances rather than calling Date.now() during render.
export function timeAgo(dateStr: string, now: number): string {
  const diff = now - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 0) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function staleness(dateStr: string, now: number): Staleness {
  const hrs = (now - new Date(dateStr).getTime()) / 3_600_000;
  const label = timeAgo(dateStr, now);
  if (hrs > AGE_STALE_HOURS) {
    return {
      tier: "stale",
      label,
      pill: "bg-red-500/15 text-red-300 border-red-500/30",
      title: "Open for over 3 days",
    };
  }
  if (hrs > AGE_WARM_HOURS) {
    return {
      tier: "warm",
      label,
      pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      title: "Open for over a day",
    };
  }
  return {
    tier: "fresh",
    label,
    pill: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    title: "Open less than a day",
  };
}

export function sentryScore(issue: { count: number; last_seen: string }, now: number): number {
  const hrs = (now - new Date(issue.last_seen).getTime()) / 3_600_000;
  const r = hrs < 1 ? 1.0 : hrs < 6 ? 0.7 : hrs < 24 ? 0.4 : 0.1;
  return issue.count * r;
}

export function sentryTier(
  issue: { count: number; last_seen: string },
  now: number,
): {
  titleClass: string;
  pill: string;
} {
  const score = sentryScore(issue, now);
  if (score > SENTRY_SCORE_HIGH) {
    return {
      titleClass: "text-red-200 font-medium",
      pill: "bg-red-500/20 text-red-300 border-red-500/40",
    };
  }
  if (score > SENTRY_SCORE_MED) {
    return {
      titleClass: "",
      pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    };
  }
  return {
    titleClass: "",
    pill: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
}

export function rankPriority(p: string): number {
  return priorityRank[p.toLowerCase()] ?? 5;
}

// Match a ticket key like "FE-123" against a branch name without false-matching
// "FE-1234". We require a non-alphanumeric boundary (or string edge) on both sides.
export function branchMatchesIssueKey(headRef: string | undefined, issueKey: string): boolean {
  if (!headRef) return false;
  const escaped = issueKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i").test(headRef);
}
