import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Send,
  CheckCircle2,
  Loader2,
  Mail,
  Share2,
} from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { DispatchReport, DestinationResult } from "@/lib/types";

export function DispatchFollowUpDialog({
  open,
  onClose,
  meetingId,
  meetingTitle,
}: {
  open: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
}) {
  const queryClient = useQueryClient();

  const [sendToLinear, setSendToLinear] = useState(true);
  const [sendToNotion, setSendToNotion] = useState(true);
  const [sendToSlack, setSendToSlack] = useState(false);
  const [sendToTeams, setSendToTeams] = useState(false);
  const [sendToEmail, setSendToEmail] = useState(true);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [lastReport, setLastReport] = useState<DispatchReport | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: api.qk.dispatchHistory(meetingId),
    queryFn: () => api.getDispatchHistory(meetingId),
    enabled: open,
  });

  const dispatchMutation = useMutation({
    mutationFn: () =>
      api.dispatchMeeting({
        meetingId,
        sendToLinear,
        sendToNotion,
        sendToSlack,
        sendToTeams,
        sendToEmail,
        emailRecipients: emailRecipients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        customNote: null,
      }),
    onSuccess: (report) => {
      setLastReport(report);
      void queryClient.invalidateQueries({ queryKey: api.qk.dispatchHistory(meetingId) });
      toast.success("Meeting dispatch completed across channels");
    },
    onError: (e) => toast.error(e, "Dispatch execution failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-surface border-border text-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Share2 className="size-4 text-accent" />
            <span>Multi-Channel Meeting Dispatch</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-subtle">
            Orchestrate post-meeting follow-ups for <strong className="text-text">{meetingTitle}</strong> across your team tools in 1 click.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Destination Selection Cards */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
              Select Destinations
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                  sendToLinear ? "border-accent bg-accent/10 text-text" : "border-border bg-surface-2/40 text-subtle"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendToLinear}
                  onChange={(e) => setSendToLinear(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Linear Issues</span>
              </label>

              <label
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                  sendToNotion ? "border-accent bg-accent/10 text-text" : "border-border bg-surface-2/40 text-subtle"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendToNotion}
                  onChange={(e) => setSendToNotion(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Notion Database</span>
              </label>

              <label
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                  sendToSlack ? "border-accent bg-accent/10 text-text" : "border-border bg-surface-2/40 text-subtle"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendToSlack}
                  onChange={(e) => setSendToSlack(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Slack Webhook</span>
              </label>

              <label
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                  sendToTeams ? "border-accent bg-accent/10 text-text" : "border-border bg-surface-2/40 text-subtle"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendToTeams}
                  onChange={(e) => setSendToTeams(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Microsoft Teams</span>
              </label>
            </div>

            <label
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                sendToEmail ? "border-accent bg-accent/10 text-text" : "border-border bg-surface-2/40 text-subtle"
              }`}
            >
              <input
                type="checkbox"
                checked={sendToEmail}
                onChange={(e) => setSendToEmail(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <Mail className="size-3.5 text-accent" />
              <span>Email Recap Draft</span>
            </label>

            {sendToEmail && (
              <input
                type="text"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="Attendee emails (comma separated, or leave blank for all)"
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
            )}
          </div>

          {/* Results Report */}
          {lastReport && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Dispatch Summary:</span>
              </span>
              <div className="space-y-1 text-[11px] text-text">
                {lastReport.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="capitalize font-medium text-accent">{r.destination}:</span>
                    <span className="truncate text-subtle max-w-[280px]">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Dispatch History */}
          {!lastReport && history.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-surface-2/30 p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                Previous Dispatches
              </span>
              <div className="space-y-1 text-[11px]">
                {history.slice(0, 3).map((h: DestinationResult, i: number) => (
                  <div key={i} className="flex items-center justify-between text-subtle">
                    <span className="capitalize text-text font-medium">{h.destination}</span>
                    <span className="truncate max-w-[240px]">{h.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-subtle hover:bg-hover hover:text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => dispatchMutation.mutate()}
              disabled={dispatchMutation.isPending || (!sendToLinear && !sendToNotion && !sendToSlack && !sendToTeams && !sendToEmail)}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40"
            >
              {dispatchMutation.isPending ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Dispatching…</span>
                </>
              ) : (
                <>
                  <Send className="size-3" />
                  <span>Dispatch Follow-Up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
