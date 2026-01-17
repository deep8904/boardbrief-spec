import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "../queryKeys";
import type { Session, User } from "@supabase/supabase-js";

interface SessionData {
  session: Session | null;
  user: User | null;
}

export function useSession() {
  const queryClient = useQueryClient();

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData<SessionData>(queryKeys.session, {
        session,
        user: session?.user ?? null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async (): Promise<SessionData> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return {
        session: data.session,
        user: data.session?.user ?? null,
      };
    },
    staleTime: Infinity, // Session is managed by auth state listener
  });
}

export function useUser() {
  const { data, isLoading, error } = useSession();
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isLoading,
    error,
    isAuthenticated: !!data?.session,
  };
}
