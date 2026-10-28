import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Users } from "lucide-react";
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
          description={`${events.length} event${events.length === 1 ? "" : "s"} stored locally`}
          control={<Switch checked={calendarOn} onCheckedChange={setCalendarOn} />}
        />
      </SettingsCard>

      <SettingsCard title="Import">
        <SettingRow
          icon={<CalendarPlus />}
          title="Import an .ics file"
          description="Export from Google Calendar or Outlook, then drop the file here."
          control={
            <Button
              variant="outline"
              size="sm"
              shape="square"
              loading={importIcs.isPending}
              onClick={() => importIcs.mutate()}
            >
              Choose file
            </Button>
          }
        />
      </SettingsCard>

      <p className="px-1 text-[13px] text-muted">
        Google and Outlook OAuth is not wired yet — import an .ics export to populate Coming up.
      </p>
    </>
  );
}
