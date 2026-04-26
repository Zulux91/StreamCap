export type SSEEventType =
  | "recording_updated"
  | "stream_live"
  | "stream_offline"
  | "recording_started"
  | "recording_stopped"
  | "recording_error"
  | "space_warning"
  | "heartbeat";

import type { RecordingStatus } from "./recording";

export interface RecordingEventData {
  rec_id: string;
  status_info: RecordingStatus | null;
  is_live: boolean;
  is_recording: boolean;
  is_checking: boolean;
  display_title: string;
  speed: string;
  cumulative_duration_seconds: number;
}

export interface SpaceWarningData {
  message: string;
  recording_enabled: boolean;
}
