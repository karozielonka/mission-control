import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded", className)} />;
}

export function PRRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Bone className="h-4 w-4 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Bone className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Bone className="h-3 w-10" />
          <Bone className="h-3 w-14" />
          <Bone className="h-3 w-12" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Bone className="h-3 w-8" />
        <Bone className="h-3 w-8" />
      </div>
    </div>
  );
}

export function IssueRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Bone className="h-3 w-14" />
          <Bone className="h-4 w-10 rounded-full" />
        </div>
        <Bone className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function SentryRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-2.5">
      <Bone className="h-3.5 w-3.5 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Bone className="h-4 w-5/6" />
        <div className="flex gap-2">
          <Bone className="h-3 w-12 rounded-full" />
          <Bone className="h-3 w-8" />
          <Bone className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}
