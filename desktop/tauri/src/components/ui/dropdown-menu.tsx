import * as React from "react";
import * as Primitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuSub = Primitive.Sub;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;

const panelClass =
  "ui-pop z-50 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-elevated p-1 text-[13px] shadow-lg";

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <Primitive.Portal>
      <Primitive.Content ref={ref} sideOffset={sideOffset} className={cn(panelClass, className)} {...props} />
    </Primitive.Portal>
  );
});

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Primitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof Primitive.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return <Primitive.SubContent ref={ref} className={cn(panelClass, className)} {...props} />;
});

const itemClass =
  "relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors data-[highlighted]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      className={cn(itemClass, destructive && "text-danger [&_svg]:text-danger", className)}
      {...props}
    />
  );
});

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.SubTrigger>
>(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <Primitive.SubTrigger ref={ref} className={cn(itemClass, className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </Primitive.SubTrigger>
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Primitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Primitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <Primitive.CheckboxItem ref={ref} className={cn(itemClass, "pr-7", className)} {...props}>
      {children}
      <Primitive.ItemIndicator className="absolute right-2">
        <Check className="size-3.5" />
      </Primitive.ItemIndicator>
    </Primitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Primitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Primitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <Primitive.RadioItem ref={ref} className={cn(itemClass, "pr-7", className)} {...props}>
      {children}
      <Primitive.ItemIndicator className="absolute right-2">
        <Check className="size-3.5" />
      </Primitive.ItemIndicator>
    </Primitive.RadioItem>
  );
});

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-[11px] font-medium text-subtle", className)} {...props} />;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Primitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-[11px] tracking-wide text-subtle", className)} {...props} />;
}
