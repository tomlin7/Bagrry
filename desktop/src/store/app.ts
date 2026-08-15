import { create } from "zustand";
import {
  MY_NOTES_SPACE,
  normalizeRecStatus,
  routeKey,
  type RecState,
  type RecStatus,
  type Route,
  type SettingsTab,
  type VuLevels,
} from "@/lib/types";
import {
  applyTheme,
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

const ONBOARD_KEY = "bagrry.onboarded";
const SIDEBAR_KEY = "bagrry.sidebar";

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

const initialPreference = readStoredPreference();

type AppState = {
  /* Navigation */
  route: Route;
  history: Route[];
  navigate: (route: Route, options?: { replace?: boolean }) => void;
  back: () => void;
  openNote: (id: string) => void;
  openSpace: (id: string) => void;
  openSettings: (tab?: SettingsTab) => void;

  /* Chrome */
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  onboardingOpen: boolean;
  finishOnboarding: () => void;

  /* Theme */
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
  syncSystemTheme: () => void;

  /* Recording */
  recState: RecState;
  recordingMeetingId: string | null;
  recordingStartedAt: number | null;
  pendingBytes: number;
  loopbackOk: boolean;
  vu: VuLevels;
  applyRecStatus: (status: RecStatus) => void;
  setVu: (vu: VuLevels) => void;

  /* Transcript panel */
  transcriptOpen: boolean;
  transcriptMinimized: boolean;
  setTranscriptOpen: (v: boolean) => void;
  setTranscriptMinimized: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  route: { kind: "home" },
  history: [],

  navigate: (route, options) => {
    const current = get().route;
    if (routeKey(current) === routeKey(route)) return;
    set({
      route,
      history: options?.replace ? get().history : [...get().history, current].slice(-50),
    });
  },

  back: () => {
    const history = get().history;
    if (history.length === 0) {
      set({ route: { kind: "home" } });
      return;
    }
    set({ route: history[history.length - 1], history: history.slice(0, -1) });
  },

  openNote: (id) => get().navigate({ kind: "note", noteId: id }),
  openSpace: (id) => get().navigate({ kind: "space", spaceId: id || MY_NOTES_SPACE }),
  openSettings: (tab = "preferences") => get().navigate({ kind: "settings", tab }),

  sidebarOpen: readFlag(SIDEBAR_KEY, true),
  toggleSidebar: () => {
    const next = !get().sidebarOpen;
    writeFlag(SIDEBAR_KEY, next);
    set({ sidebarOpen: next });
  },
  setSidebarOpen: (sidebarOpen) => {
    writeFlag(SIDEBAR_KEY, sidebarOpen);
    set({ sidebarOpen });
  },

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  onboardingOpen: readFlag(ONBOARD_KEY, false) === false,
  finishOnboarding: () => {
    writeFlag(ONBOARD_KEY, true);
    set({ onboardingOpen: false });
  },

  themePreference: initialPreference,
  resolvedTheme: resolveTheme(initialPreference),
  setThemePreference: (pref) => {
    const resolved = resolveTheme(pref);
    writeStoredPreference(pref);
    applyTheme(resolved);
    set({ themePreference: pref, resolvedTheme: resolved });
  },
  syncSystemTheme: () => {
    if (get().themePreference !== "system") return;
    const resolved = resolveTheme("system");
    applyTheme(resolved);
    set({ resolvedTheme: resolved });
  },

  recState: "idle",
  recordingMeetingId: null,
  recordingStartedAt: null,
  pendingBytes: 0,
  loopbackOk: false,
  vu: { mic: 0, system: 0 },

  applyRecStatus: (status) => {
    const next = normalizeRecStatus(status);
    const wasIdle = get().recState === "idle";
    set({
      recState: next.state,
      recordingMeetingId: next.meetingId,
      pendingBytes: next.pendingBytes,
      loopbackOk: next.loopbackOk,
      // Keep the original start time across pause/resume so the clock is continuous.
      recordingStartedAt:
        next.state === "idle" ? null : wasIdle ? Date.now() : (get().recordingStartedAt ?? Date.now()),
      transcriptOpen: next.state === "idle" ? get().transcriptOpen : true,
      vu: next.state === "idle" ? { mic: 0, system: 0 } : get().vu,
    });
  },

  setVu: (vu) => set({ vu }),

  transcriptOpen: false,
  transcriptMinimized: false,
  setTranscriptOpen: (transcriptOpen) => set({ transcriptOpen }),
  setTranscriptMinimized: (transcriptMinimized) => set({ transcriptMinimized }),
}));
