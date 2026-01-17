import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { useUser } from "@/lib/query/hooks/useSession";
import { useEnsureProfile } from "@/lib/query/hooks/useProfile";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: sessionLoading } = useUser();
  const { profile, isLoading: profileLoading, ensureProfile, isCreating } = useEnsureProfile();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [sessionLoading, isAuthenticated, navigate]);

  // Ensure profile exists on first login
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !profile && !isCreating) {
      ensureProfile();
    }
  }, [isAuthenticated, profileLoading, profile, isCreating, ensureProfile]);

  // Show loading state while checking auth
  if (sessionLoading || profileLoading || isCreating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6 pb-24 md:py-8 md:pb-8">
        <div className="mx-auto max-w-6xl animate-fade-in">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
