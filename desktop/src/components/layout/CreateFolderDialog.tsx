import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import * as api from "@/lib/api";
import { FOLDER_TEMPLATES, folderGlyph, folderGlyphClass, type FolderTemplateId } from "@/lib/folder-templates";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { Avatar } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/controls";

type SpaceId = "private" | "team";

export function CreateFolderDialog({
  open,
  initialShared,
  workspaceName,
  onOpenChange,
}: {
  open: boolean;
  initialShared: boolean;
  workspaceName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string>("folder");
  const [templateId, setTemplateId] = useState<FolderTemplateId | null>(null);
  const [space, setSpace] = useState<SpaceId>(initialShared ? "team" : "private");

  const queryClient = useQueryClient();
  const navigate = useAppStore((s) => s.navigate);
  const teamLabel = `${workspaceName} team`;
  const shared = space === "team";
  const canCreate = name.trim().length > 0;
  const NameIcon = folderGlyph(icon);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setIcon("folder");
    setTemplateId(null);
    setSpace(initialShared ? "team" : "private");
  }, [open, initialShared]);

  const create = useMutation({
    mutationFn: () =>
      api.createFolder(name.trim(), shared, {
        icon: icon === "folder" ? null : icon,
        description: description.trim() || null,
      }),
    onSuccess: (folder) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.folders() });
      onOpenChange(false);
      navigate({ kind: "space", spaceId: folder.id });
    },
    onError: (e) => toast.error(e),
  });

  function applyTemplate(id: FolderTemplateId) {
    const template = FOLDER_TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    setTemplateId(id);
    setIcon(id);
    setName(template.name);
    setDescription(template.description);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-6">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-[17px]">Create folder</DialogTitle>
          <DialogDescription className="sr-only">
            Name this folder, optionally start from a template, and choose which space it lives in.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canCreate && !create.isPending) create.mutate();
          }}
        >
          <label className="mb-1.5 block text-[13px] text-muted" htmlFor="create-folder-name">
            Name and icon
          </label>
          <div
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3",
              "transition-[border-color,box-shadow] duration-150",
              "hover:border-border-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25",
            )}
          >
            <NameIcon className={cn("size-4 shrink-0", folderGlyphClass(icon))} aria-hidden />
            <input
              id="create-folder-name"
              autoFocus
              autoComplete="off"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle"
            />
          </div>

          <p className="mb-2 mt-4 text-[12px] text-subtle">Or start from a template</p>
          <div className="flex flex-wrap gap-2">
            {FOLDER_TEMPLATES.map((template) => {
              const Icon = folderGlyph(template.id);
              const selected = templateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-[background-color,border-color,transform,color] duration-150 ease-out",
                    "hover:scale-[1.02] hover:bg-hover active:scale-[0.98]",
                    selected
                      ? "border-border-strong bg-hover text-text"
                      : "border-border bg-transparent text-muted hover:text-text",
                  )}
                >
                  <Icon className={cn("size-3.5", folderGlyphClass(template.id))} />
                  {template.name}
                </button>
              );
            })}
          </div>

          <label className="mb-1.5 mt-5 block text-[13px] text-muted" htmlFor="create-folder-description">
            Description
          </label>
          <Textarea
            id="create-folder-description"
            rows={3}
            placeholder="Describe the purpose of this folder"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[88px] rounded-xl"
          />

          <label className="mb-1.5 mt-5 block text-[13px] text-muted" htmlFor="create-folder-space">
            Space
          </label>
          <Select value={space} onValueChange={(value) => setSpace(value as SpaceId)}>
            <SelectTrigger id="create-folder-space" className="h-10 w-full rounded-xl px-3">
              <span className="flex min-w-0 items-center gap-2">
                {shared ? (
                  <Avatar name={workspaceName} size={18} className="rounded-full" />
                ) : (
                  <Lock className="size-3.5 text-muted" />
                )}
                <span className="truncate">{shared ? teamLabel : "My notes"}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <span className="flex items-center gap-2">
                  <Lock className="size-3.5 text-muted" />
                  My notes
                </span>
              </SelectItem>
              <SelectItem value="team">
                <span className="flex items-center gap-2">
                  <Avatar name={workspaceName} size={18} className="rounded-full" />
                  {teamLabel}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-[12px] leading-snug text-subtle">
            {shared ? "Everyone in your workspace will be able to view this folder." : "Only you can see this folder."}
          </p>

          <DialogFooter className="mt-6">
            <Button type="button" variant="subtle" size="md" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="solid" size="md" disabled={!canCreate} loading={create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
