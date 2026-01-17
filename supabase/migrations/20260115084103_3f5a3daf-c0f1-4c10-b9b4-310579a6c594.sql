-- ============================================
-- BoardBrief Schema Part 2
-- Friends, Game Nights, Tournaments + Security fixes
-- ============================================

-- Fix generate_join_code search_path
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$;

-- Rate limits: no client access policy (managed by edge functions only)
-- This is intentional - leaving RLS enabled with no policies means clients cannot access

-- Rule sources cache: no client access policy (managed by edge functions only)  
-- This is intentional - leaving RLS enabled with no policies means clients cannot access

-- ============================================
-- FRIENDS SYSTEM
-- ============================================

CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friends
    WHERE status = 'accepted'
    AND (
      (requester_id = user_a AND addressee_id = user_b) OR
      (requester_id = user_b AND addressee_id = user_a)
    )
  );
$$;

CREATE POLICY "Users can view their own friend records"
ON public.friends FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
ON public.friends FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requester or addressee can update friend status"
ON public.friends FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friend records"
ON public.friends FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Update profiles RLS to allow viewing friends' profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or friends profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id OR
  public.are_friends(auth.uid(), id)
);

-- ============================================
-- GAME NIGHTS
-- ============================================

CREATE TYPE public.night_status AS ENUM ('active', 'ended', 'cancelled');

CREATE TABLE public.game_nights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games_catalog(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE DEFAULT public.generate_join_code(),
  status public.night_status NOT NULL DEFAULT 'active',
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.game_nights ENABLE ROW LEVEL SECURITY;

-- Create participants table first
CREATE TABLE public.night_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_night_id UUID NOT NULL REFERENCES public.game_nights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turn_position INT NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_night_id, user_id)
);

ALTER TABLE public.night_participants ENABLE ROW LEVEL SECURITY;

-- Now create the security definer function
CREATE OR REPLACE FUNCTION public.is_night_participant(p_night_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.night_participants
    WHERE game_night_id = p_night_id AND user_id = p_user_id
  );
$$;

-- Game nights RLS policies
CREATE POLICY "Participants can view their game nights"
ON public.game_nights FOR SELECT
USING (
  auth.uid() = host_id OR
  public.is_night_participant(id, auth.uid())
);

CREATE POLICY "Host can create game nights"
ON public.game_nights FOR INSERT
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update game nights"
ON public.game_nights FOR UPDATE
USING (auth.uid() = host_id);

-- Night participants RLS
CREATE POLICY "Participants can view night participants"
ON public.night_participants FOR SELECT
USING (public.is_night_participant(game_night_id, auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Users can join nights"
ON public.night_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host or self can update participant"
ON public.night_participants FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.game_nights gn
    WHERE gn.id = game_night_id AND gn.host_id = auth.uid()
  )
);

-- Night scores
CREATE TABLE public.night_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_night_id UUID NOT NULL REFERENCES public.game_nights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_index INT NOT NULL DEFAULT 1,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_night_id, user_id, round_index)
);

ALTER TABLE public.night_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view scores"
ON public.night_scores FOR SELECT
USING (public.is_night_participant(game_night_id, auth.uid()));

CREATE POLICY "Users can insert their own scores"
ON public.night_scores FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  public.is_night_participant(game_night_id, auth.uid())
);

CREATE POLICY "Host or self can update scores"
ON public.night_scores FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.game_nights gn
    WHERE gn.id = game_night_id AND gn.host_id = auth.uid()
  )
);

-- Night results
CREATE TABLE public.night_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_night_id UUID NOT NULL REFERENCES public.game_nights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INT NOT NULL DEFAULT 0,
  placement INT NOT NULL DEFAULT 0,
  rating_change INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_night_id, user_id)
);

ALTER TABLE public.night_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view night results"
ON public.night_results FOR SELECT
USING (public.is_night_participant(game_night_id, auth.uid()));

-- ============================================
-- TOURNAMENTS
-- ============================================

CREATE TYPE public.tournament_format AS ENUM ('single_elimination', 'round_robin');
CREATE TYPE public.tournament_status AS ENUM ('draft', 'active', 'ended');
CREATE TYPE public.match_status AS ENUM ('pending', 'completed');

CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games_catalog(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format public.tournament_format NOT NULL DEFAULT 'single_elimination',
  status public.tournament_status NOT NULL DEFAULT 'draft',
  champion_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_round INT NOT NULL DEFAULT 1,
  total_rounds INT NOT NULL DEFAULT 1,
  standings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed INT NOT NULL DEFAULT 0,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Create security definer function for tournament participant check
CREATE OR REPLACE FUNCTION public.is_tournament_participant(p_tournament_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_participants
    WHERE tournament_id = p_tournament_id AND user_id = p_user_id
  );
$$;

-- Tournament RLS
CREATE POLICY "Participants can view tournaments"
ON public.tournaments FOR SELECT
USING (
  auth.uid() = host_id OR
  public.is_tournament_participant(id, auth.uid())
);

CREATE POLICY "Host can create tournaments"
ON public.tournaments FOR INSERT
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update tournaments"
ON public.tournaments FOR UPDATE
USING (auth.uid() = host_id);

-- Tournament participants RLS
CREATE POLICY "Participants can view tournament participants"
ON public.tournament_participants FOR SELECT
USING (public.is_tournament_participant(tournament_id, auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Host can manage tournament participants"
ON public.tournament_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id AND t.host_id = auth.uid()
  )
);

CREATE POLICY "Host can update tournament participants"
ON public.tournament_participants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id AND t.host_id = auth.uid()
  )
);

-- Tournament matches
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  match_number INT NOT NULL DEFAULT 1,
  player_a_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player_b_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score_a INT,
  score_b INT,
  status public.match_status NOT NULL DEFAULT 'pending',
  next_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view tournament matches"
ON public.tournament_matches FOR SELECT
USING (public.is_tournament_participant(tournament_id, auth.uid()));

CREATE POLICY "Host can manage matches"
ON public.tournament_matches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id AND t.host_id = auth.uid()
  )
);

CREATE POLICY "Host can update matches"
ON public.tournament_matches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id AND t.host_id = auth.uid()
  )
);

-- ============================================
-- TRIGGERS & INDEXES
-- ============================================

CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rule_cards_updated_at
BEFORE UPDATE ON public.rule_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_ratings_updated_at
BEFORE UPDATE ON public.game_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_night_scores_updated_at
BEFORE UPDATE ON public.night_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes
CREATE INDEX idx_friends_requester ON public.friends(requester_id);
CREATE INDEX idx_friends_addressee ON public.friends(addressee_id);
CREATE INDEX idx_friends_status ON public.friends(status);
CREATE INDEX idx_rule_answers_user_game ON public.rule_answers(user_id, game_id);
CREATE INDEX idx_rule_cards_owner_game ON public.rule_cards(owner_id, game_id);
CREATE INDEX idx_night_participants_night ON public.night_participants(game_night_id);
CREATE INDEX idx_night_participants_user ON public.night_participants(user_id);
CREATE INDEX idx_night_scores_night ON public.night_scores(game_night_id);
CREATE INDEX idx_game_nights_host ON public.game_nights(host_id);
CREATE INDEX idx_game_nights_status ON public.game_nights(status);
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_matches_tournament ON public.tournament_matches(tournament_id);