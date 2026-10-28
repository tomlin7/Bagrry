export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "bagrry.theme";

/**
 * The preference is mirrored into localStorage as well as the SQLite settings
 * table. localStorage is what the pre-hydration script in index.html reads, so
 * the correct theme paints on the very first frame instead of flashing.
 */
export function readStoredPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

export function writeStoredPreference(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* storage unavailable */
  }
}

export function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

let transitionTimer: ReturnType<typeof setTimeout> | undefined;

export function applyTheme(theme: ResolvedTheme, animate = true) {
  const root = document.documentElement;
  if (root.classList.contains("dark") === (theme === "dark")) return;

  if (animate) {
    root.classList.add("theme-transition");
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove("theme-transition"), 220);
  }
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Calls back whenever the OS colour scheme flips. Returns an unsubscribe fn. */
export function watchSystemTheme(onChange: (theme: ResolvedTheme) => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => onChange(e.matches ? "dark" : "light");
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
