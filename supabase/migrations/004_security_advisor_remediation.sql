-- Follow-up hardening based on Supabase security and performance advisors.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_business_member(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.can_manage_business(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_admin() OR EXISTS (
    SELECT 1
    FROM public.business_members member
    JOIN public.businesses business ON business.id = member.business_id
    WHERE member.business_id = target_business_id
      AND member.user_id = (SELECT auth.uid())
      AND business.listing_type = 'paid'
      AND business.plan_status = 'active'
      AND business.subscription_status = 'active'
      AND EXISTS (
        SELECT 1 FROM public.subscriptions subscription
        WHERE subscription.business_id = target_business_id
          AND subscription.status = 'active'
          AND subscription.expires_at > now()
      )
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_business_member(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_manage_business(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_business_member(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_business(TEXT) TO authenticated;

-- Public wrappers remain available to RLS policies, but are SECURITY INVOKER
-- and cannot be executed anonymously.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_admin(); $$;

CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_business_member(target_business_id); $$;

CREATE OR REPLACE FUNCTION public.can_manage_business(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.can_manage_business(target_business_id); $$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_business_member(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_business(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_business(TEXT) TO authenticated;

-- This event-trigger function should never be exposed through the API.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Anonymous visitors only need the active public listing. Membership and
-- administrator checks are provided by separate authenticated policies.
ALTER POLICY "public_read_businesses" ON public.businesses
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "merchant_read_business" ON public.businesses;
CREATE POLICY "merchant_read_business" ON public.businesses FOR SELECT TO authenticated
  USING (public.is_business_member(id) OR public.is_admin());

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'public_%'
      AND policyname <> 'public_read_businesses'
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO anon, authenticated',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename
    );
  END LOOP;

  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE 'merchant_%' OR policyname LIKE 'user_%' OR policyname LIKE 'admin_%')
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename
    );
  END LOOP;
END
$$;

ALTER POLICY "merchant_read_membership" ON public.business_members
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());
ALTER POLICY "user_read_profile" ON public.profiles
  USING (id = (SELECT auth.uid()) OR public.is_admin());
ALTER POLICY "user_manage_favorites" ON public.favorites
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

ALTER POLICY "public_read_business_media" ON storage.objects TO anon, authenticated;
ALTER POLICY "member_insert_business_media" ON storage.objects TO authenticated;
ALTER POLICY "member_update_business_media" ON storage.objects TO authenticated;
ALTER POLICY "member_delete_business_media" ON storage.objects TO authenticated;

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "admin_manage_subcategories" ON public.subcategories;
CREATE POLICY "public_read_subcategories" ON public.subcategories FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "admin_manage_subcategories" ON public.subcategories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_legacy_settings" ON public.settings;
CREATE POLICY "admin_manage_legacy_settings" ON public.settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT ALL ON public.settings TO authenticated;

CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON public.neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_businesses_city_neighborhood ON public.businesses(city_id, neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON public.businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_state_id ON public.businesses(state_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON public.businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON public.promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_business_id ON public.claim_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_business_images_business_id ON public.business_images(business_id);
CREATE INDEX IF NOT EXISTS idx_favorites_business_id ON public.favorites(business_id);
CREATE INDEX IF NOT EXISTS idx_banners_city_id ON public.banners(city_id);

