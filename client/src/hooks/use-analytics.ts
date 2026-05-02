import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function getSessionId(): string {
  const KEY = "dp_sid";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function fire(endpoint: string, body: object) {
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

// Call once at the app level — tracks pageviews, scroll depth, heartbeat.
export function useAnalytics() {
  const [location] = useLocation();
  const scrolledRef = useRef<Set<number>>(new Set());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pageview on every route change
  useEffect(() => {
    const sid = getSessionId();
    fire("/api/analytics/pageview", { sessionId: sid, path: location });

    // Reset scroll milestones on navigation
    scrolledRef.current.clear();
  }, [location]);

  // Scroll-depth tracking (passive, fires each milestone once per page visit)
  useEffect(() => {
    const sid = getSessionId();
    const MILESTONES = [25, 50, 75, 100];

    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      if (total <= el.clientHeight) return;
      const pct = Math.floor((scrolled / total) * 100);

      for (const m of MILESTONES) {
        if (pct >= m && !scrolledRef.current.has(m)) {
          scrolledRef.current.add(m);
          fire("/api/analytics/scroll", { sessionId: sid, milestone: m });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location]);

  // Heartbeat every 2 minutes to keep active-user count accurate
  useEffect(() => {
    const sid = getSessionId();
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      fire("/api/analytics/heartbeat", { sessionId: sid });
    }, 2 * 60 * 1000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);
}
