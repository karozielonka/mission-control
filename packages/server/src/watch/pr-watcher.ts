import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { FastifyBaseLogger } from 'fastify';
import {
  WATCHED_REPOS,
  type PrAlert,
  type PrAlertKind,
  type PullRequest,
} from '@dashboard/shared';
import * as github from '../integrations/github.js';
import { loadMyPullRequests } from '../routes/integrations/github.js';

const POLL_MS = 2 * 60_000;
const MAX_RECENT = 5;

type Snapshot = Pick<PullRequest, 'checks_state' | 'review_state' | 'mergeable_state'>;

const TEXT: Record<PrAlertKind, (number: number, who: string) => string> = {
  ci_passed: (n) => `CI passed on #${n}`,
  ci_failed: (n) => `CI failed on #${n}`,
  approved: (n) => `#${n} approved`,
  changes_requested: (n) => `Changes requested on #${n}`,
  conflict: (n) => `#${n} has a merge conflict`,
  review_requested: (n, who) => `${who} asked you to review #${n}`,
};

export const prEvents = new EventEmitter();

let recent: PrAlert[] = [];
let lastPrs: Map<string, Snapshot> | undefined;
let lastReviewRequests: Set<string> | undefined;

export const getRecentAlerts = (): PrAlert[] => recent;

// '' and 'unknown' mean GitHub hadn't settled or the fetch failed, so keep the last known value.
const settled = <T extends string | undefined>(next: T, prev: T | undefined): T | undefined =>
  next && next !== 'unknown' ? next : prev;

function snapshotOf(pr: PullRequest, before: Snapshot | undefined): Snapshot {
  return {
    checks_state: settled(pr.checks_state, before?.checks_state),
    review_state: settled(pr.review_state, before?.review_state) ?? '',
    mergeable_state: settled(pr.mergeable_state, before?.mergeable_state) ?? '',
  };
}

function changesFor(now: Snapshot, before: Snapshot): PrAlertKind[] {
  const kinds: PrAlertKind[] = [];
  if (now.checks_state === 'failure' && before.checks_state !== 'failure') kinds.push('ci_failed');
  if (now.checks_state === 'success' && before.checks_state === 'pending') kinds.push('ci_passed');
  if (now.review_state === 'approved' && before.review_state !== 'approved') kinds.push('approved');
  if (now.review_state === 'changes_requested' && before.review_state !== 'changes_requested') {
    kinds.push('changes_requested');
  }
  if (now.mergeable_state === 'dirty' && before.mergeable_state !== 'dirty') kinds.push('conflict');
  return kinds;
}

function alertOf(
  kind: PrAlertKind,
  pr: { url: string; repo: string; number: number; title: string; author: string },
  at: string,
): PrAlert {
  return {
    id: `${at}-${pr.url}-${kind}`,
    kind,
    text: TEXT[kind](pr.number, pr.author),
    url: pr.url,
    repo: pr.repo,
    number: pr.number,
    title: pr.title,
    at,
  };
}

const escapeAppleScript = (text: string) => text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function notifyMac(alert: PrAlert, log: FastifyBaseLogger) {
  if (process.platform !== 'darwin') return;
  const script =
    `display notification "${escapeAppleScript(alert.title)}" ` +
    `with title "Mission Control" subtitle "${escapeAppleScript(alert.text)}" sound name "Glass"`;
  execFile('osascript', ['-e', script], (err) => {
    if (err) log.warn({ err }, 'macOS notification failed');
  });
}

async function checkMyPrs(at: string): Promise<PrAlert[]> {
  const prs = (await Promise.all(WATCHED_REPOS.map((repo) => loadMyPullRequests(repo)))).flat();
  const before = lastPrs;
  lastPrs = new Map(prs.map((pr) => [pr.url, snapshotOf(pr, before?.get(pr.url))]));
  if (!before) return [];
  return prs.flatMap((pr) => {
    const was = before.get(pr.url);
    const now = lastPrs!.get(pr.url)!;
    return was ? changesFor(now, was).map((kind) => alertOf(kind, pr, at)) : [];
  });
}

async function checkReviewRequests(at: string): Promise<PrAlert[]> {
  const items = await github.getReviewRequestedPullRequests();
  const before = lastReviewRequests;
  lastReviewRequests = new Set(items.map((item) => item.html_url));
  if (!before) return [];
  return items
    .filter((item) => !before.has(item.html_url))
    .map((item) =>
      alertOf(
        'review_requested',
        {
          url: item.html_url,
          repo: item.repository_url.match(/\/repos\/([^/]+\/[^/]+)$/)?.[1] ?? '',
          number: item.number,
          title: item.title,
          author: item.user.login,
        },
        at,
      ),
    );
}

async function poll(log: FastifyBaseLogger) {
  const at = new Date().toISOString();
  const results = await Promise.allSettled([checkMyPrs(at), checkReviewRequests(at)]);
  const fresh: PrAlert[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') fresh.push(...result.value);
    else log.error({ err: result.reason }, 'PR watcher poll failed');
  }
  if (fresh.length === 0) return;
  recent = [...fresh, ...recent].slice(0, MAX_RECENT);
  for (const alert of fresh) notifyMac(alert, log);
  prEvents.emit('alerts', fresh);
}

export function startPrWatcher(log: FastifyBaseLogger) {
  if (!github.isGitHubConfigured()) {
    log.info('GitHub not configured, PR watcher off');
    return;
  }
  const tick = async () => {
    await poll(log).catch((err) => log.error({ err }, 'PR watcher poll failed'));
    setTimeout(tick, POLL_MS);
  };
  void tick();
}
