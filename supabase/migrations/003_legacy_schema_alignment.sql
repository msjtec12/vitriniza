-- Align installations created from the legacy SQL scripts with the canonical
-- text identifiers used by the application. The statements are idempotent and
-- preserve existing rows.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subcategories'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.subcategories ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.subcategories ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.subcategories ALTER COLUMN id SET DEFAULT ('subcat_' || gen_random_uuid());
    ALTER TABLE public.subcategories ALTER COLUMN category_id TYPE TEXT USING category_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_hours'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.business_hours ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.business_hours ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.business_hours ALTER COLUMN id SET DEFAULT ('hour_' || gen_random_uuid());
    ALTER TABLE public.business_hours ALTER COLUMN business_id TYPE TEXT USING business_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_images'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.business_images ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.business_images ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.business_images ALTER COLUMN id SET DEFAULT ('img_' || gen_random_uuid());
    ALTER TABLE public.business_images ALTER COLUMN business_id TYPE TEXT USING business_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'favorites'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.favorites ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.favorites ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.favorites ALTER COLUMN id SET DEFAULT ('fav_' || gen_random_uuid());
    ALTER TABLE public.favorites ALTER COLUMN business_id TYPE TEXT USING business_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'analytics_events'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.analytics_events ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.analytics_events ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.analytics_events ALTER COLUMN id SET DEFAULT ('event_' || gen_random_uuid());
    ALTER TABLE public.analytics_events ALTER COLUMN business_id TYPE TEXT USING business_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'banners'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.banners ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.banners ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.banners ALTER COLUMN id SET DEFAULT ('banner_' || gen_random_uuid());
    ALTER TABLE public.banners ALTER COLUMN city_id TYPE TEXT USING city_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'articles'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.articles ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.articles ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.articles ALTER COLUMN id SET DEFAULT ('article_' || gen_random_uuid());
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.events ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.events ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.events ALTER COLUMN id SET DEFAULT ('local_event_' || gen_random_uuid());
  END IF;
END
$$;

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0E3B43',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#E36845';

ALTER TABLE public.reviews ALTER COLUMN status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subcategories_category_id_fkey') THEN
    ALTER TABLE public.subcategories ADD CONSTRAINT subcategories_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_hours_business_id_fkey') THEN
    ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_images_business_id_fkey') THEN
    ALTER TABLE public.business_images ADD CONSTRAINT business_images_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_business_id_fkey') THEN
    ALTER TABLE public.favorites ADD CONSTRAINT favorites_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_business_id_fkey') THEN
    ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'banners_city_id_fkey') THEN
    ALTER TABLE public.banners ADD CONSTRAINT banners_city_id_fkey
      FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL NOT VALID;
  END IF;
END
$$;

