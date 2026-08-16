import { Eye, Link2, LogIn, Mail, Moon, Radio, ShieldCheck, Tags, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ThemePreference } from "@/lib/theme";
import { useAppStore } from "@/store/app";
import { useBoolSetting, useSetting } from "@/hooks/useSetting";
import * as api from "@/lib/api";
import { Textarea } from "@/components/ui/input";
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
import { toast } from "@/components/ui/toast";
import { AccentLink, TabHeading } from "./shared";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function PreferencesTab() {
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const navigate = useAppStore((s) => s.navigate);
  const [, persistTheme] = useSetting("theme", "system");
  const queryClient = useQueryClient();

  const [indicator, setIndicator] = useBoolSetting("live_indicator", true);
  const [reposition, setReposition] = useBoolSetting("reposition_for_meetings", true);
  const [speakerTags, setSpeakerTags] = useBoolSetting("speaker_tags", true);
  const [followUpEmails, setFollowUpEmails] = useBoolSetting("suggested_follow_up_emails", false);
  const [linkSharing, setLinkSharing] = useSetting("default_link_sharing", "link");
  const [improveModels, setImproveModels] = useBoolSetting("improve_models", true);
  const [retention, setRetention] = useSetting("transcript_retention", "off");
  const [transcriptionLang, setTranscriptionLang] = useSetting("transcription_language", "en-best");
  const [summaryLang, setSummaryLang] = useSetting("summary_language", "en");
  const [jargon, setJargon] = useSetting("internal_jargon", "");

  const { data: autostart = false } = useQuery({
    queryKey: api.qk.autostart(),
    queryFn: api.getLaunchOnLogin,
  });

  const toggleAutostart = useMutation({
    mutationFn: (enable: boolean) => api.setLaunchOnLogin(enable),
    onSuccess: (enabled) => {
      queryClient.setQueryData(api.qk.autostart(), enabled);
      toast.success(enabled ? "Bagrry will open at login" : "Login launch turned off");
    },
    onError: (e) => toast.error(e, "Could not change login launch."),
  });

  const applyRetention = useMutation({
    mutationFn: (value: string) => api.setSetting("transcript_retention", value).then(() => api.applyRetention()),
    onSuccess: (deleted) => {
      toast.success(
        deleted > 0 ? `Deleted ${deleted} old transcript${deleted === 1 ? "" : "s"}` : "Retention updated",
      );
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Preferences" />

      <SettingsCard title="General">
        <SettingRow
          icon={<Radio />}
          title="Live meeting indicator"
          description="Shows on the right of your screen while transcribing."
          control={<Switch checked={indicator} onCheckedChange={setIndicator} />}
        />
        <SettingRow
          icon={<LogIn />}
          title="Open Bagrry when you log in"
          description="Bagrry will start automatically with your computer."
          control={
            <Switch
              checked={autostart}
              disabled={toggleAutostart.isPending}
              onCheckedChange={(v) => toggleAutostart.mutate(v)}
            />
          }
        />
        <SettingRow
          icon={<Eye />}
          title="Reposition Bagrry for meetings"
          description="Bagrry will move aside during a meeting, then restore afterwards."
          control={<Switch checked={reposition} onCheckedChange={setReposition} />}
        />
      </SettingsCard>

      <SettingsCard title="Features">
        <SettingRow
          icon={<Tags />}
          title="Speaker tags"
          description="Label who is speaking (you vs attendees) in the transcript."
          control={<Switch checked={speakerTags} onCheckedChange={setSpeakerTags} />}
        />
        <SettingRow
          icon={<Mail />}
          title="Suggested follow-up emails"
          description="After enhancing a meeting, offer a draft recap email you can copy."
          control={<Switch checked={followUpEmails} onCheckedChange={setFollowUpEmails} />}
        />
      </SettingsCard>

      <SettingsCard title="Appearance">
        <SettingRow
          icon={<Moon />}
          title="Theme"
          description="Choose your interface colour scheme."
          control={
            <Select
              value={themePreference}
              onValueChange={(value) => {
                const next = value as ThemePreference;
                setThemePreference(next);
                persistTheme(next);
              }}
            >
              <SelectTrigger className="w-[9.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingsCard>

      <SettingsCard title="Data & sharing">
        <SettingRow
          icon={<Link2 />}
          title="Default link sharing"
          description="Used when you share a note. Private links never serve content."
          control={
            <Select value={linkSharing} onValueChange={setLinkSharing}>
              <SelectTrigger className="w-[11.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Only me</SelectItem>
                <SelectItem value="workspace">Anyone in workspace</SelectItem>
                <SelectItem value="link">Anyone with the link</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          icon={<ShieldCheck />}
          title="Use my data to improve models for everyone"
          description={
            <>
              When on, your name, role and company description are included in AI prompts.{" "}
              <AccentLink onClick={() => navigate({ kind: "settings", tab: "help" }, { replace: true })}>
                Learn more
              </AccentLink>
            </>
          }
          control={<Switch checked={improveModels} onCheckedChange={setImproveModels} />}
        />
        <SettingRow
          icon={<Trash2 />}
          title="Auto deletion period for transcripts"
          description="Transcripts older than this are deleted on launch and when you change the setting."
          control={
            <Select
              value={retention}
              onValueChange={(value) => {
                setRetention(value);
                applyRetention.mutate(value);
              }}
            >
              <SelectTrigger className="w-[8rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </SettingsCard>

      <SettingsCard title="Language" dashed>
        <SettingRow
          title="Transcription language"
          description="Passed to Whisper when turning audio into text."
          control={
            <Select value={transcriptionLang} onValueChange={setTranscriptionLang}>
              <SelectTrigger className="w-[13.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-best">English (best quality)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="auto">Detect automatically</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          title="Summary language"
          description="Language for enhanced notes and chat."
          control={
            <Select value={summaryLang} onValueChange={setSummaryLang}>
              <SelectTrigger className="w-[10rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="match">Match transcription</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </SettingsCard>

      <SettingsCard title="Internal jargon">
        <div className="p-4">
          <p className="mb-2 text-xs text-muted">
            Words and acronyms Whisper should recognise, and that summaries should keep as-is.
          </p>
          <Textarea
            rows={3}
            value={jargon}
            onChange={(e) => setJargon(e.target.value)}
            placeholder="OKRs, ARR, Northwind…"
          />
        </div>
      </SettingsCard>
    </>
  );
}
