import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen, ChevronRight, CircleHelp, Hash } from "lucide-react";
import * as api from "@/lib/api";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { TabHeading } from "./shared";
import { comingSoon } from "./helpers";

const bugTemplate = `What happened?

What did you expect?

Steps to reproduce:
1.
2.
3.`;

const featureTemplate = `What should we add?

Why would it help?`;

export function GetHelpTab() {
  const { data: status } = useQuery({ queryKey: api.qk.dbStatus(), queryFn: api.dbStatus });
  const [kind, setKind] = useState<"problem" | "feature">("problem");
  const [body, setBody] = useState(bugTemplate);

  return (
    <>
      <TabHeading title="Get help" />

      <SettingsCard>
        <SettingRow
          icon={<BookOpen />}
          title="Help Center"
          control={<ChevronRight className="size-4 text-subtle" />}
          onClick={() => comingSoon("Help Center")}
        />
        <SettingRow
          icon={<CircleHelp />}
          title="Troubleshooting"
          control={<ChevronRight className="size-4 text-subtle" />}
          onClick={() => comingSoon("Troubleshooting")}
        />
      </SettingsCard>

      <SettingsCard title="Send feedback">
        <div>
          <div className="flex gap-1 px-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setKind("problem");
                setBody(bugTemplate);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                kind === "problem" ? "bg-hover text-text" : "text-muted hover:text-text",
              )}
            >
              Problem
            </button>
            <button
              type="button"
              onClick={() => {
                setKind("feature");
                setBody(featureTemplate);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                kind === "feature" ? "bg-hover text-text" : "text-muted hover:text-text",
              )}
            >
              Feature request
            </button>
          </div>
          <div className="px-4 py-3">
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="leading-relaxed" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => comingSoon("Add screenshot")}>
            Add screenshot
          </Button>
          <Button
            variant="accent"
            size="sm"
            shape="square"
            onClick={() => toast.info("Feedback is UI-only for now", "We will wire this in a follow-up.")}
          >
            {kind === "problem" ? "Report bug" : "Send request"}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard>
        <SettingRow
          icon={<Hash />}
          title="Join the Bagrry Slack community"
          description="Ask questions and share tips with other users."
          control={<ArrowUpRight className="size-4 text-subtle" />}
          onClick={() => comingSoon("Slack community")}
        />
      </SettingsCard>

      <SettingsCard title="Keyboard shortcuts">
        <SettingRow title="Command palette" control={<Badge>Ctrl K</Badge>} />
        <SettingRow title="Toggle sidebar" control={<Badge>Ctrl \</Badge>} />
        <SettingRow title="Settings" control={<Badge>Ctrl ,</Badge>} />
        <SettingRow title="Start / stop recording" control={<Badge>Ctrl Shift R</Badge>} />
        <SettingRow title="Pause recording" control={<Badge>Ctrl Shift P</Badge>} />
        <SettingRow title="Back" control={<Badge>Alt ←</Badge>} />
      </SettingsCard>

      <SettingsCard title="Diagnostics">
        <SettingRow title="Database" description={status?.path ?? "—"} />
        <SettingRow
          title="Vector search"
          description={status?.vec_enabled ? "sqlite-vec enabled" : "Hash embeddings (sqlite-vec off)"}
        />
      </SettingsCard>
    </>
  );
}
