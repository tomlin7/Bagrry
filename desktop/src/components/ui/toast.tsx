import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { useAppStore } from "@/store/app";

export function Toaster() {
  const theme = useAppStore((s) => s.resolvedTheme);
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      offset={16}
      gap={8}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-[color:var(--border)] !bg-[color:var(--elevated)] !text-[color:var(--text)] !shadow-lg !font-sans !text-[13px]",
          description: "!text-[color:var(--text-muted)] !text-xs",
          actionButton: "!bg-[color:var(--solid)] !text-[color:var(--solid-fg)] !rounded-full",
          cancelButton: "!bg-[color:var(--hover)] !text-[color:var(--text-muted)] !rounded-full",
          error: "!text-[color:var(--danger)]",
        },
      }}
    />
  );
}

/** Normalises the `string` errors Tauri commands reject with. */
export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Something went wrong";
}

export const toast = {
  success: (message: string, description?: string) => sonnerToast.success(message, { description }),
  error: (error: unknown, description?: string) =>
    sonnerToast.error(errorMessage(error), { description }),
  info: (message: string, description?: string) => sonnerToast(message, { description }),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: sonnerToast.promise,
};
