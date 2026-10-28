import { useEffect, useState } from "react";
import { currentWindow, isTauri } from "@/lib/tauri";
import { cn } from "@/lib/utils";

/**
 * The window is created with `decorations: false`, so the caption buttons are
 * ours to draw. Geometry matches the Windows 11 caption bar (46x32) so the app
 * doesn't feel foreign next to native windows.
 */
export function WindowControls({ className }: { className?: string }) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const win = currentWindow();
    if (!win) return;

    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const sync = () => {
      win
        .isMaximized()
        .then((v) => !cancelled && setMaximized(v))
        .catch(() => undefined);
    };

    sync();
    win
      .onResized(sync)
      .then((fn) => (cancelled ? fn() : (unlisten = fn)))
      .catch(() => undefined);

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  if (!isTauri()) return null;

  const act = (fn: (win: NonNullable<ReturnType<typeof currentWindow>>) => Promise<unknown>) => {
    const win = currentWindow();
    if (win) void fn(win).catch(() => undefined);
  };

  return (
    <div className={cn("flex h-8 items-stretch", className)}>
      <CaptionButton label="Minimize" onClick={() => act((w) => w.minimize())}>
        <line x1="0" y1="5.5" x2="10" y2="5.5" />
      </CaptionButton>

      <CaptionButton
        label={maximized ? "Restore" : "Maximize"}
        onClick={() => act((w) => w.toggleMaximize())}
      >
        {maximized ? (
          <>
            <rect x="0.5" y="2.5" width="7" height="7" />
            <path d="M2.5 2.5V0.5H9.5V7.5H7.5" />
          </>
        ) : (
          <rect x="0.5" y="0.5" width="9" height="9" />
        )}
      </CaptionButton>

      <CaptionButton label="Close" danger onClick={() => act((w) => w.close())}>
        <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" />
        <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" />
      </CaptionButton>
    </div>
  );
}

function CaptionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex w-[46px] items-center justify-center text-muted transition-colors",
        danger ? "hover:bg-[#c42b1c] hover:text-white" : "hover:bg-hover hover:text-text",
      )}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
        {children}
      </svg>
    </button>
  );
}
