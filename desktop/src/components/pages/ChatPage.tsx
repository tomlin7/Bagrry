import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2 } from "lucide-react";
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
          placeholder="What decisions were made?"
          busy={pending}
          onSubmit={(value) => void send(value)}
        />

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
        <div className="mx-auto w-full max-w-[640px] space-y-4 px-6 py-6">
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
          <AskBar autoFocus placeholder="Ask anything" busy={pending} onSubmit={(v) => void send(v)} />
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

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-text">{content}</div>
  );
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
