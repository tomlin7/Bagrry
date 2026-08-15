import type { ReactNode } from "react";
import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  Home,
  LayoutTemplate,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Page } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

const MAIN_ITEMS: { page: Page; label: string; icon: ReactNode; shortcut?: string }[] = [
  { page: "dashboard", label: "Home", icon: <Home className="h-4 w-4" />, shortcut: "⌘1" },
  { page: "notes", label: "Notes", icon: <NotebookPen className="h-4 w-4" />, shortcut: "⌘2" },
  { page: "search", label: "Search", icon: <Search className="h-4 w-4" />, shortcut: "⌘3" },
];

const SECONDARY_ITEMS: { page: Page; label: string; icon: ReactNode }[] = [
  { page: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
  { page: "actions", label: "Actions", icon: <CheckSquare className="h-4 w-4" /> },
  { page: "people", label: "People", icon: <Users className="h-4 w-4" /> },
  { page: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" /> },
  { page: "templates", label: "Templates", icon: <LayoutTemplate className="h-4 w-4" /> },
];

const WORKSPACE_ITEMS = [
  { id: "personal", name: "Personal", avatar: "P" },
  { id: "work", name: "Work Team", avatar: "W" },
  { id: "project", name: "Project Alpha", avatar: "A" },
];

export function EnhancedAppShell({ children }: { children: ReactNode }) {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const recState = useAppStore((s) => s.recState);
  const [currentWorkspace, setCurrentWorkspace] = useState("personal");

  const currentWorkspaceData = WORKSPACE_ITEMS.find((w) => w.id === currentWorkspace) || WORKSPACE_ITEMS[0];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full min-h-0 w-full">
        {/* Enhanced Sidebar */}
        <aside className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-card py-4 transition-colors">
          {/* Workspace Switcher */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mb-6 h-10 w-10 rounded-xl border border-border transition-all hover:border-accent hover:bg-accent/20"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {currentWorkspaceData.avatar}
                </div>
                <ChevronDown className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-muted text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-64 p-2">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Workspaces</div>
                {WORKSPACE_ITEMS.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => setCurrentWorkspace(workspace.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                      workspace.id === currentWorkspace && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium">
                      {workspace.avatar}
                    </div>
                    {workspace.name}
                  </button>
                ))}
                <Separator className="my-2" />
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  Create workspace
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Main Navigation */}
          <div className="flex flex-col gap-1">
            {MAIN_ITEMS.map((item) => (
              <Tooltip key={item.page}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage(item.page)}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all",
                      page === item.page
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                  >
                    {item.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {item.shortcut && (
                    <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator className="my-4 w-8" />

          {/* Secondary Navigation */}
          <div className="flex flex-col gap-1">
            {SECONDARY_ITEMS.map((item) => (
              <Tooltip key={item.page}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage(item.page)}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all",
                      page === item.page
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                  >
                    {item.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Recording Indicator */}
          <AnimatePresence>
            {recState === "recording" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="mb-2 flex h-2 w-2 animate-pulse rounded-full bg-destructive shadow-sm"
                title="Recording"
              />
            )}
          </AnimatePresence>

          {/* Bottom Navigation */}
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage("workspace")}
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    page === "workspace"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                  )}
                >
                  <Shield className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Workspace</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage("settings")}
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    page === "settings"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                  )}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex min-h-0 flex-1"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function PageFrame({
  kicker,
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            {kicker && (
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{kicker}</p>
            )}
            <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}