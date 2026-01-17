-- ============================================
-- BoardBrief Complete Schema Migration (Part 1)
-- Tables without dependencies first
-- ============================================

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = actor_id);

-- ============================================
-- RATE LIMITS
-- ============================================

CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENT ERRORS
-- ============================================

CREATE TABLE public.client_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own errors"
ON public.client_errors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own errors"
ON public.client_errors FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- GAMES CATALOG
-- ============================================

CREATE TABLE public.games_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  min_players INT DEFAULT 2,
  max_players INT DEFAULT 8,
  play_time_minutes INT,
  image_url TEXT,
  bgg_id INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.games_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view games catalog"
ON public.games_catalog FOR SELECT
USING (true);

-- Seed 12 popular games
INSERT INTO public.games_catalog (name, slug, description, min_players, max_players, play_time_minutes) VALUES
('Catan', 'catan', 'Trade resources and build settlements in this classic strategy game', 3, 4, 90),
('Ticket to Ride', 'ticket-to-ride', 'Collect train cards and claim railway routes across the map', 2, 5, 60),
('Wingspan', 'wingspan', 'Attract birds to your wildlife preserves in this engine-building game', 1, 5, 70),
('Azul', 'azul', 'Draft colorful tiles to decorate your palace walls', 2, 4, 45),
('Pandemic', 'pandemic', 'Work together to stop disease outbreaks across the globe', 2, 4, 45),
('Codenames', 'codenames', 'Give one-word clues to help your team find secret agents', 4, 8, 20),
('7 Wonders', '7-wonders', 'Draft cards and build your ancient civilization', 3, 7, 30),
('Splendor', 'splendor', 'Collect gems and develop your merchant empire', 2, 4, 30),
('Terraforming Mars', 'terraforming-mars', 'Compete to make Mars habitable for human life', 1, 5, 120),
('Root', 'root', 'Asymmetric woodland warfare between factions', 2, 4, 90),
('Scythe', 'scythe', 'Lead your faction in an alternate-history 1920s Europe', 1, 5, 115),
('Dominion', 'dominion', 'Build your deck to conquer the realm', 2, 4, 30);

-- ============================================
-- RATINGS
-- ============================================

CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  global_rating INT NOT NULL DEFAULT 1000,
  games_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON public.ratings FOR SELECT
USING (true);

CREATE POLICY "Users can update their own rating"
ON public.ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_rating_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ratings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_create_rating
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_rating_for_profile();

-- Per-game ratings
CREATE TABLE public.game_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games_catalog(id) ON DELETE CASCADE,
  rating INT NOT NULL DEFAULT 1000,
  games_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

ALTER TABLE public.game_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game ratings"
ON public.game_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can update their own game rating"
ON public.game_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- RULES ASSISTANT
-- ============================================

CREATE TABLE public.rule_sources_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games_catalog(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.rule_sources_cache ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rule_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games_catalog(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  tags TEXT[] DEFAULT '{}',
  citations JSONB NOT NULL DEFAULT '[]',
  why TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rule_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rule answers"
ON public.rule_answers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rule answers"
ON public.rule_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.rule_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games_catalog(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.rule_answers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rule_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rule cards"
ON public.rule_cards FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own rule cards"
ON public.rule_cards FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own rule cards"
ON public.rule_cards FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own rule cards"
ON public.rule_cards FOR DELETE
USING (auth.uid() = owner_id);

-- Helper function
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$;