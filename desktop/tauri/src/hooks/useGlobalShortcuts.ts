import { useEffect } from "react";
import { useAppStore } from "@/store/app";
import { useAudioPlayerStore } from "@/store/audio";
import * as api from "@/lib/api";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/** Window-level shortcuts. Anything recording-related is registered in Rust instead. */
export function useGlobalShortcuts() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.ctrlKey || event.metaKey;
      const store = useAppStore.getState();
      const audioStore = useAudioPlayerStore.getState();

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        store.setPaletteOpen(!store.paletteOpen);
        return;
      }

      if (mod && event.key === "\\") {
        event.preventDefault();
        store.toggleSidebar();
        return;
      }

      if (mod && event.key === ",") {
        event.preventDefault();
        store.openSettings();
        return;
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        if (store.recState === "recording" || store.recState === "paused") {
          void api.stopRecording().then((status) => store.applyRecStatus(status));
        } else {
          void api.startRecording(store.recordingMeetingId ?? null).then((status) => store.applyRecStatus(status));
        }
        return;
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (store.recState !== "idle") {
          void api.pauseRecording().then((status) => store.applyRecStatus(status));
        }
        return;
      }

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        store.back();
        return;
      }

      // Audio Playback shortcuts when not typing
      if (!isTypingTarget(event.target) && !store.paletteOpen) {
        if (audioStore.isVisible || audioStore.isPlaying) {
          if (event.key.toLowerCase() === "j" && !mod) {
            event.preventDefault();
            audioStore.skip(-5000);
            return;
          }
          if (event.key.toLowerCase() === "l" && !mod) {
            event.preventDefault();
            audioStore.skip(5000);
            return;
          }
          if (event.key.toLowerCase() === "k" && !mod) {
            event.preventDefault();
            audioStore.togglePlay();
            return;
          }
          if ((event.key === "[" || event.key === "]") && !mod) {
            event.preventDefault();
            audioStore.cyclePlaybackRate();
            return;
          }
        }
      }

      // Escape leaves a note/settings view, but only when nothing is being typed.
      if (event.key === "Escape" && !isTypingTarget(event.target) && !store.paletteOpen) {
        if (store.route.kind === "note" || store.route.kind === "settings") {
          event.preventDefault();
          store.back();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
