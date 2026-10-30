import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, UserCheck, UserPlus, Users } from "lucide-react";
import * as api from "@/lib/api";
import { mergeSelfIntoPeople } from "@/lib/directory";
import { DirectoryEmpty, DirectoryFilter, DirectoryPanel } from "@/components/directory/DirectoryPanel";
import { PersonDossierDialog } from "@/components/people/PersonDossierDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PeoplePage() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"everyone" | "met" | "excluded">("everyone");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: people = [] } = useQuery({ queryKey: api.qk.people(), queryFn: api.listPeople });
  const { data: meetings = [] } = useQuery({ queryKey: api.qk.meetings(), queryFn: () => api.listMeetings() });

  const indexMutation = useMutation({
    mutationFn: () => api.indexAllAttendees(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
      void queryClient.invalidateQueries({ queryKey: api.qk.calendar() });
    },
  });

  const addPersonMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) return;
      return api.upsertPerson(newName.trim(), newEmail.trim() || null);
    },
    onSuccess: (newPerson) => {
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
      if (newPerson) {
        setSelectedPersonId(newPerson.id);
      }
    },
  });

  const merged = useMemo(() => mergeSelfIntoPeople(people, profile, meetings), [meetings, people, profile]);
  const metCount = merged.filter((person) => !person.is_me && person.note_count > 0).length;

  const scoped = useMemo(() => {
    if (scope === "met") {
      return merged.filter((person) => !person.is_me && person.note_count > 0 && !person.excluded);
    }
    if (scope === "excluded") {
      return merged.filter((person) => person.excluded);
    }
    // "everyone"
    return merged.filter((person) => !person.excluded);
  }, [merged, scope]);

  const rows = scoped.map((person) => {
    const subtitleParts = [
      person.role,
      person.company_name,
      person.email,
    ].filter(Boolean);

    return {
      id: person.id,
      title: person.is_me ? `${person.name} (me)` : person.name,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : null,
      avatarName: person.name,
      lastNoteAt: person.last_note_at,
      noteCount: person.note_count,
    };
  });

  return (
    <>
      <DirectoryPanel
        title="People"
        subjectColumn="Person"
        searchPlaceholder="Search people"
        onRowClick={(id) => {
          setSelectedPersonId(id);
        }}
        filters={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => indexMutation.mutate()}
              disabled={indexMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-text disabled:opacity-50"
              title="Automatically index attendees from calendar events & meetings"
            >
              <RefreshCw className={`size-3.5 ${indexMutation.isPending ? "animate-spin text-accent" : ""}`} />
              Index Attendees
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90"
              title="Add a new contact"
            >
              <Plus className="size-3.5" />
              Add Contact
            </button>
            <DirectoryFilter
              value={scope}
              onChange={(id) => setScope(id as "everyone" | "met" | "excluded")}
              options={[
                { id: "everyone", label: "Everyone" },
                { id: "met", label: "People I met" },
                { id: "excluded", label: "Excluded" },
              ]}
            />
          </div>
        }
        rows={rows}
        empty={
          metCount === 0 && scope === "met" ? (
            <DirectoryEmpty icon={<Users />}>People you meet in Bagrry will appear here.</DirectoryEmpty>
          ) : scope === "excluded" && rows.length === 0 ? (
            <DirectoryEmpty icon={<UserCheck />}>No excluded contacts.</DirectoryEmpty>
          ) : null
        }
      />

      {/* Person Dossier Modal */}
      <PersonDossierDialog
        personId={selectedPersonId}
        open={Boolean(selectedPersonId)}
        onOpenChange={(open) => !open && setSelectedPersonId(null)}
      />

      {/* Quick Add Contact Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md p-6 sm:rounded-2xl border-border bg-surface text-text shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <UserPlus className="size-4 text-accent" />
              Add New Contact
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPersonMutation.mutate();
            }}
            className="flex flex-col gap-4 pt-2"
          >
            <div>
              <label className="text-xs font-medium text-subtle">Full Name *</label>
              <input
                autoFocus
                type="text"
                required
                placeholder="e.g. Jordan Miller"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-subtle">Email Address</label>
              <input
                type="email"
                placeholder="e.g. jordan@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-subtle hover:bg-hover hover:text-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || addPersonMutation.isPending}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
              >
                {addPersonMutation.isPending ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
