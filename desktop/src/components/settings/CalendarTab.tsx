import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import * as api from "@/lib/api";
import { useBoolSetting } from "@/hooks/useSetting";
import { SettingRow, SettingsCard, Switch } from "@/components/ui/controls";
import { AccentLink, TabHeading } from "./shared";
import { comingSoon } from "./helpers";

export function CalendarTab() {
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const [emptyEvents, setEmptyEvents] = useBoolSetting("calendar_show_empty_events", true);
  const [calendarOn, setCalendarOn] = useBoolSetting("calendar_primary_visible", true);
  const email = profile?.email || "No calendar connected";

  return (
    <>
      <TabHeading title="Calendar" />

      <SettingsCard title="Display">
        <SettingRow
          icon={<Users />}
          title="Show events with no participants"
          description="'Coming up' will include events without participants or a video link."
          control={<Switch checked={emptyEvents} onCheckedChange={setEmptyEvents} />}
        />
      </SettingsCard>

      <SettingsCard
        title="Visible calendars"
        action={<AccentLink onClick={() => comingSoon("Calendar reset")}>Reset</AccentLink>}
      >
        <SettingRow
          icon={<span className="size-3.5 rounded-sm bg-[#7ab8ff]" />}
          title={email}
          control={<Switch checked={calendarOn} onCheckedChange={setCalendarOn} />}
        />
      </SettingsCard>

      <p className="px-1 text-[13px] text-muted">
        Don&apos;t see the calendar you want?{" "}
        <AccentLink className="underline" onClick={() => comingSoon("More calendars")}>
          See how to connect other calendars.
        </AccentLink>
      </p>
    </>
  );
}
