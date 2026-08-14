export function formatWhen(value: string) {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(value: string) {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;
  const today = new Date();
  if (parsed.toDateString() === today.toDateString()) return "Today";
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (parsed.toDateString() === y.toDateString()) return "Yesterday";
  return parsed.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
