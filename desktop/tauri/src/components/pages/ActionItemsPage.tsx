import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Search,
  Sparkles,
  Trash2,
  CheckCheck,
  User,
  Users,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import type { ActionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { FollowUpDialog } from "@/components/action-items/FollowUpDialog";
import { Tooltip } from "@/components/ui/tooltip";

type FilterTab = "all" | "owed-by-me" | "owed-to-me" | "completed";

export function ActionItemsPage() {
  const queryClient = useQueryClient();
  const openNote = useAppStore((s) => s.openNote);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [newOwnerInput, setNewOwnerInput] = useState("me");

  const { data: items = [], isLoading } = useQuery<ActionItem[]>({
    queryKey: api.qk.actionItems(),
    queryFn: api.listActionItems,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => api.listMeetings(),
  });

  const toggleDoneMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.setActionItemDone(id, done),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.actionItems() });
    },
    onError: (e) => toast.error(e),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteActionItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.actionItems() });
      toast.success("Action item deleted");
    },
    onError: (e) => toast.error(e),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const task = newTaskInput.trim();
      if (!task) return;
      const meetingId = meetings[0]?.id || "mtg_sample";
      await api.addActionItem(meetingId, task, newOwnerInput.trim() || "me", null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.actionItems() });
      setNewTaskInput("");
      toast.success("Loop added");
    },
    onError: (e) => toast.error(e),
  });

  // Filtered lists
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "completed") {
        if (!item.done) return false;
      } else {
        if (item.done) return false;
        if (activeTab === "owed-by-me") {
          const isMe = !item.owner || item.owner.toLowerCase() === "me";
          if (!isMe) return false;
        } else if (activeTab === "owed-to-me") {
          const isMe = !item.owner || item.owner.toLowerCase() === "me";
          if (isMe) return false;
        }
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTask = item.task.toLowerCase().includes(q);
        const matchesOwner = item.owner?.toLowerCase().includes(q);
        const matchesMeeting = item.meeting_title.toLowerCase().includes(q);
        if (!matchesTask && !matchesOwner && !matchesMeeting) return false;
      }

      return true;
    });
  }, [items, activeTab, searchQuery]);

  const counts = useMemo(() => {
    const pending = items.filter((i) => !i.done);
    return {
      all: pending.length,
      owedByMe: pending.filter((i) => !i.owner || i.owner.toLowerCase() === "me").length,
      owedToMe: pending.filter((i) => i.owner && i.owner.toLowerCase() !== "me").length,
      completed: items.filter((i) => i.done).length,
    };
  }, [items]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-8 py-8">
      <div className="mx-auto w-full max-w-[880px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text">
              Open Loops
            </h1>
            <p className="mt-1 text-xs text-muted">
              Aggregate all commitments owed by you and your team across meetings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFollowUpOpen(true)}
              className="gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="size-3.5 text-accent" />
              <span>Draft Follow-Up</span>
            </Button>
          </div>
        </div>

        {/* Quick Add Bar */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/80 p-2 shadow-xs">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMutation.mutate();
              }
            }}
            placeholder="+ Capture new commitment (e.g. Send updated pricing deck to Alex)"
            className="h-8 flex-1 bg-transparent px-2 text-xs text-text outline-none placeholder:text-subtle"
          />

          <div className="flex items-center gap-1.5 border-l border-border pl-2">
            <span className="text-[11px] text-subtle">Assignee:</span>
            <select
              value={newOwnerInput}
              onChange={(e) => setNewOwnerInput(e.target.value)}
              className="h-7 rounded-md border border-border bg-surface-1 px-2 text-[11px] text-text outline-none cursor-pointer"
            >
              <option value="me">Me</option>
              <option value="Alex Chen">Alex Chen</option>
              <option value="Team">Team</option>
            </select>

            <Button
              variant="solid"
              size="sm"
              loading={addMutation.isPending}
              disabled={!newTaskInput.trim()}
              onClick={() => addMutation.mutate()}
              className="h-7 px-3 text-[11px] cursor-pointer"
            >
              Add Loop
            </Button>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 p-1">
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              label="All Open"
              count={counts.all}
            />
            <TabButton
              active={activeTab === "owed-by-me"}
              onClick={() => setActiveTab("owed-by-me")}
              label="Owed by Me"
              count={counts.owedByMe}
              icon={User}
            />
            <TabButton
              active={activeTab === "owed-to-me"}
              onClick={() => setActiveTab("owed-to-me")}
              label="Owed to Me"
              count={counts.owedToMe}
              icon={Users}
            />
            <TabButton
              active={activeTab === "completed"}
              onClick={() => setActiveTab("completed")}
              label="Completed"
              count={counts.completed}
              icon={CheckCheck}
            />
          </div>

          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or people..."
              className="h-8 w-full rounded-lg border border-border bg-surface-2 pl-8 pr-3 text-xs text-text outline-none placeholder:text-subtle focus:border-accent"
            />
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-subtle">Loading commitments…</div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 size-8 text-accent/50" />
              <h3 className="font-display text-sm font-semibold text-text">
                {activeTab === "completed" ? "No completed items" : "All caught up!"}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {activeTab === "completed"
                  ? "Completed tasks will appear here for audit and historical review."
                  : "No open loops matching this filter. Capture action items during calls or add one above."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-xs divide-y divide-border/60">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-hover/40"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      aria-label={item.done ? "Mark incomplete" : "Mark done"}
                      onClick={() =>
                        toggleDoneMutation.mutate({ id: item.id, done: !item.done })
                      }
                      className={cn(
                        "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-md border transition-all cursor-pointer",
                        item.done
                          ? "border-accent bg-accent text-white"
                          : "border-border-strong hover:border-accent hover:bg-hover",
                      )}
                    >
                      {item.done ? (
                        <CheckCheck className="size-3" />
                      ) : (
                        <Circle className="size-3 opacity-0 group-hover:opacity-40" />
                      )}
                    </button>

                    {/* Task text & details */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[13px] leading-snug transition-all",
                          item.done ? "text-subtle line-through" : "text-text font-medium",
                        )}
                      >
                        {item.task}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
                        {/* Assignee badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            !item.owner || item.owner.toLowerCase() === "me"
                              ? "bg-accent/15 text-accent"
                              : "bg-surface-3 text-muted",
                          )}
                        >
                          {!item.owner || item.owner.toLowerCase() === "me" ? "Me" : item.owner}
                        </span>

                        {/* Source meeting */}
                        <button
                          type="button"
                          onClick={() => openNote(item.meeting_id)}
                          className="flex items-center gap-1 text-muted hover:text-accent transition-colors cursor-pointer"
                        >
                          <span className="truncate max-w-[200px]">{item.meeting_title}</span>
                          <ArrowUpRight className="size-2.5 opacity-60" />
                        </button>

                        {/* Deadline badge */}
                        {item.deadline && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted">
                            <Clock className="size-3 text-subtle" />
                            <span>{item.deadline.slice(0, 10)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip label="Delete action item">
                      <button
                        type="button"
                        aria-label="Delete action item"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="grid size-7 place-items-center rounded-lg text-subtle hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: typeof User;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
        active
          ? "bg-surface-1 text-accent shadow-xs"
          : "text-muted hover:text-text",
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.2 font-mono text-[10px]",
          active ? "bg-accent/15 text-accent" : "bg-hover text-subtle",
        )}
      >
        {count}
      </span>
    </button>
  );
}
