import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";
import type { Profile, UpdateProfileInput, CreateProfileInput } from "@/lib/validation/profile";
import { generateUsername } from "@/lib/supabase/auth";

export function useProfile() {
  const { user, isAuthenticated } = useUser();

  return useQuery({
    queryKey: queryKeys.profile(user?.id),
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Profile doesn't exist yet - this is expected for new users
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data as Profile;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: Omit<CreateProfileInput, "id">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const profileData = {
        id: user.id,
        username: input.username,
        display_name: input.display_name ?? null,
        avatar_url: input.avatar_url ?? null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(user?.id), data);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(input)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(user?.id), data);
    },
  });
}

export function useEnsureProfile() {
  const { user } = useUser();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const createProfile = useCreateProfile();

  const ensureProfile = async () => {
    if (!user?.email || profile) return profile;

    // Create profile if it doesn't exist
    const username = generateUsername(user.email);
    const displayName = user.email.split("@")[0];

    try {
      const newProfile = await createProfile.mutateAsync({
        username,
        display_name: displayName,
      });
      return newProfile;
    } catch (error) {
      console.error("Failed to create profile:", error);
      throw error;
    }
  };

  return {
    profile,
    isLoading: profileLoading,
    ensureProfile,
    isCreating: createProfile.isPending,
  };
}
