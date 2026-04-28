export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  detail: string;
  status?: number;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface StorageEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
  extension?: string;
}

export type StorageBrowseResponse = StorageEntry[];

export interface StorageStats {
  total: number;
  used: number;
  free: number;
  path: string;
  video_count: number;
}

export interface AppStatus {
  active_recordings: number;
  live_streams: number;
  monitoring: number;
  recording_enabled: boolean;
  live_checker: {
    started: boolean;
    running: boolean;
    healthy: boolean;
    last_tick: string | null;
    last_tick_age_seconds: number | null;
    last_error: string | null;
    failures: number;
    interval_seconds: number;
  };
}

export interface HealthResponse {
  status: "ok";
  version: string;
}

export interface UpdateCheckResponse {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  release_url: string;
  release_notes?: string;
}
