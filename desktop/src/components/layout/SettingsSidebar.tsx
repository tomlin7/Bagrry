import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import * as api from "@/lib/api";
import { SETTINGS_PERSONAL_NAV, SETTINGS_WORKSPACE_NAV, type SettingsNavEntry } from "@/lib/settings-nav";
import type { SettingsTab } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SIDEBAR_WIDTH } from "@/lib/motion";
import { useAppStore } from "@/store/app";
import { Avatar } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";

export function SettingsSidebar({ tab }: { tab: SettingsTab }) {
  const navigate = useAppStore((s) => s.navigate);
  const back = useAppStore((s) => s.back);
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });

  const go = (next: SettingsTab) => {
    navigate({ kind: "settings", tab: next }, { replace: true });
  };

  return (
    <aside className="flex h-full shrink-0 flex-col border-r border-border bg-sidebar" style={{ width: SIDEBAR_WIDTH }}>
      <div data-tauri-drag-region className="flex items-center gap-2.5 px-3 py-3">
        <Avatar name={profile?.name || "You"} size={32} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-text">{profile?.name || "You"}</div>
          <div className="truncate text-[11px] text-subtle">{profile?.email || "No email set"}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 scrollbar-none">
        {SETTINGS_PERSONAL_NAV.map((entry) => (
          <SettingsNavButton key={entry.tab} entry={entry} active={tab === entry.tab} onClick={go} />
        ))}

        <div className="mt-4 px-2 pb-1 text-[11px] font-semibold text-subtle">Workspace</div>
        {SETTINGS_WORKSPACE_NAV.map((entry) => (
          <SettingsNavButton key={entry.tab} entry={entry} active={tab === entry.tab} onClick={go} />
        ))}
      </div>

      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            toast.success("Signed out", "Bagrry keeps notes on this device — there's no cloud account.");
            back();
          }}
          className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-danger transition-colors hover:bg-hover"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function SettingsNavButton({
  entry,
  active,
  onClick,
}: {
  entry: SettingsNavEntry;
  active: boolean;
  onClick: (tab: SettingsTab) => void;
}) {
  const Icon = entry.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(entry.tab)}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] transition-colors duration-150",
        active ? "bg-selected font-medium text-text" : "text-muted hover:bg-hover hover:text-text",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {entry.label}
    </button>
  );
}
