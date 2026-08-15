import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content> & {
    showClose?: boolean;
    /** `bare` drops the card chrome — used by the command palette. */
    bare?: boolean;
  }
>(function DialogContent({ className, children, showClose = true, bare = false, ...props }, ref) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="ui-overlay fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]" />
      <Primitive.Content
        ref={ref}
        className={cn(
          "ui-dialog fixed left-1/2 top-1/2 z-50 w-full max-w-lg outline-none",
          !bare && "rounded-2xl border border-border bg-elevated p-5 shadow-xl",
          className,
        )}
        {...props}
      >
        {children}
        {showClose && !bare && (
          <Primitive.Close className="absolute right-3.5 top-3.5 rounded-md p-1 text-subtle transition-colors hover:bg-hover hover:text-text">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Primitive.Close>
        )}
      </Primitive.Content>
    </Primitive.Portal>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1 pr-8", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Title>) {
  return (
    <Primitive.Title className={cn("font-display text-lg font-semibold text-text", className)} {...props} />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Description>) {
  return <Primitive.Description className={cn("text-[13px] text-muted", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex items-center justify-end gap-2", className)} {...props} />;
}
