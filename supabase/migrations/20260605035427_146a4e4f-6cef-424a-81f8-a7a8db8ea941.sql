
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  era TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are public" ON public.questions
  FOR SELECT USING (true);

CREATE TABLE public.rankings (
  player_id UUID NOT NULL PRIMARY KEY,
  nickname TEXT NOT NULL,
  best_score INT NOT NULL DEFAULT 0,
  total_matches INT NOT NULL DEFAULT 0,
  trophies_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.rankings TO anon, authenticated;
GRANT ALL ON public.rankings TO service_role;

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rankings are public" ON public.rankings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert rankings" ON public.rankings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rankings" ON public.rankings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX rankings_best_score_idx ON public.rankings (best_score DESC);
