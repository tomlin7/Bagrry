// Export sonner toast for use throughout app
export { toast } from "sonner";

// Re-export Toaster from sonner with default styling
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}