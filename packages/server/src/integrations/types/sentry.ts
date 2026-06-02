export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  shortId: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  level: string;
  status: string;
  permalink: string;
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
}
