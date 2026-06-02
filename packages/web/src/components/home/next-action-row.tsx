import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTION_TONES, type ActionTone } from "@/lib/styles";

export interface ActionItem {
  id: string;
  tone: ActionTone;
  icon: React.ReactNode;
  primary: string;
  secondary: string;
  actionLabel: string;
  url: string;
}

export function NextActionRow({ item }: { item: ActionItem }) {
  const t = ACTION_TONES[item.tone];
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2.5 transition-colors",
        t.rowHover,
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-2 left-0 w-[2px] rounded-full", t.bar)} />
      <div className={cn("p-1.5 rounded-md shrink-0", t.iconWrap, t.iconText)}>{item.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground font-medium truncate">{item.primary}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.secondary}</p>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
          t.btn,
        )}
      >
        {item.actionLabel}
        <ArrowRight className="h-3 w-3" />
      </span>
    </a>
  );
}
