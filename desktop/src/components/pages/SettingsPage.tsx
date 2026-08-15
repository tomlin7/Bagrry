import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Blocks,
  Building2,
  CalendarDays,
  CircleHelp,
  CreditCard,
  Database,
  Eye,
  KeyRound,
  Link2,
  LogIn,
  Moon,
  Palette,
  Plus,
  Radio,
  ShieldCheck,
  Tags,
  Trash2,
  User,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import * as api from "@/lib/api";
import type { SettingsTab } from "@/lib/types";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { useBoolSetting, useSetting } from "@/hooks/useSetting";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type NavEntry = { tab: SettingsTab; label: string; icon: LucideIcon };

const PERSONAL_NAV: NavEntry[] = [
  { tab: "preferences", label: "Preferences", icon: Palette },
  { tab: "profile", label: "Profile", icon: User },
  { tab: "calendar", label: "Calendar", icon: CalendarDays },
  { tab: "notifications", label: "Notifications", icon: Bell },
  { tab: "connectors", label: "Connectors", icon: Blocks },
  { tab: "help", label: "Get help", icon: CircleHelp },
];

const WORKSPACE_NAV: NavEntry[] = [
  { tab: "workspace-general", label: "General", icon: Building2 },
  { tab: "members", label: "Members", icon: Users },
  { tab: "spaces", label: "Spaces", icon: Blocks },
  { tab: "analytics", label: "Analytics", icon: BarChart3 },
  { tab: "billing", label: "Billing", icon: CreditCard },
];

export function SettingsPage({ tab }: { tab: SettingsTab }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });

  return (
    <div className="flex h-full min-h-0">
      <nav className="flex w-[212px] shrink-0 flex-col border-r border-border bg-sidebar p-2">
        <div className="mb-3 flex items-center gap-2 px-1.5 pt-1">
          <Avatar name={profile?.name || "You"} size={30} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-text">{profile?.name || "You"}</div>
            <div className="truncate text-[11px] text-subtle">{profile?.email || "No email set"}</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
          {PERSONAL_NAV.map((entry) => (
            <NavButton key={entry.tab} entry={entry} active={tab === entry.tab} onClick={navigate} />
          ))}

          <div className="mt-4 px-2 pb-1 text-[11px] font-semibold text-subtle">Workspace</div>
          {WORKSPACE_NAV.map((entry) => (
            <NavButton key={entry.tab} entry={entry} active={tab === entry.tab} onClick={navigate} />
          ))}
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[620px] px-8 pb-16 pt-6">
          {tab === "preferences" && <PreferencesTab />}
          {tab === "profile" && <ProfileTab />}
          {tab === "calendar" && <CalendarTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "connectors" && <ConnectorsTab />}
          {tab === "help" && <HelpTab />}
          {tab === "workspace-general" && <WorkspaceGeneralTab />}
          {tab === "members" && <MembersTab />}
          {tab === "spaces" && <SpacesTab />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "billing" && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

function NavButton({
  entry,
  active,
  onClick,
}: {
  entry: NavEntry;
  active: boolean;
  onClick: (route: { kind: "settings"; tab: SettingsTab }) => void;
}) {
  const Icon = entry.icon;
  return (
    <button
      type="button"
      onClick={() => onClick({ kind: "settings", tab: entry.tab })}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] transition-colors",
        active ? "bg-selected font-medium text-text" : "text-muted hover:bg-hover hover:text-text",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {entry.label}
    </button>
  );
}

function TabHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-5">
      <h1 className="font-display text-[24px] font-semibold text-text">{title}</h1>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function PreferencesTab() {
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const [, persistTheme] = useSetting("theme", "system");

  const [indicator, setIndicator] = useBoolSetting("live_indicator", true);
  const [launchOnLogin, setLaunchOnLogin] = useBoolSetting("launch_on_login", false);
  const [reposition, setReposition] = useBoolSetting("reposition_for_meetings", false);
  const [speakerTags, setSpeakerTags] = useBoolSetting("speaker_tags", false);
  const [linkSharing, setLinkSharing] = useSetting("default_link_sharing", "workspace");
  const [improveModels, setImproveModels] = useBoolSetting("improve_models", false);
  const [retention, setRetention] = useSetting("transcript_retention", "off");

  return (
    <>
      <TabHeading title="Preferences" />

      <SettingsCard title="General">
        <SettingRow
          icon={<Radio />}
          title="Live meeting indicator"
          description="Shows on the edge of your screen while transcribing."
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
          description="Move the window aside during a meeting, then restore it afterwards."
          control={<Switch checked={reposition} onCheckedChange={setReposition} />}
        />
      </SettingsCard>

      <SettingsCard title="Features">
        <SettingRow
          icon={<Tags />}
          title="Speaker tags"
          description="Identify who is speaking in your calls."
          control={<Switch checked={speakerTags} onCheckedChange={setSpeakerTags} />}
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
          description="Who can open a note you share by link."
          control={
            <Select value={linkSharing} onValueChange={setLinkSharing}>
              <SelectTrigger className="w-[11rem]">
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
          title="Use my data to improve models"
          description="Anonymised transcripts help improve summary quality."
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
    </>
  );
}

/* ------------------------------------------------------------------ */

function ProfileTab() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.setProfile(
        name ?? profile?.name ?? "",
        email ?? profile?.email ?? "",
        profile?.workspace ?? "",
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.profile() });
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Profile" description="How you appear on shared notes." />

      <div className="mb-5 flex items-center gap-3">
        <Avatar name={profile?.name || "You"} size={52} />
        <div className="text-xs text-subtle">
          Avatars are generated from your name.
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Display name">
          <Input
            value={name ?? profile?.name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email ?? profile?.email ?? ""}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>
        <Button variant="solid" size="md" loading={save.isPending} onClick={() => save.mutate()}>
          Save changes
        </Button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-text">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */

function CalendarTab() {
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery({ queryKey: api.qk.calendar(), queryFn: api.listCalendar });
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");

  const add = useMutation({
    mutationFn: () => api.upsertCalendarEvent(title.trim(), startAt.replace("T", " ") + ":00"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.calendar() });
      setTitle("");
      setStartAt("");
      toast.success("Event added");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading
        title="Calendar"
        description="Bagrry shows these events on Home so you can start a note in one click."
      />

      <SettingsCard title="Add an event">
        <div className="space-y-3 p-4">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Button
            variant="solid"
            size="md"
            disabled={!title.trim() || !startAt}
            loading={add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus />
            Add event
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Upcoming">
        {events.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title="No events yet" />
        ) : (
          events.map((event) => (
            <SettingRow key={event.id} title={event.title} description={event.start_at} />
          ))
        )}
      </SettingsCard>
    </>
  );
}

/* ------------------------------------------------------------------ */

function NotificationsTab() {
  const [meetingStart, setMeetingStart] = useBoolSetting("notify_meeting_start", true);
  const [summaryReady, setSummaryReady] = useBoolSetting("notify_summary_ready", true);
  const [weeklyDigest, setWeeklyDigest] = useBoolSetting("notify_weekly_digest", false);

  return (
    <>
      <TabHeading title="Notifications" />
      <SettingsCard>
        <SettingRow
          icon={<Bell />}
          title="Meeting is starting"
          description="Nudge me a minute before a calendar event begins."
          control={<Switch checked={meetingStart} onCheckedChange={setMeetingStart} />}
        />
        <SettingRow
          icon={<Bell />}
          title="Summary is ready"
          description="Tell me when enhanced notes finish generating."
          control={<Switch checked={summaryReady} onCheckedChange={setSummaryReady} />}
        />
        <SettingRow
          icon={<Bell />}
          title="Weekly digest"
          description="A recap of everything captured this week."
          control={<Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />}
        />
      </SettingsCard>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ConnectorsTab() {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({ queryKey: api.qk.dbStatus(), queryFn: api.dbStatus });
  const [groqKey, setGroqKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useSetting("webhook_url", "");

  const saveKey = useMutation({
    mutationFn: () => api.setSecret("groq_api_key", groqKey.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.dbStatus() });
      setGroqKey("");
      toast.success("Groq API key saved");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading
        title="Connectors"
        description="Transcription and summaries run through Groq. Keys are stored in your OS keychain."
      />

      <SettingsCard title="Groq">
        <SettingRow
          icon={<KeyRound />}
          title="API key"
          description={
            status?.groq_configured ? "A key is configured." : "No key yet — AI features are disabled."
          }
          control={
            status?.groq_configured ? <Badge tone="success">Connected</Badge> : <Badge>Not set</Badge>
          }
        />
        <div className="flex gap-2 p-4">
          <Input
            type="password"
            placeholder="gsk_..."
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
          />
          <Button
            variant="solid"
            size="md"
            disabled={!groqKey.trim()}
            loading={saveKey.isPending}
            onClick={() => saveKey.mutate()}
          >
            Save
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Webhook">
        <SettingRow
          icon={<Webhook />}
          title="Outgoing webhook URL"
          description="Bagrry posts completed notes here when you choose Send to webhook."
        />
        <div className="p-4">
          <Input
            placeholder="https://hooks.example.com/bagrry"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Local database">
        <SettingRow
          icon={<Database />}
          title="SQLite file"
          description={status?.path ?? "Loading…"}
        />
        <SettingRow
          icon={<Database />}
          title="Notes stored"
          description={`${status?.meeting_count ?? 0} notes · SQLite ${status?.sqlite_version ?? "?"}`}
        />
        <SettingRow
          icon={<Link2 />}
          title="Local API port"
          description={`Share links and integrations are served on port ${status?.api_port ?? "—"}.`}
        />
      </SettingsCard>
    </>
  );
}

/* ------------------------------------------------------------------ */

function HelpTab() {
  const { data: status } = useQuery({ queryKey: api.qk.dbStatus(), queryFn: api.dbStatus });
  return (
    <>
      <TabHeading title="Get help" />
      <SettingsCard title="Keyboard shortcuts">
        <SettingRow title="Command palette" control={<Badge>Ctrl K</Badge>} />
        <SettingRow title="Toggle sidebar" control={<Badge>Ctrl \</Badge>} />
        <SettingRow title="Settings" control={<Badge>Ctrl ,</Badge>} />
        <SettingRow title="Start / stop recording" control={<Badge>Ctrl Shift R</Badge>} />
        <SettingRow title="Pause recording" control={<Badge>Ctrl Shift P</Badge>} />
        <SettingRow title="Back" control={<Badge>Alt ←</Badge>} />
      </SettingsCard>
      <SettingsCard title="Diagnostics">
        <SettingRow title="Database" description={status?.path ?? "—"} />
        <SettingRow
          title="Vector search"
          description={status?.vec_enabled ? "sqlite-vec enabled" : "Hash embeddings (sqlite-vec off)"}
        />
      </SettingsCard>
    </>
  );
}

/* ------------------------------------------------------------------ */

function WorkspaceGeneralTab() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const [workspace, setWorkspace] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.setProfile(profile?.name ?? "", profile?.email ?? "", (workspace ?? "").trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.profile() });
      toast.success("Workspace renamed");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="General" description="Workspace-wide settings." />
      <div className="space-y-4">
        <Field label="Workspace name">
          <Input
            value={workspace ?? profile?.workspace ?? ""}
            onChange={(e) => setWorkspace(e.target.value)}
          />
        </Field>
        <Button
          variant="solid"
          size="md"
          disabled={workspace === null || !workspace.trim()}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Save changes
        </Button>
      </div>
    </>
  );
}

function MembersTab() {
  const queryClient = useQueryClient();
  const { data: people = [] } = useQuery({ queryKey: api.qk.people(), queryFn: api.listPeople });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const add = useMutation({
    mutationFn: () => api.upsertPerson(name.trim(), email.trim() || null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
      setName("");
      setEmail("");
      toast.success("Person added");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Members" description="People who show up as attendees on your notes." />

      <SettingsCard title="Add someone">
        <div className="space-y-3 p-4">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            type="email"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            variant="solid"
            size="md"
            disabled={!name.trim()}
            loading={add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus />
            Add person
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title={`${people.length} people`}>
        {people.length === 0 ? (
          <EmptyState icon={<Users />} title="No one added yet" />
        ) : (
          people.map((person) => (
            <SettingRow
              key={person.id}
              icon={<Avatar name={person.name} size={26} />}
              title={person.name}
              description={person.email ?? person.domain ?? undefined}
            />
          ))
        )}
      </SettingsCard>
    </>
  );
}

function SpacesTab() {
  const { data: folders = [] } = useQuery({ queryKey: api.qk.folders(), queryFn: api.listFolders });
  const { data: templates = [] } = useQuery({ queryKey: api.qk.templates(), queryFn: api.listTemplates });
  const { data: recipes = [] } = useQuery({ queryKey: api.qk.recipes(), queryFn: api.listRecipes });

  return (
    <>
      <TabHeading title="Spaces" description="Folders, templates and recipes in this workspace." />

      <SettingsCard title="Folders">
        {folders.map((folder) => (
          <SettingRow
            key={folder.id}
            title={folder.name}
            description={folder.is_shared ? "Shared with the workspace" : "Private"}
            control={folder.is_shared ? <Badge tone="accent">Shared</Badge> : <Badge>Private</Badge>}
          />
        ))}
      </SettingsCard>

      <SettingsCard title="Templates">
        {templates.map((template) => (
          <SettingRow key={template.id} title={template.name} description={template.prompt_template} />
        ))}
      </SettingsCard>

      <SettingsCard title="Recipes">
        {recipes.map((recipe) => (
          <SettingRow key={recipe.id} title={recipe.name} description={recipe.prompt_template} />
        ))}
      </SettingsCard>
    </>
  );
}

function AnalyticsTab() {
  const { data: notes = [] } = useQuery({
    queryKey: api.qk.meetings(),
    queryFn: () => api.listMeetings(),
  });
  const { data: actions = [] } = useQuery({
    queryKey: api.qk.actionItems(),
    queryFn: api.listActionItems,
  });

  const enhanced = notes.filter((n) => n.enhanced_notes_json).length;
  const totalMs = notes.reduce((sum, n) => sum + (n.duration_ms ?? 0), 0);

  return (
    <>
      <TabHeading title="Analytics" />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Notes captured" value={notes.length} />
        <Stat label="Notes enhanced" value={enhanced} />
        <Stat label="Open action items" value={actions.length} />
        <Stat label="Hours recorded" value={(totalMs / 3_600_000).toFixed(1)} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-display text-[26px] font-semibold text-text">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function BillingTab() {
  return (
    <>
      <TabHeading title="Billing" />
      <SettingsCard>
        <SettingRow
          icon={<CreditCard />}
          title="Plan"
          description="Bagrry runs entirely on your machine. Bring your own Groq key."
          control={<Badge tone="accent">Local</Badge>}
        />
      </SettingsCard>
    </>
  );
}
