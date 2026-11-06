import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Search } from "lucide-react";
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
  const [filterQuery, setFilterQuery] = useState("");
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });

  const go = (next: SettingsTab) => {
    navigate({ kind: "settings", tab: next }, { replace: true });
  };

  const filteredPersonal = SETTINGS_PERSONAL_NAV.filter((e) =>
    e.label.toLowerCase().includes(filterQuery.toLowerCase()),
  );
  const filteredWorkspace = SETTINGS_WORKSPACE_NAV.filter((e) =>
    e.label.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-white/5 bg-sidebar shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <div data-tauri-drag-region className="px-3 pt-3 pb-1">
        <h2 className="text-xl font-semibold tracking-tight text-text">Settings</h2>
      </div>

      <div className="px-2 mb-2">
        <div className="flex h-8 w-full items-center gap-2 rounded-xl border border-border/80 bg-surface/70 px-2.5 text-xs text-subtle transition-colors focus-within:border-border-strong focus-within:text-text">
          <Search className="size-3.5 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-xs text-text outline-none placeholder:text-subtle"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 scrollbar-none">
        {filteredPersonal.map((entry) => (
          <SettingsNavButton key={entry.tab} entry={entry} active={tab === entry.tab} onClick={go} />
        ))}

        <div className="mt-4 px-2.5 pb-1 text-[11px] font-semibold text-subtle uppercase tracking-wider">
          Workspace
        </div>
        {filteredWorkspace.map((entry) => (
          <SettingsNavButton key={entry.tab} entry={entry} active={tab === entry.tab} onClick={go} />
        ))}
      </div>

      <div className="border-t border-border/60 p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <Avatar name={profile?.name || "You"} size={22} className="rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-text">{profile?.name || "You"}</div>
            <div className="truncate text-[10px] text-subtle">{profile?.email || "No email set"}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            toast.success("Signed out", "Bagrry keeps notes on this device — there's no cloud account.");
            back();
          }}
          className="flex h-8 w-full items-center gap-2 rounded-xl px-2.5 text-left text-[12px] text-danger transition-colors hover:bg-hover cursor-pointer"
        >
          <LogOut className="size-3.5 shrink-0" />
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
        "flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] transition-all duration-150 cursor-pointer",
        active ? "bg-surface text-text font-semibold shadow-xs" : "text-muted hover:bg-hover hover:text-text",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.badge && (
        <span className="rounded-full bg-accent-subtle px-1.5 py-px text-[10px] font-semibold text-accent">
          {entry.badge}
        </span>
      )}
    </button>
  );
}
