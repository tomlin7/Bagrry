import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { MY_NOTES_SPACE, TEAM_SPACE } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/store/app";

/**
 * Spaces are a UI concept; only real folders have rows in SQLite. `my-notes`
 * and `team` are aggregate views, so notes created there land in the inbox.
 */
export function spaceToFolderId(spaceId: string | undefined): string | null {
  if (!spaceId || spaceId === MY_NOTES_SPACE || spaceId === TEAM_SPACE) return null;
  return spaceId;
}

export function useCurrentFolderId(): string | null {
  const route = useAppStore((s) => s.route);
  return route.kind === "space" ? spaceToFolderId(route.spaceId) : null;
}

/** Creates a note in the active space, opens it, and optionally starts recording. */
export function useCreateNote() {
  const queryClient = useQueryClient();
  const openNote = useAppStore((s) => s.openNote);
  const folderId = useCurrentFolderId();

  return useMutation({
    mutationFn: async ({
      title = "New note",
      folder = folderId,
      record = false,
    }: {
      title?: string;
      folder?: string | null;
      record?: boolean;
    }) => {
      const note = await api.createMeeting(title, folder);
      if (record) {
        // A failed start shouldn't discard the note the user just created.
        try {
          await api.startRecording(note.id);
        } catch (error) {
          toast.error(error, "The note was created without recording.");
        }
      }
      return note;
    },
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      openNote(note.id);
    },
    onError: (error) => toast.error(error),
  });
}
