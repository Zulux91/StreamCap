"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, Trash2Icon, CirclePlayIcon, CircleStopIcon } from "lucide-react";
import {
  useRecordings,
  useBatchDelete,
  useBatchStart,
  useBatchStop,
} from "@/hooks/use-recordings";
import { useUIStore } from "@/stores/ui-store";
import { RecordingCard } from "@/components/features/recording/recording-card";
import { RecordingDialog } from "@/components/features/recording/recording-dialog";
import { RecordingFilters } from "@/components/features/recording/recording-filters";
import type { Recording } from "@/types/recording";

export default function RecordingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<
    Recording | undefined
  >();

  const {
    recordingViewMode,
    setRecordingViewMode,
    selectedRecordingIds,
    selectRecording,
    deselectRecording,
    clearSelection,
  } = useUIStore();

  const { data: recordings, isLoading } = useRecordings({
    status: statusFilter || undefined,
    platform: platformFilter || undefined,
    search: search || undefined,
  });

  const batchDelete = useBatchDelete();
  const batchStart = useBatchStart();
  const batchStop = useBatchStop();

  const handleSelect = (id: string) => {
    if (selectedRecordingIds.includes(id)) {
      deselectRecording(id);
    } else {
      selectRecording(id);
    }
  };

  const handleEdit = (id: string) => {
    const rec = recordings?.find((r) => r.rec_id === id);
    setEditingRecording(rec);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingRecording(undefined);
    setDialogOpen(true);
  };

  const handleBatchDelete = () => {
    if (!selectedRecordingIds.length) return;
    if (confirm(`Delete ${selectedRecordingIds.length} recording(s)?`)) {
      batchDelete.mutate(selectedRecordingIds, {
        onSuccess: () => clearSelection(),
      });
    }
  };

  const gridClass =
    recordingViewMode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      : "space-y-2";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recordings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {recordings
              ? `${recordings.length} recording${recordings.length !== 1 ? "s" : ""}`
              : "Manage your stream recordings"}
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>

      <RecordingFilters
        search={search}
        status={statusFilter}
        platform={platformFilter}
        viewMode={recordingViewMode}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPlatformChange={setPlatformFilter}
        onViewModeChange={setRecordingViewMode}
      />

      {selectedRecordingIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex-wrap">
          <span className="text-sm text-primary font-medium">
            {selectedRecordingIds.length} selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => batchStart.mutate(selectedRecordingIds)}
            disabled={batchStart.isPending}
          >
            <CirclePlayIcon className="size-3.5" />
            Start
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => batchStop.mutate(selectedRecordingIds)}
            disabled={batchStop.isPending}
          >
            <CircleStopIcon className="size-3.5" />
            Stop
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hover:text-destructive"
            onClick={handleBatchDelete}
            disabled={batchDelete.isPending}
          >
            <Trash2Icon className="size-3.5" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : !recordings?.length ? (
        <GlassCard padding="lg" className="text-center py-12">
          <p className="text-muted-foreground mb-4">No recordings found</p>
          <Button onClick={handleAddNew}>
            <PlusIcon className="size-4" />
            Add your first recording
          </Button>
        </GlassCard>
      ) : (
        <div className={gridClass}>
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.rec_id}
              recording={recording}
              selected={selectedRecordingIds.includes(recording.rec_id)}
              onSelect={handleSelect}
              onEdit={handleEdit}
              viewMode={recordingViewMode}
            />
          ))}
        </div>
      )}

      <RecordingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recording={editingRecording}
      />
    </div>
  );
}
