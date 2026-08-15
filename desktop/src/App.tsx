import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import * as api from "@/lib/api";
import { currentWindow, isTauri } from "@/lib/tauri";
import { watchSystemTheme } from "@/lib/theme";
import { routeKey, type RecStatus, type VuLevels } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { Sidebar } from "@/components/layout/Sidebar";
import { TitleBar } from "@/components/layout/TitleBar";
import { CommandPalette } from "@/components/CommandPalette";
import { Onboarding } from "@/components/Onboarding";
import { Toaster } from "@/components/ui/toast";
import { HomePage } from "@/components/pages/HomePage";
import { NotePage } from "@/components/pages/NotePage";
import { ChatPage } from "@/components/pages/ChatPage";
import { SpacePage } from "@/components/pages/SpacePage";
import { SharedPage } from "@/components/pages/SharedPage";
import { SettingsPage } from "@/components/pages/SettingsPage";

const SNAPPY = { duration: 0.14, ease: [0.22, 1, 0.36, 1] as const };

export default function App() {
  const route = useAppStore((s) => s.route);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  useGlobalShortcuts();
  useRecordingBridge();
  useSystemThemeSync();
  useShowWindowWhenReady();

  return (
    <MotionConfig reducedMotion="user" transition={SNAPPY}>
      <TooltipProvider delayDuration={350} skipDelayDuration={200}>
        <div className="flex h-full w-full overflow-hidden bg-bg text-text">
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div
                key="sidebar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full"
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex min-w-0 flex-1 flex-col bg-bg">
            <TitleBar />
            <main className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={routeKey(route)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="h-full min-h-0"
                >
                  {route.kind === "home" && <HomePage />}
                  {route.kind === "shared" && <SharedPage />}
                  {route.kind === "space" && <SpacePage spaceId={route.spaceId} />}
                  {route.kind === "note" && <NotePage noteId={route.noteId} />}
                  {route.kind === "chat" && <ChatPage sessionId={route.sessionId} />}
                  {route.kind === "settings" && <SettingsPage tab={route.tab} />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          <CommandPalette />
          <Onboarding />
          <Toaster />
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

/** Mirrors the Rust recorder state machine into the store. */
function useRecordingBridge() {
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const setVu = useAppStore((s) => s.setVu);

  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    const unlisteners: Array<() => void> = [];

    api.recordingStatus().then(applyRecStatus).catch(() => undefined);

    const register = <T,>(event: string, handler: (payload: T) => void) => {
      listen<T>(event, (e) => handler(e.payload))
        .then((fn) => (disposed ? fn() : unlisteners.push(fn)))
        .catch(() => undefined);
    };

    register<RecStatus>("recording-state", applyRecStatus);
    register<VuLevels>("audio-vu", setVu);

    return () => {
      disposed = true;
      unlisteners.forEach((fn) => fn());
    };
  }, [applyRecStatus, setVu]);
}

function useSystemThemeSync() {
  const syncSystemTheme = useAppStore((s) => s.syncSystemTheme);
  useEffect(() => watchSystemTheme(syncSystemTheme), [syncSystemTheme]);
}

/**
 * The window is created hidden so the first paint is already themed and
 * laid out; showing it here avoids a white flash on launch.
 */
function useShowWindowWhenReady() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      currentWindow()
        ?.show()
        .catch(() => undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
}
