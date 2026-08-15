import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";
import { NotesWorkspace } from "@/components/NotesWorkspace";
import { CommandPalette } from "@/components/CommandPalette";
import { Onboarding } from "@/components/Onboarding";
import {
  ActionsPage,
  CalendarPage,
  CompaniesPage,
  PeoplePage,
  SearchPage,
  SettingsPage,
  TemplatesPage,
  WorkspacePage,
} from "@/components/pages";
import * as api from "@/lib/api";
import type { RecStatus, VuLevels } from "@/lib/types";
import { useAppStore } from "@/store/app";

export default function App() {
  const page = useAppStore((s) => s.page);
  const recState = useAppStore((s) => s.recState);
  const overlayOn = useAppStore((s) => s.overlayOn);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const setVu = useAppStore((s) => s.setVu);

  useEffect(() => {
    api.recordingStatus().then(applyRecStatus).catch(() => undefined);
    let a: (() => void) | undefined;
    let b: (() => void) | undefined;
    listen<RecStatus>("recording-state", (e) => applyRecStatus(e.payload)).then((fn) => {
      a = fn;
    });
    listen<VuLevels>("audio-vu", (e) => setVu(e.payload)).then((fn) => {
      b = fn;
    });
    return () => {
      a?.();
      b?.();
    };
  }, [applyRecStatus, setVu]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-background text-foreground">
      {overlayOn && recState === "recording" && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground">
          Bagrry is recording
        </div>
      )}
      <CommandPalette />
      <Onboarding />
      <AppShell>
        {page === "dashboard" && <Dashboard />}
        {page === "notes" && (
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <NotesWorkspace />
          </div>
        )}
        {page === "search" && <SearchPage />}
        {page === "people" && <PeoplePage />}
        {page === "companies" && <CompaniesPage />}
        {page === "calendar" && <CalendarPage />}
        {page === "actions" && <ActionsPage />}
        {page === "templates" && <TemplatesPage />}
        {page === "workspace" && <WorkspacePage />}
        {page === "settings" && <SettingsPage />}
      </AppShell>
    </div>
  );
}
