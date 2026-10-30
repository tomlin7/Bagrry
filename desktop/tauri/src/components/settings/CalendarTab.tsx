import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Users, Link2, Sparkles } from "lucide-react";
import * as api from "@/lib/api";
import { pickTextFile } from "@/lib/open";
import { useBoolSetting } from "@/hooks/useSetting";
import { Button } from "@/components/ui/button";
import { SettingRow, SettingsCard, Switch } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { AccentLink, TabHeading } from "./shared";

export function CalendarTab() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: events = [] } = useQuery({ queryKey: api.qk.calendar(), queryFn: api.listCalendar });
  const [emptyEvents, setEmptyEvents] = useBoolSetting("calendar_show_empty_events", true);
  const [calendarOn, setCalendarOn] = useBoolSetting("calendar_primary_visible", true);
  const [subUrl, setSubUrl] = useState("");
  const email = profile?.email || "Local calendar";

  const importIcs = useMutation({
    mutationFn: async () => {
      const file = await pickTextFile(".ics,text/calendar");
      if (!file) return 0;
      return api.importIcs(file.text);
    },
    onSuccess: (count) => {
      if (count === 0) {
        toast.info("No events found in that file");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: api.qk.calendar() });
      toast.success(`Imported ${count} event${count === 1 ? "" : "s"}`);
    },
    onError: (e) => toast.error(e),
  });

  const syncUrlMutation = useMutation({
    mutationFn: async (urlToFetch: string) => {
      let url = urlToFetch.trim();
      if (!url) throw new Error("Enter a valid calendar URL");
      if (url.startsWith("webcal://")) {
        url = "https://" + url.slice(9);
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} when fetching calendar feed`);
      const text = await res.text();
      return api.importIcs(text);
    },
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.calendar() });
      toast.success(`Synced ${count} event${count === 1 ? "" : "s"} from subscription feed`);
      setSubUrl("");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to sync calendar feed"),
  });

  const seedSampleEvents = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const inFiveMin = new Date(now.getTime() + 5 * 60_000).toISOString().slice(0, 19).replace("T", " ");
      const inOneHour = new Date(now.getTime() + 65 * 60_000).toISOString().slice(0, 19).replace("T", " ");

      await api.upsertCalendarEvent(
        "Sprint Roadmap & Architecture Sync https://meet.google.com/xyz-abcd-qrs",
        inFiveMin,
        JSON.stringify([
          { name: "Alex Chen", email: "alex@northwind.example" },
          { name: "Sarah Lin", email: "sarah@company.example" },
        ]),
      );

      await api.upsertCalendarEvent(
        "Quarterly Business Review (Zoom) https://northwind.zoom.us/j/987654321",
        inOneHour,
        JSON.stringify([
          { name: "David Kim", email: "david@acme.example" },
        ]),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.calendar() });
      toast.success("Seeded demo calendar events with Zoom & Meet links");
    },
    onError: (e) => toast.error(e),
  });

  const reset = useMutation({
    mutationFn: api.resetCalendar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.calendar() });
      toast.success("Calendar cleared");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Calendar" />

      <SettingsCard title="Display">
        <SettingRow
          icon={<Users />}
          title="Show events with no participants"
          description="'Coming up' will include events without participants."
          control={<Switch checked={emptyEvents} onCheckedChange={setEmptyEvents} />}
        />
      </SettingsCard>

      <SettingsCard
        title="Visible calendars"
        action={
          <AccentLink onClick={() => events.length > 0 && reset.mutate()}>
            {reset.isPending ? "Resetting…" : "Reset"}
          </AccentLink>
        }
      >
        <SettingRow
          icon={<span className="size-3.5 rounded-sm bg-[#7ab8ff]" />}
          title={email}
          description={`${events.length} event${events.length === 1 ? "" : "s"} stored locally in SQLite`}
          control={<Switch checked={calendarOn} onCheckedChange={setCalendarOn} />}
        />
      </SettingsCard>

      <SettingsCard title="Sync Google / Outlook / ICS">
        <SettingRow
          icon={<CalendarPlus />}
          title="Import an .ics file"
          description="Export from Google Calendar or Microsoft 365, then drop the file here."
          control={
            <Button
              variant="outline"
              size="sm"
              shape="square"
              loading={importIcs.isPending}
              onClick={() => importIcs.mutate()}
              className="cursor-pointer"
            >
              Choose file
            </Button>
          }
        />

        <SettingRow
          icon={<Link2 />}
          title="Calendar Subscription URL"
          description="Sync read-only webcal or secret .ics link from Google Calendar or Outlook."
          control={
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                className="h-8 w-64 rounded-lg border border-border bg-surface-2 px-2.5 text-xs text-text outline-none focus:border-accent"
              />
              <Button
                variant="solid"
                size="sm"
                loading={syncUrlMutation.isPending}
                disabled={!subUrl.trim()}
                onClick={() => syncUrlMutation.mutate(subUrl)}
                className="cursor-pointer"
              >
                Sync URL
              </Button>
            </div>
          }
        />

        <SettingRow
          icon={<Sparkles className="text-accent" />}
          title="Seed Demo Calendar Events"
          description="Populate Coming Up with Google Meet and Zoom scheduled events for instant testing."
          control={
            <Button
              variant="outline"
              size="sm"
              loading={seedSampleEvents.isPending}
              onClick={() => seedSampleEvents.mutate()}
              className="cursor-pointer"
            >
              Seed Events
            </Button>
          }
        />
      </SettingsCard>

      <p className="px-1 text-[13px] text-muted">
        Bagrry monitors upcoming calendar events locally and fires unobtrusive desktop join prompts 1 minute before scheduled start.
      </p>
    </>
  );
}
