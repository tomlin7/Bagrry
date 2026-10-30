import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileDown,
  FileText,
  Hash,
  Printer,
} from "lucide-react";
import * as api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export function ExportDialog({
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
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: async (format: "slack" | "html_rich_text" | "markdown" | "pdf_html") => {
      const res = await api.exportFormatted(meetingId, format);
      if (format === "slack") {
        await navigator.clipboard.writeText(res.content);
        setCopiedFormat("slack");
        setTimeout(() => setCopiedFormat(null), 2500);
        toast.success("Slack markdown copied to clipboard!");
      } else if (format === "html_rich_text") {
        try {
          const blobHtml = new Blob([res.content], { type: "text/html" });
          const blobPlain = new Blob([res.content.replace(/<[^>]+>/g, " ").trim()], {
            type: "text/plain",
          });
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": blobHtml,
              "text/plain": blobPlain,
            }),
          ]);
          setCopiedFormat("notion");
          setTimeout(() => setCopiedFormat(null), 2500);
          toast.success("Rich text copied! Ready to paste into Notion, Google Docs, or Apple Notes.");
        } catch {
          await navigator.clipboard.writeText(res.content);
          toast.info("HTML copied to clipboard");
        }
      } else if (format === "markdown") {
        const blob = new Blob([res.content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${res.filename}`);
      } else if (format === "pdf_html") {
        const printWin = window.open("", "_blank");
        if (printWin) {
          printWin.document.write(res.content);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => {
            printWin.print();
          }, 300);
        } else {
          toast.info("Print preview", "Allow popups to trigger print");
        }
      }
    },
    onError: (err) => {
      toast.error(typeof err === "string" ? err : "Export failed");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:rounded-2xl border-border bg-surface text-text shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FileDown className="size-4 text-accent" />
            Export Note
          </DialogTitle>
          <p className="text-xs text-subtle pt-1">
            Export <strong>{meetingTitle || "this note"}</strong> across multiple formats with zero formatting loss.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 pt-4">
          {/* 1. Slack Markdown */}
          <button
            type="button"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate("slack")}
            className="group flex items-center justify-between rounded-xl border border-border/80 bg-surface-raised/40 p-3.5 transition-all hover:border-accent/40 hover:bg-hover text-left"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-surface border border-border text-subtle group-hover:text-accent">
                <Hash className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
                  Copy as Slack Markdown
                </span>
                <span className="text-[11px] text-subtle">
                  Clean bullet points, bold headers, and key commitments
                </span>
              </div>
            </div>
            {copiedFormat === "slack" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check className="size-3.5" /> Copied
              </span>
            ) : (
              <Copy className="size-3.5 text-subtle opacity-60 group-hover:opacity-100" />
            )}
          </button>

          {/* 2. Notion / Rich Text */}
          <button
            type="button"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate("html_rich_text")}
            className="group flex items-center justify-between rounded-xl border border-border/80 bg-surface-raised/40 p-3.5 transition-all hover:border-accent/40 hover:bg-hover text-left"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-surface border border-border text-subtle group-hover:text-accent">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
                  Copy as Notion / Rich Text
                </span>
                <span className="text-[11px] text-subtle">
                  Paste headings & checklists into Notion, Docs, or Apple Notes
                </span>
              </div>
            </div>
            {copiedFormat === "notion" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check className="size-3.5" /> Copied
              </span>
            ) : (
              <Copy className="size-3.5 text-subtle opacity-60 group-hover:opacity-100" />
            )}
          </button>

          {/* 3. Download Markdown */}
          <button
            type="button"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate("markdown")}
            className="group flex items-center justify-between rounded-xl border border-border/80 bg-surface-raised/40 p-3.5 transition-all hover:border-accent/40 hover:bg-hover text-left"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-surface border border-border text-subtle group-hover:text-accent">
                <FileCode className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
                  Download Markdown (.md)
                </span>
                <span className="text-[11px] text-subtle">
                  Standard format with full YAML frontmatter metadata
                </span>
              </div>
            </div>
            <Download className="size-3.5 text-subtle opacity-60 group-hover:opacity-100" />
          </button>

          {/* 4. Styled PDF Export */}
          <button
            type="button"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate("pdf_html")}
            className="group flex items-center justify-between rounded-xl border border-border/80 bg-surface-raised/40 p-3.5 transition-all hover:border-accent/40 hover:bg-hover text-left"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-surface border border-border text-subtle group-hover:text-accent">
                <Printer className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
                  Export Styled PDF / Print
                </span>
                <span className="text-[11px] text-subtle">
                  Executive layout with page margins & citation footnotes
                </span>
              </div>
            </div>
            <Printer className="size-3.5 text-subtle opacity-60 group-hover:opacity-100" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
