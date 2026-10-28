import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NoteList } from "@/components/notes/NoteList";
import { EmptyState, Skeleton } from "@/components/ui/misc";

export function PersonNotesDialog({
  personId,
  name,
  open,
  onOpenChange,
}: {
  personId: string | null;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["meetings-for-person", personId],
    queryFn: () => api.meetingsForPerson(personId!),
    enabled: open && Boolean(personId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>Notes this person attended.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : notes.length === 0 ? (
          <EmptyState title="No notes yet" description="They’ll show up here after you add them to a meeting." />
        ) : (
          <NoteList
            notes={notes}
            emptyState={null}
            className="px-0"
          />
        )}
        {notes.length > 0 && (
          <p className="mt-2 text-xs text-subtle">Click a note to open it.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CompanyNotesDialog({
  companyName,
  domain,
  open,
  onOpenChange,
}: {
  companyName: string;
  domain: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: api.qk.meetings(),
    queryFn: () => api.listMeetings(),
    enabled: open,
  });
  const needle = (domain || companyName).toLowerCase();
  const notes = meetings.filter((m) => `${m.title} ${m.scratchpad_raw}`.toLowerCase().includes(needle));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{companyName}</DialogTitle>
          <DialogDescription>Notes that mention this company.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : notes.length === 0 ? (
          <EmptyState title="No matching notes" />
        ) : (
          <NoteList notes={notes} emptyState={null} />
        )}
      </DialogContent>
    </Dialog>
  );
}
