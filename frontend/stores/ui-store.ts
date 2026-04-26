import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
type RecordingViewMode = "grid" | "list";

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  recordingViewMode: RecordingViewMode;
  selectedRecordingIds: string[];
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRecordingViewMode: (mode: RecordingViewMode) => void;
  selectRecording: (id: string) => void;
  deselectRecording: (id: string) => void;
  selectAllRecordings: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      recordingViewMode: "grid",
      selectedRecordingIds: [],
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setRecordingViewMode: (mode) => set({ recordingViewMode: mode }),
      selectRecording: (id) =>
        set((state) => ({
          selectedRecordingIds: state.selectedRecordingIds.includes(id)
            ? state.selectedRecordingIds
            : [...state.selectedRecordingIds, id],
        })),
      deselectRecording: (id) =>
        set((state) => ({
          selectedRecordingIds: state.selectedRecordingIds.filter((i) => i !== id),
        })),
      selectAllRecordings: (ids) => set({ selectedRecordingIds: ids }),
      clearSelection: () => set({ selectedRecordingIds: [] }),
    }),
    {
      name: "streamcap-ui",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        recordingViewMode: state.recordingViewMode,
      }),
    }
  )
);
