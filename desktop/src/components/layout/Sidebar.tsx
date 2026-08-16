import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  FolderPlus,
  Home,
  LayoutTemplate,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Settings,
  SquarePen,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import * as api from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { MY_NOTES_SPACE, TEAM_SPACE, type Route } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { Avatar, Kbd } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SIDEBAR_WIDTH, layoutTween, snappy } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { SettingsSidebar } from "@/components/layout/SettingsSidebar";

export function Sidebar() {
  const route = useAppStore((s) => s.route);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {route.kind === "settings" ? (
        <motion.div
          key="settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={snappy}
          className="h-full"
        >
          <SettingsSidebar tab={route.tab} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={snappy}
          className="h-full"
        >
          <AppSidebar />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppSidebar() {
  const route = useAppStore((s) => s.route);
  const navigate = useAppStore((s) => s.navigate);
  const openSettings = useAppStore((s) => s.openSettings);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);

  const [chatExpanded, setChatExpanded] = useState(true);
  const [newFolderIn, setNewFolderIn] = useState<null | { shared: boolean }>(null);

  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: sessions = [] } = useQuery({
    queryKey: api.qk.chatSessions(),
    queryFn: api.listChatSessions,
  });
  const { data: folders = [] } = useQuery({ queryKey: api.qk.folders(), queryFn: api.listFolders });

  const workspaceName = profile?.workspace || "My workspace";
  const teamLabel = `${workspaceName} team`;

  const privateFolders = folders.filter((f) => !f.is_shared && f.id !== "folder_inbox");
  const sharedFolders = folders.filter((f) => f.is_shared);

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-border bg-sidebar"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Brand row doubles as the drag handle for the sidebar column. */}
      <div data-tauri-drag-region className="flex h-11 items-center px-3">
        <button
          type="button"
          onClick={() => navigate({ kind: "home" })}
          className="flex size-6 items-center justify-center rounded-md border border-border-strong text-[11px] font-semibold text-muted transition-colors hover:bg-hover hover:text-text"
          aria-label="Bagrry home"
        >
          <span className="font-display italic leading-none">B</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mb-2 flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-surface px-2 text-[13px] text-muted transition-colors hover:border-border-strong hover:text-text"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search</span>
          <Kbd>Ctrl+K</Kbd>
        </button>

        <NavItem
          icon={Home}
          label="Home"
          active={route.kind === "home"}
          onClick={() => navigate({ kind: "home" })}
        />
        <NavItem
          icon={Users}
          label="Shared with me"
          active={route.kind === "shared"}
          onClick={() => navigate({ kind: "shared" })}
        />
        <NavItem
          icon={MessageSquare}
          label="Chat"
          active={route.kind === "chat"}
          onClick={() => navigate({ kind: "chat", sessionId: null })}
          expanded={sessions.length > 0 ? chatExpanded : undefined}
          onToggleExpanded={() => setChatExpanded((v) => !v)}
          trailing={
            <IconAction
              label="New chat"
              icon={Plus}
              onClick={() => navigate({ kind: "chat", sessionId: null })}
            />
          }
        />

        <AnimatePresence initial={false}>
          {chatExpanded && sessions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={layoutTween}
              className="overflow-hidden"
            >
              <div className="mb-1">
                {sessions.slice(0, 6).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => navigate({ kind: "chat", sessionId: session.id })}
                    className={cn(
                      "flex h-7 w-full items-center gap-2 rounded-lg pl-8 pr-2 text-left text-[13px] transition-colors",
                      route.kind === "chat" && route.sessionId === session.id
                        ? "bg-selected text-text"
                        : "text-muted hover:bg-hover hover:text-text",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{session.title || "New chat"}</span>
                    <span className="shrink-0 text-[11px] text-subtle">
                      {formatRelative(session.updated_at)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 px-2 pb-1 text-[11px] font-semibold text-subtle">Spaces</div>

        <NavItem
          icon={Lock}
          label="My notes"
          active={route.kind === "space" && route.spaceId === MY_NOTES_SPACE}
          onClick={() => navigate({ kind: "space", spaceId: MY_NOTES_SPACE })}
        />
        {privateFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            id={folder.id}
            name={folder.name}
            active={route.kind === "space" && route.spaceId === folder.id}
            onClick={() => navigate({ kind: "space", spaceId: folder.id })}
          />
        ))}
        <AddFolderButton onClick={() => setNewFolderIn({ shared: false })} />

        <NavItem
          avatar={workspaceName}
          label={teamLabel}
          active={route.kind === "space" && route.spaceId === TEAM_SPACE}
          onClick={() => navigate({ kind: "space", spaceId: TEAM_SPACE })}
        />
        {sharedFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            id={folder.id}
            name={folder.name}
            active={route.kind === "space" && route.spaceId === folder.id}
            onClick={() => navigate({ kind: "space", spaceId: folder.id })}
          />
        ))}
        <AddFolderButton onClick={() => setNewFolderIn({ shared: true })} />
      </div>

      <SidebarFooter
        name={profile?.name || "You"}
        email={profile?.email || ""}
        workspace={workspaceName}
        onSettings={openSettings}
        navigate={navigate}
      />

      <NewFolderDialog
        open={newFolderIn !== null}
        shared={newFolderIn?.shared ?? false}
        onOpenChange={(open) => !open && setNewFolderIn(null)}
      />
    </aside>
  );
}

/* ------------------------------------------------------------------ */

function NavItem({
  icon: Icon,
  avatar,
  label,
  active,
  onClick,
  trailing,
  expanded,
  onToggleExpanded,
}: {
  icon?: LucideIcon;
  avatar?: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-8 items-center rounded-lg transition-colors",
        active ? "bg-selected" : "hover:bg-hover",
      )}
    >
      {expanded !== undefined && (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          className="absolute left-0.5 grid size-4 place-items-center rounded text-subtle opacity-0 transition-opacity hover:text-text group-hover:opacity-100"
        >
          <ChevronDown className={cn("size-3 transition-transform", !expanded && "-rotate-90")} />
        </button>
      )}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]",
          active ? "font-medium text-text" : "text-muted group-hover:text-text",
        )}
      >
        {Icon && <Icon className="size-4 shrink-0" />}
        {avatar && <Avatar name={avatar} size={16} className="rounded-md" />}
        <span className="truncate">{label}</span>
      </button>
      {trailing && (
        <div className="pr-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {trailing}
        </div>
      )}
    </div>
  );
}

function FolderItem({
  id,
  name,
  active,
  onClick,
}: {
  id: string;
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: api.qk.folders() });
    void queryClient.invalidateQueries({ queryKey: ["meetings"] });
  };

  const rename = useMutation({
    mutationFn: (next: string) => api.renameFolder(id, next),
    onSuccess: invalidate,
    onError: (e) => toast.error(e),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteFolder(id),
    onSuccess: () => {
      invalidate();
      toast.success("Folder deleted", "Its notes moved to My notes.");
    },
    onError: (e) => toast.error(e),
  });

  if (renaming) {
    return (
      <form
        className="px-1 py-0.5"
        onSubmit={(e) => {
          e.preventDefault();
          const next = draft.trim();
          if (next && next !== name) rename.mutate(next);
          setRenaming(false);
        }}
      >
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setRenaming(false)}
          onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
          className="h-7 text-[13px]"
        />
      </form>
    );
  }

  return (
    <div
      className={cn(
        "group flex h-7 items-center rounded-lg pl-6 transition-colors",
        active ? "bg-selected" : "hover:bg-hover",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "min-w-0 flex-1 truncate py-1 text-left text-[13px]",
          active ? "font-medium text-text" : "text-muted group-hover:text-text",
        )}
      >
        {name}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${name} options`}
            className="mr-1 grid size-5 place-items-center rounded text-subtle opacity-0 transition-opacity hover:bg-active hover:text-text group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <ChevronsUpDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => {
              setDraft(name);
              setRenaming(true);
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => remove.mutate()}>
            Delete folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AddFolderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 items-center gap-2 rounded-lg px-2 text-[13px] text-subtle transition-colors hover:bg-hover hover:text-text"
    >
      <FolderPlus className="size-3.5" />
      Add folder
    </button>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-active hover:text-text"
      >
        <Icon className="size-3.5" />
      </button>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */

function SidebarFooter({
  name,
  email,
  workspace,
  onSettings,
  navigate,
}: {
  name: string;
  email: string;
  workspace: string;
  onSettings: () => void;
  navigate: (route: Route) => void;
}) {
  return (
    <div className="border-t border-border p-2">
      <div className="mb-1.5 flex items-center gap-0.5 px-1">
        <FooterIcon label="New note" icon={SquarePen} onClick={() => navigate({ kind: "home" })} />
        <FooterIcon label="People" icon={UserPlus} onClick={() => navigate({ kind: "settings", tab: "members" })} />
        <FooterIcon
          label="Templates"
          icon={LayoutTemplate}
          onClick={() => navigate({ kind: "settings", tab: "spaces" })}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-lg px-1.5 text-left transition-colors hover:bg-hover"
          >
            <Avatar name={workspace} size={18} className="rounded-md" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{name}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-subtle" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-60">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar name={workspace} size={26} className="rounded-lg" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-text">{workspace}</div>
              <div className="text-[11px] text-subtle">1 member</div>
            </div>
          </div>
          <div className="px-1 pb-1">
            <Button
              variant="subtle"
              size="sm"
              className="w-full"
              onClick={() => navigate({ kind: "settings", tab: "members" })}
            >
              <UserPlus />
              Invite teammates
            </Button>
          </div>
          <DropdownMenuSeparator />
          {email && <div className="px-2 py-1 text-[11px] text-subtle">{email}</div>}
          <DropdownMenuItem onSelect={() => navigate({ kind: "settings", tab: "workspace-general" })}>
            <Building2 />
            Workspace settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate({ kind: "settings", tab: "spaces" })}>
            <LayoutTemplate />
            Manage templates
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate({ kind: "settings", tab: "help" })}>
            <CircleHelp />
            Help centre
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onSettings()}>
            <Settings />
            Settings
            <DropdownMenuShortcut>Ctrl ,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FooterIcon({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} side="top">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="grid size-6 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-text"
      >
        <Icon className="size-3.5" />
      </button>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */

function NewFolderDialog({
  open,
  shared,
  onOpenChange,
}: {
  open: boolean;
  shared: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const navigate = useAppStore((s) => s.navigate);

  const create = useMutation({
    mutationFn: () => api.createFolder(name.trim(), shared),
    onSuccess: (folder) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.folders() });
      onOpenChange(false);
      setName("");
      navigate({ kind: "space", spaceId: folder.id });
    },
    onError: (e) => toast.error(e),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <Input
            autoFocus
            placeholder={shared ? "Team folder name" : "Folder name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" size="md" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="solid" size="md" disabled={!name.trim()} loading={create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
