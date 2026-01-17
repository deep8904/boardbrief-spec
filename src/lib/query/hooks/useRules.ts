import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rulesApi, type RulesSearchResult } from "@/lib/api/edge-functions";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";
import { useToast } from "@/hooks/use-toast";

export interface RuleCard {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  game_id: string;
  answer_id: string | null;
  owner_id: string;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface RuleAnswer {
  id: string;
  question: string;
  answer: string;
  confidence: number | null;
  tags: string[] | null;
  citations: Array<{ title: string; url: string; excerpt: string }>;
  why: string | null;
  game_id: string;
  user_id: string;
  created_at: string;
}

export function useRuleCards(gameId?: string) {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.ruleCards(user?.id, gameId),
    queryFn: async (): Promise<RuleCard[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from("rule_cards")
        .select("*")
        .eq("owner_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (gameId) {
        query = query.eq("game_id", gameId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useRuleAnswers(gameId?: string) {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.ruleAnswers(user?.id, gameId),
    queryFn: async (): Promise<RuleAnswer[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from("rule_answers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (gameId) {
        query = query.eq("game_id", gameId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map((r) => ({
        ...r,
        citations: (r.citations as Array<{ title: string; url: string; excerpt: string }>) || [],
      }));
    },
    enabled: !!user?.id,
  });
}

export function useSearchRules() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ gameId, question }: { gameId: string; question: string }) =>
      rulesApi.search(gameId, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ruleAnswers(user?.id) });
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateRuleCard() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      content: string;
      gameId: string;
      answerId?: string;
      tags?: string[];
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rule_cards")
        .insert({
          title: input.title,
          content: input.content,
          game_id: input.gameId,
          owner_id: user.id,
          answer_id: input.answerId || null,
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ruleCards(user?.id) });
      toast({
        title: "Rule card saved",
        description: "You can find it in your rule cards.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTogglePinRuleCard() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ cardId, isPinned }: { cardId: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from("rule_cards")
        .update({ is_pinned: isPinned })
        .eq("id", cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ruleCards(user?.id) });
    },
  });
}

export function useDeleteRuleCard() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("rule_cards").delete().eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ruleCards(user?.id) });
      toast({ title: "Rule card deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
