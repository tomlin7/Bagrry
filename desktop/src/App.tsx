import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/toast";
import { TitleBar } from "@/components/TitleBar";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground transition-colors">
      <TitleBar />
      {overlayOn && recState === "recording" && (
        <div className="pointer-events-none fixed left-1/2 top-10 z-50 -translate-x-1/2 animate-slide-in-down rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground shadow-sm">
          Bagrry is recording
        </div>
      )}
      <CommandPalette />
      <Onboarding />
      <div className="flex min-h-0 flex-1">
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
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <HashRouter>
          <AppContent />
          <Toaster />
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
