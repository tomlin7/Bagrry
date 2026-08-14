import type { ReactNode } from "react";
import {
  Building2,
  Calendar,
  CheckSquare,
  CreditCard,
  LayoutDashboard,
  Link2,
  MessageSquare,
  NotebookPen,
  Settings,
  Users,
} from "lucide-react";
import type { Page } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

const ITEMS: { page: Page; label: string; icon: ReactNode }[] = [
  { page: "dashboard", label: "Home", icon: <LayoutDashboard className="h-4 w-4" /> },
  { page: "notes", label: "Notes", icon: <NotebookPen className="h-4 w-4" /> },
  { page: "search", label: "Ask", icon: <MessageSquare className="h-4 w-4" /> },
  { page: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
  { page: "actions", label: "Actions", icon: <CheckSquare className="h-4 w-4" /> },
  { page: "people", label: "People", icon: <Users className="h-4 w-4" /> },
  { page: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const recState = useAppStore((s) => s.recState);

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside className="flex w-[4.25rem] shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-4">
        <button type="button" className="mb-5 px-1" onClick={() => setPage("landing")} title="Marketing">
          <span className="font-display text-lg italic leading-none">B</span>
        </button>
        {ITEMS.map((item) => (
          <button
            key={item.page}
            type="button"
            title={item.label}
            onClick={() => setPage(item.page)}
            className={cn(
              "mb-1 flex h-10 w-10 items-center justify-center rounded-xl transition",
              page === item.page ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/70",
            )}
          >
            {item.icon}
          </button>
        ))}
        <div className="flex-1" />
        {recState === "recording" && <span className="mb-2 h-2 w-2 rounded-full bg-destructive" title="Recording" />}
        <NavTiny page="pricing" current={page} onClick={setPage} icon={<CreditCard className="h-4 w-4" />} label="Pricing" />
        <NavTiny page="integrations" current={page} onClick={setPage} icon={<Link2 className="h-4 w-4" />} label="Integrations" />
        <NavTiny page="settings" current={page} onClick={setPage} icon={<Settings className="h-4 w-4" />} label="Settings" />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}

function NavTiny({
  page,
  current,
  onClick,
  icon,
  label,
}: {
  page: Page;
  current: Page;
  onClick: (p: Page) => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onClick(page)}
      className={cn(
        "mb-1 flex h-10 w-10 items-center justify-center rounded-xl",
        current === page ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/70",
      )}
    >
      {icon}
    </button>
  );
}

export function PageFrame({
  kicker,
  title,
  subtitle,
  actions,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {kicker && (
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{kicker}</p>
            )}
            <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}
