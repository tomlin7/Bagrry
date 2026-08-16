import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Database, KeyRound, Link2, Webhook } from "lucide-react";
import * as api from "@/lib/api";
import { useSetting } from "@/hooks/useSetting";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { TabHeading } from "./shared";
import { comingSoon } from "./helpers";

const integrations: { name: string; hint: string; color: string }[] = [
  { name: "Gmail", hint: "Follow-up emails", color: "#ea4335" },
  { name: "Slack", hint: "Share notes to channels", color: "#4a154b" },
  { name: "Notion", hint: "Export to databases", color: "#37352f" },
  { name: "Zapier", hint: "Automations", color: "#ff4a00" },
  { name: "Affinity", hint: "CRM sync", color: "#1f6feb" },
  { name: "HubSpot", hint: "CRM sync", color: "#ff7a59" },
  { name: "Salesforce", hint: "CRM sync", color: "#00a1e0" },
  { name: "Attio", hint: "CRM sync", color: "#1d1d1b" },
  { name: "Pipedrive", hint: "CRM sync", color: "#017737" },
];

export function ConnectorsTab() {
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
      <TabHeading title="Connectors" />

      <SettingsCard title="Integrations">
        {integrations.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => comingSoon(item.name)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white"
              style={{ background: item.color }}
            >
              {item.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-text">{item.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">{item.hint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-subtle" />
          </button>
        ))}
      </SettingsCard>

      <SettingsCard
        title="API"
        description="Create a personal key to query Bagrry from your own scripts. Workspace keys can only be created by admins."
      >
        <SettingRow
          title="Personal API keys"
          description="For automations on this account."
          control={
            <Button variant="accent" size="sm" shape="square" onClick={() => comingSoon("Personal API keys")}>
              Create
            </Button>
          }
        />
        <SettingRow
          title="Workspace API keys"
          description="Admins only."
          control={
            <Button variant="accent" size="sm" shape="square" onClick={() => comingSoon("Workspace API keys")}>
              Create
            </Button>
          }
        />
      </SettingsCard>

      <SettingsCard title="This device" description="Transcription and local storage for this computer.">
        <SettingRow
          icon={<KeyRound />}
          title="Groq API key"
          description={status?.groq_configured ? "A key is configured." : "No key yet — AI features are disabled."}
          control={status?.groq_configured ? <Badge tone="success">Connected</Badge> : <Badge>Not set</Badge>}
        />
        <div className="flex gap-2 p-4">
          <Input type="password" placeholder="gsk_..." value={groqKey} onChange={(e) => setGroqKey(e.target.value)} />
          <Button
            variant="solid"
            size="md"
            shape="square"
            disabled={!groqKey.trim()}
            loading={saveKey.isPending}
            onClick={() => saveKey.mutate()}
          >
            Save
          </Button>
        </div>
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
        <SettingRow icon={<Database />} title="SQLite file" description={status?.path ?? "Loading…"} />
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
