"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export type LiveRefreshSource = {
  /**
   * URL to an SSE endpoint (same-origin).
   * Example: `/api/live/projects` or `/api/live/plots?projectId=...`
   */
  url: string;
  /** Enable/disable subscription (default: true). */
  enabled?: boolean;
};

export type UseLiveRefreshOptions = {
  /**
   * Debounce window for `router.refresh()`.
   * Prevents flooding the server during bursts of changes.
   */
  debounceMs?: number;
  /**
   * If true, pause the SSE connection while the document is hidden.
   * This reduces server load from background tabs.
   */
  pauseWhenHidden?: boolean;
};

/**
 * Subscribe to one or more SSE endpoints and refresh the current route when data changes.
 *
 * Production notes:
 * - We debounce `router.refresh()` to avoid excessive refreshes.
 * - We optionally pause connections in background tabs.
 * - We keep all logic in a hook so pages/components can opt-in easily.
 */
export function useLiveRefresh(
  sources: LiveRefreshSource[],
  opts: UseLiveRefreshOptions = {},
) {
  const router = useRouter();

  const debounceMs = opts.debounceMs ?? 1000;
  const pauseWhenHidden = opts.pauseWhenHidden ?? true;

  const refreshTimerRef = React.useRef<number | null>(null);

  const scheduleRefresh = React.useCallback(() => {
    if (refreshTimerRef.current != null) return;

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      router.refresh();
    }, debounceMs);
  }, [debounceMs, router]);

  React.useEffect(() => {
    const eventSources: EventSource[] = [];

    const connect = () => {
      // Close any existing connections (e.g. on visibility changes)
      while (eventSources.length) {
        eventSources.pop()?.close();
      }

      for (const s of sources) {
        if (s.enabled === false) continue;

        // EventSource automatically includes cookies for same-origin requests.
        const es = new EventSource(s.url);

        es.onmessage = () => {
          // Any message implies the server detected a change.
          scheduleRefresh();
        };

        // Optional: also refresh on custom events.
        es.addEventListener("change", () => scheduleRefresh());

        es.onerror = () => {
          // Let the browser handle reconnects. We avoid spamming logs here.
          // If the server goes away, the EventSource will retry.
        };

        eventSources.push(es);
      }
    };

    const disconnect = () => {
      while (eventSources.length) {
        eventSources.pop()?.close();
      }
    };

    connect();

    const onVisibilityChange = () => {
      if (!pauseWhenHidden) return;
      if (document.visibilityState === "hidden") {
        disconnect();
      } else {
        connect();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      disconnect();

      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [pauseWhenHidden, scheduleRefresh, sources]);
}
