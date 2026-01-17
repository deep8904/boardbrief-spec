import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { CardShell } from "./CardShell";

type FeatureColor = "mint" | "sky" | "lavender" | "peach" | "default" | "yellow";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  color?: FeatureColor;
  className?: string;
}

// Map legacy "yellow" to lavender (closest pastel match)
const colorToVariant: Record<FeatureColor, "default" | "mint" | "sky" | "lavender" | "peach"> = {
  mint: "mint",
  sky: "sky",
  lavender: "lavender",
  peach: "peach",
  default: "default",
  yellow: "lavender", // Legacy mapping
};

const iconBgStyles: Record<FeatureColor, string> = {
  mint: "bg-white/60",
  sky: "bg-white/60",
  lavender: "bg-white/60",
  peach: "bg-white/60",
  default: "bg-secondary",
  yellow: "bg-white/60",
};

export function FeatureCard({
  title,
  description,
  icon,
  color = "default",
  className,
}: FeatureCardProps) {
  const variant = colorToVariant[color] || "default";
  
  return (
    <CardShell
      variant={variant}
      hover
      className={cn("h-full", className)}
    >
      {icon && (
        <div className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
          iconBgStyles[color]
        )}>
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </CardShell>
  );
}
