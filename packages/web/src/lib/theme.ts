type Theme = "dark" | "light";

const STORAGE_KEY = "claude-dashboard-theme";
const DEFAULT_THEME: Theme = "dark";

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be disabled (Safari private mode, quota exceeded, etc).
    // Theme then lives only on `document.documentElement` for the session.
  }
}

export function getTheme(): Theme {
  const stored = safeGetItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return DEFAULT_THEME;
}

export function setTheme(theme: Theme) {
  safeSetItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute("data-theme", theme);
}
