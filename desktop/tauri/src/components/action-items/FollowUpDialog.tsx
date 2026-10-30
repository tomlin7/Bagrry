import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Copy,
  Check,
  Send,
  MessageSquare,
  ListTodo,
} from "lucide-react";
import * as api from "@/lib/api";
import type { Person, Meeting } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FollowUpFormat = "email" | "slack" | "linear";

interface FollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId?: string | null;
}

export function FollowUpDialog({
  open,
  onOpenChange,
  meetingId,
}: FollowUpDialogProps) {
  const [format, setFormat] = useState<FollowUpFormat>("email");
  const [copied, setCopied] = useState(false);

  // Fetch all meetings and action items
  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => api.listMeetings(),
    enabled: open,
  });

  const { data: allActionItems = [] } = useQuery({
    queryKey: api.qk.actionItems(),
    queryFn: api.listActionItems,
    enabled: open,
  });

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    meetingId || (meetings[0]?.id ?? null),
  );

  const activeMeeting: Meeting | undefined = useMemo(() => {
    const targetId = meetingId || selectedMeetingId;
    return meetings.find((m) => m.id === targetId);
  }, [meetings, meetingId, selectedMeetingId]);

  const { data: attendees = [] } = useQuery<Person[]>({
    queryKey: activeMeeting ? api.qk.attendees(activeMeeting.id) : ["no-attendees"],
    queryFn: () => (activeMeeting ? api.listMeetingAttendees(activeMeeting.id) : Promise.resolve([])),
    enabled: Boolean(activeMeeting),
  });

  const meetingItems = useMemo(() => {
    if (!activeMeeting) return [];
    return allActionItems.filter((item) => item.meeting_id === activeMeeting.id);
  }, [allActionItems, activeMeeting]);

  const itemsByMe = meetingItems.filter((i) => !i.owner || i.owner.toLowerCase() === "me");
  const itemsByOthers = meetingItems.filter((i) => i.owner && i.owner.toLowerCase() !== "me");

  // Generate customized message body
  const generatedMessage = useMemo(() => {
    const title = activeMeeting?.title || "our meeting";
    const attendeeEmails = attendees.map((a) => a.email).filter(Boolean);

    if (format === "email") {
      let body = `Hi everyone,\n\nThanks for your time today during "${title}". Here is a recap of our key takeaways and agreed action items:\n\n`;

      if (itemsByMe.length > 0) {
        body += `Action items (My commitments):\n`;
        itemsByMe.forEach((i) => {
          body += `• ${i.task}${i.deadline ? ` (Due: ${i.deadline.slice(0, 10)})` : ""}\n`;
        });
        body += `\n`;
      }

      if (itemsByOthers.length > 0) {
        body += `Action items (Team commitments):\n`;
        itemsByOthers.forEach((i) => {
          body += `• ${i.owner}: ${i.task}${i.deadline ? ` (Due: ${i.deadline.slice(0, 10)})` : ""}\n`;
        });
        body += `\n`;
      }

      if (meetingItems.length === 0) {
        body += `• All open questions resolved during sync. No outstanding blockers.\n\n`;
      }

      body += `Please reply directly if anything needs adjusting.\n\nBest regards`;
      return { subject: `Follow-up: ${title}`, body, recipients: attendeeEmails.join(",") };
    }

    if (format === "slack") {
      let text = `*Meeting Recap: ${title}*\nThanks everyone for jumping on today's sync.\n\n`;
      if (itemsByMe.length > 0) {
        text += `*My Commitments:*\n`;
        itemsByMe.forEach((i) => {
          text += `• ${i.task}${i.deadline ? ` _(Due ${i.deadline.slice(0, 10)})_` : ""}\n`;
        });
        text += `\n`;
      }
      if (itemsByOthers.length > 0) {
        text += `*Next Steps:*\n`;
        itemsByOthers.forEach((i) => {
          text += `• *@${i.owner}*: ${i.task}${i.deadline ? ` _(Due ${i.deadline.slice(0, 10)})_` : ""}\n`;
        });
      }
      return { subject: "", body: text, recipients: "" };
    }

    // Linear / Markdown format
    let markdown = `### ${title} — Action Items\n\n`;
    meetingItems.forEach((i) => {
      const assignee = i.owner ? `@${i.owner}` : "@me";
      const due = i.deadline ? ` [due:: ${i.deadline.slice(0, 10)}]` : "";
      markdown += `- [ ] ${i.task} ${assignee}${due}\n`;
    });
    return { subject: "", body: markdown, recipients: "" };
  }, [format, activeMeeting, attendees, meetingItems, itemsByMe, itemsByOthers]);

  const handleCopy = async () => {
    try {
      const textToCopy =
        format === "email"
          ? `Subject: ${generatedMessage.subject}\n\n${generatedMessage.body}`
          : generatedMessage.body;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(
        format === "email"
          ? "Follow-up email copied to clipboard"
          : format === "slack"
            ? "Slack message copied"
            : "Tasks copied for Linear / GitHub",
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info("Message", generatedMessage.body);
    }
  };

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(generatedMessage.subject);
    const body = encodeURIComponent(generatedMessage.body);
    const to = encodeURIComponent(generatedMessage.recipients);
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] rounded-2xl border border-border bg-surface-1 p-6 shadow-2xl">
        <DialogHeader className="mb-3">
          <DialogTitle className="font-display text-lg font-semibold text-text">
            1-Click Follow-Up Generator
          </DialogTitle>
          <p className="text-[12px] text-muted">
            Auto-compose executive recap messages and commitment breakdowns for Slack, Email, or Linear.
          </p>
        </DialogHeader>

        {/* Meeting selector if not launched from a specific note */}
        {!meetingId && meetings.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[12px] font-medium text-text">Source Meeting:</span>
            <select
              value={selectedMeetingId || ""}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="h-8 flex-1 rounded-lg border border-border bg-surface-2 px-2.5 text-xs text-text outline-none focus:border-accent"
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Format Selector Pills */}
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setFormat("email")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer",
              format === "email"
                ? "bg-surface-1 text-accent shadow-xs"
                : "text-muted hover:text-text",
            )}
          >
            <Mail className="size-3.5" />
            <span>Recap Email</span>
          </button>
          <button
            type="button"
            onClick={() => setFormat("slack")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer",
              format === "slack"
                ? "bg-surface-1 text-accent shadow-xs"
                : "text-muted hover:text-text",
            )}
          >
            <MessageSquare className="size-3.5" />
            <span>Slack Message</span>
          </button>
          <button
            type="button"
            onClick={() => setFormat("linear")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer",
              format === "linear"
                ? "bg-surface-1 text-accent shadow-xs"
                : "text-muted hover:text-text",
            )}
          >
            <ListTodo className="size-3.5" />
            <span>Linear / GitHub</span>
          </button>
        </div>

        {/* Message Preview */}
        <div className="space-y-2">
          {format === "email" && (
            <div className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs">
              <span className="font-semibold text-subtle">Subject: </span>
              <span className="text-text font-medium">{generatedMessage.subject}</span>
            </div>
          )}

          <div className="relative">
            <textarea
              readOnly
              rows={10}
              value={generatedMessage.body}
              className="w-full resize-none rounded-xl border border-border bg-surface-2 p-3.5 font-mono text-xs text-text leading-relaxed outline-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="text-[11px] text-subtle">
            {meetingItems.length} {meetingItems.length === 1 ? "action item" : "action items"} included
          </div>

          <div className="flex items-center gap-2">
            {format === "email" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMailto}
                className="gap-1.5 cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Open in Mail App</span>
              </Button>
            )}

            <Button
              variant="solid"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
