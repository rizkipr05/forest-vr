import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none",
  {
    variants: {
      variant: {
        jungle:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-900/15",
        sun:
          "bg-[#facc15] text-slate-900 hover:bg-[#eab308] shadow-md shadow-amber-500/20",
        river:
          "bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-900/15",
        berry:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        cream:
          "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-xs",
        darkGlass:
          "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-base sm:text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "jungle",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
