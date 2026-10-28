/**
 * SQLite stores timestamps as `YYYY-MM-DD HH:MM:SS` in UTC (via `datetime('now')`).
 * JS parses that string as *local* time, which silently shifts every date by the
 * user's offset, so every read goes through here.
 */
export function parseDbDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const monthName = new Intl.DateTimeFormat(undefined, { month: "long" });
const dayMonth = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const dayMonthYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatTime(value: string | Date | null | undefined): string {
  const d = value instanceof Date ? value : parseDbDate(value);
  if (!d) return "";
  return time.format(d).toLowerCase();
}

export function formatWeekday(d: Date): string {
  return weekday.format(d);
}

export function formatMonth(d: Date): string {
  return monthName.format(d);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dayOffset(value: string | Date | null | undefined): number | null {
  const d = value instanceof Date ? value : parseDbDate(value);
  if (!d) return null;
  return Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
}

/** "Today" / "Yesterday" / "Mar 4" / "Mar 4, 2024" — the note-list grouping label. */
export function formatDayLabel(value: string | Date | null | undefined): string {
  const d = value instanceof Date ? value : parseDbDate(value);
  if (!d) return "Undated";
  const offset = dayOffset(d);
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  if (offset !== null && offset > -7 && offset < 0) return weekday.format(d);
  return d.getFullYear() === new Date().getFullYear() ? dayMonth.format(d) : dayMonthYear.format(d);
}

/** Compact "now / 4m / 3h / 2d" used in sidebar and list rows. */
export function formatRelative(value: string | Date | null | undefined): string {
  const d = value instanceof Date ? value : parseDbDate(value);
  if (!d) return "";
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 45) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return dayMonth.format(d);
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Elapsed clock for the live recorder ("04:31"). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Strips markdown/HTML noise so a note body can be used as a one-line preview. */
export function previewText(raw: string | null | undefined, max = 120): string {
  if (!raw) return "";
  const text = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_`#>-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
