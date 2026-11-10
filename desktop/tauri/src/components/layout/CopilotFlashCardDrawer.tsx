import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ExternalLink,
  GitPullRequest,
  History,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";

export function CopilotFlashCardDrawer({
  meetingId,
  onQuoteToNotes,
}: {
  meetingId: string;
  onQuoteToNotes?: (snippet: string) => void;
}) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const { data: cards = [] } = useQuery({
    queryKey: api.qk.copilotFlashCards(meetingId),
    queryFn: () => api.listCopilotFlashCards(meetingId),
    refetchInterval: 5000,
  });

  const dismissMutation = useMutation({
    mutationFn: (cardId: string) => api.dismissCopilotFlashCard(cardId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.copilotFlashCards(meetingId) });
    },
  });

  const createSample = useMutation({
    mutationFn: () => {
      const isLinear = cards.length % 2 === 0;
      return api.createCopilotFlashCard(
        meetingId,
        isLinear ? "ENG-402 billing webhook fix" : "Did we agree on Q4 pricing terms?",
        isLinear ? "linear" : "meeting_memory",
        isLinear ? "Linear ENG-402 · Fix Stripe Webhook Signature Check" : "Meeting Decision · Q4 Enterprise Tier",
        isLinear
          ? "Status: Merged to main. Deployed to production on Nov 2nd by @sarah."
          : "Agreed in Sept 14 Executive Review: Standardize \$20/seat/mo with 15% annual commitment discount.",
        isLinear ? "https://linear.app/team/issue/ENG-402" : undefined,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.copilotFlashCards(meetingId) });
      toast.success("Triggered proactive flash card");
    },
  });

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-between border-t border-border/50 bg-surface/30 px-3 py-1.5 text-[11px] text-subtle">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-accent" />
          <span>Proactive Copilot: Listening for ticket numbers & agreements</span>
        </div>
        <button
          type="button"
          onClick={() => createSample.mutate()}
          className="text-[10px] font-medium text-accent hover:underline cursor-pointer"
        >
          + Simulate Trigger
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border/60 bg-surface/70 backdrop-blur-md px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-accent animate-pulse" />
          <span className="text-xs font-semibold text-text">
            Proactive Flash Cards ({cards.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => createSample.mutate()}
            className="text-[10px] font-medium text-subtle hover:text-text cursor-pointer"
          >
            + Test Trigger
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="grid size-5 place-items-center rounded text-subtle hover:text-text cursor-pointer"
          >
            <ChevronDown className={`size-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
          <AnimatePresence initial={false}>
            {cards.map((card) => {
              const Icon =
                card.source_type === "linear"
                  ? Ticket
                  : card.source_type === "github"
                  ? GitPullRequest
                  : History;

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group relative flex flex-col gap-1 rounded-xl border border-border bg-surface-2 p-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="grid size-5 shrink-0 place-items-center rounded bg-surface border border-border text-accent">
                        <Icon className="size-3" />
                      </div>
                      <span className="text-xs font-semibold text-text truncate max-w-[280px]">
                        {card.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => dismissMutation.mutate(card.id)}
                      className="grid size-5 place-items-center rounded text-subtle hover:text-text cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-text-muted font-normal">
                    {card.snippet}
                  </p>

                  <div className="mt-1 flex items-center justify-between text-[10px] pt-1 border-t border-border/40">
                    <span className="text-subtle font-mono truncate max-w-[180px]">
                      Trigger: "{card.trigger_text}"
                    </span>

                    <div className="flex items-center gap-2">
                      {card.url && (
                        <a
                          href={card.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}

                      {onQuoteToNotes && (
                        <button
                          type="button"
                          onClick={() => {
                            onQuoteToNotes(`\n> **[${card.title}]**: ${card.snippet}\n`);
                            toast.success("Quoted to notes");
                          }}
                          className="font-medium text-text hover:text-accent cursor-pointer"
                        >
                          Quote to Note
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
