-- =======================================================
-- VITRINIZA: SCHEMA COMPLETO SUPABASE (POSTGRESQL)
-- Execute este script no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/kdhfnheeagsxwjcibrxy/sql)
-- =======================================================

-- 1. TABELA: CONFIGURAÇÕES DA PLATAFORMA (PREÇOS & CONTATO)
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  platform_name TEXT NOT NULL DEFAULT 'Vitriniza',
  contact_whatsapp TEXT NOT NULL DEFAULT '11999999999',
  plan_semanal_price NUMERIC(10,2) NOT NULL DEFAULT 19.90,
  plan_mensal_price NUMERIC(10,2) NOT NULL DEFAULT 49.90,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir configuração padrão
INSERT INTO platform_settings (id, platform_name, contact_whatsapp, plan_semanal_price, plan_mensal_price)
VALUES ('main', 'Vitriniza', '11999999999', 19.90, 49.90)
ON CONFLICT (id) DO UPDATE 
SET plan_semanal_price = EXCLUDED.plan_semanal_price,
    plan_mensal_price = EXCLUDED.plan_mensal_price;

-- 2. TABELA: CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA: EMPRESAS / COMÉRCIOS (BUSINESSES)
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id TEXT NOT NULL,
  neighborhood_id TEXT NOT NULL DEFAULT 'neigh-guaianases',
  city_id TEXT NOT NULL DEFAULT 'city-sp',
  state_id TEXT NOT NULL DEFAULT 'SP',
  address TEXT NOT NULL,
  number TEXT NOT NULL DEFAULT 'S/N',
  complement TEXT,
  postal_code TEXT DEFAULT '08400-000',
  latitude NUMERIC(10,6) DEFAULT -23.5424,
  longitude NUMERIC(10,6) DEFAULT -46.4178,
  phone TEXT DEFAULT '(11) 99999-9999',
  whatsapp TEXT NOT NULL,
  instagram TEXT,
  website TEXT,
  logo_url TEXT,
  cover_url TEXT,
  plan_id TEXT NOT NULL DEFAULT 'free', -- 'free' | 'semanal' | 'mensal'
  plan_status TEXT NOT NULL DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  delivery_available BOOLEAN DEFAULT false,
  takeaway_available BOOLEAN DEFAULT true,
  dine_in_available BOOLEAN DEFAULT true,
  payment_methods JSONB DEFAULT '["Pix", "Cartão de Crédito", "Dinheiro"]'::jsonb,
  hours JSONB,
  owner_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA: PRODUTOS & CARDÁPIO
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(10,2),
  category TEXT DEFAULT 'Geral',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA: OFERTAS & PROMOÇÕES
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  rules TEXT,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TABELA: REIVINDICAÇÕES DE COMÉRCIO
CREATE TABLE IF NOT EXISTS claim_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  document TEXT,
  proof_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 7. TABELA: AVALIAÇÕES
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =======================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) COM POLÍTICAS ABERTAS
-- =======================================================
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública de dados
CREATE POLICY "Permitir leitura pública em platform_settings" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Permitir alteração em platform_settings" ON platform_settings FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública em categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Permitir alteração em categories" ON categories FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública em businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização em businesses" ON businesses FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública em products" ON products FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e alteração em products" ON products FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública em promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e alteração em promotions" ON promotions FOR ALL USING (true);

CREATE POLICY "Permitir leitura e inserção em claim_requests" ON claim_requests FOR ALL USING (true);
CREATE POLICY "Permitir leitura e inserção em reviews" ON reviews FOR ALL USING (true);
