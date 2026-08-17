import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen, ChevronRight, CircleHelp, Hash } from "lucide-react";
import * as api from "@/lib/api";
import { openExternal } from "@/lib/open";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { TabHeading } from "./shared";

const bugTemplate = `What happened?

What did you expect?

Steps to reproduce:
1.
2.
3.`;

const featureTemplate = `What should we add?

Why would it help?`;

const HELP_CENTER = "https://github.com/tomlin7/Bagrry#readme";
const TROUBLESHOOTING = "https://github.com/tomlin7/Bagrry/issues";
const COMMUNITY = "https://github.com/tomlin7/Bagrry/discussions";

export function GetHelpTab() {
  const { data: status } = useQuery({ queryKey: api.qk.dbStatus(), queryFn: api.dbStatus });
  const [kind, setKind] = useState<"problem" | "feature">("problem");
  const [body, setBody] = useState(bugTemplate);

  const submit = useMutation({
    mutationFn: () => api.submitFeedback(kind, body),
    onSuccess: () => {
      toast.success("Feedback saved locally");
      setBody(kind === "problem" ? bugTemplate : featureTemplate);
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading title="Get help" />

      <SettingsCard>
        <SettingRow
          icon={<BookOpen />}
          title="Help Center"
          control={<ChevronRight className="size-4 text-subtle" />}
          onClick={() => void openExternal(HELP_CENTER)}
        />
        <SettingRow
          icon={<CircleHelp />}
          title="Troubleshooting"
          control={<ChevronRight className="size-4 text-subtle" />}
          onClick={() => void openExternal(TROUBLESHOOTING)}
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
        <div className="flex items-center justify-end gap-3 px-4 py-3">
          <Button
            variant="accent"
            size="sm"
            shape="square"
            loading={submit.isPending}
            onClick={() => submit.mutate()}
          >
            {kind === "problem" ? "Report bug" : "Send request"}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard>
        <SettingRow
          icon={<Hash />}
          title="Join the Bagrry community"
          description="Ask questions and share tips with other users."
          control={<ArrowUpRight className="size-4 text-subtle" />}
          onClick={() => void openExternal(COMMUNITY)}
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
        <SettingRow title="Local API" description={`127.0.0.1:${status?.api_port ?? "—"}`} />
      </SettingsCard>
    </>
  );
}
