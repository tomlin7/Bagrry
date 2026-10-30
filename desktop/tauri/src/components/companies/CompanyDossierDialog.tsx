import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import * as api from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAppStore } from "@/store/app";
import { formatDayLabel, formatDuration } from "@/lib/format";
import { Avatar, EmptyState, Skeleton } from "@/components/ui/misc";
import type { ActionItem, Meeting, Person } from "@/lib/types";

export function CompanyDossierDialog({
  companyId,
  open,
  onOpenChange,
  onSelectPerson,
}: {
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPerson?: (personId: string) => void;
}) {
  const queryClient = useQueryClient();
  const openNote = useAppStore((s) => s.openNote);

  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "meetings" | "tasks">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: dossier, isLoading } = useQuery({
    queryKey: api.qk.companyDossier(companyId || ""),
    queryFn: () => api.getCompanyDossier(companyId!),
    enabled: open && Boolean(companyId),
  });

  const startEdit = () => {
    if (!dossier) return;
    setEditName(dossier.company.name);
    setEditDomain(dossier.company.domain || "");
    setIsEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) return;
      return api.updateCompany(companyId, editName, editDomain || null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.companyDossier(companyId || "") });
      void queryClient.invalidateQueries({ queryKey: api.qk.companies() });
      setIsEditing(false);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.setActionItemDone(id, done),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.companyDossier(companyId || "") });
      void queryClient.invalidateQueries({ queryKey: api.qk.actionItems() });
    },
  });

  const copyBrief = () => {
    if (!dossier?.account_brief) return;
    void navigator.clipboard.writeText(dossier.account_brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-bg-surface border border-border-hairline shadow-2xl rounded-2xl">
        {isLoading || !dossier ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-48 h-5" />
                <Skeleton className="w-32 h-3.5" />
              </div>
            </div>
            <Skeleton className="w-full h-32 rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-border-hairline bg-bg/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-accent-olive/10 border border-accent-olive/20 flex items-center justify-center text-accent-olive font-semibold text-lg">
                    {dossier.company.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-text-primary tracking-tight">
                      {dossier.company.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-tertiary">
                      {dossier.company.domain && (
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Globe className="w-3.5 h-3.5" />
                          {dossier.company.domain}
                        </span>
                      )}
                      <span>•</span>
                      <span>{dossier.meetings.length} meeting(s)</span>
                      <span>•</span>
                      <span>{dossier.attendees.length} contact(s)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={startEdit}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                    title="Edit company details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <div className="mt-4 p-4 rounded-xl bg-bg-elevated border border-border-hairline space-y-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Edit Company Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-text-tertiary">Company Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg bg-bg border border-border-hairline text-text-primary focus:outline-none focus:border-accent-olive"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-text-tertiary">Domain</label>
                      <input
                        type="text"
                        value={editDomain}
                        onChange={(e) => setEditDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg bg-bg border border-border-hairline text-text-primary focus:outline-none focus:border-accent-olive"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs rounded-lg text-text-secondary hover:bg-bg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending || !editName.trim()}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-olive text-white hover:bg-accent-olive/90 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1 mt-6 border-b border-border-hairline -mb-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-accent-olive text-text-primary"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("contacts")}
                  className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === "contacts"
                      ? "border-accent-olive text-text-primary"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  Contacts ({dossier.attendees.length})
                </button>
                <button
                  onClick={() => setActiveTab("meetings")}
                  className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === "meetings"
                      ? "border-accent-olive text-text-primary"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  Meetings ({dossier.meetings.length})
                </button>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === "tasks"
                      ? "border-accent-olive text-text-primary"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  Open Loops ({dossier.action_items.filter((a) => !a.done).length})
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 overflow-y-auto space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Account brief card */}
                  {dossier.account_brief && (
                    <div className="p-4 rounded-xl bg-accent-olive/5 border border-accent-olive/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-accent-olive uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          Account Intelligence Brief
                        </div>
                        <button
                          onClick={copyBrief}
                          className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-primary"
                        >
                          <Copy className="w-3 h-3" />
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-line font-mono bg-bg/40 p-3 rounded-lg border border-border-hairline">
                        {dossier.account_brief}
                      </div>
                    </div>
                  )}

                  {/* Quick Contacts preview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Key Stakeholders ({dossier.attendees.length})
                      </h4>
                      <button
                        onClick={() => setActiveTab("contacts")}
                        className="text-xs text-accent-olive hover:underline"
                      >
                        View all
                      </button>
                    </div>

                    {dossier.attendees.length === 0 ? (
                      <div className="text-xs text-text-tertiary py-3 text-center border border-dashed border-border-hairline rounded-xl">
                        No individual contacts associated with this domain yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {dossier.attendees.slice(0, 4).map((person: Person) => (
                          <div
                            key={person.id}
                            onClick={() => onSelectPerson?.(person.id)}
                            className="p-3 rounded-xl bg-bg border border-border-hairline hover:border-border-hairline-strong transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={person.name} size={28} />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-text-primary truncate group-hover:text-accent-olive transition-colors">
                                  {person.name}
                                </div>
                                <div className="text-[11px] text-text-tertiary truncate">
                                  {person.role || person.email || "Contact"}
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Meetings preview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Recent Meetings
                      </h4>
                      <button
                        onClick={() => setActiveTab("meetings")}
                        className="text-xs text-accent-olive hover:underline"
                      >
                        View all
                      </button>
                    </div>

                    {dossier.meetings.length === 0 ? (
                      <div className="text-xs text-text-tertiary py-3 text-center border border-dashed border-border-hairline rounded-xl">
                        No recorded meetings with this organization yet.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {dossier.meetings.slice(0, 3).map((meeting: Meeting) => (
                          <div
                            key={meeting.id}
                            onClick={() => {
                              onOpenChange(false);
                              openNote(meeting.id);
                            }}
                            className="p-2.5 rounded-xl bg-bg border border-border-hairline hover:border-border-hairline-strong transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                              <span className="text-xs font-medium text-text-primary truncate group-hover:text-accent-olive">
                                {meeting.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-text-tertiary">
                              {formatDayLabel(meeting.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "contacts" && (
                <div className="space-y-2">
                  {dossier.attendees.length === 0 ? (
                    <EmptyState
                      icon={<Users className="w-5 h-5" />}
                      title="No contacts found"
                      description="Attendee profiles matching this domain will appear here."
                    />
                  ) : (
                    dossier.attendees.map((person: Person) => (
                      <div
                        key={person.id}
                        onClick={() => onSelectPerson?.(person.id)}
                        className="p-3 rounded-xl bg-bg border border-border-hairline hover:border-border-hairline-strong transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={person.name} size={32} />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-text-primary group-hover:text-accent-olive transition-colors truncate">
                              {person.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                              {person.role && <span>{person.role}</span>}
                              {person.role && person.email && <span>•</span>}
                              {person.email && <span>{person.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-text-tertiary">
                            {person.note_count} call(s)
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-primary" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "meetings" && (
                <div className="space-y-2">
                  {dossier.meetings.length === 0 ? (
                    <EmptyState
                      icon={<Calendar className="w-5 h-5" />}
                      title="No meetings recorded"
                      description="Meetings with attendees from this company will appear here."
                    />
                  ) : (
                    dossier.meetings.map((meeting: Meeting) => (
                      <div
                        key={meeting.id}
                        onClick={() => {
                          onOpenChange(false);
                          openNote(meeting.id);
                        }}
                        className="p-3.5 rounded-xl bg-bg border border-border-hairline hover:border-border-hairline-strong transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-medium text-text-primary group-hover:text-accent-olive transition-colors truncate">
                            {meeting.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                            <span>{formatDayLabel(meeting.date)}</span>
                            {meeting.duration_ms && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(meeting.duration_ms)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <ExternalLink className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="space-y-2">
                  {dossier.action_items.length === 0 ? (
                    <EmptyState
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      title="No open loops"
                      description="Action items extracted from meetings with this organization will appear here."
                    />
                  ) : (
                    dossier.action_items.map((task: ActionItem) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-bg border border-border-hairline flex items-start gap-3"
                      >
                        <button
                          aria-label="Toggle task status"
                          onClick={() =>
                            toggleTaskMutation.mutate({
                              id: task.id,
                              done: !task.done,
                            })
                          }
                          className="mt-0.5 text-text-tertiary hover:text-accent-olive transition-colors"
                        >
                          {task.done ? (
                            <CheckCircle2 className="w-4 h-4 text-accent-olive" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs ${
                              task.done
                                ? "line-through text-text-tertiary"
                                : "text-text-primary"
                            }`}
                          >
                            {task.task}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-text-tertiary">
                            <span>Meeting: {task.meeting_title}</span>
                            {task.owner && (
                              <>
                                <span>•</span>
                                <span>Owner: {task.owner}</span>
                              </>
                            )}
                            {task.deadline && (
                              <>
                                <span>•</span>
                                <span>Due: {task.deadline}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
