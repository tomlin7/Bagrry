import { useQuery } from "@tanstack/react-query";
import { NotebookPen } from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import { useCreateNote } from "@/hooks/useCreateNote";
import { useChat } from "@/hooks/useChat";
import { ComingUp } from "@/components/home/ComingUp";
import { ActionItemsStrip } from "@/components/home/ActionItemsStrip";
import { NoteList } from "@/components/notes/NoteList";
import { AskBar, RecipeChips } from "@/components/chat/AskBar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export function HomePage() {
  const createNote = useCreateNote();
  const navigate = useAppStore((s) => s.navigate);
  const { send, pending } = useChat(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: api.qk.meetings(),
    queryFn: () => api.listMeetings(),
  });

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-6 pb-40 pt-2">
          <ComingUp />
          <ActionItemsStrip />

          <div className="mt-8">
            <NoteList
              notes={notes}
              loading={isLoading}
              emptyState={
                <EmptyState
                  icon={<NotebookPen />}
                  title="Your meeting notes will appear here"
                  description="Start a note and Bagrry will listen, transcribe and summarise it for you."
                  action={
                    <Button variant="solid" size="md" onClick={() => createNote.mutate({})}>
                      New note
                    </Button>
                  }
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Docked composer — sits above the scroll area on a fade so long lists
          don't run into it. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg to-transparent pb-4 pt-10">
        <div className="pointer-events-auto mx-auto w-full max-w-[720px] px-6">
          <AskBar
            placeholder="Continue chat"
            busy={pending}
            onSubmit={(value) => void send(value)}
          />
          <RecipeChips
            className="mt-2 justify-end"
            limit={1}
            onPick={(prompt) => void send(prompt)}
            onSeeAll={() => navigate({ kind: "chat", sessionId: null })}
          />
        </div>
      </div>
    </div>
  );
}
