import { useBoolSetting, useSetting } from "@/hooks/useSetting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingRow,
  SettingsCard,
  Switch,
} from "@/components/ui/controls";
import { Input } from "@/components/ui/input";
import { AccentLink, TabHeading } from "./shared";

const CHANNELS = [
  { value: "feed-email", label: "Activity Feed and Email" },
  { value: "feed", label: "Activity Feed" },
  { value: "email", label: "Email" },
  { value: "off", label: "Off" },
] as const;

export function NotificationsTab() {
  const [scheduled, setScheduled] = useBoolSetting("notify_meeting_start", true);
  const [autoDetected, setAutoDetected] = useBoolSetting("notify_auto_detected", true);
  const [notesReady, setNotesReady] = useBoolSetting("notify_notes_ready", true);
  const [quietApps, setQuietApps] = useSetting("notify_quiet_apps", "");
  const [addedToFolder, setAddedToFolder] = useSetting("notify_added_to_folder", "feed-email");
  const [noteAdded, setNoteAdded] = useSetting("notify_note_added_to_folder", "off");
  const [noteShared, setNoteShared] = useSetting("notify_note_shared", "feed-email");
  const [marketing, setMarketing] = useBoolSetting("notify_marketing", true);

  return (
    <>
      <TabHeading title="Notifications" />

      <SettingsCard title="Meeting notifications">
        <SettingRow
          title="Scheduled meetings"
          description="Show notifications 1 minute before meetings start."
          control={<Switch checked={scheduled} onCheckedChange={setScheduled} />}
        />
        <SettingRow
          title="Auto-detected meetings"
          description="Notify when Bagrry hears a call on this computer."
          control={<Switch checked={autoDetected} onCheckedChange={setAutoDetected} />}
        />
        <SettingRow
          title="Notes ready"
          description="Desktop notification when a transcript or enhancement finishes."
          control={<Switch checked={notesReady} onCheckedChange={setNotesReady} />}
        />
        {autoDetected && (
          <div className="px-4 pb-4">
            <div className="rounded-xl border border-border bg-bg/50 p-3">
              <p className="mb-2 text-[13px] text-muted">Don&apos;t notify me when a call is detected in these apps:</p>
              <Input placeholder="Select apps…" value={quietApps} onChange={(e) => setQuietApps(e.target.value)} />
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title="Sharing notifications"
        dashed
        action={
          <AccentLink
            onClick={() => {
              setAddedToFolder("feed-email");
              setNoteAdded("off");
              setNoteShared("feed-email");
            }}
          >
            Reset to default
          </AccentLink>
        }
      >
        <ChannelRow
          title="Added to folder"
          description="When someone adds you to a folder."
          value={addedToFolder}
          onChange={setAddedToFolder}
        />
        <ChannelRow
          title="Note added to folder"
          description="When a note is added to a folder you can see."
          value={noteAdded}
          onChange={setNoteAdded}
        />
        <ChannelRow
          title="Note shared with you"
          description="When someone shares a note directly with you."
          value={noteShared}
          onChange={setNoteShared}
        />
      </SettingsCard>

      <SettingsCard title="Marketing emails">
        <SettingRow
          title="Product updates and tips"
          description="Receive product updates and tips to get more out of Bagrry."
          control={<Switch checked={marketing} onCheckedChange={setMarketing} />}
        />
      </SettingsCard>
    </>
  );
}

function ChannelRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SettingRow
      title={title}
      description={description}
      control={
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[13.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHANNELS.map((channel) => (
              <SelectItem key={channel.value} value={channel.value}>
                {channel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}
