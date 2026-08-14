import { create } from "zustand";
import type { RecState, RecStatus, VuLevels } from "@/lib/types";

type AppState = {
  selectedMeetingId: string | null;
  recState: RecState;
  pendingBytes: number;
  loopbackOk: boolean;
  vu: VuLevels;
  selectMeeting: (id: string | null) => void;
  applyRecStatus: (status: RecStatus) => void;
  setVu: (vu: VuLevels) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedMeetingId: null,
  recState: "idle",
  pendingBytes: 0,
  loopbackOk: false,
  vu: { mic: 0, system: 0 },
  selectMeeting: (id) => set({ selectedMeetingId: id }),
  applyRecStatus: (status) =>
    set({
      recState: status.state,
      pendingBytes: status.pending_bytes,
      loopbackOk: status.loopback_ok,
    }),
  setVu: (vu) => set({ vu }),
}));
