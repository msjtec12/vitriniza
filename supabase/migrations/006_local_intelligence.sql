-- =======================================================
-- KONNEXY LOCAL INTELLIGENCE: SCHEMA & SEGURANÇA MULTIEMPRESA
-- Migration 006_local_intelligence.sql
-- =======================================================

-- 1. GOOGLE INTEGRATIONS (Search Console, GA4, Business Profile, Merchant Center)
CREATE TABLE IF NOT EXISTS public.google_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google_search_console', 'google_analytics_4', 'google_business_profile', 'google_merchant_center')),
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending_approval')),
    account_id TEXT,
    property_id TEXT,
    property_name TEXT,
    encrypted_tokens TEXT,
    scopes TEXT[] DEFAULT '{}'::TEXT[],
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, provider)
);

-- 2. SEO AUDITS (Diagnósticos de SEO Local, NAP, Schema.org e Indexabilidade)
CREATE TABLE IF NOT EXISTS public.seo_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SEO OPTIMIZATIONS (Histórico de Intervenções e Otimizações Antes/Depois)
CREATE TABLE IF NOT EXISTS public.seo_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    issue_code TEXT NOT NULL,
    action_type TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'reverted', 'suggested')),
    before_state JSONB,
    after_state JSONB,
    applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reverted_at TIMESTAMPTZ,
    notes TEXT
);

-- 4. LOCAL INTELLIGENCE METRICS (Séries Temporais de Desempenho Local)
CREATE TABLE IF NOT EXISTS public.local_intelligence_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    period_date DATE NOT NULL,
    impressions INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    ctr NUMERIC(5,2) DEFAULT 0,
    average_position NUMERIC(5,2) DEFAULT 0,
    profile_views INT NOT NULL DEFAULT 0,
    whatsapp_clicks INT NOT NULL DEFAULT 0,
    phone_clicks INT NOT NULL DEFAULT 0,
    route_requests INT NOT NULL DEFAULT 0,
    product_views INT NOT NULL DEFAULT 0,
    top_queries JSONB DEFAULT '[]'::jsonb,
    top_products JSONB DEFAULT '[]'::jsonb,
    source TEXT NOT NULL DEFAULT 'internal' CHECK (source IN ('internal', 'google_search_console', 'google_analytics_4', 'google_business_profile', 'blended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, period_date, source)
);

-- 5. LOCAL INTELLIGENCE REPORTS (Relatórios Periódicos Consolidados)
CREATE TABLE IF NOT EXISTS public.local_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'monthly' CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'on_demand')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary TEXT,
    generated_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================================
-- ÍNDICES DE PERFORMANCE E PESQUISA
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_google_integrations_business ON public.google_integrations(business_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_business ON public.seo_audits(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_optimizations_business ON public.seo_optimizations(business_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_date ON public.local_intelligence_metrics(business_id, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_reports_business ON public.local_intelligence_reports(business_id, period_start DESC);

-- Índice GIN para busca full text ponderada em produtos e negócios
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING GIN (
    to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
);

CREATE INDEX IF NOT EXISTS idx_businesses_fts ON public.businesses USING GIN (
    to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(address, ''))
);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_intelligence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- 1. Google Integrations Policies
CREATE POLICY "admin_all_google_integrations"
    ON public.google_integrations FOR ALL
    USING (public.is_admin());

CREATE POLICY "merchant_view_google_integrations"
    ON public.google_integrations FOR SELECT
    USING (public.can_manage_business(business_id));

CREATE POLICY "merchant_update_google_integrations"
    ON public.google_integrations FOR UPDATE
    USING (public.can_manage_business(business_id));

-- 2. SEO Audits Policies
CREATE POLICY "admin_all_seo_audits"
    ON public.seo_audits FOR ALL
    USING (public.is_admin());

CREATE POLICY "merchant_view_seo_audits"
    ON public.seo_audits FOR SELECT
    USING (public.can_manage_business(business_id));

-- 3. SEO Optimizations Policies
CREATE POLICY "admin_all_seo_optimizations"
    ON public.seo_optimizations FOR ALL
    USING (public.is_admin());

CREATE POLICY "merchant_view_seo_optimizations"
    ON public.seo_optimizations FOR SELECT
    USING (public.can_manage_business(business_id));

CREATE POLICY "merchant_insert_seo_optimizations"
    ON public.seo_optimizations FOR INSERT
    WITH CHECK (public.can_manage_business(business_id));

CREATE POLICY "merchant_update_seo_optimizations"
    ON public.seo_optimizations FOR UPDATE
    USING (public.can_manage_business(business_id));

-- 4. Local Intelligence Metrics Policies
CREATE POLICY "admin_all_intelligence_metrics"
    ON public.local_intelligence_metrics FOR ALL
    USING (public.is_admin());

CREATE POLICY "merchant_view_intelligence_metrics"
    ON public.local_intelligence_metrics FOR SELECT
    USING (public.can_manage_business(business_id));

-- 5. Local Intelligence Reports Policies
CREATE POLICY "admin_all_intelligence_reports"
    ON public.local_intelligence_reports FOR ALL
    USING (public.is_admin());

CREATE POLICY "merchant_view_intelligence_reports"
    ON public.local_intelligence_reports FOR SELECT
    USING (public.can_manage_business(business_id));
