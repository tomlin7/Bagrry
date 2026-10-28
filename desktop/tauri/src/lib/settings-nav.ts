import {
  AppWindow,
  BarChart3,
  Bell,
  CalendarDays,
  CircleHelp,
  CreditCard,
  Folder,
  Gift,
  LayoutGrid,
  SlidersHorizontal,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SettingsTab } from "./types";

export type SettingsNavEntry = { tab: SettingsTab; label: string; icon: LucideIcon; badge?: string };

export const SETTINGS_PERSONAL_NAV: SettingsNavEntry[] = [
  { tab: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { tab: "profile", label: "Profile", icon: User },
  { tab: "calendar", label: "Calendar", icon: CalendarDays },
  { tab: "notifications", label: "Notifications", icon: Bell },
  { tab: "connectors", label: "Connectors", icon: LayoutGrid },
  { tab: "help", label: "Get help", icon: CircleHelp },
];

export const SETTINGS_WORKSPACE_NAV: SettingsNavEntry[] = [
  { tab: "workspace-general", label: "General", icon: AppWindow },
  { tab: "members", label: "Members", icon: Users },
  { tab: "spaces", label: "Spaces", icon: Folder },
  { tab: "analytics", label: "Analytics", icon: BarChart3 },
  { tab: "billing", label: "Billing", icon: CreditCard },
  { tab: "referrals", label: "Referrals", icon: Gift, badge: "New" },
];
