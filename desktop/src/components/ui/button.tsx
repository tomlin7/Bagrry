import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium outline-none transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** High-emphasis neutral pill — the "New note" / "Start now" button. */
        solid: "bg-solid text-solid-fg shadow-xs hover:bg-solid-hover",
        /** Brand action. */
        accent: "bg-accent text-accent-fg hover:bg-accent-hover",
        /** Default surface button with a hairline border. */
        outline: "border border-border bg-surface text-text hover:bg-hover hover:border-border-strong",
        /** Chip / secondary fill with no border. */
        subtle: "bg-hover text-text hover:bg-active",
        /** Toolbar and icon affordances. */
        ghost: "text-muted hover:bg-hover hover:text-text",
        danger: "bg-danger text-danger-fg hover:opacity-90",
        link: "text-accent underline-offset-4 hover:underline rounded-sm",
      },
      size: {
        xs: "h-6 px-2 text-[11px] [&_svg]:size-3",
        sm: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
        md: "h-8 px-3.5 text-[13px] [&_svg]:size-4",
        lg: "h-10 px-5 text-sm [&_svg]:size-4",
        icon: "size-8 [&_svg]:size-4",
        "icon-sm": "size-7 [&_svg]:size-3.5",
        "icon-xs": "size-6 [&_svg]:size-3",
      },
      shape: {
        pill: "",
        square: "rounded-md",
      },
    },
    defaultVariants: { variant: "outline", size: "md", shape: "pill" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, shape, asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, shape }), className)}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin-slow" aria-hidden />
          <span className="contents">{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { buttonVariants };
