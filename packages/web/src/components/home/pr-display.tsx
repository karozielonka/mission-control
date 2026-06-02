import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GitMerge,
  GitPullRequest,
  XCircle,
} from "lucide-react";

export function getPRIcon(state: string) {
  switch (state.toLowerCase()) {
    case "merged":
      return <GitMerge className="h-4 w-4 text-purple-400" />;
    case "closed":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "draft":
      return <GitPullRequest className="h-4 w-4 text-zinc-400" />;
    default:
      return <GitPullRequest className="h-4 w-4 text-green-400" />;
  }
}

export function getMergeLabel(mergeableState: string, checksState?: string) {
  if (checksState === "failure" || mergeableState === "unstable") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-red-400">
        <XCircle className="h-3 w-3" />
        Failing
      </span>
    );
  }
  if (mergeableState === "dirty") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-red-400">
        <XCircle className="h-3 w-3" />
        Conflicts
      </span>
    );
  }
  if (mergeableState === "behind") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
        <Clock className="h-3 w-3" />
        Behind
      </span>
    );
  }
  if (checksState === "success") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Passed
      </span>
    );
  }
  if (checksState === "pending") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-yellow-400">
        <AlertCircle className="h-3 w-3" />
        Checks running
      </span>
    );
  }
  if (mergeableState === "clean") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Ready
      </span>
    );
  }
  return null;
}
