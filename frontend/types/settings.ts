export interface UserSettings {
  language: string;
  theme_mode: "light" | "dark";
  loop_time_seconds: number;
  recording_space_threshold: number;
  video_save_path: string;
  video_record_format: string;
  video_quality: string;
  segment_record: boolean;
  segment_time: number;
  convert_to_mp4: boolean;
  delete_original: boolean;
  proxy_address: string;
  max_bit_rate: number;
  remove_emojis: boolean;
  check_live_on_browser_refresh: boolean;
  login_required: boolean;
  recording_enabled: boolean;
  // Push notifications
  enabled_message_push: boolean;
  // Script paths
  recording_start_script: string;
  recording_stop_script: string;
  // Notification settings
  custom_notification_title: string;
  custom_stream_start_content: string;
  custom_stream_end_content: string;
  notify_loop_time: number;
  [key: string]: unknown;
}

export interface PushChannelConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface PushSettings {
  [channel: string]: PushChannelConfig;
}
