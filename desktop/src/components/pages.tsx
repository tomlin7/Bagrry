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
  const meetings = useQuery({ queryKey: ["meetings", null], queryFn: () => api.listMeetings(null) });
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  const qc = useQueryClient();
  const [task, setTask] = useState("");
  const [owner, setOwner] = useState("");
  const [meetingId, setMeetingId] = useState("");
  return (
    <PageFrame kicker="Follow-through" title="Action items" subtitle="Owners, deadlines, and the meeting they came from.">
      <div className="mb-6 flex flex-wrap gap-2">
        <input className="h-9 flex-1 rounded-full border px-3 text-sm" placeholder="Task" value={task} onChange={(e) => setTask(e.target.value)} />
        <input className="h-9 w-40 rounded-full border px-3 text-sm" placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <select className="h-9 rounded-full border px-3 text-sm" value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
          <option value="">Meeting</option>
          {meetings.data?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          className="rounded-full"
          onClick={async () => {
            if (!task || !meetingId) return;
            await api.addActionItem(meetingId, task, owner || null);
            setTask("");
            qc.invalidateQueries({ queryKey: ["actions"] });
          }}
        >
          Add
        </Button>
      </div>
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

export function TemplatesPage() {
  const templates = useQuery({ queryKey: ["templates"], queryFn: api.listTemplates });
  const recipes = useQuery({ queryKey: ["recipes"], queryFn: api.listRecipes });
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sections, setSections] = useState("Wins, Challenges, Next Steps");
  const [rname, setRname] = useState("");
  const [rprompt, setRprompt] = useState("");
  return (
    <PageFrame
      kicker="Enhance"
      title="Templates & recipes"
      subtitle="1-on-1s, discovery, research, retros — or write your own structure. Recipes run after the call."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {templates.data?.map((t) => (
          <article key={t.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Template</p>
            <h3 className="font-display mt-1 text-xl">{t.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.prompt_template}</p>
          </article>
        ))}
      </div>
      <div className="paper-card mt-8 rounded-2xl border border-border p-5">
        <h3 className="font-display text-xl">Custom template</h3>
        <div className="mt-3 grid gap-2">
          <input className="h-9 rounded-full border px-3 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="h-9 rounded-full border px-3 text-sm" placeholder="Sections, comma separated" value={sections} onChange={(e) => setSections(e.target.value)} />
          <textarea className="min-h-20 rounded-xl border p-3 text-sm" placeholder="Enhancement instructions" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <Button
            className="w-fit rounded-full"
            onClick={async () => {
              if (!name || !prompt) return;
              const structure = JSON.stringify({
                sections: sections.split(",").map((s) => s.trim()).filter(Boolean),
              });
              await api.saveCustomTemplate(name, prompt, structure);
              setName("");
              setPrompt("");
              qc.invalidateQueries({ queryKey: ["templates"] });
            }}
          >
            Save template
          </Button>
        </div>
      </div>
      <h3 className="font-display mt-10 text-2xl">Recipes</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {recipes.data?.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <h4 className="font-medium">{r.name}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{r.prompt_template}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <input className="h-9 rounded-full border px-3 text-sm" placeholder="Recipe name" value={rname} onChange={(e) => setRname(e.target.value)} />
        <textarea className="min-h-16 rounded-xl border p-3 text-sm" placeholder="What should it produce?" value={rprompt} onChange={(e) => setRprompt(e.target.value)} />
        <Button
          className="w-fit rounded-full"
          variant="outline"
          onClick={async () => {
            if (!rname || !rprompt) return;
            await api.saveCustomRecipe(rname, rprompt);
            setRname("");
            setRprompt("");
            qc.invalidateQueries({ queryKey: ["recipes"] });
          }}
        >
          Save recipe
        </Button>
      </div>
    </PageFrame>
  );
}

export function WorkspacePage() {
  const [name, setName] = useState("Personal");
  const [plan, setPlan] = useState("basic");
  const [optOut, setOptOut] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [lang, setLang] = useState("en");
  const [saved, setSaved] = useState("");
  useEffect(() => {
    api.getSetting("workspace_name").then((v) => v && setName(v)).catch(() => undefined);
    api.getSetting("plan").then((v) => v && setPlan(v)).catch(() => undefined);
    api.getSetting("training_opt_out").then((v) => setOptOut(v !== "0")).catch(() => undefined);
    api.getSetting("overlay_enabled").then((v) => setOverlay(v !== "0")).catch(() => undefined);
    api.getSetting("language").then((v) => v && setLang(v)).catch(() => undefined);
  }, []);
  async function save() {
    await api.setSetting("workspace_name", name);
    await api.setSetting("plan", plan);
    await api.setSetting("training_opt_out", optOut ? "1" : "0");
    await api.setSetting("overlay_enabled", overlay ? "1" : "0");
    await api.setSetting("language", lang);
    setSaved("Saved on this machine");
  }
  return (
    <PageFrame
      kicker="Account"
      title="Workspace"
      subtitle="Plan, privacy, and how Bagrry shows up in the room. Everything here is local."
    >
      <div className="max-w-lg space-y-4">
        <label className="block text-xs font-medium">Workspace name</label>
        <input className="h-10 w-full rounded-full border px-4 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block text-xs font-medium">Plan</label>
        <select className="h-10 w-full rounded-full border px-4 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="basic">Basic — $0</option>
          <option value="business">Business — $14</option>
          <option value="enterprise">Enterprise — $35</option>
        </select>
        <label className="block text-xs font-medium">Note language</label>
        <select className="h-10 w-full rounded-full border px-4 text-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)} />
          Opt out of model training
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          Show “Bagrry is recording” watermark
        </label>
        <Button className="rounded-full" onClick={save}>
          Save workspace
        </Button>
        {saved && <p className="text-xs text-primary">{saved}</p>}
      </div>
    </PageFrame>
  );
}

export function SettingsPage() {
  const status = useQuery({ queryKey: ["db-status"], queryFn: api.dbStatus });
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
