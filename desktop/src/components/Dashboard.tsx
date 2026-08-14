import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Calendar, CheckSquare, Mic, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { formatDay, formatWhen, greeting } from "@/lib/format";
import { useAppStore } from "@/store/app";

export function Dashboard() {
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  const setPage = useAppStore((s) => s.setPage);
  const recState = useAppStore((s) => s.recState);

  const meetings = useQuery({ queryKey: ["meetings", null], queryFn: () => api.listMeetings(null) });
  const calendar = useQuery({ queryKey: ["calendar"], queryFn: api.listCalendar });
  const people = useQuery({ queryKey: ["people"], queryFn: api.listPeople });
  const actions = useQuery({ queryKey: ["actions"], queryFn: api.listActionItems });
  const status = useQuery({ queryKey: ["db-status"], queryFn: api.dbStatus });

  const recent = meetings.data?.slice(0, 5) ?? [];
  const upcoming = calendar.data?.slice(0, 4) ?? [];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Home</p>
            <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight">{greeting()}.</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Your meeting memory on this machine. Capture without a bot, enhance when you’re ready.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setPage("calendar")}>
              <Calendar className="h-4 w-4" />
              Prep a brief
            </Button>
            <Button className="rounded-full" onClick={() => setPage("notes")}>
              <Mic className="h-4 w-4" />
              {recState === "recording" ? "Recording…" : "New notepad"}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Meetings" value={String(status.data?.meeting_count ?? recent.length)} hint="Searchable locally" />
          <Stat label="People" value={String(people.data?.length ?? 0)} hint="From calendar & notes" />
          <Stat label="Open actions" value={String(actions.data?.length ?? 0)} hint="Owners and deadlines" />
          <Stat
            label="Groq"
            value={status.data?.groq_configured ? "Connected" : "BYOK"}
            hint={status.data?.groq_configured ? "Whisper + Llama ready" : "Add a key in Settings"}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <RowHead title="Recent notes" action="All notes" onAction={() => setPage("notes")} />
            <div className="mt-3 space-y-2">
              {recent.length === 0 && <Empty>No meetings yet. Open the notepad and hit Record.</Empty>}
              {recent.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMeeting(m.id)}
                  className="paper-card flex w-full items-start justify-between rounded-2xl border border-border px-5 py-4 text-left transition hover:-translate-y-px"
                >
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {m.scratchpad_raw || "Empty scratchpad — enhance after the call."}
                    </p>
                  </div>
                  <span className="shrink-0 pl-4 text-xs text-muted-foreground">{formatDay(m.date)}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section>
              <RowHead title="Coming up" action="Calendar" onAction={() => setPage("calendar")} />
              <div className="mt-3 space-y-2">
                {upcoming.length === 0 && <Empty>Add a local event to generate a pre-meeting brief.</Empty>}
                {upcoming.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(e.start_at)}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <RowHead title="Action items" action="All" onAction={() => setPage("actions")} />
              <div className="mt-3 space-y-2">
                {(actions.data ?? []).slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectMeeting(a.meeting_id)}
                    className="flex w-full items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left"
                  >
                    <CheckSquare className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                      <span className="block text-sm">{a.task}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {a.owner ?? "Unassigned"} · {a.meeting_title}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Promo
            icon={<Sparkles className="h-4 w-4" />}
            title="Enhance, don’t replace"
            body="Your bullets stay in ink. AI expansions sit in gray, with citations you can zoom into."
            cta="Open notes"
            onClick={() => setPage("notes")}
          />
          <Promo
            icon={<Users className="h-4 w-4" />}
            title="People graph"
            body="Every attendee becomes a thread: meetings, companies, and follow-ups in one place."
            cta="Browse people"
            onClick={() => setPage("people")}
          />
          <Promo
            icon={<Calendar className="h-4 w-4" />}
            title="Ask across meetings"
            body="Chat your history instead of digging through folders. Scope to a client or a team."
            cta="Ask Bagrry"
            onClick={() => setPage("search")}
          />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function RowHead({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-display text-2xl">{title}</h2>
      <button type="button" className="text-xs text-primary" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function Promo({
  icon,
  title,
  body,
  cta,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary">{icon}</div>
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <button type="button" className="mt-3 text-sm text-primary" onClick={onClick}>
        {cta} →
      </button>
    </article>
  );
}
