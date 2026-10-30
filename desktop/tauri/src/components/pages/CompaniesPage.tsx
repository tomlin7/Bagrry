import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, RefreshCw, Search, Calendar } from "lucide-react";
import * as api from "@/lib/api";
import { CompanyDossierDialog } from "@/components/companies/CompanyDossierDialog";
import { PersonDossierDialog } from "@/components/people/PersonDossierDialog";
import { formatDayLabel } from "@/lib/format";
import { EmptyState, Skeleton } from "@/components/ui/misc";

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: api.qk.companies(),
    queryFn: api.listCompanies,
  });

  const autoIndexMutation = useMutation({
    mutationFn: api.autoIndexCompanies,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.companies() });
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
    },
  });

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.domain && c.domain.toLowerCase().includes(q))
    );
  }, [companies, search]);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg overflow-hidden">
      {/* Top Header */}
      <div className="p-6 border-b border-border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-normal text-text-primary tracking-tight">
            Companies & Organizations
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            Account intelligence, aggregated meeting history, and key stakeholder rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => autoIndexMutation.mutate()}
            disabled={autoIndexMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 border border-border-hairline text-text-primary transition-colors disabled:opacity-50"
            title="Automatically group contacts by corporate domain"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                autoIndexMutation.isPending ? "animate-spin" : ""
              }`}
            />
            {autoIndexMutation.isPending ? "Indexing..." : "Auto-Index Accounts"}
          </button>
        </div>
      </div>

      {/* Search & Metrics Bar */}
      <div className="px-6 py-3 border-b border-border-hairline bg-bg/50 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations or domains..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-bg-surface border border-border-hairline text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-olive transition-colors"
          />
        </div>

        <div className="text-xs text-text-tertiary">
          <span>{filteredCompanies.length} company account(s)</span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-5 h-5" />}
            title={search ? "No matching companies" : "No companies indexed"}
            description={
              search
                ? "Try searching for a different company name or corporate domain."
                : "Record meetings with attendee emails or click 'Auto-Index Accounts' to group contacts by domain."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => setSelectedCompanyId(company.id)}
                className="p-4 rounded-2xl bg-bg-surface border border-border-hairline hover:border-border-hairline-strong hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-olive/10 border border-accent-olive/20 flex items-center justify-center text-accent-olive font-semibold text-sm group-hover:scale-105 transition-transform">
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-text-secondary border border-border-hairline">
                        {company.note_count} call{company.note_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-text-primary group-hover:text-accent-olive transition-colors truncate">
                      {company.name}
                    </h3>
                    {company.domain && (
                      <div className="flex items-center gap-1 text-xs text-text-tertiary mt-0.5 truncate">
                        <Globe className="w-3 h-3 text-text-tertiary flex-shrink-0" />
                        <span>{company.domain}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-hairline/60 flex items-center justify-between text-[11px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {company.last_note_at
                      ? `Last active ${formatDayLabel(company.last_note_at)}`
                      : "No meetings"}
                  </span>
                  <span className="text-accent-olive opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    View Dossier →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dossier Dialogs */}
      <CompanyDossierDialog
        companyId={selectedCompanyId}
        open={Boolean(selectedCompanyId)}
        onOpenChange={(open) => !open && setSelectedCompanyId(null)}
        onSelectPerson={(personId) => {
          setSelectedCompanyId(null);
          setSelectedPersonId(personId);
        }}
      />

      <PersonDossierDialog
        personId={selectedPersonId}
        open={Boolean(selectedPersonId)}
        onOpenChange={(open) => !open && setSelectedPersonId(null)}
      />
    </div>
  );
}
