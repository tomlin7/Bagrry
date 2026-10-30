import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Users,
  Search,
  Kanban,
  Code2,
  Briefcase,
  Shield,
  Rocket,
  ListChecks,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import * as api from "@/lib/api";
import type { Template } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const TEMPLATE_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "users", label: "People / 1-on-1", icon: Users },
  { id: "search", label: "Research / Discovery", icon: Search },
  { id: "kanban", label: "Standup / Agile", icon: Kanban },
  { id: "code", label: "Technical / Architecture", icon: Code2 },
  { id: "briefcase", label: "Sales / Business", icon: Briefcase },
  { id: "shield", label: "Security / Compliance", icon: Shield },
  { id: "rocket", label: "Product / Launch", icon: Rocket },
  { id: "list-checks", label: "Checklist / Action items", icon: ListChecks },
  { id: "message-square", label: "Interview / Chat", icon: MessageSquare },
];

export function getTemplateIcon(iconName: string | null | undefined): LucideIcon {
  const match = TEMPLATE_ICONS.find((i) => i.id === iconName);
  return match ? match.icon : Sparkles;
}

export function parseTemplateSections(structureJson: string | null | undefined): string[] {
  if (!structureJson) return ["Summary", "Action Items"];
  try {
    const parsed = JSON.parse(structureJson) as { sections?: string[] };
    if (Array.isArray(parsed?.sections) && parsed.sections.length > 0) {
      return parsed.sections;
    }
  } catch {
    /* fallback */
  }
  return ["Summary", "Action Items"];
}

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateToEdit?: Template | null;
  onSelectTemplate?: (templateId: string) => void;
}

export function TemplateDialog({
  open,
  onOpenChange,
  templateToEdit,
  onSelectTemplate,
}: TemplateDialogProps) {
  const queryClient = useQueryClient();

  const isEditing = Boolean(templateToEdit && !templateToEdit.id.startsWith("tpl_1on1") && !templateToEdit.id.startsWith("tpl_discovery") && !templateToEdit.id.startsWith("tpl_standup") && !templateToEdit.id.startsWith("tpl_arch") && !templateToEdit.id.startsWith("tpl_sales"));

  const [name, setName] = useState(templateToEdit?.name || "");
  const [icon, setIcon] = useState(templateToEdit?.icon || "sparkles");
  const [prompt, setPrompt] = useState(
    templateToEdit?.prompt_template ||
      "Anchor on the user scratchpad. Expand discussion points with exact quotes, numbers, and decisions from the transcript.",
  );
  const [sections, setSections] = useState<string[]>(
    parseTemplateSections(templateToEdit?.structure_json),
  );
  const [newSectionInput, setNewSectionInput] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Template name is required");
      if (sections.length === 0) throw new Error("At least one section is required");

      const structureJson = JSON.stringify({ sections });

      if (isEditing && templateToEdit) {
        await api.updateCustomTemplate(templateToEdit.id, trimmedName, prompt, structureJson, icon);
        return templateToEdit.id;
      } else {
        const created = await api.saveCustomTemplate(trimmedName, prompt, structureJson, icon);
        return created.id;
      }
    },
    onSuccess: (templateId) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.templates() });
      toast.success(isEditing ? "Template updated" : "Template created");
      onOpenChange(false);
      if (onSelectTemplate) {
        onSelectTemplate(templateId);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!templateToEdit) return;
      await api.deleteCustomTemplate(templateToEdit.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.templates() });
      toast.success("Template deleted");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete template");
    },
  });

  const handleAddSection = () => {
    const s = newSectionInput.trim();
    if (!s) return;
    if (!sections.includes(s)) {
      setSections([...sections, s]);
    }
    setNewSectionInput("");
  };

  const handleRemoveSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleDuplicate = () => {
    setName(`${name} (Copy)`);
    toast.info("Duplicated template as draft");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] rounded-2xl border border-border bg-surface-1 p-6 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-lg font-semibold text-text">
            {isEditing ? "Edit Template Persona" : "Create Meeting Template"}
          </DialogTitle>
          <p className="text-[12px] text-muted">
            Configure how AI synthesizes meetings, including extraction sections and custom personas.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Name & Icon */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-text">Template Name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Design Critique / Executive Sync"
                className="h-9 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-xs text-text outline-none placeholder:text-subtle focus:border-accent"
              />
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-text">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => setIcon(item.id)}
                    className={cn(
                      "grid size-8 place-items-center rounded-lg border transition-colors cursor-pointer",
                      isSelected
                        ? "border-accent bg-accent/15 text-accent shadow-xs"
                        : "border-border bg-hover/20 text-muted hover:border-border-strong hover:text-text",
                    )}
                  >
                    <IconComp className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output Sections Definition */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-text">
              Sections to Extract ({sections.length})
            </label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface-2 p-2">
              {sections.map((section, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 rounded-md border border-border bg-surface-1 px-2 py-1 text-[11px] font-medium text-text"
                >
                  <span>{section}</span>
                  <button
                    type="button"
                    aria-label={`Remove section ${section}`}
                    onClick={() => handleRemoveSection(idx)}
                    className="grid size-3.5 place-items-center text-subtle hover:text-red-500 cursor-pointer"
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newSectionInput}
                  onChange={(e) => setNewSectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSection();
                    }
                  }}
                  placeholder="+ Add section..."
                  className="h-6 w-28 bg-transparent px-1 text-[11px] text-text outline-none placeholder:text-subtle"
                />
                {newSectionInput && (
                  <button
                    type="button"
                    aria-label="Add section"
                    onClick={handleAddSection}
                    className="grid size-5 place-items-center rounded bg-accent text-white cursor-pointer"
                  >
                    <Plus className="size-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Prompt Persona Instructions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-text">
                Custom Prompt Persona & Guidelines
              </label>
              <span className="text-[10px] text-subtle">Direct instruction for LLM</span>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus on pricing objections and budget numbers. Quote clients verbatim."
              className="w-full resize-none rounded-lg border border-border bg-surface-2 p-2.5 text-xs text-text leading-relaxed outline-none placeholder:text-subtle focus:border-accent"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="gap-1 text-red-500 hover:bg-red-500/10 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            )}

            {templateToEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                className="gap-1 text-muted hover:text-text cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Duplicate</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              size="sm"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="cursor-pointer"
            >
              {isEditing ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
