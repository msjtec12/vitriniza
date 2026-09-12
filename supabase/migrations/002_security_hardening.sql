-- Vitriniza production security hardening.
-- Apply after 001_initial_schema.sql. It is also safe on installations that
-- previously applied supabase_schema.sql and supabase_saas_migration.sql.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  products_limit INTEGER NOT NULL DEFAULT 0,
  photos_limit INTEGER NOT NULL DEFAULT 3,
  has_promotions BOOLEAN NOT NULL DEFAULT false,
  analytics_level TEXT NOT NULL DEFAULT 'basic',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  homepage_featured BOOLEAN NOT NULL DEFAULT false,
  priority_level INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  platform_name TEXT NOT NULL DEFAULT 'Vitriniza',
  contact_whatsapp TEXT,
  instagram TEXT,
  primary_color TEXT DEFAULT '#0E3B43',
  secondary_color TEXT DEFAULT '#E36845',
  plan_semanal_price NUMERIC(10,2) DEFAULT 19.90,
  plan_mensal_price NUMERIC(10,2) DEFAULT 49.90,
  contact_email TEXT,
  logo_url TEXT,
  hero_bg_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'local_free',
  ADD COLUMN IF NOT EXISTS ownership_status TEXT NOT NULL DEFAULT 'unclaimed',
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_online_only BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id TEXT DEFAULT 'pro',
  plan_name TEXT DEFAULT 'Vitriniza Pro',
  price NUMERIC(10,2) DEFAULT 49.90,
  interval TEXT DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  payment_confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_requests (
  id TEXT PRIMARY KEY,
  owner_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  instagram TEXT,
  category_id TEXT,
  category_name TEXT,
  neighborhood_id TEXT,
  neighborhood_name TEXT,
  city_name TEXT,
  state_code TEXT,
  address TEXT,
  interest_type TEXT NOT NULL DEFAULT 'pro',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log_' || gen_random_uuid()),
  admin_user_id TEXT NOT NULL,
  business_id TEXT,
  business_name TEXT,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_hours (
  id TEXT PRIMARY KEY DEFAULT ('hour_' || gen_random_uuid()),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time VARCHAR(5) NOT NULL DEFAULT '08:00',
  close_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  is_closed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (business_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.business_images (
  id TEXT PRIMARY KEY DEFAULT ('img_' || gen_random_uuid()),
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  image_type TEXT NOT NULL DEFAULT 'gallery',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id TEXT PRIMARY KEY DEFAULT ('fav_' || gen_random_uuid()),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, business_id)
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  advertiser_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'homepage',
  city_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  impressions_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  author_name TEXT NOT NULL,
  neighborhood_name TEXT,
  city_name TEXT,
  category TEXT NOT NULL DEFAULT 'historia',
  read_time VARCHAR(20) NOT NULL DEFAULT '3 min',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  neighborhood_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(10) NOT NULL,
  image_url TEXT NOT NULL,
  whatsapp_contact TEXT,
  organizer_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_requests
  ADD COLUMN IF NOT EXISTS city_name TEXT,
  ADD COLUMN IF NOT EXISTS state_code TEXT;

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS plan_semanal_price NUMERIC(10,2) DEFAULT 19.90,
  ADD COLUMN IF NOT EXISTS plan_mensal_price NUMERIC(10,2) DEFAULT 49.90,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_bg_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;

ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS password;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE public.profiles SET role = 'admin' WHERE role = 'super_admin';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('consumer', 'merchant', 'admin'));

CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_requests_status ON public.business_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Remove every legacy policy. PostgreSQL combines permissive policies with OR,
-- so leaving a single old USING (true) policy would reopen the table.
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles', 'states', 'cities', 'neighborhoods', 'categories', 'plans',
        'platform_settings', 'businesses', 'business_hours', 'business_images',
        'products', 'promotions', 'reviews', 'favorites', 'analytics_events',
        'claim_requests', 'business_requests', 'business_members',
        'subscriptions', 'audit_logs', 'banners', 'articles', 'events'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members
    WHERE business_id = target_business_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_business(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.business_members member
    JOIN public.businesses business ON business.id = member.business_id
    WHERE member.business_id = target_business_id
      AND member.user_id = auth.uid()
      AND business.listing_type = 'paid'
      AND business.plan_status = 'active'
      AND business.subscription_status = 'active'
      AND EXISTS (
        SELECT 1
        FROM public.subscriptions subscription
        WHERE subscription.business_id = target_business_id
          AND subscription.status = 'active'
          AND subscription.expires_at > now()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_member(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_business(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_business(TEXT) TO anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public directory data.
CREATE POLICY "public_read_states" ON public.states FOR SELECT USING (true);
CREATE POLICY "public_read_cities" ON public.cities FOR SELECT USING (active = true);
CREATE POLICY "public_read_neighborhoods" ON public.neighborhoods FOR SELECT USING (active = true);
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "public_read_plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "public_read_settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "public_read_businesses" ON public.businesses FOR SELECT
  USING (is_active = true OR public.is_business_member(id) OR public.is_admin());
CREATE POLICY "public_read_hours" ON public.business_hours FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active));
CREATE POLICY "public_read_images" ON public.business_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active));
CREATE POLICY "public_read_products" ON public.products FOR SELECT
  USING (is_available = true AND EXISTS (
    SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active
  ));
CREATE POLICY "public_read_promotions" ON public.promotions FOR SELECT
  USING (is_active = true AND expires_at > now() AND EXISTS (
    SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active
  ));
CREATE POLICY "public_read_reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "public_read_banners" ON public.banners FOR SELECT
  USING (is_active = true AND starts_at <= now() AND expires_at > now());
CREATE POLICY "public_read_articles" ON public.articles FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_events" ON public.events FOR SELECT USING (is_active = true);

-- Sensitive submissions use validated, rate-limited server routes.
CREATE POLICY "public_submit_analytics" ON public.analytics_events FOR INSERT
  WITH CHECK (event_type IN (
    'business_view', 'product_view', 'promotion_view', 'whatsapp_click',
    'phone_click', 'instagram_click', 'map_click', 'share_click', 'favorite', 'search'
  ));

-- Merchant access.
CREATE POLICY "merchant_read_membership" ON public.business_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "merchant_read_subscription" ON public.subscriptions FOR SELECT
  USING (public.is_business_member(business_id) OR public.is_admin());
CREATE POLICY "merchant_manage_products" ON public.products FOR ALL
  USING (public.can_manage_business(business_id))
  WITH CHECK (public.can_manage_business(business_id));
CREATE POLICY "merchant_manage_promotions" ON public.promotions FOR ALL
  USING (public.can_manage_business(business_id))
  WITH CHECK (public.can_manage_business(business_id));
CREATE POLICY "merchant_manage_hours" ON public.business_hours FOR ALL
  USING (public.can_manage_business(business_id))
  WITH CHECK (public.can_manage_business(business_id));
CREATE POLICY "merchant_manage_images" ON public.business_images FOR ALL
  USING (public.can_manage_business(business_id))
  WITH CHECK (public.can_manage_business(business_id));
CREATE POLICY "merchant_read_analytics" ON public.analytics_events FOR SELECT
  USING (public.can_manage_business(business_id));
CREATE POLICY "user_read_profile" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "user_manage_favorites" ON public.favorites FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Administrator access.
CREATE POLICY "admin_manage_profiles" ON public.profiles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_states" ON public.states FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_cities" ON public.cities FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_neighborhoods" ON public.neighborhoods FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_categories" ON public.categories FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_plans" ON public.plans FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_settings" ON public.platform_settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_businesses" ON public.businesses FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_reviews" ON public.reviews FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_claims" ON public.claim_requests FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_requests" ON public.business_requests FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_memberships" ON public.business_members FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_subscriptions" ON public.subscriptions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_read_audit" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_audit" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_banners" ON public.banners FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_articles" ON public.articles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_manage_events" ON public.events FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Explicit grants complement RLS. The service_role used by protected server
-- routes bypasses these policies by design.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON public.states, public.cities, public.neighborhoods, public.categories,
  public.plans, public.platform_settings, public.businesses, public.business_hours,
  public.business_images, public.products, public.promotions, public.reviews,
  public.banners, public.articles, public.events TO anon, authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.profiles, public.business_members, public.subscriptions,
  public.analytics_events, public.favorites TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products, public.promotions,
  public.business_hours, public.business_images, public.favorites TO authenticated;
GRANT ALL ON public.profiles, public.states, public.cities, public.neighborhoods,
  public.categories, public.plans, public.platform_settings, public.businesses,
  public.reviews, public.claim_requests, public.business_requests,
  public.business_members, public.subscriptions, public.audit_logs,
  public.banners, public.articles, public.events TO authenticated;

-- Storage bucket for compressed business images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-media',
  'business-media',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_read_business_media" ON storage.objects;
DROP POLICY IF EXISTS "member_insert_business_media" ON storage.objects;
DROP POLICY IF EXISTS "member_update_business_media" ON storage.objects;
DROP POLICY IF EXISTS "member_delete_business_media" ON storage.objects;

CREATE POLICY "public_read_business_media" ON storage.objects FOR SELECT
  USING (bucket_id = 'business-media');
CREATE POLICY "member_insert_business_media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-media'
    AND public.can_manage_business((storage.foldername(name))[1])
  );
CREATE POLICY "member_update_business_media" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-media'
    AND public.can_manage_business((storage.foldername(name))[1])
  );
CREATE POLICY "member_delete_business_media" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-media'
    AND public.can_manage_business((storage.foldername(name))[1])
  );
