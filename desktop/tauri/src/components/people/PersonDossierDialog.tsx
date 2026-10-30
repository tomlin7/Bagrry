import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  ExternalLink,
  EyeOff,
  GitMerge,
  Mail,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import * as api from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAppStore } from "@/store/app";
import { formatDayLabel, formatDuration } from "@/lib/format";
import { Avatar, EmptyState, Skeleton } from "@/components/ui/misc";
import type { ActionItem, Meeting } from "@/lib/types";

export function PersonDossierDialog({
  personId,
  open,
  onOpenChange,
}: {
  personId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const openNote = useAppStore((s) => s.openNote);

  const [activeTab, setActiveTab] = useState<"meetings" | "tasks" | "notes">("meetings");
  const [isEditing, setIsEditing] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [selectedMergeId, setSelectedMergeId] = useState<string>("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editExcluded, setEditExcluded] = useState(false);

  const { data: dossier, isLoading, refetch } = useQuery({
    queryKey: api.qk.personDossier(personId || ""),
    queryFn: () => api.getPersonDossier(personId!),
    enabled: open && Boolean(personId),
  });

  const { data: allPeople = [] } = useQuery({
    queryKey: api.qk.people(),
    queryFn: api.listPeople,
    enabled: showMerge,
  });

  // Start edit
  const startEdit = () => {
    if (!dossier) return;
    setEditName(dossier.person.name);
    setEditEmail(dossier.person.email || "");
    setEditRole(dossier.person.role || "");
    setEditCompany(dossier.person.company_name || "");
    setEditNotes(dossier.person.notes || "");
    setEditExcluded(Boolean(dossier.person.excluded));
    setIsEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!personId) return;
      return api.updatePerson({
        id: personId,
        name: editName,
        email: editEmail.trim() || null,
        role: editRole.trim() || null,
        companyName: editCompany.trim() || null,
        notes: editNotes.trim() || null,
        excluded: editExcluded,
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
      void queryClient.invalidateQueries({ queryKey: api.qk.personDossier(personId!) });
    },
  });

  const toggleActionMutation = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      await api.setActionItemDone(id, done);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.personDossier(personId!) });
      void queryClient.invalidateQueries({ queryKey: api.qk.actionItems() });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async (duplicateId: string) => {
      if (!personId) return;
      await api.mergePeople(personId, duplicateId);
    },
    onSuccess: () => {
      setShowMerge(false);
      setSelectedMergeId("");
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
      void queryClient.invalidateQueries({ queryKey: api.qk.personDossier(personId!) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!personId) return;
      await api.deletePerson(personId);
    },
    onSuccess: () => {
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: api.qk.people() });
    },
  });

  if (!open) return null;

  const person = dossier?.person;
  const meetings = dossier?.meetings || [];
  const actionItems = dossier?.action_items || [];
  const catchMeUp = dossier?.catch_me_up_brief;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6 sm:rounded-2xl border-border bg-surface text-text shadow-2xl">
        {isLoading || !person ? (
          <div className="flex flex-col gap-4 py-8">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header / Profile Info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar name={person.name} size={56} className="size-14 text-xl font-bold ring-2 ring-border shadow-sm" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">{person.name}</h2>
                    {person.excluded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-border px-2 py-0.5 text-[11px] font-medium text-subtle">
                        <EyeOff className="size-3" /> Excluded
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                    {person.role && (
                      <span className="font-medium text-text">{person.role}</span>
                    )}
                    {person.company_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3.5 text-subtle" />
                        {person.company_name}
                      </span>
                    )}
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className="flex items-center gap-1 text-accent transition-colors hover:underline"
                        title="Send email"
                      >
                        <Mail className="size-3.5" />
                        {person.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-text"
                  title="Edit details"
                >
                  <Edit3 className="size-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowMerge(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-text"
                  title="Merge duplicate contact"
                >
                  <GitMerge className="size-3.5" />
                  Merge
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-raised/40 p-3 text-center">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">Meetings</p>
                <p className="mt-0.5 text-lg font-semibold text-text">{person.note_count}</p>
              </div>
              <div className="border-x border-border">
                <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">Discussion Time</p>
                <p className="mt-0.5 text-lg font-semibold text-text">
                  {person.total_duration_ms ? formatDuration(person.total_duration_ms) : "0m"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">Open Loops</p>
                <p className="mt-0.5 text-lg font-semibold text-text">
                  {actionItems.filter((i: ActionItem) => !i.done).length}
                </p>
              </div>
            </div>

            {/* Pre-Meeting "Catch Me Up" Briefing Card */}
            {catchMeUp && (
              <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-accent/5 p-4 transition-all">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkles className="size-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider">
                      Catch Me Up · Pre-Meeting Briefing
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-subtle transition-colors hover:text-text"
                    title="Refresh briefing"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </div>
                <div className="prose prose-sm max-w-none text-xs leading-relaxed text-text/90">
                  <div className="whitespace-pre-line font-sans">{catchMeUp}</div>
                </div>
              </div>
            )}

            {/* Edit Profile Form Inline */}
            {isEditing && (
              <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-surface-raised p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text">Edit Contact Details</h4>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-subtle hover:text-text"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-subtle">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-subtle">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-subtle">Job Title / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. VP of Product"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-subtle">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-subtle">Private Notes & Background</label>
                  <textarea
                    rows={2}
                    placeholder="Key facts, context, timezone, or discussion preferences..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-subtle">
                    <input
                      type="checkbox"
                      checked={editExcluded}
                      onChange={(e) => setEditExcluded(e.target.checked)}
                      className="rounded border-border accent-accent"
                    />
                    Exclude from attendee tracking & directory lists
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-subtle hover:bg-hover hover:text-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!editName.trim() || updateMutation.isPending}
                      onClick={() => updateMutation.mutate()}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Merge Duplicate Dialog */}
            {showMerge && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitMerge className="size-4 text-accent" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text">Merge Duplicate Contact</h4>
                  </div>
                  <button type="button" onClick={() => setShowMerge(false)} className="text-subtle hover:text-text">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-xs text-subtle">
                  Choose another contact to merge into <strong>{person.name}</strong>. All past meetings, attendee links, and action items will be reassigned.
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMergeId}
                    onChange={(e) => setSelectedMergeId(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Select contact to merge...</option>
                    {allPeople
                      .filter((p) => p.id !== person.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.email ? `(${p.email})` : ""}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedMergeId || mergeMutation.isPending}
                    onClick={() => mergeMutation.mutate(selectedMergeId)}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50"
                  >
                    {mergeMutation.isPending ? "Merging..." : "Merge"}
                  </button>
                </div>
              </div>
            )}

            {/* Dossier Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("meetings")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "meetings"
                    ? "bg-surface-raised text-text font-semibold shadow-xs"
                    : "text-subtle hover:text-text hover:bg-hover/50"
                }`}
              >
                <Calendar className="size-3.5" />
                Past Meetings ({meetings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "tasks"
                    ? "bg-surface-raised text-text font-semibold shadow-xs"
                    : "text-subtle hover:text-text hover:bg-hover/50"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                Open Loops ({actionItems.length})
              </button>
              {person.notes && (
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === "notes"
                      ? "bg-surface-raised text-text font-semibold shadow-xs"
                      : "text-subtle hover:text-text hover:bg-hover/50"
                  }`}
                >
                  <User className="size-3.5" />
                  Notes & Context
                </button>
              )}
            </div>

            {/* Tab 1: Past Meetings Timeline */}
            {activeTab === "meetings" && (
              <div className="flex flex-col gap-2">
                {meetings.length === 0 ? (
                  <EmptyState
                    title="No shared meetings yet"
                    description="When this contact attends a meeting or calendar sync runs, it will appear here."
                  />
                ) : (
                  meetings.map((meeting: Meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => {
                        onOpenChange(false);
                        openNote(meeting.id);
                      }}
                      className="group flex items-center justify-between rounded-xl border border-border/60 bg-surface-raised/30 p-3 transition-colors hover:border-border hover:bg-hover/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-lg bg-surface border border-border text-subtle group-hover:text-accent">
                          <Calendar className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-text group-hover:text-accent transition-colors">
                            {meeting.title || "Untitled Meeting"}
                          </span>
                          <span className="text-[11px] text-subtle">
                            {formatDayLabel(meeting.date)}
                            {meeting.duration_ms ? ` · ${formatDuration(meeting.duration_ms)}` : ""}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="size-3.5 text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Action Items & Open Loops */}
            {activeTab === "tasks" && (
              <div className="flex flex-col gap-2">
                {actionItems.length === 0 ? (
                  <EmptyState
                    title="No action items found"
                    description="Commitments assigned to or discussed with this person will appear here."
                  />
                ) : (
                  actionItems.map((item: ActionItem) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-surface-raised/30 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleActionMutation.mutate({ id: item.id, done: !item.done })}
                          className="mt-0.5 text-subtle transition-colors hover:text-accent"
                        >
                          {item.done ? (
                            <CheckCircle2 className="size-4 text-accent" />
                          ) : (
                            <Circle className="size-4 text-subtle" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs ${
                              item.done ? "line-through text-subtle" : "text-text font-medium"
                            }`}
                          >
                            {item.task}
                          </span>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-subtle">
                            {item.owner && (
                              <span className="rounded bg-surface px-1.5 py-0.5 border border-border">
                                {item.owner}
                              </span>
                            )}
                            <span>from {item.meeting_title}</span>
                            {item.deadline && (
                              <span className="flex items-center gap-1 text-accent">
                                <Clock className="size-3" />
                                {formatDayLabel(item.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Notes & Context */}
            {activeTab === "notes" && person.notes && (
              <div className="rounded-xl border border-border bg-surface-raised/40 p-4">
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Private Dossier Notes</h5>
                <p className="mt-2 whitespace-pre-wrap text-xs text-text leading-relaxed">
                  {person.notes}
                </p>
              </div>
            )}

            {/* Footer / Delete Danger zone */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-subtle">
              <span>Contact ID: {person.id}</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${person.name}?`)) {
                    deleteMutation.mutate();
                  }
                }}
                className="flex items-center gap-1 text-rose-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="size-3" />
                Delete Contact
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
