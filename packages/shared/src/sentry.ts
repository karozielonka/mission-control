export type SentryLevel = "sample" | "debug" | "info" | "warning" | "error" | "fatal";

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  count: number;
  first_seen: string;
  last_seen: string;
  level: SentryLevel;
  url: string;
}
