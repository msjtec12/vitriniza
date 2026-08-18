-- =======================================================
-- VITRINIZA: SCHEMA DO BANCO DE DADOS POSTGRESQL (SUPABASE)
-- =======================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('consumer', 'merchant', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STATES
CREATE TABLE IF NOT EXISTS public.states (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    uf VARCHAR(2) NOT NULL UNIQUE
);

-- 3. CITIES
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id TEXT NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    description TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(state_id, slug)
);

-- 4. NEIGHBORHOODS (Bairros)
CREATE TABLE IF NOT EXISTS public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(city_id, slug)
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    order_index INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUBCATEGORIES
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(category_id, slug)
);

-- 7. PLANS
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY, -- 'free', 'destaque', 'pro', 'premium'
    name TEXT NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    products_limit INT NOT NULL DEFAULT 0, -- -1 for unlimited
    photos_limit INT NOT NULL DEFAULT 3,
    has_promotions BOOLEAN NOT NULL DEFAULT FALSE,
    analytics_level TEXT NOT NULL DEFAULT 'basic' CHECK (analytics_level IN ('basic', 'standard', 'full', 'maximum')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    homepage_featured BOOLEAN NOT NULL DEFAULT FALSE,
    priority_level INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BUSINESSES (Estabelecimentos)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    short_description TEXT NOT NULL DEFAULT '',
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE RESTRICT,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
    state_id TEXT NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
    address TEXT NOT NULL,
    number TEXT NOT NULL DEFAULT 'S/N',
    complement TEXT,
    postal_code TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    instagram TEXT,
    website TEXT,
    logo_url TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES public.plans(id),
    plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'suspended', 'canceled', 'trial')),
    plan_starts_at TIMESTAMPTZ DEFAULT NOW(),
    plan_expires_at TIMESTAMPTZ,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    payment_methods TEXT[] NOT NULL DEFAULT '{}',
    delivery_available BOOLEAN NOT NULL DEFAULT FALSE,
    takeaway_available BOOLEAN NOT NULL DEFAULT TRUE,
    dine_in_available BOOLEAN NOT NULL DEFAULT TRUE,
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    reviews_count INT NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. BUSINESS HOURS
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time VARCHAR(5) NOT NULL DEFAULT '08:00',
    close_time VARCHAR(5) NOT NULL DEFAULT '18:00',
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(business_id, day_of_week)
);

-- 10. PRODUCTS & SERVICES
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    promo_price NUMERIC(10,2),
    category TEXT,
    image_url TEXT NOT NULL DEFAULT '',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PROMOTIONS
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    original_price NUMERIC(10,2) NOT NULL,
    promo_price NUMERIC(10,2) NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    max_quantity INT,
    rules TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. BUSINESS IMAGES (Galeria)
CREATE TABLE IF NOT EXISTS public.business_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    image_type TEXT NOT NULL DEFAULT 'gallery' CHECK (image_type IN ('gallery', 'facade', 'product', 'team')),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, business_id)
);

-- 15. ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('business_view', 'product_view', 'promotion_view', 'whatsapp_click', 'phone_click', 'instagram_click', 'map_click', 'share_click', 'favorite', 'search')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CLAIM REQUESTS (Reivindicação de Empresa)
CREATE TABLE IF NOT EXISTS public.claim_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT NOT NULL,
    document TEXT,
    proof_notes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 17. BANNERS PUBLICITÁRIOS
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    placement TEXT NOT NULL DEFAULT 'homepage' CHECK (placement IN ('homepage', 'search', 'category')),
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    impressions_count INT NOT NULL DEFAULT 0,
    clicks_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. ARTICLES & HISTÓRIAS (Descobrir)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. LOCAL EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================================
-- INDEXES & FULL TEXT SEARCH
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_businesses_city_neigh ON public.businesses(city_id, neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_plan ON public.businesses(plan_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_business_event ON public.analytics_events(business_id, event_type, created_at);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public can read active businesses
CREATE POLICY "Public can view active businesses"
    ON public.businesses FOR SELECT
    USING (is_active = TRUE);

-- Public can view active products
CREATE POLICY "Public can view active products"
    ON public.products FOR SELECT
    USING (is_available = TRUE);

-- Public can view active promotions
CREATE POLICY "Public can view active promotions"
    ON public.promotions FOR SELECT
    USING (is_active = TRUE AND expires_at > NOW());

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    USING (status = 'approved');

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (TRUE);

-- Business owners can manage their products
CREATE POLICY "Owners can manage products"
    ON public.products FOR ALL
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Business owners can manage their promotions
CREATE POLICY "Owners can manage promotions"
    ON public.promotions FOR ALL
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );
