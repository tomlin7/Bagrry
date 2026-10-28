import { useEffect } from "react";
import { useAppStore } from "@/store/app";

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

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        store.back();
        return;
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
