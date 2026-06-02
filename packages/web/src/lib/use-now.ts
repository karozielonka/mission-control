import { useSyncExternalStore } from "react";
import { REFRESH_INTERVAL_MS } from "@/lib/constants";

// A single shared ticker drives every time-relative label (timeAgo, staleness,
// "updated 5m ago") so they all advance together and stay cheap. Components read
// "now" through this hook instead of calling Date.now() during render — that keeps
// renders pure (no impure call in the render body) and lets React re-render only
// the subscribers when the tick changes.

let now = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (intervalId === null) {
    intervalId = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, REFRESH_INTERVAL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot(): number {
  return now;
}

/** Current time in ms, refreshed on the shared cadence. Subscribing components
 *  re-render once per tick so relative timestamps stay current. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}
