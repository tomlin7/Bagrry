import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import * as api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { ShareInfo } from "@/lib/types";

export function ShareDialog({
  meetingId,
  meetingTitle,
  open,
  onOpenChange,
}: {
  meetingId: string;
  meetingTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [includeScratchpad, setIncludeScratchpad] = useState(true);
  const [expiresDays, setExpiresDays] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: shares = [] } = useQuery({
    queryKey: api.qk.meetingShares(meetingId),
    queryFn: () => api.getMeetingShares(meetingId),
    enabled: open && Boolean(meetingId),
  });

  const createShareMutation = useMutation({
    mutationFn: () =>
      api.createShareCustom({
        meetingId,
        includeTranscript,
        includeAudio,
        includeScratchpad,
        expiresDays,
      }),
    onSuccess: async (newShare) => {
      try {
        await navigator.clipboard.writeText(newShare.url);
        setCopiedToken(newShare.token);
        setTimeout(() => setCopiedToken(null), 2500);
        toast.success("Share link created and copied to clipboard!");
      } catch {
        toast.info("Share URL created", newShare.url);
      }
      void queryClient.invalidateQueries({ queryKey: api.qk.meetingShares(meetingId) });
    },
    onError: (err) => {
      toast.error(typeof err === "string" ? err : "Failed to create share link");
    },
  });

  const revokeShareMutation = useMutation({
    mutationFn: (token: string) => api.revokeShare(token),
    onSuccess: () => {
      toast.success("Share link revoked immediately.");
      void queryClient.invalidateQueries({ queryKey: api.qk.meetingShares(meetingId) });
    },
  });

  const copyUrl = async (share: ShareInfo) => {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopiedToken(share.token);
      setTimeout(() => setCopiedToken(null), 2500);
      toast.success("Link copied!");
    } catch {
      toast.info("URL", share.url);
    }
  };

  const activeShares = shares.filter((s) => !s.revoked);
  const latestActiveShare = activeShares[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:rounded-2xl border-border bg-surface text-text shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Globe className="size-4 text-accent" />
              Share Note
            </DialogTitle>
          </div>
          <p className="text-xs text-subtle pt-1">
            Publish a secure, read-only secret web link for <strong>{meetingTitle || "this meeting"}</strong>.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-3">
          {/* Latest Active Link Card */}
          {latestActiveShare ? (
            <div className="flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-accent">
                <span className="flex items-center gap-1.5">
                  <Link2 className="size-3.5" />
                  Active Secret Share Link
                </span>
                <span className="text-[11px] font-normal text-subtle">
                  {latestActiveShare.views_count} {latestActiveShare.views_count === 1 ? "view" : "views"}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  readOnly
                  value={latestActiveShare.url}
                  className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyUrl(latestActiveShare)}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90"
                >
                  {copiedToken === latestActiveShare.token ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <a
                  href={latestActiveShare.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-subtle hover:text-text hover:bg-hover transition-colors"
                  title="Open in browser"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          ) : null}

          {/* Privacy Controls Prior to Publishing */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface-raised/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text flex items-center gap-1.5">
              <Lock className="size-3.5 text-subtle" />
              Privacy & Content Controls
            </h4>

            <div className="flex flex-col gap-2.5 pt-1">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="flex flex-col">
                  <span className="font-medium text-text">Include Verbatim Transcript</span>
                  <span className="text-[11px] text-subtle">Uncheck to hide sensitive conversation utterances</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeTranscript}
                  onChange={(e) => setIncludeTranscript(e.target.checked)}
                  className="size-4 rounded border-border accent-accent cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="flex flex-col">
                  <span className="font-medium text-text">Include Raw User Scratchpad</span>
                  <span className="text-[11px] text-subtle">Display your initial personal bullet notes</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeScratchpad}
                  onChange={(e) => setIncludeScratchpad(e.target.checked)}
                  className="size-4 rounded border-border accent-accent cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="flex flex-col">
                  <span className="font-medium text-text">Include Audio Waveform Player</span>
                  <span className="text-[11px] text-subtle">Allow listeners to play synthesized speech audio</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="size-4 rounded border-border accent-accent cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-medium text-text">Link Expiry</span>
                <select
                  value={expiresDays ?? ""}
                  onChange={(e) => setExpiresDays(e.target.value ? Number(e.target.value) : null)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Never expire</option>
                  <option value="7">Expires in 7 days</option>
                  <option value="30">Expires in 30 days</option>
                  <option value="90">Expires in 90 days</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={createShareMutation.isPending}
              onClick={() => createShareMutation.mutate()}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              {latestActiveShare ? "Generate New Secret Link" : "Publish & Copy Link"}
            </button>
          </div>

          {/* Historical / Existing Links */}
          {shares.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
                All Generated Links ({shares.length})
              </h5>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {shares.map((s) => (
                  <div
                    key={s.token}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          s.revoked ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-mono text-[11px] text-text truncate max-w-[140px]">
                        ...{s.token.slice(-10)}
                      </span>
                      <span className="text-[10px] text-subtle">
                        {s.views_count} views
                      </span>
                      {s.revoked && (
                        <span className="rounded bg-rose-500/10 text-rose-500 text-[10px] px-1 py-0.2">
                          Revoked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!s.revoked && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyUrl(s)}
                            className="text-subtle hover:text-text p-1 transition-colors"
                            title="Copy link"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Revoke this link immediately? Access will terminate with HTTP 410.")) {
                                revokeShareMutation.mutate(s.token);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-400 p-1 transition-colors"
                            title="Revoke access"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
