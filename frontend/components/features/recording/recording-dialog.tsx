"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  GlassDialog,
  GlassDialogContent,
  GlassDialogHeader,
  GlassDialogTitle,
} from "@/components/glass/glass-dialog";
import { GlassInput } from "@/components/glass/glass-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateRecording, useUpdateRecording } from "@/hooks/use-recordings";
import type { Recording } from "@/types/recording";

const schema = z.object({
  url: z.string().min(1, "URL required"),
  streamer_name: z.string().min(1, "Name required"),
  quality: z.enum(["OD", "UHD", "HD", "SD", "LD"]),
  record_format: z.enum(["TS", "MP4", "FLV", "MKV", "MOV", "NUT"]),
  segment_record: z.boolean(),
  segment_time: z.number().int().min(1),
  monitor_status: z.boolean(),
  scheduled_recording: z.boolean(),
  scheduled_start_time: z.string(),
  monitor_hours: z.string(),
  recording_dir: z.string(),
  enabled_message_push: z.boolean(),
  only_notify_no_record: z.boolean(),
  flv_use_direct_download: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const DEFAULTS: FormData = {
  url: "",
  streamer_name: "",
  quality: "OD",
  record_format: "TS",
  segment_record: false,
  segment_time: 3600,
  monitor_status: true,
  scheduled_recording: false,
  scheduled_start_time: "",
  monitor_hours: "",
  recording_dir: "",
  enabled_message_push: false,
  only_notify_no_record: false,
  flv_use_direct_download: false,
};

interface RecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recording?: Recording;
}

function SwitchRow({
  label,
  name,
  control,
}: {
  label: string;
  name: keyof FormData;
  control: ReturnType<typeof useForm<FormData>>["control"];
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-sm">{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}

export function RecordingDialog({
  open,
  onOpenChange,
  recording,
}: RecordingDialogProps) {
  const isEdit = !!recording;
  const createRecording = useCreateRecording();
  const updateRecording = useUpdateRecording();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (recording) {
      reset({
        url: recording.url,
        streamer_name: recording.streamer_name,
        quality: recording.quality,
        record_format: recording.record_format,
        segment_record: recording.segment_record,
        segment_time: recording.segment_time,
        monitor_status: recording.monitor_status,
        scheduled_recording: recording.scheduled_recording,
        scheduled_start_time: recording.scheduled_start_time,
        monitor_hours: recording.monitor_hours,
        recording_dir: recording.recording_dir,
        enabled_message_push: recording.enabled_message_push,
        only_notify_no_record: recording.only_notify_no_record,
        flv_use_direct_download: recording.flv_use_direct_download,
      });
    } else {
      reset(DEFAULTS);
    }
  }, [open, recording, reset]);

  const segmentRecord = useWatch({ control, name: "segment_record" });
  const scheduledRecording = useWatch({ control, name: "scheduled_recording" });
  const isPending = createRecording.isPending || updateRecording.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit && recording) {
      updateRecording.mutate(
        { id: recording.rec_id, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createRecording.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <GlassDialog open={open} onOpenChange={onOpenChange}>
      <GlassDialogContent className="max-w-lg sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <GlassDialogHeader>
          <GlassDialogTitle>
            {isEdit ? "Edit Recording" : "Add Recording"}
          </GlassDialogTitle>
        </GlassDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col min-h-0 gap-0"
        >
          <div className="overflow-y-auto space-y-3 flex-1 py-2 pr-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stream URL</label>
              <GlassInput
                placeholder="https://..."
                {...register("url")}
              />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Streamer Name</label>
              <GlassInput
                placeholder="Name"
                {...register("streamer_name")}
              />
              {errors.streamer_name && (
                <p className="text-xs text-destructive">
                  {errors.streamer_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quality</label>
                <Controller
                  control={control}
                  name="quality"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v) field.onChange(v);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["OD", "UHD", "HD", "SD", "LD"] as const).map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Format</label>
                <Controller
                  control={control}
                  name="record_format"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v) field.onChange(v);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["TS", "MP4", "FLV", "MKV", "MOV", "NUT"] as const).map(
                          (f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1 rounded-lg border border-white/10 p-3">
              <SwitchRow label="Start Monitoring" name="monitor_status" control={control} />
              <SwitchRow label="Segment Recording" name="segment_record" control={control} />

              {segmentRecord && (
                <div className="space-y-1.5 pl-3 border-l border-white/10 mt-2">
                  <label className="text-xs text-muted-foreground">
                    Segment Duration (seconds)
                  </label>
                  <GlassInput
                    type="number"
                    {...register("segment_time", { valueAsNumber: true })}
                  />
                </div>
              )}

              <SwitchRow
                label="Scheduled Recording"
                name="scheduled_recording"
                control={control}
              />

              {scheduledRecording && (
                <div className="space-y-2 pl-3 border-l border-white/10 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Start Time (HH:MM)
                    </label>
                    <GlassInput
                      placeholder="20:00"
                      {...register("scheduled_start_time")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Monitor Hours (comma-separated)
                    </label>
                    <GlassInput
                      placeholder="2,4"
                      {...register("monitor_hours")}
                    />
                  </div>
                </div>
              )}

              <SwitchRow
                label="Push Notifications"
                name="enabled_message_push"
                control={control}
              />
              <SwitchRow
                label="Notify Only (No Record)"
                name="only_notify_no_record"
                control={control}
              />
              <SwitchRow
                label="FLV Direct Download"
                name="flv_use_direct_download"
                control={control}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Custom Recording Directory
              </label>
              <GlassInput
                placeholder="Leave empty for default"
                {...register("recording_dir")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-white/10 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </GlassDialogContent>
    </GlassDialog>
  );
}
