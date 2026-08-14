import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import {
  Building2,
  Calendar,
  MessageSquare,
  Mic,
  Pause,
  Search,
  Settings,
  Square,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VuMeter } from "@/components/VuMeter";
import { NoteEditor } from "@/components/NoteEditor";
import { EnhancedNotes } from "@/components/EnhancedNotes";
import * as api from "@/lib/api";
import type { Meeting, Page, RecStatus, VuLevels } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

function formatWhen(value: string) {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function App() {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const recState = useAppStore((s) => s.recState);
  const overlayOn = useAppStore((s) => s.overlayOn);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const setVu = useAppStore((s) => s.setVu);

  useEffect(() => {
    api.recordingStatus().then(applyRecStatus).catch(() => undefined);
    let a: (() => void) | undefined;
    let b: (() => void) | undefined;
    listen<RecStatus>("recording-state", (e) => applyRecStatus(e.payload)).then((fn) => {
      a = fn;
    });
    listen<VuLevels>("audio-vu", (e) => setVu(e.payload)).then((fn) => {
      b = fn;
    });
    return () => {
      a?.();
      b?.();
    };
  }, [applyRecStatus, setVu]);

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      {overlayOn && recState === "recording" && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground shadow">
          Bagrry is transcribing audio
        </div>
      )}
      <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border py-3">
        <NavBtn page="notes" current={page} onClick={setPage} icon={<Mic className="h-4 w-4" />} label="Notes" />
        <NavBtn page="search" current={page} onClick={setPage} icon={<Search className="h-4 w-4" />} label="Ask" />
        <NavBtn page="people" current={page} onClick={setPage} icon={<Users className="h-4 w-4" />} label="People" />
        <NavBtn
          page="companies"
          current={page}
          onClick={setPage}
          icon={<Building2 className="h-4 w-4" />}
          label="Companies"
        />
        <NavBtn
          page="calendar"
          current={page}
          onClick={setPage}
          icon={<Calendar className="h-4 w-4" />}
          label="Calendar"
        />
        <div className="flex-1" />
        <NavBtn
          page="settings"
          current={page}
          onClick={setPage}
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
        />
      </nav>
      {page === "notes" && <NotesWorkspace />}
      {page === "search" && <SearchPage />}
      {page === "people" && <PeoplePage />}
      {page === "companies" && <CompaniesPage />}
      {page === "calendar" && <CalendarPage />}
      {page === "settings" && <SettingsPage />}
    </div>
  );
}

function NavBtn({
  page,
  current,
  onClick,
  icon,
  label,
}: {
  page: Page;
  current: Page;
  onClick: (p: Page) => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onClick(page)}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md",
        current === page ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent",
      )}
    >
      {icon}
    </button>
  );
}

function NotesWorkspace() {
  const queryClient = useQueryClient();
  const selectedMeetingId = useAppStore((s) => s.selectedMeetingId);
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  const folderId = useAppStore((s) => s.folderId);
  const setFolderId = useAppStore((s) => s.setFolderId);
  const recState = useAppStore((s) => s.recState);
  const pendingBytes = useAppStore((s) => s.pendingBytes);
  const loopbackOk = useAppStore((s) => s.loopbackOk);
  const vu = useAppStore((s) => s.vu);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const liveOpen = useAppStore((s) => s.liveOpen);
  const setLiveOpen = useAppStore((s) => s.setLiveOpen);
  const chatOpen = useAppStore((s) => s.chatOpen);
  const setChatOpen = useAppStore((s) => s.setChatOpen);

  const folders = useQuery({ queryKey: ["folders"], queryFn: api.listFolders });
  const meetings = useQuery({
    queryKey: ["meetings", folderId],
    queryFn: () => api.listMeetings(folderId),
  });
  const templates = useQuery({ queryKey: ["templates"], queryFn: api.listTemplates });
  const recipes = useQuery({ queryKey: ["recipes"], queryFn: api.listRecipes });
  const meeting = useQuery({
    queryKey: ["meeting", selectedMeetingId],
    queryFn: () => api.getMeeting(selectedMeetingId!),
    enabled: !!selectedMeetingId,
  });
  const segments = useQuery({
    queryKey: ["segments", selectedMeetingId],
    queryFn: () => api.listSegments(selectedMeetingId!),
    enabled: !!selectedMeetingId,
  });

  const create = useMutation({
    mutationFn: () => api.createMeeting("Untitled meeting", folderId),
    onSuccess: (m) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      selectMeeting(m.id);
    },
  });

  const live = recState === "recording" || recState === "paused";
  const [templateId, setTemplateId] = useState<string>("");
  const [recipeOut, setRecipeOut] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [scratch, setScratch] = useState("");
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    setScratch(meeting.data?.scratchpad_raw ?? "");
    setRecipeOut("");
  }, [meeting.data?.id, meeting.data?.scratchpad_raw]);

  function onScratch(v: string) {
    setScratch(v);
    if (!selectedMeetingId) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api.saveScratchpad(selectedMeetingId, v).catch(console.error);
    }, 400);
  }

  async function onRecord() {
    try {
      let id = selectedMeetingId;
      if (!live && !id) {
        const m = await create.mutateAsync();
        id = m.id;
      }
      if (live) {
        const next = await api.stopRecording();
        applyRecStatus(next);
        if (id && next.pending_bytes > 0) {
          setBusy("Transcribing…");
          try {
            await api.transcribePending(id);
            await api.enhanceMeeting(id, templateId || null);
            queryClient.invalidateQueries({ queryKey: ["meeting", id] });
            queryClient.invalidateQueries({ queryKey: ["segments", id] });
          } catch (e) {
            console.error(e);
            setBusy(String(e));
            return;
          }
        }
        setBusy(null);
      } else {
        applyRecStatus(await api.startRecording());
        setLiveOpen(true);
      }
    } catch (e) {
      setBusy(String(e));
    }
  }

  async function onEnhance() {
    if (!selectedMeetingId) return;
    setBusy("Enhancing…");
    try {
      await api.saveScratchpad(selectedMeetingId, scratch);
      await api.enhanceMeeting(selectedMeetingId, templateId || null);
      queryClient.invalidateQueries({ queryKey: ["meeting", selectedMeetingId] });
    } catch (e) {
      setBusy(String(e));
    }
    setBusy(null);
  }

  const selected = meeting.data;

  return (
    <>
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between px-3 py-3">
          <div>
            <p className="text-sm font-semibold">Bagrry</p>
            <p className="text-[11px] text-muted-foreground">Private on this machine</p>
          </div>
          <Button size="sm" onClick={() => create.mutate()}>
            New
          </Button>
        </div>
        <div className="px-2 pb-2">
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={folderId ?? ""}
            onChange={(e) => setFolderId(e.target.value || null)}
          >
            <option value="">All folders</option>
            {folders.data?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2">
          {meetings.data?.map((m: Meeting) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMeeting(m.id)}
              className={cn(
                "mb-0.5 w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                selectedMeetingId === m.id && "bg-accent",
              )}
            >
              <span className="block truncate font-medium">{m.title}</span>
              <span className="block text-[11px] text-muted-foreground">{formatWhen(m.date)}</span>
            </button>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <div className="min-w-0">
            {selected ? (
              <input
                className="w-full bg-transparent text-base font-semibold outline-none"
                value={selected.title}
                onChange={(e) => {
                  api.saveTitle(selected.id, e.target.value).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["meeting", selected.id] });
                    queryClient.invalidateQueries({ queryKey: ["meetings"] });
                  });
                }}
              />
            ) : (
              <h1 className="text-base font-semibold">Scratchpad</h1>
            )}
            <p className="text-[11px] text-muted-foreground">
              Ctrl+Shift+R record · Ctrl+Shift+P pause
              {loopbackOk ? " · system audio" : live ? " · mic" : ""}
              {pendingBytes > 0 ? ` · ${(pendingBytes / 1024).toFixed(0)} KB RAM` : ""}
              {busy ? ` · ${busy}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <VuMeter mic={vu.mic} system={vu.system} />
            {live && (
              <Button variant="outline" size="sm" onClick={async () => applyRecStatus(await api.pauseRecording())}>
                <Pause />
                {recState === "paused" ? "Resume" : "Pause"}
              </Button>
            )}
            <Button variant={live ? "destructive" : "default"} size="sm" onClick={onRecord}>
              {live ? <Square /> : <Mic />}
              {live ? "Stop" : "Record"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChatOpen(!chatOpen)}>
              <MessageSquare />
              Ask
            </Button>
            {live && (
              <Button variant="ghost" size="sm" onClick={() => setLiveOpen(!liveOpen)}>
                Live
              </Button>
            )}
          </div>
        </header>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Default template</option>
            {templates.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" disabled={!selectedMeetingId} onClick={onEnhance}>
            Enhance
          </Button>
          {recipes.data?.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant="ghost"
              disabled={!selectedMeetingId}
              onClick={async () => {
                if (!selectedMeetingId) return;
                setBusy(r.name);
                try {
                  setRecipeOut(await api.runRecipe(selectedMeetingId, r.id));
                } catch (e) {
                  setRecipeOut(String(e));
                }
                setBusy(null);
              }}
            >
              {r.name}
            </Button>
          ))}
          {selectedMeetingId && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const url = await api.createShare(selectedMeetingId);
                  await navigator.clipboard.writeText(url);
                  setBusy("Share link copied");
                }}
              >
                Share
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const md = await api.exportMarkdown(selectedMeetingId);
                  await navigator.clipboard.writeText(md);
                  setBusy("Markdown copied");
                }}
              >
                Export
              </Button>
            </>
          )}
        </div>
        <section className="grid min-h-0 flex-1 grid-cols-2 gap-px bg-border">
          <div className="flex min-h-0 flex-col bg-background p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              My notes
            </p>
            <NoteEditor
              value={scratch}
              onChange={onScratch}
              placeholder="Keywords, decisions, numbers…"
            />
            <RepromptBar meetingId={selectedMeetingId} scratch={scratch} />
          </div>
          <div className="min-h-0 bg-card p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Enhanced
            </p>
            <EnhancedNotes json={selected?.enhanced_notes_json ?? null} segments={segments.data ?? []} />
            {recipeOut && (
              <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">
                {recipeOut}
              </pre>
            )}
          </div>
        </section>
      </main>
      {chatOpen && <ChatDrawer meetingId={selectedMeetingId} folderId={folderId} />}
      {liveOpen && live && <LiveDrawer />}
    </>
  );
}

function RepromptBar({ meetingId, scratch }: { meetingId: string | null; scratch: string }) {
  const [instruction, setInstruction] = useState("");
  const [out, setOut] = useState("");
  if (!meetingId) return null;
  return (
    <div className="mt-3 border-t border-border pt-2">
      <p className="mb-1 text-[11px] text-muted-foreground">Rewrite selection / scratchpad</p>
      <div className="flex gap-1">
        {["Make more concise", "Add more quotes", "Rephrase for executives"].map((chip) => (
          <Button
            key={chip}
            size="sm"
            variant="outline"
            onClick={async () => {
              setOut(await api.repromptSelection(meetingId, scratch, chip));
            }}
          >
            {chip}
          </Button>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        <input
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
          placeholder="Custom rewrite…"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button
          size="sm"
          onClick={async () => {
            if (!instruction) return;
            setOut(await api.repromptSelection(meetingId, scratch, instruction));
          }}
        >
          Go
        </Button>
      </div>
      {out && <p className="mt-2 text-xs leading-relaxed">{out}</p>}
    </div>
  );
}

function ChatDrawer({ meetingId, folderId }: { meetingId: string | null; folderId: string | null }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Ask Bagrry</p>
        <button className="text-xs" onClick={() => setChatOpen(false)}>
          Close
        </button>
      </div>
      <textarea
        className="min-h-24 rounded-md border border-input bg-background p-2 text-sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="What pricing objections came up last month?"
      />
      <Button
        className="mt-2"
        onClick={async () => setA(await api.askBagrry(q, folderId, meetingId))}
      >
        Ask
      </Button>
      <div className="mt-3 flex-1 overflow-auto whitespace-pre-wrap text-sm">{a}</div>
    </aside>
  );
}

function LiveDrawer() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [live, setLive] = useState("");
  const setLiveOpen = useAppStore((s) => s.setLiveOpen);
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card p-3">
      <div className="mb-2 flex justify-between">
        <p className="text-sm font-semibold">Ask live</p>
        <button className="text-xs" onClick={() => setLiveOpen(false)}>
          Close
        </button>
      </div>
      <textarea
        className="mb-2 min-h-20 rounded-md border border-input bg-background p-2 text-xs"
        placeholder="Paste or type rolling notes from the last few minutes…"
        value={live}
        onChange={(e) => setLive(e.target.value)}
      />
      <input
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        placeholder="What budget figure did they mention?"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button className="mt-2" onClick={async () => setA(await api.liveAsk(q, live))}>
        Ask
      </Button>
      <p className="mt-3 text-sm whitespace-pre-wrap">{a}</p>
    </aside>
  );
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Meeting[]>([]);
  const [answer, setAnswer] = useState("");
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  return (
    <div className="flex min-w-0 flex-1 flex-col p-6">
      <h1 className="text-lg font-semibold">Ask across meetings</h1>
      <div className="mt-3 flex gap-2">
        <input
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes and transcripts"
        />
        <Button
          onClick={async () => {
            setHits(await api.searchMeetings(q));
            setAnswer(await api.askBagrry(q));
          }}
        >
          Search
        </Button>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm">{answer}</p>
      <ul className="mt-4 space-y-1">
        {hits.map((m) => (
          <li key={m.id}>
            <button className="text-sm underline" onClick={() => selectMeeting(m.id)}>
              {m.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PeoplePage() {
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
    <div className="flex min-w-0 flex-1 gap-6 p-6">
      <div className="w-80">
        <h1 className="text-lg font-semibold">People</h1>
        <div className="mt-3 flex flex-col gap-2">
          <input className="h-8 rounded-md border px-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="h-8 rounded-md border px-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button
            size="sm"
            onClick={async () => {
              await api.upsertPerson(name, email || null);
              qc.invalidateQueries({ queryKey: ["people"] });
              setName("");
              setEmail("");
            }}
          >
            Add
          </Button>
        </div>
        <ul className="mt-4 space-y-1">
          {people.data?.map((p) => (
            <li key={p.id}>
              <button className="text-left text-sm" onClick={() => setOpen(p.id)}>
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{p.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-semibold">Meetings</h2>
        <ul className="mt-2">
          {meetings.data?.map((m) => (
            <li key={m.id}>
              <button className="text-sm underline" onClick={() => selectMeeting(m.id)}>
                {m.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompaniesPage() {
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
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-lg font-semibold">Companies</h1>
      <ul className="mt-4 space-y-4">
        {companies.data?.map((c) => (
          <li key={c.id} className="rounded-lg border border-border p-3">
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.domain}</p>
            <p className="mt-2 text-xs">
              {(grouped[c.domain || ""] ?? []).map((p) => p.name).join(", ") || "No contacts yet"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarPage() {
  const events = useQuery({ queryKey: ["calendar"], queryFn: api.listCalendar });
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [brief, setBrief] = useState("");
  const qc = useQueryClient();
  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-lg font-semibold">Calendar & briefs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Local events now. Connect Google or Microsoft client IDs in Settings when you have them.
      </p>
      <div className="mt-4 flex gap-2">
        <input className="h-8 rounded-md border px-2 text-sm" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="h-8 rounded-md border px-2 text-sm" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Button
          size="sm"
          onClick={async () => {
            await api.upsertCalendarEvent(title, when.replace("T", " "));
            qc.invalidateQueries({ queryKey: ["calendar"] });
          }}
        >
          Add
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {events.data?.map((e) => (
          <li key={e.id} className="rounded-md border border-border p-3">
            <p className="font-medium">{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.start_at}</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-1"
              onClick={async () => setBrief(await api.preMeetingBrief(e.attendees_json || "[]"))}
            >
              Prep brief
            </Button>
          </li>
        ))}
      </ul>
      {brief && <pre className="mt-4 whitespace-pre-wrap text-sm">{brief}</pre>}
    </div>
  );
}

function SettingsPage() {
  const status = useQuery({ queryKey: ["db-status"], queryFn: api.dbStatus });
  const [groq, setGroq] = useState("");
  const [webhook, setWebhook] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api.getSetting("webhook_url").then(setWebhook).catch(() => undefined);
    api.getSetting("consent_message").then(setMsg).catch(() => undefined);
  }, []);
  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Keys stay in the OS credential store when available, otherwise in local SQLite.
      </p>
      <div className="mt-4 max-w-lg space-y-3">
        <label className="block text-xs font-medium">Groq API key (BYOK)</label>
        <input
          type="password"
          className="h-9 w-full rounded-md border px-2 text-sm"
          value={groq}
          onChange={(e) => setGroq(e.target.value)}
          placeholder={status.data?.groq_configured ? "Configured" : "gsk_…"}
        />
        <Button size="sm" onClick={() => api.setSecret("groq_api_key", groq)}>
          Save key
        </Button>
        <label className="block text-xs font-medium">Outgoing webhook</label>
        <input className="h-9 w-full rounded-md border px-2 text-sm" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
        <Button size="sm" onClick={() => api.setSetting("webhook_url", webhook)}>
          Save webhook
        </Button>
        <label className="block text-xs font-medium">Consent chat message</label>
        <input className="h-9 w-full rounded-md border px-2 text-sm" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <Button
          size="sm"
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
    </div>
  );
}

function ApiKeyField() {
  const [token, setToken] = useState("");
  return (
    <>
      <input
        className="h-9 w-full rounded-md border px-2 text-sm"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Leave empty for open localhost"
      />
      <Button size="sm" onClick={() => api.setSetting("api_key", token)}>
        Save API token
      </Button>
    </>
  );
}
