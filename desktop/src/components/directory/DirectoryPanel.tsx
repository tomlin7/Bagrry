import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";

export type DirectoryRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  avatarName: string;
  lastNoteAt: string | null;
  noteCount: number;
};

export function DirectoryPanel({
  title,
  subjectColumn,
  filters,
  rows,
  empty,
  searchPlaceholder,
}: {
  title: string;
  subjectColumn: string;
  filters: React.ReactNode;
  rows: DirectoryRow[];
  empty: React.ReactNode;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((row) => `${row.title} ${row.subtitle ?? ""}`.toLowerCase().includes(q)) : rows;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a.lastNoteAt ?? "";
      const bv = b.lastNoteAt ?? "";
      if (av === bv) return a.title.localeCompare(b.title);
      if (!av) return 1;
      if (!bv) return -1;
      return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
    });
    return copy;
  }, [query, rows, sortDir]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 px-6 pb-3 pt-2">
        <h1 className="font-display min-w-0 flex-1 text-[22px] font-semibold tracking-tight text-text">{title}</h1>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={query}
                placeholder={searchPlaceholder}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    setSearchOpen(false);
                  }
                }}
                className="h-8 w-52 rounded-full"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
                className="grid size-8 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-text"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="grid size-8 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-text"
            >
              <Search className="size-4" />
            </button>
          )}
          {filters}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10">
        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_4.5rem] gap-x-3 border-b border-border px-1 pb-2 text-[11px] font-medium text-subtle">
          <div>{subjectColumn}</div>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="inline-flex items-center gap-0.5 text-left hover:text-text"
          >
            Last note
            <ChevronDown className={cn("size-3 transition-transform", sortDir === "asc" && "rotate-180")} />
          </button>
          <div>Notes</div>
        </div>

        {visible.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_7.5rem_4.5rem] items-center gap-x-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-hover"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={row.avatarName} size={28} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-text">{row.title}</div>
                {row.subtitle ? <div className="truncate text-[12px] text-subtle">{row.subtitle}</div> : null}
              </div>
            </div>
            <div className="text-[13px] text-muted">{row.lastNoteAt ? formatDayLabel(row.lastNoteAt) : "—"}</div>
            <div className="text-[13px] text-muted">{row.noteCount || "—"}</div>
          </div>
        ))}

        {empty}
      </div>
    </div>
  );
}

export function DirectoryFilter({
  options,
  value,
  onChange,
  variant = "segmented",
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  variant?: "segmented" | "pill-link";
}) {
  if (variant === "pill-link") {
    return (
      <div className="flex items-center gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "h-8 rounded-full px-3 text-[13px] transition-colors duration-150",
                active ? "bg-solid text-solid-fg shadow-xs" : "text-muted hover:bg-hover hover:text-text",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex h-8 items-center rounded-full bg-hover p-0.5">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "h-7 rounded-full px-3 text-[13px] transition-colors duration-150",
              active ? "bg-solid text-solid-fg shadow-xs" : "text-muted hover:text-text",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DirectoryEmpty({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
      <div className="text-subtle/40 [&_svg]:size-16">{icon}</div>
      <p className="max-w-xs text-[13px] text-subtle">{children}</p>
    </div>
  );
}
