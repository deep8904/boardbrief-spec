import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { friendsApi } from "@/lib/api/edge-functions";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";
import { useToast } from "@/hooks/use-toast";

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useFriends() {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.friends(user?.id),
    queryFn: async (): Promise<Friend[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Fetch profiles for friends
      const friendUserIds = data.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      if (friendUserIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", friendUserIds);

      return data.map((f) => ({
        ...f,
        profile: profiles?.find(
          (p) => p.id === (f.requester_id === user.id ? f.addressee_id : f.requester_id)
        ),
      }));
    },
    enabled: !!user?.id,
  });
}

export function useFriendRequests() {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.friendRequests(user?.id),
    queryFn: async () => {
      if (!user?.id) return { incoming: [], outgoing: [] };

      // Incoming requests (I'm the addressee)
      const { data: incoming, error: incomingError } = await supabase
        .from("friends")
        .select("*")
        .eq("addressee_id", user.id)
        .eq("status", "pending");

      if (incomingError) throw incomingError;

      // Outgoing requests (I'm the requester)
      const { data: outgoing, error: outgoingError } = await supabase
        .from("friends")
        .select("*")
        .eq("requester_id", user.id)
        .eq("status", "pending");

      if (outgoingError) throw outgoingError;

      // Get profiles
      const incomingUserIds = incoming?.map((r) => r.requester_id) || [];
      const outgoingUserIds = outgoing?.map((r) => r.addressee_id) || [];
      const allUserIds = [...new Set([...incomingUserIds, ...outgoingUserIds])];

      let profiles: Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }> = [];
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", allUserIds);
        profiles = profilesData || [];
      }

      return {
        incoming: (incoming || []).map((r) => ({
          ...r,
          profile: profiles.find((p) => p.id === r.requester_id),
        })),
        outgoing: (outgoing || []).map((r) => ({
          ...r,
          profile: profiles.find((p) => p.id === r.addressee_id),
        })),
      };
    },
    enabled: !!user?.id,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: friendsApi.sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friendRequests(user?.id) });
      toast({
        title: "Friend request sent",
        description: "Waiting for them to accept.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "accept" | "decline" | "block" }) =>
      friendsApi.respond(requestId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friendRequests(user?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends(user?.id) });
      toast({
        title: variables.action === "accept" ? "Friend added!" : "Request declined",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
