import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export function ActionItemsStrip() {
  const openNote = useAppStore((s) => s.openNote);
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: api.qk.actionItems(),
    queryFn: api.listActionItems,
  });
  const open = items.filter((item) => !item.done);

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => api.setActionItemDone(id, done),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: api.qk.actionItems() }),
    onError: (e) => toast.error(e),
  });

  if (open.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-text">
        <CheckSquare className="size-4 text-muted" />
        Action items
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {open.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
          >
            <button
              type="button"
              aria-label="Mark done"
              onClick={() => toggle.mutate({ id: item.id, done: true })}
              className="grid size-4 shrink-0 place-items-center rounded-sm border border-border-strong hover:bg-hover"
            />
            <button
              type="button"
              onClick={() => openNote(item.meeting_id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-[13px] text-text">{item.task}</p>
              <p className="truncate text-[11px] text-subtle">
                {item.meeting_title}
                {item.owner ? ` · ${item.owner}` : ""}
                {item.deadline ? ` · ${item.deadline.slice(0, 10)}` : ""}
              </p>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActionCheckbox({ done, className }: { done: boolean; className?: string }) {
  return (
    <span className={cn("size-4 rounded-sm border", done ? "bg-accent border-accent" : "border-border-strong", className)} />
  );
}
