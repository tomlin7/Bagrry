import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/store/app";

/** First line of a question, trimmed — good enough as a session title. */
function titleFromPrompt(prompt: string): string {
  const line = prompt.split("\n")[0].trim();
  return line.length > 48 ? `${line.slice(0, 47)}…` : line || "New chat";
}

/**
 * Owns the send loop for the chat surfaces: persist the question, ask the
 * backend, persist the answer. Creating a session lazily means the sidebar
 * doesn't fill up with empty chats.
 */
export function useChat(sessionId: string | null) {
  const queryClient = useQueryClient();
  const navigate = useAppStore((s) => s.navigate);
  const [pending, setPending] = useState(false);
  const [streamingQuestion, setStreamingQuestion] = useState<string | null>(null);

  const send = useCallback(
    async (prompt: string, options?: { spaceId?: string | null; meetingId?: string | null }) => {
      if (!prompt.trim() || pending) return;
      setPending(true);
      setStreamingQuestion(prompt);

      let activeId = sessionId;
      try {
        if (!activeId) {
          const session = await api.createChatSession(titleFromPrompt(prompt), options?.spaceId ?? null);
          activeId = session.id;
          void queryClient.invalidateQueries({ queryKey: api.qk.chatSessions() });
          navigate({ kind: "chat", sessionId: session.id }, { replace: true });
        }

        await api.appendChatMessage(activeId, "user", prompt);
        void queryClient.invalidateQueries({ queryKey: api.qk.chatMessages(activeId) });
        setStreamingQuestion(null);

        const answer = await api.askBagrry(prompt, options?.spaceId ?? null, options?.meetingId ?? null);
        await api.appendChatMessage(activeId, "assistant", answer);
      } catch (error) {
        toast.error(error);
        // Record the failure in the thread so the question isn't left dangling.
        if (activeId) {
          await api
            .appendChatMessage(activeId, "assistant", "I couldn't answer that. Please try again.")
            .catch(() => undefined);
        }
      } finally {
        setStreamingQuestion(null);
        setPending(false);
        if (activeId) {
          void queryClient.invalidateQueries({ queryKey: api.qk.chatMessages(activeId) });
          void queryClient.invalidateQueries({ queryKey: api.qk.chatSessions() });
        }
      }
    },
    [navigate, pending, queryClient, sessionId],
  );

  return { send, pending, streamingQuestion };
}
