import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import * as api from "@/lib/api";
import { NoteList } from "@/components/notes/NoteList";
import { EmptyState } from "@/components/ui/misc";

export function SharedPage() {
  const { data: folders = [] } = useQuery({ queryKey: api.qk.folders(), queryFn: api.listFolders });
  const { data: allNotes = [], isLoading } = useQuery({
    queryKey: api.qk.meetings(),
    queryFn: () => api.listMeetings(),
  });

  const sharedFolderIds = new Set(folders.filter((f) => f.is_shared).map((f) => f.id));
  const notes = allNotes.filter((n) => n.folder_id && sharedFolderIds.has(n.folder_id));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-8">
        <header className="flex flex-col items-center text-center">
          <div className="grid size-7 place-items-center rounded-lg bg-hover text-muted">
            <Users className="size-3.5" />
          </div>
          <h1 className="font-display mt-2 text-[30px] font-semibold leading-tight text-text">
            Shared with me
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Notes teammates have shared into your workspace.
          </p>
        </header>

        <div className="mt-8">
          <NoteList
            notes={notes}
            loading={isLoading}
            emptyState={
              <EmptyState
                icon={<Users />}
                title="Nothing shared with you yet"
                description="When a teammate shares a note or a folder, it shows up here."
                dashed
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
