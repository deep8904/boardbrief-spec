import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function Page({ children, title, subtitle, actions, className }: PageProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && (
              <h1 className="text-page-title">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-2 text-muted-body">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
