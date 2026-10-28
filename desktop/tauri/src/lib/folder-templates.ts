import { CalendarDays, Folder, Presentation, Tag, Users, type LucideIcon } from "lucide-react";

/** Starter kits for the Create folder panel. Ids are stored on the folder row. */
export type FolderTemplateId = "projects" | "meetings" | "coaching" | "standups";

export type FolderTemplate = {
  id: FolderTemplateId;
  name: string;
  description: string;
};

export const FOLDER_TEMPLATES: FolderTemplate[] = [
  {
    id: "projects",
    name: "Projects",
    description: "Specs, workstreams, and project meetings in one place.",
  },
  {
    id: "meetings",
    name: "Team meetings",
    description: "Recurring team meetings, agendas, and follow-ups.",
  },
  {
    id: "coaching",
    name: "Coaching",
    description: "1-on-1s, career conversations, and coaching notes.",
  },
  {
    id: "standups",
    name: "Standups",
    description: "Daily standups, blockers, and team updates.",
  },
];

export function folderGlyph(icon: string | null | undefined): LucideIcon {
  switch (icon) {
    case "projects":
      return Presentation;
    case "meetings":
      return CalendarDays;
    case "coaching":
      return Tag;
    case "standups":
      return Users;
    default:
      return Folder;
  }
}

export function folderGlyphClass(icon: string | null | undefined): string {
  switch (icon) {
    case "projects":
      return "text-[#b794f6]";
    case "meetings":
      return "text-[#4ade80]";
    case "coaching":
      return "text-[#f6c945]";
    case "standups":
      return "text-text";
    default:
      return "text-muted";
  }
}
