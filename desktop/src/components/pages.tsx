import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/AppShell";
import * as api from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { useAppStore } from "@/store/app";

export function SearchPage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Awaited<ReturnType<typeof api.searchMeetings>>>([]);
  const [answer, setAnswer] = useState("");
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  return (
    <PageFrame
      kicker="Memory"
      title="Ask across meetings"
      subtitle="Search notes and transcripts, then chat the same query as a brief."
    >
      <div className="flex gap-2">
        <input
          className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What pricing objections came up last month?"
        />
        <Button
          className="rounded-full"
          onClick={async () => {
            setHits(await api.searchMeetings(q));
            setAnswer(await api.askBagrry(q));
          }}
        >
          Ask
        </Button>
      </div>
      {answer && <p className="ai-text mt-6 whitespace-pre-wrap text-sm leading-relaxed">{answer}</p>}
      <ul className="mt-6 space-y-2">
        {hits.map((m) => (
          <li key={m.id}>
            <button
              className="paper-card w-full rounded-2xl border border-border px-4 py-3 text-left"
              onClick={() => selectMeeting(m.id)}
            >
              <span className="font-medium">{m.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{formatWhen(m.date)}</span>
            </button>
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}

export function PeoplePage() {
  const people = useQuery({ queryKey: ["people"], queryFn: api.listPeople });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const meetings = useQuery({
    queryKey: ["person-meetings", open],
    queryFn: () => api.meetingsForPerson(open!),
    enabled: !!open,
  });
  const qc = useQueryClient();
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  return (
    <PageFrame kicker="Graph" title="People" subtitle="Everyone you’ve sat with, and every note that mentions them.">
      <div className="grid gap-8 md:grid-cols-[20rem_1fr]">
        <div>
          <div className="flex flex-col gap-2">
            <input className="h-9 rounded-full border px-3 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="h-9 rounded-full border px-3 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button
              size="sm"
              className="rounded-full"
              onClick={async () => {
                await api.upsertPerson(name, email || null);
                qc.invalidateQueries({ queryKey: ["people"] });
                setName("");
                setEmail("");
              }}
            >
              Add person
            </Button>
          </div>
          <ul className="mt-4 space-y-1">
            {people.data?.map((p) => (
              <li key={p.id}>
                <button
                  className="w-full rounded-xl px-3 py-2 text-left hover:bg-accent"
                  onClick={() => setOpen(p.id)}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">{p.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl">Meetings</h2>
          <ul className="mt-3 space-y-2">
            {meetings.data?.map((m) => (
              <li key={m.id}>
                <button className="text-sm underline-offset-4 hover:underline" onClick={() => selectMeeting(m.id)}>
                  {m.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageFrame>
  );
}

export function CompaniesPage() {
  const companies = useQuery({ queryKey: ["companies"], queryFn: api.listCompanies });
  const people = useQuery({ queryKey: ["people"], queryFn: api.listPeople });
  const grouped = useMemo(() => {
    const map: Record<string, typeof people.data> = {};
    for (const p of people.data ?? []) {
      const key = p.domain || "unknown";
      map[key] = [...(map[key] ?? []), p];
    }
    return map;
  }, [people.data]);
  return (
    <PageFrame kicker="Graph" title="Companies" subtitle="Account memory grouped by domain.">
      <ul className="grid gap-3 md:grid-cols-2">
        {companies.data?.map((c) => (
          <li key={c.id} className="paper-card rounded-2xl border border-border p-5">
            <p className="font-display text-xl">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.domain}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {(grouped[c.domain || ""] ?? []).map((p) => p.name).join(", ") || "No contacts yet"}
            </p>
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}

export function CalendarPage() {
  const events = useQuery({ queryKey: ["calendar"], queryFn: api.listCalendar });
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [brief, setBrief] = useState("");
  const qc = useQueryClient();
  return (
    <PageFrame
      kicker="Prep"
      title="Calendar & briefs"
      subtitle="Local events now. Connect Google or Microsoft client IDs in Settings when you have them."
    >
      <div className="flex flex-wrap gap-2">
        <input className="h-9 rounded-full border px-3 text-sm" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="h-9 rounded-full border px-3 text-sm" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Button
          size="sm"
          className="rounded-full"
          onClick={async () => {
            await api.upsertCalendarEvent(title, when.replace("T", " "));
            qc.invalidateQueries({ queryKey: ["calendar"] });
          }}
        >
          Add event
        </Button>
      </div>
      <ul className="mt-6 space-y-2">
        {events.data?.map((e) => (
          <li key={e.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.start_at}</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-1 rounded-full"
              onClick={async () => setBrief(await api.preMeetingBrief(e.attendees_json || "[]"))}
            >
              Prep brief
            </Button>
          </li>
        ))}
      </ul>
      {brief && <pre className="ai-text mt-6 whitespace-pre-wrap text-sm">{brief}</pre>}
    </PageFrame>
  );
}

export function ActionsPage() {
  const actions = useQuery({ queryKey: ["actions"], queryFn: api.listActionItems });
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  return (
    <PageFrame kicker="Follow-through" title="Action items" subtitle="Owners, deadlines, and the meeting they came from.">
      <ul className="space-y-2">
        {(actions.data ?? []).map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => selectMeeting(a.meeting_id)}
              className="paper-card flex w-full items-start justify-between rounded-2xl border border-border px-5 py-4 text-left"
            >
              <span>
                <span className="block font-medium">{a.task}</span>
                <span className="text-xs text-muted-foreground">
                  {a.owner ?? "Unassigned"} · {a.meeting_title}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{a.deadline ?? "No date"}</span>
            </button>
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}

export function PricingPage() {
  const enter = useAppStore((s) => s.enterWorkspace);
  const plans = [
    {
      name: "Basic",
      price: "$0",
      pitch: "A free taste of Bagrry",
      items: [
        "AI meeting notes",
        "Last 30 days in the app",
        "Chat within and across meetings",
        "Shared folders & templates",
        "Recipes and MCP on this machine",
      ],
    },
    {
      name: "Business",
      price: "$14",
      pitch: "For people who live in meetings",
      items: [
        "Unlimited history",
        "Advanced chat models",
        "Notion, Slack, HubSpot, Attio, Zapier",
        "Centralized billing",
        "MCP in every AI app",
      ],
    },
    {
      name: "Enterprise",
      price: "$35",
      pitch: "For larger companies",
      items: [
        "SSO and admin controls",
        "Priority support & analytics",
        "Org-wide auto-deletion",
        "Sharing & API governance",
        "Org-wide training opt-out",
      ],
    },
  ];
  return (
    <PageFrame kicker="Plans" title="Unlimited notes. Upgrade for history." subtitle="Take as many notes as you like. Business keeps every conversation searchable forever.">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <article key={p.name} className="paper-card rounded-2xl border border-border p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{p.name}</p>
            <p className="font-display mt-2 text-4xl">
              {p.price}
              <span className="text-base font-sans text-muted-foreground"> / user / mo</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{p.pitch}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {p.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full rounded-full" variant={p.name === "Business" ? "default" : "outline"} onClick={() => enter("dashboard")}>
              {p.name === "Basic" ? "Start free" : "Continue"}
            </Button>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}

export function IntegrationsPage() {
  const tools = [
    ["Notion", "Push structured notes into a database."],
    ["Slack", "Send recaps and action items to a channel."],
    ["HubSpot", "Attach call notes to contacts and deals."],
    ["Attio", "Keep CRM records in sync with meetings."],
    ["Zapier", "Fan out webhooks to the rest of your stack."],
    ["MCP", "Claude, ChatGPT, and Cursor query local notes."],
  ];
  return (
    <PageFrame
      kicker="Connect"
      title="Use your notes anywhere"
      subtitle="No more copy-pasting transcripts into other AI tools. Local MCP is already running; CRM sync uses your webhook."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {tools.map(([name, body]) => (
          <article key={name} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-xl">{name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            <p className="mt-3 text-xs text-primary">Available on Business · configure in Settings</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}

export function SettingsPage() {
  const status = useQuery({ queryKey: ["db-status"], queryFn: api.dbStatus });
  const setPage = useAppStore((s) => s.setPage);
  const [groq, setGroq] = useState("");
  const [webhook, setWebhook] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api.getSetting("webhook_url").then(setWebhook).catch(() => undefined);
    api.getSetting("consent_message").then(setMsg).catch(() => undefined);
  }, []);
  return (
    <PageFrame
      kicker="Workspace"
      title="Settings"
      subtitle="Keys stay in the OS credential store when available, otherwise in local SQLite."
      actions={
        <Button variant="outline" className="rounded-full" onClick={() => setPage("landing")}>
          View landing
        </Button>
      }
    >
      <div className="max-w-lg space-y-4">
        <label className="block text-xs font-medium">Groq API key (BYOK)</label>
        <input
          type="password"
          className="h-10 w-full rounded-full border px-4 text-sm"
          value={groq}
          onChange={(e) => setGroq(e.target.value)}
          placeholder={status.data?.groq_configured ? "Configured" : "gsk_…"}
        />
        <Button size="sm" className="rounded-full" onClick={() => api.setSecret("groq_api_key", groq)}>
          Save key
        </Button>
        <label className="block text-xs font-medium">Outgoing webhook</label>
        <input className="h-10 w-full rounded-full border px-4 text-sm" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
        <Button size="sm" className="rounded-full" onClick={() => api.setSetting("webhook_url", webhook)}>
          Save webhook
        </Button>
        <label className="block text-xs font-medium">Consent chat message</label>
        <input className="h-10 w-full rounded-full border px-4 text-sm" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <Button
          size="sm"
          className="rounded-full"
          onClick={async () => {
            await api.setSetting("consent_message", msg);
            const text = await api.copyConsent();
            await navigator.clipboard.writeText(text);
          }}
        >
          Copy consent to clipboard
        </Button>
        <label className="block text-xs font-medium">Local API bearer token (optional)</label>
        <ApiKeyField />
        <p className="text-xs text-muted-foreground">
          Local API: http://127.0.0.1:{status.data?.api_port ?? 47821} · SQLite {status.data?.sqlite_version} ·{" "}
          {status.data?.meeting_count} meetings
        </p>
      </div>
    </PageFrame>
  );
}

function ApiKeyField() {
  const [token, setToken] = useState("");
  return (
    <>
      <input
        className="h-10 w-full rounded-full border px-4 text-sm"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Leave empty for open localhost"
      />
      <Button size="sm" className="rounded-full" onClick={() => api.setSetting("api_key", token)}>
        Save API token
      </Button>
    </>
  );
}
