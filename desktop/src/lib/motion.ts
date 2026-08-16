/** Shared timing for chrome motion. Keep these short — premium, not theatrical. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Even travel so a short slide is visible instead of snapping away. */
export const EASE_SLIDE = [0.4, 0, 0.2, 1] as const;

export const duration = {
  fast: 0.12,
  base: 0.16,
  layout: 0.2,
  sidebar: 0.18,
} as const;

export const snappy = { duration: duration.base, ease: EASE_OUT };
export const layoutTween = { duration: duration.layout, ease: EASE_OUT };
export const sidebarTween = { duration: duration.sidebar, ease: EASE_SLIDE };

/** Matches `Sidebar` inner width so the rail can clip instead of squash. */
export const SIDEBAR_WIDTH = 208;
