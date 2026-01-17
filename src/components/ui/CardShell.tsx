import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type CardVariant = "default" | "mint" | "sky" | "lavender" | "peach" | "accent" | "image";

interface CardShellProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-card card-elevated",
  mint: "card-mint",
  sky: "card-sky",
  lavender: "card-lavender",
  peach: "card-peach",
  accent: "card-accent",
  image: "bg-secondary overflow-hidden",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function CardShell({
  children,
  variant = "default",
  className,
  padding = "md",
  hover = false,
  onClick,
}: CardShellProps) {
  const Component = onClick ? "button" : "div";
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        "rounded-xl transition-all duration-200",
        variantStyles[variant],
        paddingStyles[padding],
        hover && "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
        onClick && "w-full text-left",
        className
      )}
    >
      {children}
    </Component>
  );
}
