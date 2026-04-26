"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import type { RecordingEventData, SpaceWarningData } from "@/types/events";
import type { Recording } from "@/types/recording";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6007";

const MAX_RECONNECT_DELAY = 30000;

function parseEventData<T>(event: MessageEvent) {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

export function useRealtime() {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let closed = false;

    function connect() {
      const url = `${API_BASE_URL}/api/events?token=${encodeURIComponent(token!)}`;
      const es = new EventSource(url);
      esRef.current = es;

      const updateRecording = (event: MessageEvent) => {
        const data = parseEventData<RecordingEventData>(event);
        if (!data?.rec_id) return;

        queryClient.setQueriesData<Recording[]>(
          { queryKey: ["recordings"] },
          (old) =>
            old?.map((r) =>
              r.rec_id === data.rec_id ? { ...r, ...data } : r
            ) ?? old
        );
      };

      es.onopen = () => {
        reconnectDelay.current = 1000;
      };

      es.addEventListener("recording_updated", updateRecording);

      es.addEventListener("stream_live", updateRecording);

      es.addEventListener("stream_offline", updateRecording);

      es.addEventListener("recording_started", updateRecording);

      es.addEventListener("recording_stopped", updateRecording);

      es.addEventListener("recording_error", () => {
        queryClient.invalidateQueries({ queryKey: ["recordings"] });
      });

      es.addEventListener("space_warning", (e) => {
        const data = parseEventData<SpaceWarningData>(e);
        if (!data?.message) return;
        toast.error(data.message, { duration: 8000 });
        queryClient.invalidateQueries({ queryKey: ["status"] });
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (closed) return;
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2,
            MAX_RECONNECT_DELAY
          );
          connect();
        }, reconnectDelay.current);
      };
    }

    connect();

    return () => {
      closed = true;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [isAuthenticated, token, queryClient]);
}
