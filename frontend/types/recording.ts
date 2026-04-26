export type VideoQuality = "OD" | "UHD" | "HD" | "SD" | "LD";
export type RecordFormat = "TS" | "MP4" | "FLV" | "MKV" | "MOV" | "NUT";

export type RecordingStatus =
  | "STATUS_CHECKING"
  | "MONITORING"
  | "PREPARING_RECORDING"
  | "RECORDING"
  | "NOT_RECORDING"
  | "CHECK_ERROR"
  | "LIVE_STATUS_CHECK_ERROR"
  | "STOPPED_MONITORING"
  | "RECORDING_ERROR"
  | "NOT_RECORDING_SPACE"
  | "LIVE_BROADCASTING"
  | "NOT_IN_SCHEDULED_CHECK";

export interface Recording {
  // Persisted fields
  rec_id: string;
  url: string;
  streamer_name: string;
  quality: VideoQuality;
  record_format: RecordFormat;
  segment_record: boolean;
  segment_time: number;
  monitor_status: boolean;
  scheduled_recording: boolean;
  scheduled_start_time: string;
  monitor_hours: string;
  recording_dir: string;
  enabled_message_push: boolean;
  only_notify_no_record: boolean;
  flv_use_direct_download: boolean;
  platform: string | null;
  platform_key: string | null;
  // Runtime fields (read-only)
  is_live: boolean;
  is_recording: boolean;
  is_checking: boolean;
  status_info: RecordingStatus | null;
  display_title: string;
  speed: string;
  cumulative_duration_seconds: number;
}

export interface CreateRecordingInput {
  url: string;
  streamer_name: string;
  quality: VideoQuality;
  record_format: RecordFormat;
  segment_record: boolean;
  segment_time: number;
  monitor_status: boolean;
  scheduled_recording: boolean;
  scheduled_start_time: string;
  monitor_hours: string;
  recording_dir: string;
  enabled_message_push: boolean;
  only_notify_no_record: boolean;
  flv_use_direct_download: boolean;
}

export type UpdateRecordingInput = Partial<CreateRecordingInput>;

export interface BatchOperationResult {
  success: boolean;
  results: { rec_id: string; success: boolean; error?: string }[];
}
