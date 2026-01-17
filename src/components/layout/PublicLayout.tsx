import { ReactNode } from "react";
import { TopNav } from "./TopNav";

interface PublicLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function PublicLayout({ children, showNav = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNav && <TopNav />}
      <main>{children}</main>
    </div>
  );
}
