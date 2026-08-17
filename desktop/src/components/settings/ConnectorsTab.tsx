import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Database, KeyRound, Link2, Trash2, Webhook } from "lucide-react";
import * as api from "@/lib/api";
import { useSetting } from "@/hooks/useSetting";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingRow, SettingsCard, Switch } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { TabHeading } from "./shared";

const integrations: { id: string; name: string; hint: string; color: string; placeholder: string }[] = [
  { id: "gmail", name: "Gmail", hint: "Follow-up emails via webhook", color: "#ea4335", placeholder: "https://hooks.zapier.com/…" },
  { id: "slack", name: "Slack", hint: "Incoming webhook to a channel", color: "#4a154b", placeholder: "https://hooks.slack.com/services/…" },
  { id: "notion", name: "Notion", hint: "Export via Zapier / Make", color: "#37352f", placeholder: "https://hooks.zapier.com/…" },
  { id: "zapier", name: "Zapier", hint: "Catch-hook for any Zap", color: "#ff4a00", placeholder: "https://hooks.zapier.com/…" },
  { id: "affinity", name: "Affinity", hint: "CRM via Zapier", color: "#1f6feb", placeholder: "https://hooks.zapier.com/…" },
  { id: "hubspot", name: "HubSpot", hint: "CRM via Zapier", color: "#ff7a59", placeholder: "https://hooks.zapier.com/…" },
  { id: "salesforce", name: "Salesforce", hint: "CRM via Zapier", color: "#00a1e0", placeholder: "https://hooks.zapier.com/…" },
  { id: "attio", name: "Attio", hint: "CRM via Zapier", color: "#1d1d1b", placeholder: "https://hooks.zapier.com/…" },
  { id: "pipedrive", name: "Pipedrive", hint: "CRM via Zapier", color: "#017737", placeholder: "https://hooks.zapier.com/…" },
];

export function ConnectorsTab() {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({ queryKey: api.qk.dbStatus(), queryFn: api.dbStatus });
  const { data: keys = [] } = useQuery({ queryKey: api.qk.apiKeys(), queryFn: api.listApiKeys });
  const [groqKey, setGroqKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useSetting("webhook_url", "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const saveKey = useMutation({
    mutationFn: () => api.setSecret("groq_api_key", groqKey.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.dbStatus() });
      setGroqKey("");
      toast.success("Groq API key saved");
    },
    onError: (e) => toast.error(e),
  });

  const createKey = useMutation({
    mutationFn: ({ label, kind }: { label: string; kind: "personal" | "workspace" }) =>
      api.createApiKey(label, kind),
    onSuccess: (token) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.apiKeys() });
      setRevealedToken(token);
      setNewKeyLabel("");
      toast.success("Copy this key now — it won't be shown again");
    },
    onError: (e) => toast.error(e),
  });

  const revoke = useMutation({
    mutationFn: api.revokeApiKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.apiKeys() });
      toast.success("Key revoked");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Connectors" />

      <SettingsCard title="Integrations" description="Paste a webhook URL to send completed notes to each tool. Native OAuth lands later.">
        {integrations.map((item) => (
          <IntegrationRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
          />
        ))}
      </SettingsCard>

      <SettingsCard
        title="API"
        description="Keys authenticate the local HTTP API (127.0.0.1). Once any key exists, requests need Bearer auth."
      >
        <div className="flex gap-2 p-4">
          <Input
            placeholder="Key label"
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
          />
          <Button
            variant="accent"
            size="sm"
            shape="square"
            loading={createKey.isPending}
            onClick={() => createKey.mutate({ label: newKeyLabel || "Personal key", kind: "personal" })}
          >
            Create personal
          </Button>
          <Button
            variant="outline"
            size="sm"
            shape="square"
            loading={createKey.isPending}
            onClick={() => createKey.mutate({ label: newKeyLabel || "Workspace key", kind: "workspace" })}
          >
            Create workspace
          </Button>
        </div>
        {revealedToken && (
          <div className="px-4 pb-3">
            <p className="mb-1 text-xs text-muted">Copy now — this is the only time the full token is shown.</p>
            <code className="block break-all rounded-lg border border-border bg-bg px-3 py-2 text-[12px]">
              {revealedToken}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                void navigator.clipboard.writeText(revealedToken).then(
                  () => toast.success("Copied"),
                  () => toast.info(revealedToken),
                );
              }}
            >
              Copy token
            </Button>
          </div>
        )}
        {keys.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-subtle">No keys yet. The local API is open on loopback.</p>
        ) : (
          keys.map((key) => (
            <SettingRow
              key={key.id}
              icon={<KeyRound />}
              title={key.label}
              description={`${key.kind} · …${key.token_tail} · ${key.created_at.slice(0, 10)}`}
              control={
                <Button variant="ghost" size="sm" onClick={() => revoke.mutate(key.id)}>
                  <Trash2 className="size-3.5" />
                  Revoke
                </Button>
              }
            />
          ))
        )}
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

function IntegrationRow({
  item,
  open,
  onToggle,
}: {
  item: (typeof integrations)[number];
  open: boolean;
  onToggle: () => void;
}) {
  const [url, setUrl] = useSetting(`connector_${item.id}_url`, "");
  const [enabled, setEnabled] = useSetting(`connector_${item.id}`, "0");
  const connected = enabled === "1" && url.trim().length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
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
        {connected ? <Badge tone="success">On</Badge> : <ChevronRight className="size-4 shrink-0 text-subtle" />}
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          <Input
            placeholder={item.placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Send notes here after enhance / share</span>
            <Switch
              checked={enabled === "1"}
              onCheckedChange={(v) => {
                setEnabled(v ? "1" : "0");
                toast.success(v ? `${item.name} connected` : `${item.name} disconnected`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
