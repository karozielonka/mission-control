export const REPOS = ["Vatixltd/platform", "Vatix/employee-safety-mobile"] as const;

export const SENTRY_ENVS = ["prod-uk", "stage"] as const;
export type SentryEnv = (typeof SENTRY_ENVS)[number];

export const DEFAULT_SENTRY_ENV: SentryEnv = "prod-uk";
