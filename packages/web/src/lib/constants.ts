// Auto-refresh cadence + "stale" threshold for the in-app data
export const REFRESH_INTERVAL_MS = 60_000;
export const STALE_REFRESH_MINUTES = 20;

// Age tiers (in hours) for open PRs / waiting tickets
export const AGE_WARM_HOURS = 24;
export const AGE_STALE_HOURS = 72;

// Sentry tier thresholds (count × recency score)
export const SENTRY_SCORE_HIGH = 500;
export const SENTRY_SCORE_MED = 50;

// Linear project key prefixes to hide from the "Testing (unassigned)" pill.
// e.g. "DD-143" belongs to the DD project.
export const TESTING_EXCLUDED_PROJECTS = ["DD"];
