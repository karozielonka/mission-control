export const prBadge: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  merged: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  closed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const levelColor: Record<string, string> = {
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fatal: "bg-red-700/20 text-red-300 border-red-700/30",
};

export const priorityRank: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};

export const issueTypeStyle: Record<string, string> = {
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  story: "bg-green-500/20 text-green-400 border-green-500/30",
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  task: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  subtask: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "sub-task": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export const HEALTH_TONES = {
  red: {
    icon: "text-red-400",
    pill: "border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10",
    open: "border-red-500/60 bg-red-500/10",
    zero: "text-zinc-500 border-zinc-700",
  },
  cyan: {
    icon: "text-cyan-400",
    pill: "border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10",
    open: "border-cyan-500/60 bg-cyan-500/10",
    zero: "text-zinc-500 border-zinc-700",
  },
} as const;

export type HealthTone = keyof typeof HEALTH_TONES;

export type ActionTone = "amber" | "red" | "green" | "blue";

export const ACTION_TONES: Record<
  ActionTone,
  { bar: string; iconWrap: string; iconText: string; btn: string; rowHover: string }
> = {
  amber: {
    bar: "bg-amber-500",
    iconWrap: "bg-amber-500/10",
    iconText: "text-amber-400",
    btn: "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30",
    rowHover: "hover:bg-amber-500/[0.04]",
  },
  red: {
    bar: "bg-red-500",
    iconWrap: "bg-red-500/10",
    iconText: "text-red-400",
    btn: "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30",
    rowHover: "hover:bg-red-500/[0.04]",
  },
  green: {
    bar: "bg-green-500",
    iconWrap: "bg-green-500/10",
    iconText: "text-green-400",
    btn: "bg-green-500/15 hover:bg-green-500/25 text-green-300 border-green-500/30",
    rowHover: "hover:bg-green-500/[0.04]",
  },
  blue: {
    bar: "bg-blue-500",
    iconWrap: "bg-blue-500/10",
    iconText: "text-blue-400",
    btn: "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30",
    rowHover: "hover:bg-blue-500/[0.04]",
  },
};
