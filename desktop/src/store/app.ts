import { create } from "zustand";

type AppState = {
  selectedMeetingId: string | null;
  selectMeeting: (id: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedMeetingId: null,
  selectMeeting: (id) => set({ selectedMeetingId: id }),
}));
