-- =======================================================
-- VITRINIZA: PONTOS DE INTERESSE & DESCOBERTA LOCAL
-- Migração 005: Tabela places (Equipamentos Públicos & POIs)
-- =======================================================

-- 1. Criação da Tabela de Pontos de Interesse (Places)
CREATE TABLE IF NOT EXISTS public.places (
    id TEXT PRIMARY KEY DEFAULT ('place_' || uuid_generate_v4()),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    category_group TEXT NOT NULL CHECK (
        category_group IN ('saude', 'educacao', 'lazer', 'religiao', 'transporte', 'servicos_publicos', 'cultura', 'outros')
    ),
    subcategory TEXT NOT NULL, -- Ex: 'UBS', 'Hospital', 'Parque', 'Estação CPTM', 'Escola Estadual'
    icon TEXT,
    address TEXT NOT NULL,
    number TEXT DEFAULT 'S/N',
    complement TEXT,
    neighborhood_id TEXT REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
    neighborhood_name TEXT NOT NULL,
    city_id TEXT REFERENCES public.cities(id) ON DELETE SET NULL,
    city_name TEXT NOT NULL,
    state_id TEXT NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
    postal_code TEXT,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    opening_hours TEXT,
    image_url TEXT,
    photo_url TEXT,
    cover_url TEXT,
    source TEXT DEFAULT 'Dados Públicos Oficiais',
    source_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'public_info' CHECK (
        verification_status IN ('verified', 'public_info', 'community_submitted')
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para Otimização de Busca e Geolocalização
CREATE INDEX IF NOT EXISTS idx_places_category_group ON public.places(category_group);
CREATE INDEX IF NOT EXISTS idx_places_subcategory ON public.places(subcategory);
CREATE INDEX IF NOT EXISTS idx_places_neighborhood_id ON public.places(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_places_city_id ON public.places(city_id);
CREATE INDEX IF NOT EXISTS idx_places_is_active ON public.places(is_active);
CREATE INDEX IF NOT EXISTS idx_places_geo ON public.places(latitude, longitude);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_places_updated_at ON public.places;
CREATE TRIGGER trigger_places_updated_at
    BEFORE UPDATE ON public.places
    FOR EACH ROW
    EXECUTE FUNCTION update_places_updated_at();

-- 4. Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Política de Leitura Pública
DROP POLICY IF EXISTS "Places públicos são visíveis por todos" ON public.places;
CREATE POLICY "Places públicos são visíveis por todos"
    ON public.places FOR SELECT
    USING (is_active = TRUE);

-- Política de Gestão para Administradores
DROP POLICY IF EXISTS "Admins podem gerenciar places" ON public.places;
CREATE POLICY "Admins podem gerenciar places"
    ON public.places FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
