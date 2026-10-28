import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "data-[state=checked]:bg-accent data-[state=unchecked]:bg-border-strong",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-[18px] rounded-full bg-white shadow-sm ring-0 transition-transform duration-150 ease-out",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
});

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 text-[13px] text-text outline-none transition-colors",
        "hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-3.5 text-subtle" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-elevated p-1 text-[13px] shadow-lg ui-pop",
          "max-h-[min(24rem,var(--radix-select-content-available-height))]",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)]">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-2 pr-7 outline-none transition-colors",
        "data-[highlighted]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

/* ------------------------------------------------------------------ */
/* Settings row                                                        */
/* ------------------------------------------------------------------ */

/**
 * One line in a settings card: leading glyph, title + description, trailing control.
 * Rows stack inside `<SettingsCard>` and self-divide with hairlines.
 */
type LabelledProps = { "aria-label"?: string; "aria-labelledby"?: string };

export function SettingRow({
  icon,
  title,
  description,
  control,
  onClick,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  control?: React.ReactNode;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const titleId = React.useId();

  // Switches and selects sit visually next to their label but aren't wrapped by
  // one, so point them at the title to give them an accessible name.
  const labelledControl =
    React.isValidElement(control) && !(control.props as LabelledProps)["aria-label"]
      ? React.cloneElement(control as React.ReactElement<LabelledProps>, {
          "aria-labelledby": (control.props as LabelledProps)["aria-labelledby"] ?? titleId,
        })
      : control;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        interactive && "cursor-pointer hover:bg-hover",
      )}
    >
      {icon && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hover text-muted [&_svg]:size-4">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div id={titleId} className="text-[13px] font-medium text-text">
          {title}
        </div>
        {description && <div className="mt-0.5 text-xs leading-snug text-muted">{description}</div>}
      </div>
      {control && <div className="shrink-0">{labelledControl}</div>}
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  action,
  dashed,
  danger,
  children,
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dashed?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      {(title || action || description) && (
        <div className="mb-2 px-1">
          <div className="flex items-center justify-between gap-3">
            {title ? <h3 className="text-[13px] text-muted">{title}</h3> : <span />}
            {action}
          </div>
          {description && <p className="mt-0.5 max-w-xl text-xs leading-snug text-subtle">{description}</p>}
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-xl border",
          danger ? "border-danger/35 bg-danger/[0.06]" : "border-border bg-surface",
          dashed ? "divide-y divide-dashed divide-border" : "divide-y divide-[color:var(--border)]",
        )}
      >
        {children}
      </div>
    </section>
  );
}
