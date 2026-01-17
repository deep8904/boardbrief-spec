import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        outline: "border border-border bg-transparent text-foreground",
        mint: "bg-pastel-mint text-pastel-mint-dark",
        sky: "bg-pastel-sky text-pastel-sky-dark",
        lavender: "bg-pastel-lavender text-pastel-lavender-dark",
        peach: "bg-pastel-peach text-pastel-peach-dark",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface ChipProps extends VariantProps<typeof chipVariants> {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Chip({ children, variant, size, className, icon }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size }), className)}>
      {icon}
      {children}
    </span>
  );
}
