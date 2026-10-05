// Per-device conveniences. Storage can be unavailable (private mode, blocked),
// so every access is guarded and the app works without it.
import type { ClassifyResponse, LocationInfo } from "./types";

export interface HistoryEntry {
  id: string;
  ts: number;
  thumb: string;
  location: string;
  response: ClassifyResponse;
}

const KEYS = {
  location: "sortly.location",
  advanced: "sortly.advanced",
  history: "sortly.history",
};
const MAX_HISTORY = 12;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or disabled — ignore */
  }
}

export const loadLocation = () => read<LocationInfo | null>(KEYS.location, null);
export const saveLocation = (loc: LocationInfo) => write(KEYS.location, loc);

export const loadAdvanced = () => read<boolean>(KEYS.advanced, false);
export const saveAdvanced = (on: boolean) => write(KEYS.advanced, on);

export const loadHistory = () => read<HistoryEntry[]>(KEYS.history, []);
export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  write(KEYS.history, next);
  return next;
}
export function clearHistory(): HistoryEntry[] {
  write(KEYS.history, []);
  return [];
}
