import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the OAuth or magic link code for a session. For PKCE flows this
        // parses the code from the current URL and stores the session in the Supabase
        // client. If there's no code (e.g. email redirect), supabase-js will handle it.
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/login");
          return;
        }
        // On successful exchange the session is persisted internally. We can now
        // redirect to the authenticated portion of the app.
        navigate("/app/home");
      } catch (e) {
        console.error("Auth callback unexpected error:", e);
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
