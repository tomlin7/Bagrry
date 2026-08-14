import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Mic, Pause, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VuMeter } from "@/components/VuMeter";
import { NoteEditor } from "@/components/NoteEditor";
import { EnhancedNotes } from "@/components/EnhancedNotes";
import * as api from "@/lib/api";
import { formatDay, formatWhen } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

export function NotesWorkspace() {
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
  const [folderName, setFolderName] = useState("");
  const saveTimer = useRef<number | null>(null);
  const wasLive = useRef(false);
  const finishing = useRef(false);

  useEffect(() => {
    setScratch(meeting.data?.scratchpad_raw ?? "");
    setRecipeOut("");
  }, [meeting.data?.id, meeting.data?.scratchpad_raw]);

  useEffect(() => {
    const nowLive = recState === "recording" || recState === "paused";
    if (wasLive.current && !nowLive && !finishing.current) {
      const mid = selectedMeetingId;
      if (mid) {
        finishing.current = true;
        setBusy("Transcribing…");
        void (async () => {
          try {
            await api.transcribePending(mid);
            await api.enhanceMeeting(mid, templateId || null);
            await queryClient.invalidateQueries({ queryKey: ["meeting", mid] });
            await queryClient.invalidateQueries({ queryKey: ["segments", mid] });
            setBusy(null);
          } catch (e) {
            const msg = String(e);
            setBusy(msg.includes("no audio in memory") ? null : msg);
          } finally {
            finishing.current = false;
          }
        })();
      }
    }
    wasLive.current = nowLive;
  }, [recState, selectedMeetingId, templateId, queryClient]);

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
        applyRecStatus(await api.stopRecording());
      } else {
        applyRecStatus(await api.startRecording(id));
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
  const grouped = groupMeetings(meetings.data ?? []);

  return (
    <>
      <aside className="flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-4 pb-3 pt-5">
          <p className="font-display text-2xl italic leading-none">Notes</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Private on this machine</p>
        </div>
        <div className="flex items-center gap-2 px-3 pb-3">
          <Button size="sm" className="flex-1 rounded-full" onClick={() => create.mutate()}>
            <Plus className="h-3.5 w-3.5" />
            New note
          </Button>
        </div>
        <div className="px-3 pb-2">
          <select
            className="w-full rounded-xl border border-input bg-background px-2 py-1.5 text-xs"
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
          <div className="mt-2 flex gap-1">
            <input
              className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-xs"
              placeholder="New folder"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!folderName.trim()) return;
                await api.createFolder(folderName.trim());
                setFolderName("");
                queryClient.invalidateQueries({ queryKey: ["folders"] });
              }}
            >
              Add
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} className="mb-3">
              <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {day}
              </p>
              {items.map((m: Meeting) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMeeting(m.id)}
                  className={cn(
                    "mb-0.5 w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-accent",
                    selectedMeetingId === m.id && "bg-accent",
                  )}
                >
                  <span className="block truncate font-medium">{m.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{formatWhen(m.date)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f7f2]">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-6 py-3">
          <div className="min-w-0">
            {selected ? (
              <input
                className="font-display w-full bg-transparent text-2xl font-semibold outline-none"
                value={selected.title}
                onChange={(e) => {
                  api.saveTitle(selected.id, e.target.value).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["meeting", selected.id] });
                    queryClient.invalidateQueries({ queryKey: ["meetings"] });
                  });
                }}
              />
            ) : (
              <h1 className="font-display text-2xl font-semibold">Scratchpad</h1>
            )}
            <p className="text-[11px] text-muted-foreground">
              Ctrl+Shift+R record · Ctrl+Shift+P pause
              {loopbackOk ? " · system audio" : live ? " · mic" : ""}
              {pendingBytes > 0 ? ` · ${(pendingBytes / 1024).toFixed(0)} KB in RAM` : ""}
            </p>
            {busy && <p className="mt-1 max-w-xl text-xs font-medium text-destructive">{busy}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <VuMeter mic={vu.mic} system={vu.system} />
            {live && (
              <Button variant="outline" size="sm" className="rounded-full" onClick={async () => applyRecStatus(await api.pauseRecording())}>
                <Pause />
                {recState === "paused" ? "Resume" : "Pause"}
              </Button>
            )}
            <Button
              variant={live ? "destructive" : "default"}
              size="sm"
              className="rounded-full"
              onClick={onRecord}
            >
              {live ? <Square /> : <Mic />}
              {live ? "Stop" : "Record"}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setChatOpen(!chatOpen)}>
              <MessageSquare />
              Chat
            </Button>
            {live && (
              <Button variant="ghost" size="sm" onClick={() => setLiveOpen(!liveOpen)}>
                Live
              </Button>
            )}
          </div>
        </header>
        <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-x-auto border-b border-border px-6 py-2">
          <select
            className="rounded-full border border-input bg-background px-3 py-1 text-xs"
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
          <Button size="sm" variant="secondary" className="rounded-full" disabled={!selectedMeetingId} onClick={onEnhance}>
            Enhance notes
          </Button>
          {recipes.data?.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant="ghost"
              className="rounded-full"
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
                className="rounded-full"
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
                className="rounded-full"
                onClick={async () => {
                  const md = await api.exportMarkdown(selectedMeetingId);
                  await navigator.clipboard.writeText(md);
                  setBusy("Markdown copied");
                }}
              >
                Export
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={async () => {
                  try {
                    setBusy(await api.dispatchWebhook(selectedMeetingId));
                  } catch (e) {
                    setBusy(String(e));
                  }
                }}
              >
                Webhook
              </Button>
            </>
          )}
        </div>
        <section className="grid min-h-0 min-w-0 flex-1 grid-cols-2 overflow-hidden [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-border p-6">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              My notes
            </p>
            <NoteEditor value={scratch} onChange={onScratch} placeholder="Keywords, decisions, numbers…" />
            <RepromptBar meetingId={selectedMeetingId} scratch={scratch} />
          </div>
          <div className="min-h-0 min-w-0 overflow-hidden bg-[#fbfaf5] p-6">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Enhanced
            </p>
            <EnhancedNotes json={selected?.enhanced_notes_json ?? null} segments={segments.data ?? []} />
            {(segments.data?.length ?? 0) > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Transcript
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
                  {segments.data?.map((s) => (
                    <p key={s.id} className="leading-relaxed">
                      <span className="font-medium text-muted-foreground">{s.speaker}</span>{" "}
                      <span className={s.speaker === "me" ? "" : "ai-text"}>{s.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
            {recipeOut && (
              <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/70 p-3 text-xs">
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

function groupMeetings(items: Meeting[]) {
  const map: Record<string, Meeting[]> = {};
  for (const m of items) {
    const key = formatDay(m.date);
    map[key] = [...(map[key] ?? []), m];
  }
  return map;
}

function RepromptBar({ meetingId, scratch }: { meetingId: string | null; scratch: string }) {
  const [instruction, setInstruction] = useState("");
  const [out, setOut] = useState("");
  if (!meetingId) return null;
  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="mb-2 text-[11px] text-muted-foreground">Rewrite selection</p>
      <div className="flex min-w-0 flex-wrap gap-1">
        {["Make more concise", "Add more quotes", "Rephrase for executives"].map((chip) => (
          <Button
            key={chip}
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              setOut(await api.repromptSelection(meetingId, scratch, chip));
            }}
          >
            {chip}
          </Button>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <input
          className="h-8 flex-1 rounded-full border border-input bg-background px-3 text-xs"
          placeholder="Custom rewrite…"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button
          size="sm"
          className="rounded-full"
          onClick={async () => {
            if (!instruction) return;
            setOut(await api.repromptSelection(meetingId, scratch, instruction));
          }}
        >
          Go
        </Button>
      </div>
      {out && <p className="mt-2 text-xs leading-relaxed ai-text">{out}</p>}
    </div>
  );
}

function ChatDrawer({ meetingId, folderId }: { meetingId: string | null; folderId: string | null }) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<{ q: string; a: string }[]>([]);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  return (
    <aside className="flex w-[22rem] shrink-0 flex-col border-l border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-xl">Chat</p>
          <p className="text-[11px] text-muted-foreground">This meeting, this folder, or everything</p>
        </div>
        <button className="text-xs text-muted-foreground" onClick={() => setChatOpen(false)}>
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto">
        {turns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask what pricing objections came up, or what you promised last week.
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i}>
            <p className="text-sm font-medium">{t.q}</p>
            <p className="ai-text mt-1 whitespace-pre-wrap text-sm leading-relaxed">{t.a}</p>
          </div>
        ))}
      </div>
      <textarea
        className="mt-3 min-h-20 rounded-xl border border-input bg-background p-2 text-sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="What did we decide?"
      />
      <Button
        className="mt-2 rounded-full"
        onClick={async () => {
          if (!q.trim()) return;
          const a = await api.askBagrry(q, folderId, meetingId);
          setTurns((prev) => [...prev, { q, a }]);
          setQ("");
        }}
      >
        Ask
      </Button>
    </aside>
  );
}

function LiveDrawer() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [live, setLive] = useState("");
  const setLiveOpen = useAppStore((s) => s.setLiveOpen);
  return (
    <aside className="flex w-[22rem] shrink-0 flex-col border-l border-border bg-card p-4">
      <div className="mb-3 flex justify-between">
        <p className="font-display text-xl">Ask live</p>
        <button className="text-xs text-muted-foreground" onClick={() => setLiveOpen(false)}>
          Close
        </button>
      </div>
      <textarea
        className="mb-2 min-h-24 rounded-xl border border-input bg-background p-2 text-xs"
        placeholder="Rolling notes from the last few minutes…"
        value={live}
        onChange={(e) => setLive(e.target.value)}
      />
      <input
        className="h-9 rounded-full border border-input bg-background px-3 text-sm"
        placeholder="What budget figure did they mention?"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button className="mt-2 rounded-full" onClick={async () => setA(await api.liveAsk(q, live))}>
        Ask
      </Button>
      <p className="ai-text mt-3 whitespace-pre-wrap text-sm">{a}</p>
    </aside>
  );
}
