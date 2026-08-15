import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  Home,
  LayoutTemplate,
  MessageSquare,
  NotebookPen,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Command } from "cmdk";
import { Kbd } from "@/components/ui/kbd";
import * as api from "@/lib/api";
import type { Page } from "@/lib/types";
import { useAppStore } from "@/store/app";
// import { cn } from "@/lib/utils";

const NAVIGATION_ITEMS: { page: Page; label: string; icon: React.ReactNode; keywords: string[] }[] = [
  { page: "dashboard", label: "Home", icon: <Home className="h-4 w-4" />, keywords: ["dashboard", "home", "overview"] },
  { page: "notes", label: "Notes", icon: <NotebookPen className="h-4 w-4" />, keywords: ["notes", "meetings", "transcripts"] },
  { page: "search", label: "Search", icon: <Search className="h-4 w-4" />, keywords: ["search", "ask", "ai", "chat"] },
  { page: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" />, keywords: ["calendar", "schedule"] },
  { page: "actions", label: "Actions", icon: <CheckSquare className="h-4 w-4" />, keywords: ["actions", "tasks", "todo"] },
  { page: "people", label: "People", icon: <Users className="h-4 w-4" />, keywords: ["people", "contacts", "attendees"] },
  { page: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" />, keywords: ["companies", "organizations"] },
  { page: "templates", label: "Templates", icon: <LayoutTemplate className="h-4 w-4" />, keywords: ["templates", "recipes"] },
  { page: "workspace", label: "Workspace", icon: <Shield className="h-4 w-4" />, keywords: ["workspace", "privacy"] },
  { page: "settings", label: "Settings", icon: <Settings className="h-4 w-4" />, keywords: ["settings", "preferences", "config"] },
];

export function EnhancedCommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const setPage = useAppStore((s) => s.setPage);
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const [query, setQuery] = useState("");

  const meetings = useQuery({
    queryKey: ["meetings", null],
    queryFn: () => api.listMeetings(null),
    enabled: open,
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useAppStore.getState().paletteOpen);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  // Reset query when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filteredNavigation = useMemo(() => {
    if (!query) return NAVIGATION_ITEMS;
    const searchQuery = query.toLowerCase();
    return NAVIGATION_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery) ||
        item.keywords.some((keyword) => keyword.includes(searchQuery)),
    );
  }, [query]);

  const filteredMeetings = useMemo(() => {
    if (!meetings.data) return [];
    if (!query) return meetings.data.slice(0, 8);
    const searchQuery = query.toLowerCase();
    return meetings.data.filter((meeting) => meeting.title.toLowerCase().includes(searchQuery)).slice(0, 8);
  }, [meetings.data, query]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <div className="flex min-h-full items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center border-b border-border px-4">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search meetings, navigate, or ask AI..."
                  className="flex h-12 w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </div>
              </div>

              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No results found</p>
                </Command.Empty>

                {/* Navigation */}
                {filteredNavigation.length > 0 && (
                  <Command.Group heading="Navigation">
                    {filteredNavigation.map((item) => (
                      <Command.Item
                        key={item.page}
                        onSelect={() => {
                          setPage(item.page);
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent data-[selected=true]:bg-accent"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {item.icon}
                        </div>
                        <span className="flex-1">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Recent Meetings */}
                {filteredMeetings.length > 0 && (
                  <Command.Group heading="Recent Meetings">
                    {filteredMeetings.map((meeting) => (
                      <Command.Item
                        key={meeting.id}
                        onSelect={() => {
                          selectMeeting(meeting.id);
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent data-[selected=true]:bg-accent"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meeting.date).toLocaleDateString()}
                          </p>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* AI Search */}
                {query.trim() && (
                  <Command.Group heading="AI Search">
                    <Command.Item
                      onSelect={() => {
                        setPage("search");
                        setChatOpen(true);
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent data-[selected=true]:bg-accent"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ask "{query}" across all meetings</p>
                        <p className="text-xs text-muted-foreground">Search using AI</p>
                      </div>
                    </Command.Item>
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Kbd>↵</Kbd>
                    <span>to select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <span>to navigate</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Kbd>esc</Kbd>
                  <span>to close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}