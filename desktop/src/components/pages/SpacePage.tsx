import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Blocks, Lock, NotebookPen, Users, X } from "lucide-react";
import * as api from "@/lib/api";
import { MY_NOTES_SPACE, TEAM_SPACE } from "@/lib/types";
import { folderGlyph, folderGlyphClass } from "@/lib/folder-templates";
import { useAppStore } from "@/store/app";
import { useChat } from "@/hooks/useChat";
import { spaceToFolderId, useCreateNote } from "@/hooks/useCreateNote";
import { NoteList } from "@/components/notes/NoteList";
import { AskBar, RecipeChips } from "@/components/chat/AskBar";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BANNER_DISMISS_PREFIX = "bagrry.banner.";

export function SpacePage({ spaceId }: { spaceId: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const createNote = useCreateNote();
  const { send, pending } = useChat(null);

  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });
  const { data: folders = [] } = useQuery({ queryKey: api.qk.folders(), queryFn: api.listFolders });

  const folderId = spaceToFolderId(spaceId);
  const folder = folders.find((f) => f.id === spaceId);
  const workspace = profile?.workspace || "My workspace";

  const { data: allNotes = [], isLoading } = useQuery({
    queryKey: api.qk.meetings(folderId),
    queryFn: () => api.listMeetings(folderId),
  });

  // `my-notes` and `team` aggregate across folders by share flag; a real folder
  // is already filtered by the query above.
  const sharedFolderIds = new Set(folders.filter((f) => f.is_shared).map((f) => f.id));
  const notes =
    spaceId === MY_NOTES_SPACE
      ? allNotes.filter((n) => !n.folder_id || !sharedFolderIds.has(n.folder_id))
      : spaceId === TEAM_SPACE
        ? allNotes.filter((n) => n.folder_id && sharedFolderIds.has(n.folder_id))
        : allNotes;

  const FolderGlyph = folderGlyph(folder?.icon);

  const header =
    spaceId === MY_NOTES_SPACE
      ? {
          icon: <Lock className="size-3.5" />,
          title: "My notes",
          subtitle: "Notes from all of your private folders.",
          meta: (
            <>
              <Lock className="size-3" />
              Your private notes and folders
            </>
          ),
          banner: {
            id: "private-space",
            tone: "info" as const,
            title: "Your private space",
            body: "Your notes live here by default. Nothing gets shared until you choose to share it.",
          },
        }
      : spaceId === TEAM_SPACE
        ? {
            avatar: workspace,
            title: `${workspace} team`,
            subtitle: "Notes visible to your entire workspace.",
            meta: (
              <>
                <Users className="size-3" />
                Your team workspace
                <span className="text-subtle">·</span>
                <Blocks className="size-3" />
                Integrations
              </>
            ),
            banner: {
              id: "team-space",
              tone: "accent" as const,
              title: "Your team space",
              body: "Share meeting notes with your team. Add user interviews, sales calls and team meetings so everyone stays in the loop.",
            },
          }
        : {
            icon: <FolderGlyph className={cn("size-3.5", folderGlyphClass(folder?.icon))} />,
            title: folder?.name ?? "Folder",
            subtitle:
              folder?.description ||
              (folder?.is_shared ? "Shared with your workspace." : "A private folder in your space."),
            meta: folder?.is_shared ? (
              <>
                <Users className="size-3" />
                Shared folder
              </>
            ) : (
              <>
                <Lock className="size-3" />
                Private folder
              </>
            ),
            banner: null,
          };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-8">
        <header className="flex flex-col items-center text-center">
          {"avatar" in header && header.avatar ? (
            <Avatar name={header.avatar} size={26} className="rounded-lg" />
          ) : (
            <div className="grid size-7 place-items-center rounded-lg bg-hover text-muted">
              {"icon" in header ? header.icon : null}
            </div>
          )}
          <h1 className="font-display mt-2 text-[30px] font-semibold leading-tight text-text">
            {header.title}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">{header.subtitle}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-subtle">{header.meta}</p>
        </header>

        {header.banner && (
          <SpaceBanner
            id={header.banner.id}
            tone={header.banner.tone}
            title={header.banner.title}
            body={header.banner.body}
          />
        )}

        <div className="mt-6">
          <AskBar
            placeholder="Add a note to this space to start chatting"
            busy={pending}
            onSubmit={(value) => void send(value, { spaceId: folderId })}
          />
          <RecipeChips
            className="mt-2"
            limit={3}
            onPick={(prompt) => void send(prompt, { spaceId: folderId })}
            onSeeAll={() => navigate({ kind: "chat", sessionId: null })}
          />
        </div>

        <div className="my-6 h-px bg-border" />

        <NoteList
          notes={notes}
          loading={isLoading}
          emptyState={
            <EmptyState
              icon={<NotebookPen />}
              title="Take your first meeting note"
              description="Notes you create in this space will be listed here."
              action={
                <Button
                  variant="accent"
                  size="md"
                  onClick={() => createNote.mutate({ folder: folderId })}
                >
                  New note
                </Button>
              }
            />
          }
        />
      </div>
    </div>
  );
}

function SpaceBanner({
  id,
  tone,
  title,
  body,
}: {
  id: string;
  tone: "info" | "accent";
  title: string;
  body: string;
}) {
  const storageKey = `${BANNER_DISMISS_PREFIX}${id}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  return (
    <div
      className={
        tone === "accent"
          ? "relative mt-6 rounded-xl border border-accent/30 bg-accent-subtle p-3.5"
          : "relative mt-6 rounded-xl border border-border bg-surface-2 p-3.5"
      }
    >
      <p className="text-[13px] font-medium text-text">{title}</p>
      <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted">{body}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(storageKey, "1");
          } catch {
            /* storage unavailable */
          }
          setDismissed(true);
        }}
        className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
