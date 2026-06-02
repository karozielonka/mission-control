import type { SentryIssue } from './types/sentry.js';

const getConfig = () => ({
  token: process.env.SENTRY_ACCESS_TOKEN || '',
  org: process.env.SENTRY_ORG || '',
  project: process.env.SENTRY_PROJECT || '',
  url: process.env.SENTRY_URL || 'https://sentry.io',
});

export const isSentryConfigured = (): boolean =>
  !!(process.env.SENTRY_ACCESS_TOKEN && process.env.SENTRY_ORG);

async function sentryFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getConfig().url}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getConfig().token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sentry API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getRecentIssues(project?: string, environment?: string): Promise<SentryIssue[]> {
  const { org, project: defaultProject } = getConfig();
  const targetProject = project || defaultProject;
  const envParam = environment ? `&environment=${encodeURIComponent(environment)}` : '';
  if (targetProject) {
    return sentryFetch<SentryIssue[]>(
      `/api/0/projects/${org}/${targetProject}/issues/?query=is:unresolved&sort=date&limit=25${envParam}`
    );
  }
  return sentryFetch<SentryIssue[]>(
    `/api/0/organizations/${org}/issues/?query=is:unresolved&sort=date&limit=25${envParam}`
  );
}
