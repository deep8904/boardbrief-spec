import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Calendar, Trophy, User } from "lucide-react";

const navItems = [
  { href: "/app/home", label: "Home", icon: Home },
  { href: "/app/rules", label: "Rules", icon: BookOpen },
  { href: "/app/nights", label: "Nights", icon: Calendar },
  { href: "/app/tournaments", label: "Tourneys", icon: Trophy },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="mx-auto max-w-md bg-card/95 backdrop-blur-md rounded-2xl shadow-nav border border-border/50">
        <div className="flex items-center justify-around py-2.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
