import { AlertTriangle } from "lucide-react";

/** Inline failure state for a panel whose fetch errored. Shown in place of the
 *  empty state so a failed request never masquerades as "nothing here". */
export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-5 py-3 text-[12px] text-red-300">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
      <span className="min-w-0">
        <span className="font-medium text-red-300">Couldn't load.</span>{" "}
        <span className="text-red-300/70 break-words">{message}</span>
      </span>
    </div>
  );
}
