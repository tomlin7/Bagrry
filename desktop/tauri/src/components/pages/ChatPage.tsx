import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import * as api from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useAppStore } from "@/store/app";
import { useChat } from "@/hooks/useChat";
import { AskBar, RecipeChips } from "@/components/chat/AskBar";
import { Skeleton } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";

export function ChatPage({ sessionId }: { sessionId: string | null }) {
  return sessionId ? <ChatThread sessionId={sessionId} /> : <ChatLanding />;
}

/* ------------------------------------------------------------------ */

const CROSS_MEETING_PROMPTS = [
  "Summarize key decisions made across all meetings this week",
  "What action items or commitments were made to clients?",
  "Which meetings discussed pricing, budgets, or contract terms?",
  "List all open tasks assigned to me across recent calls",
];

function ChatLanding() {
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();
  const { send, pending } = useChat(null);

  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: sessions = [] } = useQuery({
    queryKey: api.qk.chatSessions(),
    queryFn: api.listChatSessions,
  });

  const firstName = (profile?.name || "there").split(" ")[0];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[640px] px-6 pb-16 pt-16">
        <h1 className="font-display mb-5 text-[26px] font-semibold text-text">
          Hi {firstName}, ask anything
        </h1>

        <AskBar
          autoFocus
          placeholder="Ask across all meetings, transcripts, and attendees…"
          busy={pending}
          onSubmit={(value) => void send(value)}
        />

        <section className="mt-8">
          <h2 className="px-1 pb-2 text-[11px] font-semibold text-subtle">
            Cross-Meeting Intelligence
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CROSS_MEETING_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent/40 hover:bg-hover"
              >
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
                <span className="text-[12px] leading-relaxed text-text">{prompt}</span>
              </button>
            ))}
          </div>
        </section>

        {sessions.length > 0 && (
          <section className="mt-8">
            <h2 className="px-1 pb-1 text-[11px] font-semibold text-subtle">Recents</h2>
            {sessions.slice(0, 8).map((session) => (
              <div key={session.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate({ kind: "chat", sessionId: session.id })}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-hover"
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-surface text-subtle">
                    <MessageSquare className="size-3.5" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text">
                    {session.title || "New chat"}
                  </span>
                  <span className="shrink-0 text-[11px] text-subtle">
                    {formatRelative(session.updated_at)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete chat"
                  className="grid size-7 place-items-center rounded-md text-subtle opacity-0 transition-opacity hover:bg-hover hover:text-danger group-hover:opacity-100"
                  onClick={() => {
                    void api.deleteChatSession(session.id).then(
                      () => {
                        void queryClient.invalidateQueries({ queryKey: api.qk.chatSessions() });
                        toast.success("Chat deleted");
                      },
                      (e) => toast.error(e),
                    );
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </section>
        )}

        <section className="mt-8">
          <h2 className="px-1 pb-2 text-[11px] font-semibold text-subtle">Recipes</h2>
          <RecipeChips limit={6} onPick={(prompt) => void send(prompt)} />
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ChatThread({ sessionId }: { sessionId: string }) {
  const { send, pending, streamingQuestion } = useChat(sessionId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: api.qk.chatMessages(sessionId),
    queryFn: () => api.listChatMessages(sessionId),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingQuestion, pending]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] space-y-5 px-6 py-6">
          {isLoading && <Skeleton className="h-16 w-full rounded-xl" />}

          {messages.map((message) =>
            message.role === "user" ? (
              <UserBubble key={message.id} content={message.content} />
            ) : (
              <AssistantMessage key={message.id} content={message.content} />
            ),
          )}

          {streamingQuestion && <UserBubble content={streamingQuestion} />}
          {pending && <ThinkingIndicator />}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 px-6 pb-5">
        <div className="mx-auto w-full max-w-[640px]">
          <AskBar autoFocus placeholder="Ask across meetings…" busy={pending} onSubmit={(v) => void send(v)} />
        </div>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-surface-2 px-3.5 py-2 text-[13px] text-text">
        {content}
      </div>
    </div>
  );
}

export type ParsedCitation = {
  id: string;
  title: string;
};

export function parseAssistantContent(content: string) {
  // Extract confidence tag: [Confidence: High (95%) · Grounded across N meetings]
  const confidenceRegex = /\[Confidence:\s*([^\]]+)\]/i;
  const confMatch = content.match(confidenceRegex);
  const confidenceText = confMatch ? confMatch[1].trim() : null;
  const contentWithoutConf = confMatch ? content.replace(confidenceRegex, "").trim() : content;

  // Extract citation tokens: [[meeting:MEETING_ID:MEETING_TITLE]]
  const citationRegex = /\[\[meeting:([^:]+):([^\]]+)\]\]/g;
  const citedMeetings: ParsedCitation[] = [];
  const seenIds = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = citationRegex.exec(contentWithoutConf)) !== null) {
    const id = m[1].trim();
    const title = m[2].trim();
    if (!seenIds.has(id)) {
      seenIds.add(id);
      citedMeetings.push({ id, title });
    }
  }

  return {
    confidenceText,
    contentWithoutConf,
    citedMeetings,
  };
}

export function AssistantMessage({ content }: { content: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const [copied, setCopied] = useState(false);

  const { confidenceText, contentWithoutConf, citedMeetings } = parseAssistantContent(content);

  const handleCopy = () => {
    // Strip raw tokens for clean clipboard export
    const clean = contentWithoutConf.replace(/\[\[meeting:[^:]+:([^\]]+)\]\]/g, "$1");
    void navigator.clipboard.writeText(clean).then(() => {
      setCopied(true);
      toast.success("Answer copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="group rounded-2xl border border-border/60 bg-surface/80 p-4 shadow-sm transition-colors hover:border-border">
      {/* Confidence Header Badge */}
      {confidenceText && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            <span>Confidence: {confidenceText}</span>
          </span>
        </div>
      )}

      {/* Answer Body with Inline Citation Pills */}
      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-text">
        {renderInlineCitations(contentWithoutConf, (id) => navigate({ kind: "note", noteId: id }))}
      </div>

      {/* Sources and Grounding Footnote Tray */}
      {citedMeetings.length > 0 && (
        <div className="mt-4 rounded-xl border border-border/80 bg-surface-2/60 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-subtle">
            <Sparkles className="size-3 text-accent" />
            <span>Referenced Sources ({citedMeetings.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {citedMeetings.map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => navigate({ kind: "note", noteId: src.id })}
                className="group/pill inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-text transition-colors hover:border-accent hover:bg-hover hover:text-accent"
              >
                <FileText className="size-3 text-subtle group-hover/pill:text-accent" />
                <span className="max-w-[200px] truncate">{src.title}</span>
                <ExternalLink className="size-2.5 text-subtle group-hover/pill:text-accent" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Footer Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-subtle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors hover:bg-hover hover:text-text"
            aria-label="Copy answer"
          >
            {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function renderInlineCitations(text: string, onNavigate: (id: string) => void): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[\[meeting:([^:]+):([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const id = match[1].trim();
    const title = match[2].trim();
    parts.push(
      <button
        key={`${id}-${match.index}`}
        type="button"
        onClick={() => onNavigate(id)}
        className="mx-1 inline-flex cursor-pointer items-center gap-1 rounded-md border border-accent/25 bg-accent/10 px-2 py-0.5 align-baseline text-[12px] font-medium text-accent transition-colors hover:border-accent/40 hover:bg-accent/20"
        title={`Jump to meeting: ${title}`}
      >
        <Calendar className="size-3 shrink-0" />
        <span className="max-w-[180px] truncate">{title}</span>
      </button>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 text-subtle" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-current"
          style={{ animation: `fade-in 700ms ${i * 160}ms ease-in-out infinite alternate` }}
        />
      ))}
    </div>
  );
}
