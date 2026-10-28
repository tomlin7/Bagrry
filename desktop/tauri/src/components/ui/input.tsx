import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-text outline-none transition-colors",
          "hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none transition-colors",
        "hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

/**
 * Textarea that grows with its content up to `maxRows`, then scrolls.
 * Used for every "Ask anything" composer.
 */
export const AutoTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxRows?: number }
>(function AutoTextarea({ className, maxRows = 8, value, onChange, ...props }, forwardedRef) {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const max = lineHeight * maxRows;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [maxRows]);

  React.useLayoutEffect(resize, [resize, value]);

  return (
    <textarea
      ref={setRef}
      rows={1}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      className={cn(
        "w-full resize-none bg-transparent text-[13px] leading-5 text-text outline-none placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
});
