import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Window } from "@tauri-apps/api/window";

/**
 * True when the frontend is hosted by the Tauri webview. Running `vite dev` in
 * a normal browser is a supported way to iterate on layout, so anything that
 * touches the native window has to degrade instead of throwing.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function currentWindow(): Window | null {
  if (!isTauri()) return null;
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}
