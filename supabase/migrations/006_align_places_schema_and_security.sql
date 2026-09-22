-- Align the public-utility catalog with the application contract and secure writes.
-- This migration is intentionally idempotent so it can repair databases that
-- received an earlier version of migration 005.

ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE public.places
SET
  photo_url = COALESCE(photo_url, image_url),
  cover_url = COALESCE(cover_url, photo_url, image_url),
  source_name = COALESCE(source_name, source, 'Dados Públicos Oficiais'),
  tags = COALESCE(tags, ARRAY[]::TEXT[])
WHERE
  photo_url IS NULL
  OR cover_url IS NULL
  OR source_name IS NULL
  OR tags IS NULL;

ALTER TABLE public.places
  DROP CONSTRAINT IF EXISTS places_category_group_check;

ALTER TABLE public.places
  ADD CONSTRAINT places_category_group_check CHECK (
    category_group IN (
      'saude',
      'educacao',
      'lazer',
      'esporte',
      'turismo',
      'religiao',
      'transporte',
      'servicos_publicos',
      'cultura',
      'outros'
    )
  );

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Places públicos são visíveis por todos" ON public.places;
DROP POLICY IF EXISTS "Admins podem gerenciar places" ON public.places;
DROP POLICY IF EXISTS places_public_read ON public.places;
DROP POLICY IF EXISTS places_admin_manage ON public.places;

CREATE POLICY places_public_read
  ON public.places
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY places_admin_manage
  ON public.places
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON TABLE public.places TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.places TO authenticated;

CREATE INDEX IF NOT EXISTS idx_places_active_category
  ON public.places (category_group, name)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_places_active_neighborhood
  ON public.places (neighborhood_id, name)
  WHERE is_active = TRUE;
