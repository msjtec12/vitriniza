-- Remove legacy table privileges, avoid overlapping SELECT policies and add
-- the foreign-key indexes reported by the Supabase performance advisor.

REVOKE ALL PRIVILEGES ON TABLE public.places FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.places
  FROM anon;

GRANT SELECT ON TABLE public.places TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.places TO authenticated;

DROP POLICY IF EXISTS places_public_read ON public.places;
DROP POLICY IF EXISTS places_admin_manage ON public.places;
DROP POLICY IF EXISTS places_anon_read ON public.places;
DROP POLICY IF EXISTS places_authenticated_read ON public.places;
DROP POLICY IF EXISTS places_admin_insert ON public.places;
DROP POLICY IF EXISTS places_admin_update ON public.places;
DROP POLICY IF EXISTS places_admin_delete ON public.places;

CREATE POLICY places_anon_read
  ON public.places
  FOR SELECT
  TO anon
  USING (is_active = TRUE);

CREATE POLICY places_authenticated_read
  ON public.places
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY places_admin_insert
  ON public.places
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY places_admin_update
  ON public.places
  FOR UPDATE
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

CREATE POLICY places_admin_delete
  ON public.places
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_businesses_neighborhood_id
  ON public.businesses (neighborhood_id);

CREATE INDEX IF NOT EXISTS idx_places_city_id
  ON public.places (city_id);

CREATE INDEX IF NOT EXISTS idx_places_state_id
  ON public.places (state_id);
