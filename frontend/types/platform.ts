export interface Platform {
  name: string;
  key: string;
  display_name: string;
}

export interface PlatformDetectResult {
  platform: string | null;
  platform_key: string | null;
}
