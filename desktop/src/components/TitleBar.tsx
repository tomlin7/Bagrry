import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const window = getCurrentWindow();
    
    // Check initial maximized state
    window.isMaximized().then(setIsMaximized);

    // Listen for window state changes
    const unlistenResize = window.onResized(() => {
      window.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlistenResize.then(fn => fn());
    };
  }, []);

  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    const window = getCurrentWindow();
    if (isMaximized) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  const handleDrag = () => {
    getCurrentWindow().startDragging();
  };

  return (
    <div className="flex h-8 w-full items-center justify-between bg-background border-b border-border">
      {/* Drag region - left side */}
      <div 
        className="flex-1 h-full cursor-move" 
        onMouseDown={handleDrag}
        data-tauri-drag-region
      />
      
      {/* App title/logo - center */}
      <div className="flex items-center gap-2 px-4">
        <span className="font-display text-sm font-semibold text-foreground">Bagrry</span>
      </div>
      
      {/* Drag region - center */}
      <div 
        className="flex-1 h-full cursor-move" 
        onMouseDown={handleDrag}
        data-tauri-drag-region
      />
      
      {/* Window controls - right */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMinimize}
          className="h-8 w-10 rounded-none hover:bg-accent"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMaximize}
          className="h-8 w-10 rounded-none hover:bg-accent"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className={cn("h-4 w-4", isMaximized && "scale-90")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-10 rounded-none hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}