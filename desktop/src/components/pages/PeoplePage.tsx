import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import * as api from "@/lib/api";
import { mergeSelfIntoPeople } from "@/lib/directory";
import { DirectoryEmpty, DirectoryFilter, DirectoryPanel } from "@/components/directory/DirectoryPanel";
import { PersonNotesDialog } from "@/components/directory/EntityDialogs";

export function PeoplePage() {
  const [scope, setScope] = useState<"everyone" | "met">("everyone");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: people = [] } = useQuery({ queryKey: api.qk.people(), queryFn: api.listPeople });
  const { data: meetings = [] } = useQuery({ queryKey: api.qk.meetings(), queryFn: () => api.listMeetings() });

  const merged = useMemo(() => mergeSelfIntoPeople(people, profile, meetings), [meetings, people, profile]);
  const metCount = merged.filter((person) => !person.is_me && person.note_count > 0).length;
  const scoped = scope === "met" ? merged.filter((person) => !person.is_me && person.note_count > 0) : merged;

  const rows = scoped.map((person) => ({
    id: person.id,
    title: person.is_me ? `${person.name} (me)` : person.name,
    subtitle: person.email,
    avatarName: person.name,
    lastNoteAt: person.last_note_at,
    noteCount: person.note_count,
  }));

  return (
    <>
      <DirectoryPanel
        title="People"
        subjectColumn="Person"
        searchPlaceholder="Search people"
        onRowClick={(id) => {
          const person = scoped.find((p) => p.id === id);
          if (person) setSelected({ id: person.id, name: person.name });
        }}
        filters={
          <DirectoryFilter
            value={scope}
            onChange={(id) => setScope(id as "everyone" | "met")}
            options={[
              { id: "everyone", label: "Everyone" },
              { id: "met", label: "People I met" },
            ]}
          />
        }
        rows={rows}
        empty={
          metCount === 0 ? (
            <DirectoryEmpty icon={<Users />}>People you meet in Bagrry will appear here.</DirectoryEmpty>
          ) : null
        }
      />
      <PersonNotesDialog
        personId={selected?.id ?? null}
        name={selected?.name ?? ""}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

