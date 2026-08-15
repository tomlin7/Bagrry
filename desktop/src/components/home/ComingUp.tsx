import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarClock, Settings2 } from "lucide-react";
import * as api from "@/lib/api";
import { dayOffset, formatMonth, formatTime, formatWeekday, parseDbDate } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { Avatar, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app";
import { useCreateNote } from "@/hooks/useCreateNote";

function attendeeNames(event: CalendarEvent): string[] {
  if (!event.attendees_json) return [];
  try {
    const parsed = JSON.parse(event.attendees_json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((a) => (typeof a === "string" ? a : (a?.name ?? a?.email ?? "")))
      .filter((v): v is string => Boolean(v));
  } catch {
    return [];
  }
}

/** The dated calendar card at the top of Home. */
export function ComingUp() {
  const openSettings = useAppStore((s) => s.openSettings);
  const createNote = useCreateNote();

  const { data: events = [], isLoading } = useQuery({
    queryKey: api.qk.calendar(),
    queryFn: api.listCalendar,
  });

  const today = new Date();
  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .map((event) => ({ event, start: parseDbDate(event.start_at) }))
      .filter(
        (item): item is { event: CalendarEvent; start: Date } =>
          item.start !== null && item.start.getTime() >= now - 30 * 60_000,
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <section>
      <h1 className="font-display mb-3 animate-slide-up text-[26px] font-semibold text-text">Coming up</h1>

      <div className="hover-lift flex animate-slide-up overflow-hidden rounded-xl border border-border bg-surface">
        <div className="w-[150px] shrink-0 border-r border-border p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[26px] font-semibold leading-none text-text">
              {today.getDate()}
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-text">
                {formatMonth(today)}
                <span className="size-1 rounded-full bg-danger" />
              </div>
              <div className="text-[11px] text-subtle">{formatWeekday(today)}</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 p-3">
          {isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-2/3 rounded-lg" />
            </div>
          ) : upcoming.length > 0 ? (
            <div className="space-y-1">
              {upcoming.map(({ event, start }, i) => {
                const names = attendeeNames(event);
                const offset = dayOffset(start);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.14, delay: Math.min(i * 0.04, 0.16) }}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-hover"
                  >
                    <Avatar name={names[0] ?? event.title} size={30} className="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-text">{event.title}</div>
                      <div className="truncate text-xs text-subtle">
                        {formatTime(start)}
                        {offset === 1 && " · Tomorrow"}
                        {names.length > 0 && ` · ${names.join(", ")}`}
                      </div>
                    </div>
                    <Button
                      variant="solid"
                      size="sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => createNote.mutate({ title: event.title, record: true })}
                    >
                      Start now
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-9 text-center">
              <CalendarClock className="size-5 text-subtle" />
              <p className="text-[13px] text-muted">No upcoming events</p>
              <p className="text-xs text-subtle">Check your visible calendars</p>
              <Button
                variant="solid"
                size="sm"
                className="mt-2"
                onClick={() => openSettings("calendar")}
              >
                <Settings2 />
                Calendar settings
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
