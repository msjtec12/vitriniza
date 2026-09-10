-- ==============================================================================
-- VITRINIZA: MIGRAÇÃO PARA MODELO SAAS MULTI-TENANT CONTROLADO
-- ==============================================================================
-- Este script estabelece as tabelas de suporte, tipos comerciais (Cadastro Local vs Pro),
-- controle de membros (business_members), assinaturas manuais, solicitações comerciais
-- e políticas RLS de segurança rigorosas no Supabase.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'merchant', -- 'admin' | 'merchant'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AJUSTES NA TABELA DE NEGÓCIOS (BUSINESSES)
DO $$ 
BEGIN
  -- listing_type: 'local_free' ou 'paid'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'listing_type') THEN
    ALTER TABLE public.businesses ADD COLUMN listing_type TEXT DEFAULT 'local_free' CHECK (listing_type IN ('local_free', 'paid'));
  END IF;

  -- ownership_status: 'unclaimed' ou 'claimed'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'ownership_status') THEN
    ALTER TABLE public.businesses ADD COLUMN ownership_status TEXT DEFAULT 'unclaimed' CHECK (ownership_status IN ('unclaimed', 'claimed'));
  END IF;

  -- owner_user_id: vínculo com usuário proprietário
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'owner_user_id') THEN
    ALTER TABLE public.businesses ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- subscription_status: 'active', 'pending', 'overdue', 'cancelled', 'expired'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'subscription_status') THEN
    ALTER TABLE public.businesses ADD COLUMN subscription_status TEXT DEFAULT 'active';
  END IF;
END $$;

-- 4. TABELA DE MEMBROS DO NEGÓCIO (BUSINESS_MEMBERS)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON public.business_members(business_id);

-- 5. TABELA DE ASSINATURAS MANUAIS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id TEXT DEFAULT 'pro',
  plan_name TEXT DEFAULT 'Vitriniza Pro',
  price NUMERIC(10,2) DEFAULT 49.90,
  interval TEXT DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'overdue', 'cancelled', 'expired')),
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  payment_confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 6. TABELA DE SOLICITAÇÕES COMERCIAIS (BUSINESS_REQUESTS)
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
  address TEXT,
  interest_type TEXT NOT NULL DEFAULT 'pro' CHECK (interest_type IN ('local_free', 'pro')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_business_requests_status ON public.business_requests(status);
CREATE INDEX IF NOT EXISTS idx_business_requests_interest_type ON public.business_requests(interest_type);

-- 7. TABELA DE AUDITORIA ADMINISTRATIVA (AUDIT_LOGS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log_' || gen_random_uuid()),
  admin_user_id TEXT NOT NULL,
  business_id TEXT,
  business_name TEXT,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ==============================================================================
-- 8. FUNÇÕES AUXILIARES DE SEGURANÇA E RLS
-- ==============================================================================

-- Verifica se o usuário autenticado é membro com papel ativo do negócio
CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.business_members 
    WHERE business_id = target_business_id 
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. POLÍTICAS RLS MULTI-TENANT (ROW LEVEL SECURITY)
-- ==============================================================================

-- Habilita RLS em todas as tabelas sensíveis
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: BUSINESSES
DROP POLICY IF EXISTS "Public view active businesses" ON public.businesses;
CREATE POLICY "Public view active businesses"
  ON public.businesses FOR SELECT
  USING (is_active = true OR is_business_member(id) OR is_admin());

DROP POLICY IF EXISTS "Members can update their business" ON public.businesses;
CREATE POLICY "Members can update their business"
  ON public.businesses FOR UPDATE
  USING (is_business_member(id) OR is_admin())
  WITH CHECK (is_business_member(id) OR is_admin());

-- POLÍTICAS: PRODUCTS
DROP POLICY IF EXISTS "Public view available products" ON public.products;
CREATE POLICY "Public view available products"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Members can manage products" ON public.products;
CREATE POLICY "Members can manage products"
  ON public.products FOR ALL
  USING (is_business_member(business_id) OR is_admin())
  WITH CHECK (is_business_member(business_id) OR is_admin());

-- POLÍTICAS: PROMOTIONS
DROP POLICY IF EXISTS "Public view promotions" ON public.promotions;
CREATE POLICY "Public view promotions"
  ON public.promotions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Members can manage promotions" ON public.promotions;
CREATE POLICY "Members can manage promotions"
  ON public.promotions FOR ALL
  USING (is_business_member(business_id) OR is_admin())
  WITH CHECK (is_business_member(business_id) OR is_admin());

-- POLÍTICAS: BUSINESS_MEMBERS
DROP POLICY IF EXISTS "Users can view their memberships" ON public.business_members;
CREATE POLICY "Users can view their memberships"
  ON public.business_members FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- POLÍTICAS: BUSINESS_REQUESTS
DROP POLICY IF EXISTS "Public can insert business requests" ON public.business_requests;
CREATE POLICY "Public can insert business requests"
  ON public.business_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage requests" ON public.business_requests;
CREATE POLICY "Admins can manage requests"
  ON public.business_requests FOR ALL
  USING (is_admin());

-- POLÍTICAS: SUBSCRIPTIONS & AUDIT_LOGS
DROP POLICY IF EXISTS "Members can view subscription" ON public.subscriptions;
CREATE POLICY "Members can view subscription"
  ON public.subscriptions FOR SELECT
  USING (is_business_member(business_id) OR is_admin());

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_admin());
