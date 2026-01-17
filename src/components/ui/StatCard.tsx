import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { CardShell } from "./CardShell";

type StatVariant = "default" | "mint" | "sky" | "lavender" | "peach";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  variant?: StatVariant;
  className?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

const textColorMap: Record<StatVariant, string> = {
  default: "text-foreground",
  mint: "text-pastel-mint-dark",
  sky: "text-pastel-sky-dark",
  lavender: "text-pastel-lavender-dark",
  peach: "text-pastel-peach-dark",
};

export function StatCard({
  value,
  label,
  icon,
  variant = "default",
  className,
  trend,
}: StatCardProps) {
  return (
    <CardShell variant={variant} className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn("text-stat", textColorMap[variant])}>{value}</p>
          <p className={cn(
            "text-sm font-medium",
            variant === "default" ? "text-muted-foreground" : textColorMap[variant]
          )}>
            {label}
          </p>
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.positive ? "text-success" : "text-danger"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            variant === "default" ? "bg-secondary" : "bg-white/50"
          )}>
            {icon}
          </div>
        )}
      </div>
    </CardShell>
  );
}
