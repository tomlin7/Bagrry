import { create } from "zustand";
import type { Page, RecState, RecStatus, VuLevels } from "@/lib/types";
import { normalizeRecStatus } from "@/lib/types";

const ENTERED_KEY = "bagrry.entered";
const ONBOARD_KEY = "bagrry.onboarded";

function initialPage(): Page {
  try {
    return localStorage.getItem(ENTERED_KEY) === "1" ? "dashboard" : "landing";
  } catch {
    return "landing";
  }
}

type AppState = {
  page: Page;
  selectedMeetingId: string | null;
  folderId: string | null;
  recState: RecState;
  pendingBytes: number;
  loopbackOk: boolean;
  vu: VuLevels;
  liveOpen: boolean;
  chatOpen: boolean;
  overlayOn: boolean;
  paletteOpen: boolean;
  onboardingOpen: boolean;
  setPage: (page: Page) => void;
  enterWorkspace: (page?: Page) => void;
  selectMeeting: (id: string | null) => void;
  setFolderId: (id: string | null) => void;
  applyRecStatus: (status: RecStatus) => void;
  setVu: (vu: VuLevels) => void;
  setLiveOpen: (v: boolean) => void;
  setChatOpen: (v: boolean) => void;
  setOverlayOn: (v: boolean) => void;
  setPaletteOpen: (v: boolean) => void;
  finishOnboarding: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  page: initialPage(),
  selectedMeetingId: null,
  folderId: null,
  recState: "idle",
  pendingBytes: 0,
  loopbackOk: false,
  vu: { mic: 0, system: 0 },
  liveOpen: false,
  chatOpen: false,
  overlayOn: false,
  paletteOpen: false,
  onboardingOpen: (() => {
    try {
      return localStorage.getItem(ENTERED_KEY) === "1" && localStorage.getItem(ONBOARD_KEY) !== "1";
    } catch {
      return false;
    }
  })(),
  setPage: (page) => set({ page }),
  enterWorkspace: (page = "dashboard") => {
    let showOnboard = false;
    try {
      localStorage.setItem(ENTERED_KEY, "1");
      showOnboard = localStorage.getItem(ONBOARD_KEY) !== "1";
    } catch {
      /* ignore */
    }
    set({ page, onboardingOpen: showOnboard });
  },
  selectMeeting: (id) => set({ selectedMeetingId: id, page: "notes" }),
  setFolderId: (id) => set({ folderId: id }),
  applyRecStatus: (status) => {
    const n = normalizeRecStatus(status);
    set({
      recState: n.state,
      pendingBytes: n.pendingBytes,
      loopbackOk: n.loopbackOk,
      overlayOn: n.state === "recording",
    });
  },
  setVu: (vu) => set({ vu }),
  setLiveOpen: (liveOpen) => set({ liveOpen }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setOverlayOn: (overlayOn) => set({ overlayOn }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  finishOnboarding: () => {
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
    } catch {
      /* ignore */
    }
    set({ onboardingOpen: false });
  },
}));
