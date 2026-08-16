import { Eye, Link2, LogIn, Mail, Moon, Radio, ShieldCheck, Tags, Trash2 } from "lucide-react";
import type { ThemePreference } from "@/lib/theme";
import { useAppStore } from "@/store/app";
import { useBoolSetting, useSetting } from "@/hooks/useSetting";
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
import { AccentLink, ChevronValue, TabHeading } from "./shared";
import { comingSoon } from "./helpers";

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

  const [indicator, setIndicator] = useBoolSetting("live_indicator", true);
  const [launchOnLogin, setLaunchOnLogin] = useBoolSetting("launch_on_login", true);
  const [reposition, setReposition] = useBoolSetting("reposition_for_meetings", true);
  const [speakerTags] = useBoolSetting("speaker_tags", false);
  const [followUpEmails, setFollowUpEmails] = useBoolSetting("suggested_follow_up_emails", false);
  const [linkSharing, setLinkSharing] = useSetting("default_link_sharing", "link");
  const [improveModels, setImproveModels] = useBoolSetting("improve_models", true);
  const [retention, setRetention] = useSetting("transcript_retention", "off");
  const [transcriptionLang, setTranscriptionLang] = useSetting("transcription_language", "en-best");
  const [summaryLang, setSummaryLang] = useSetting("summary_language", "en");
  const [jargon, setJargon] = useSetting("internal_jargon", "");

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
          control={<Switch checked={launchOnLogin} onCheckedChange={setLaunchOnLogin} />}
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
          description="Identify who is speaking in your calls."
          control={<ChevronValue>{speakerTags ? "On" : "Off"}</ChevronValue>}
          onClick={() => comingSoon("Speaker tags")}
        />
        <SettingRow
          icon={<Mail />}
          title="Suggested follow-up emails"
          description="Get email drafts that sound like you after a meeting is enhanced."
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
          description="By default, your notes are viewable by anyone with the link."
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
              Anonymised transcripts help improve summary quality.{" "}
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
          description="Transcripts are deleted automatically after this period."
          control={
            <Select value={retention} onValueChange={setRetention}>
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
          description="Used when turning audio into text."
          control={
            <Select value={transcriptionLang} onValueChange={setTranscriptionLang}>
              <SelectTrigger className="w-[13.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-best">English (best quality)</SelectItem>
                <SelectItem value="en">English</SelectItem>
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
                <SelectItem value="match">Match transcription</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </SettingsCard>

      <SettingsCard title="Internal jargon">
        <div className="p-4">
          <p className="mb-2 text-xs text-muted">Words and acronyms Bagrry should recognise in your meetings.</p>
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
