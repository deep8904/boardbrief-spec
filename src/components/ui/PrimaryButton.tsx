import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Link } from "react-router-dom";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "accent";
  href?: string;
  className?: string;
}

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_-2px_hsl(200_100%_45%/0.3)] hover:shadow-[0_4px_12px_-2px_hsl(200_100%_45%/0.4)]",
  secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_2px_8px_-2px_hsl(24_95%_55%/0.3)]",
};

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, size = "md", variant = "primary", href, className, disabled, ...props }, ref) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center rounded-full font-semibold",
      "transition-all duration-200 hover:-translate-y-0.5",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
      sizeStyles[size],
      variantStyles[variant],
      className
    );

    if (href) {
      return (
        <Link to={href} className={baseStyles}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={baseStyles} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";
