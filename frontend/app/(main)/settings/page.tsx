"use client";

import { GlassCard } from "@/components/glass/glass-card";
import { GlassInput } from "@/components/glass/glass-input";
import { GlassTabs, GlassTabsList, GlassTabsTrigger, GlassTabsContent } from "@/components/glass/glass-tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings, useCookies, useUpdateCookies, useAccounts, useUpdateAccounts } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UserSettings } from "@/types/settings";

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function RecordingTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const toggle = (key: keyof UserSettings) => {
    if (!settings) return;
    updateSettings.mutate({ [key]: !settings[key] });
  };

  const update = (key: keyof UserSettings, value: unknown) => {
    updateSettings.mutate({ [key]: value });
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!settings) return null;

  return (
    <GlassCard padding="md">
      <SettingsRow label="Recording Enabled" description="Allow recording when space is available">
        <Switch
          checked={settings.recording_enabled as boolean}
          onCheckedChange={() => toggle("recording_enabled")}
        />
      </SettingsRow>
      <SettingsRow label="Convert to MP4" description="Auto-convert after recording stops">
        <Switch
          checked={settings.convert_to_mp4 as boolean}
          onCheckedChange={() => toggle("convert_to_mp4")}
        />
      </SettingsRow>
      <SettingsRow label="Delete Original" description="Delete original file after conversion">
        <Switch
          checked={settings.delete_original as boolean}
          onCheckedChange={() => toggle("delete_original")}
        />
      </SettingsRow>
      <SettingsRow label="Segment Recording" description="Split recordings into segments">
        <Switch
          checked={settings.segment_record as boolean}
          onCheckedChange={() => toggle("segment_record")}
        />
      </SettingsRow>
      <SettingsRow label="Remove Emojis" description="Strip emojis from stream titles">
        <Switch
          checked={settings.remove_emojis as boolean}
          onCheckedChange={() => toggle("remove_emojis")}
        />
      </SettingsRow>
      <SettingsRow label="Check Live on Refresh">
        <Switch
          checked={settings.check_live_on_browser_refresh as boolean}
          onCheckedChange={() => toggle("check_live_on_browser_refresh")}
        />
      </SettingsRow>
      <SettingsRow label="Monitor Interval (seconds)">
        <GlassInput
          type="number"
          defaultValue={settings.loop_time_seconds as number}
          className="w-24 text-right"
          onBlur={(e) => update("loop_time_seconds", parseInt(e.target.value, 10))}
        />
      </SettingsRow>
      <SettingsRow label="Max Bitrate (Kbps)" description="0 = unlimited">
        <GlassInput
          type="number"
          defaultValue={settings.max_bit_rate as number}
          className="w-24 text-right"
          onBlur={(e) => update("max_bit_rate", parseInt(e.target.value, 10))}
        />
      </SettingsRow>
      <SettingsRow label="Segment Duration (seconds)">
        <GlassInput
          type="number"
          defaultValue={settings.segment_time as number}
          className="w-24 text-right"
          onBlur={(e) => update("segment_time", parseInt(e.target.value, 10))}
        />
      </SettingsRow>
      <SettingsRow label="Save Path">
        <GlassInput
          defaultValue={settings.video_save_path as string}
          className="w-52"
          placeholder="/path/to/recordings"
          onBlur={(e) => update("video_save_path", e.target.value)}
        />
      </SettingsRow>
      <SettingsRow label="Proxy Address">
        <GlassInput
          defaultValue={settings.proxy_address as string}
          className="w-52"
          placeholder="http://proxy:port"
          onBlur={(e) => update("proxy_address", e.target.value)}
        />
      </SettingsRow>
    </GlassCard>
  );
}

function PushTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const toggle = (key: keyof UserSettings) => {
    if (!settings) return;
    updateSettings.mutate({ [key]: !settings[key] });
  };

  const update = (key: keyof UserSettings, value: unknown) => {
    updateSettings.mutate({ [key]: value });
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;
  if (!settings) return null;

  return (
    <GlassCard padding="md">
      <SettingsRow label="Enable Push Notifications" description="Send notifications for stream events">
        <Switch
          checked={settings.enabled_message_push as boolean}
          onCheckedChange={() => toggle("enabled_message_push")}
        />
      </SettingsRow>
      <SettingsRow label="Notification Title">
        <GlassInput
          defaultValue={settings.custom_notification_title as string}
          className="w-52"
          placeholder="StreamCap"
          onBlur={(e) => update("custom_notification_title", e.target.value)}
        />
      </SettingsRow>
      <SettingsRow label="Stream Start Message">
        <GlassInput
          defaultValue={settings.custom_stream_start_content as string}
          className="w-52"
          placeholder="{name} is live"
          onBlur={(e) => update("custom_stream_start_content", e.target.value)}
        />
      </SettingsRow>
      <SettingsRow label="Stream End Message">
        <GlassInput
          defaultValue={settings.custom_stream_end_content as string}
          className="w-52"
          placeholder="{name} went offline"
          onBlur={(e) => update("custom_stream_end_content", e.target.value)}
        />
      </SettingsRow>
      <SettingsRow label="Notify Interval (seconds)" description="Minimum time between repeat notifications">
        <GlassInput
          type="number"
          defaultValue={settings.notify_loop_time as number}
          className="w-24 text-right"
          onBlur={(e) => update("notify_loop_time", parseInt(e.target.value, 10))}
        />
      </SettingsRow>
      <SettingsRow label="Recording Start Script" description="Shell script to run when recording starts">
        <GlassInput
          defaultValue={settings.recording_start_script as string}
          className="w-52"
          placeholder="/path/to/script.sh"
          onBlur={(e) => update("recording_start_script", e.target.value)}
        />
      </SettingsRow>
      <SettingsRow label="Recording Stop Script">
        <GlassInput
          defaultValue={settings.recording_stop_script as string}
          className="w-52"
          placeholder="/path/to/script.sh"
          onBlur={(e) => update("recording_stop_script", e.target.value)}
        />
      </SettingsRow>
    </GlassCard>
  );
}

function CookiesTab() {
  const { data: cookies, isLoading } = useCookies();
  const updateCookies = useUpdateCookies();

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  const cookieText = cookies ? JSON.stringify(cookies, null, 2) : "{}";

  const handleSave = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateCookies.mutate(parsed);
    } catch {
      // invalid JSON — ignore
    }
  };

  return (
    <GlassCard padding="md">
      <p className="text-sm text-muted-foreground mb-3">
        Platform cookies in JSON format. Keys are platform identifiers, values are cookie strings.
      </p>
      <textarea
        key={cookieText}
        className="w-full h-64 rounded-lg bg-black/20 border border-white/10 p-3 text-xs font-mono text-foreground resize-y focus:outline-none focus:border-primary/50"
        defaultValue={cookieText}
        onBlur={(e) => handleSave(e.target.value)}
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground mt-2">
        Changes are saved automatically when you click outside the editor.
      </p>
    </GlassCard>
  );
}

function AccountsTab() {
  const { data: accounts, isLoading } = useAccounts();
  const updateAccounts = useUpdateAccounts();

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  const accountsText = accounts ? JSON.stringify(accounts, null, 2) : "{}";

  const handleSave = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateAccounts.mutate(parsed);
    } catch {
      // invalid JSON — ignore
    }
  };

  return (
    <GlassCard padding="md">
      <p className="text-sm text-muted-foreground mb-3">
        Platform account credentials (Soop, FlexTV, PopkonTV, Twitcasting, etc.).
      </p>
      <textarea
        key={accountsText}
        className="w-full h-64 rounded-lg bg-black/20 border border-white/10 p-3 text-xs font-mono text-foreground resize-y focus:outline-none focus:border-primary/50"
        defaultValue={accountsText}
        onBlur={(e) => handleSave(e.target.value)}
        spellCheck={false}
      />
    </GlassCard>
  );
}

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(6, "Minimum 6 characters"),
  confirmPassword: z.string().min(1, "Required"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function SecurityTab() {
  const { changePassword } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: PasswordFormData) => {
    changePassword(
      { oldPassword: data.oldPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() }
    );
  };

  return (
    <GlassCard padding="md">
      <h3 className="font-semibold mb-4">Change Password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Current Password</label>
          <GlassInput
            type="password"
            autoComplete="current-password"
            {...register("oldPassword")}
          />
          {errors.oldPassword && (
            <p className="text-xs text-destructive">{errors.oldPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">New Password</label>
          <GlassInput
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirm New Password</label>
          <GlassInput
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Change Password"}
        </Button>
      </form>
    </GlassCard>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure StreamCap</p>
      </div>

      <GlassTabs defaultValue="recording">
        <GlassTabsList>
          <GlassTabsTrigger value="recording">Recording</GlassTabsTrigger>
          <GlassTabsTrigger value="push">Push</GlassTabsTrigger>
          <GlassTabsTrigger value="cookies">Cookies</GlassTabsTrigger>
          <GlassTabsTrigger value="accounts">Accounts</GlassTabsTrigger>
          <GlassTabsTrigger value="security">Security</GlassTabsTrigger>
        </GlassTabsList>

        <GlassTabsContent value="recording" className="mt-4">
          <RecordingTab />
        </GlassTabsContent>
        <GlassTabsContent value="push" className="mt-4">
          <PushTab />
        </GlassTabsContent>
        <GlassTabsContent value="cookies" className="mt-4">
          <CookiesTab />
        </GlassTabsContent>
        <GlassTabsContent value="accounts" className="mt-4">
          <AccountsTab />
        </GlassTabsContent>
        <GlassTabsContent value="security" className="mt-4">
          <SecurityTab />
        </GlassTabsContent>
      </GlassTabs>
    </div>
  );
}
