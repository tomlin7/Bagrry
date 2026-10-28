import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import * as api from "@/lib/api";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { TabHeading } from "./shared";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-text">{label}</span>
      {children}
    </label>
  );
}

export function WorkspaceGeneralTab() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const [workspace, setWorkspace] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => api.setProfile(profile?.name ?? "", profile?.email ?? "", (workspace ?? "").trim()),
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
          <Input value={workspace ?? profile?.workspace ?? ""} onChange={(e) => setWorkspace(e.target.value)} />
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

export function MembersTab() {
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

export function SpacesTab() {
  const queryClient = useQueryClient();
  const { data: folders = [] } = useQuery({ queryKey: api.qk.folders(), queryFn: api.listFolders });
  const { data: templates = [] } = useQuery({ queryKey: api.qk.templates(), queryFn: api.listTemplates });
  const { data: recipes = [] } = useQuery({ queryKey: api.qk.recipes(), queryFn: api.listRecipes });
  const [tplName, setTplName] = useState("");
  const [tplPrompt, setTplPrompt] = useState("");
  const [rcpName, setRcpName] = useState("");
  const [rcpPrompt, setRcpPrompt] = useState("");

  const saveTpl = useMutation({
    mutationFn: () =>
      api.saveCustomTemplate(tplName.trim(), tplPrompt.trim(), '{"sections":["Summary","Decisions","Next Steps"]}'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.templates() });
      setTplName("");
      setTplPrompt("");
      toast.success("Template saved");
    },
    onError: (e) => toast.error(e),
  });

  const saveRcp = useMutation({
    mutationFn: () => api.saveCustomRecipe(rcpName.trim(), rcpPrompt.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.recipes() });
      setRcpName("");
      setRcpPrompt("");
      toast.success("Recipe saved");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Spaces" description="Folders, templates and recipes in this workspace." />

      <SettingsCard title="Folders">
        {folders.map((folder) => (
          <SettingRow
            key={folder.id}
            title={folder.name}
            description={folder.description || (folder.is_shared ? "Shared with the workspace" : "Private")}
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
        <div className="space-y-2 p-4">
          <Input placeholder="Recipe name" value={rcpName} onChange={(e) => setRcpName(e.target.value)} />
          <Input placeholder="Prompt" value={rcpPrompt} onChange={(e) => setRcpPrompt(e.target.value)} />
          <Button
            variant="solid"
            size="sm"
            disabled={!rcpName.trim() || !rcpPrompt.trim()}
            loading={saveRcp.isPending}
            onClick={() => saveRcp.mutate()}
          >
            Add recipe
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="New template">
        <div className="space-y-2 p-4">
          <Input placeholder="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} />
          <Input placeholder="Prompt" value={tplPrompt} onChange={(e) => setTplPrompt(e.target.value)} />
          <Button
            variant="solid"
            size="sm"
            disabled={!tplName.trim() || !tplPrompt.trim()}
            loading={saveTpl.isPending}
            onClick={() => saveTpl.mutate()}
          >
            Add template
          </Button>
        </div>
      </SettingsCard>
    </>
  );
}

export function AnalyticsTab() {
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
  const openActions = actions.filter((a) => !a.done).length;

  return (
    <>
      <TabHeading title="Analytics" />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Notes captured" value={notes.length} />
        <Stat label="Notes enhanced" value={enhanced} />
        <Stat label="Open action items" value={openActions} />
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
