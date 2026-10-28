import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import * as api from "@/lib/api";
import { mergeDomainCompanies, mergeSelfIntoPeople } from "@/lib/directory";
import { DirectoryEmpty, DirectoryFilter, DirectoryPanel } from "@/components/directory/DirectoryPanel";
import { CompanyNotesDialog } from "@/components/directory/EntityDialogs";

export function CompaniesPage() {
  const [scope, setScope] = useState<"all" | "met">("all");
  const [selected, setSelected] = useState<{ name: string; domain: string | null } | null>(null);
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: people = [] } = useQuery({ queryKey: api.qk.people(), queryFn: api.listPeople });
  const { data: companies = [] } = useQuery({ queryKey: api.qk.companies(), queryFn: api.listCompanies });
  const { data: meetings = [] } = useQuery({ queryKey: api.qk.meetings(), queryFn: () => api.listMeetings() });

  const { rows, metCount } = useMemo(() => {
    const mergedPeople = mergeSelfIntoPeople(people, profile, meetings);
    const merged = mergeDomainCompanies(companies, mergedPeople, meetings);
    const selfDomain = mergedPeople.find((person) => person.is_me)?.domain?.toLowerCase();
    const met = merged.filter((company) => {
      const domain = company.domain?.toLowerCase();
      return company.note_count > 0 && domain !== selfDomain;
    });
    const scoped = scope === "met" ? met : merged;
    return {
      metCount: met.length,
      rows: scoped.map((company) => ({
        id: company.id,
        title: company.name,
        subtitle: company.domain,
        avatarName: company.name,
        lastNoteAt: company.last_note_at,
        noteCount: company.note_count,
      })),
    };
  }, [companies, meetings, people, profile, scope]);

  return (
    <>
      <DirectoryPanel
        title="Companies"
        subjectColumn="Company"
        searchPlaceholder="Search companies"
        onRowClick={(id) => {
          const company = rows.find((r) => r.id === id);
          if (company) setSelected({ name: company.title, domain: company.subtitle ?? null });
        }}
      filters={
        <DirectoryFilter
          variant="pill-link"
          value={scope}
          onChange={(id) => setScope(id as "all" | "met")}
          options={[
            { id: "all", label: "All companies" },
            { id: "met", label: "Companies I met" },
          ]}
        />
      }
      rows={rows}
      empty={
        metCount === 0 ? (
          <DirectoryEmpty icon={<Building2 />}>Companies of people you meet in Bagrry will appear here.</DirectoryEmpty>
        ) : null
      }
      />
      <CompanyNotesDialog
        companyName={selected?.name ?? ""}
        domain={selected?.domain ?? null}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
