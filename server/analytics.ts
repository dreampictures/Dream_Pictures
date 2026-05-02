// ─── In-Memory Analytics ──────────────────────────────────────────────────────
// Resets on server restart. No DB, no personal data, no unlimited growth.

export interface AnalyticsSnapshot {
  totalVisits: number;
  activeUsers: number;
  pageVisits: Record<string, number>;
  albumVisits: { code: string; visits: number }[];
  scrollDepth: { scroll_25: number; scroll_50: number; scroll_75: number; scroll_100: number };
  startedAt: string;
}

const ACTIVE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ALBUM_ENTRIES = 50;         // cap album map size

const state = {
  totalVisits: 0,
  pageVisits: {} as Record<string, number>,
  albumVisits: {} as Record<string, number>,
  scrollDepth: { scroll_25: 0, scroll_50: 0, scroll_75: 0, scroll_100: 0 },
  // sessionId → last-seen timestamp (ms)
  activeSessions: new Map<string, number>(),
  // dedupe pageviews: "sessionId:path"
  seenPageviews: new Set<string>(),
  // dedupe scroll milestones: "sessionId:milestone"
  seenScrolls: new Set<string>(),
  startedAt: new Date().toISOString(),
};

function pruneActive() {
  const cutoff = Date.now() - ACTIVE_TTL_MS;
  Array.from(state.activeSessions.entries()).forEach(([id, ts]) => {
    if (ts < cutoff) state.activeSessions.delete(id);
  });
}

export function recordPageview(sessionId: string, path: string) {
  if (!sessionId) return;

  // Refresh active-user heartbeat
  state.activeSessions.set(sessionId, Date.now());

  // Deduplicate: count only first visit per session per path
  const key = `${sessionId}:${path}`;
  if (state.seenPageviews.has(key)) return;
  state.seenPageviews.add(key);

  state.totalVisits++;
  const label = normalisePath(path);
  state.pageVisits[label] = (state.pageVisits[label] || 0) + 1;

  // Track album visits separately
  const albumMatch = path.match(/^\/album\/([^/?#]+)/i);
  if (albumMatch) {
    const code = albumMatch[1].toLowerCase();
    if (Object.keys(state.albumVisits).length < MAX_ALBUM_ENTRIES || state.albumVisits[code]) {
      state.albumVisits[code] = (state.albumVisits[code] || 0) + 1;
    }
  }
}

export function recordHeartbeat(sessionId: string) {
  if (sessionId) state.activeSessions.set(sessionId, Date.now());
}

export function recordScroll(sessionId: string, milestone: 25 | 50 | 75 | 100) {
  if (!sessionId) return;
  state.activeSessions.set(sessionId, Date.now());
  const key = `${sessionId}:${milestone}`;
  if (state.seenScrolls.has(key)) return;
  state.seenScrolls.add(key);
  const field = `scroll_${milestone}` as keyof typeof state.scrollDepth;
  state.scrollDepth[field]++;
}

export function getSnapshot(): AnalyticsSnapshot {
  pruneActive();
  const albumVisits = Object.entries(state.albumVisits)
    .map(([code, visits]) => ({ code, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  return {
    totalVisits: state.totalVisits,
    activeUsers: state.activeSessions.size,
    pageVisits: { ...state.pageVisits },
    albumVisits,
    scrollDepth: { ...state.scrollDepth },
    startedAt: state.startedAt,
  };
}

function normalisePath(path: string): string {
  if (path === "/" || path === "") return "Home";
  if (/^\/album\//i.test(path)) return "Albums";
  if (/^\/admin/i.test(path)) return "Admin";
  if (/^\/delivery/i.test(path)) return "Delivery";
  if (/^\/refund/i.test(path)) return "Refund";
  return path.slice(1, 28) || "Other";
}
