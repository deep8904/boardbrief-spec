-- Fix ratings privacy: Restrict to authenticated users only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Anyone can view game ratings" ON public.game_ratings;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can view ratings"
ON public.ratings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view game ratings"
ON public.game_ratings FOR SELECT
USING (auth.uid() IS NOT NULL);