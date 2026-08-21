-- ==============================================================================
-- VITRINIZA: SCRIPT DE MIGRAÇÃO & CARGA COMPLETA DE DADOS (SEED)
-- Execute este script no SQL Editor do Supabase para popular todas as tabelas!
-- https://supabase.com/dashboard/project/kdhfnheeagsxwjcibrxy/sql
-- ==============================================================================

-- 1. LIMPAR OU AJUSTAR TABELAS PARA ID TEXTO
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS claim_requests CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS states CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;

-- 2. CRIAR TABELAS COM TIPOS CORRETOS
CREATE TABLE states (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  uf TEXT NOT NULL
);

CREATE TABLE cities (
  id TEXT PRIMARY KEY,
  state_id TEXT NOT NULL REFERENCES states(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  image_url TEXT,
  description TEXT
);

CREATE TABLE neighborhoods (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

CREATE TABLE platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  platform_name TEXT NOT NULL DEFAULT 'Vitriniza',
  contact_whatsapp TEXT NOT NULL DEFAULT '11999999999',
  plan_semanal_price NUMERIC(10,2) NOT NULL DEFAULT 19.90,
  plan_mensal_price NUMERIC(10,2) NOT NULL DEFAULT 49.90,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id),
  neighborhood_id TEXT NOT NULL REFERENCES neighborhoods(id),
  city_id TEXT NOT NULL REFERENCES cities(id),
  state_id TEXT NOT NULL REFERENCES states(id),
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
  plan_id TEXT NOT NULL DEFAULT 'free',
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE products (
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

CREATE TABLE promotions (
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

CREATE TABLE claim_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  document TEXT,
  proof_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS) COM POLÍTICAS DE ACESSO TOTAL
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total states" ON states FOR ALL USING (true);
CREATE POLICY "Acesso Total cities" ON cities FOR ALL USING (true);
CREATE POLICY "Acesso Total neighborhoods" ON neighborhoods FOR ALL USING (true);
CREATE POLICY "Acesso Total categories" ON categories FOR ALL USING (true);
CREATE POLICY "Acesso Total platform_settings" ON platform_settings FOR ALL USING (true);
CREATE POLICY "Acesso Total businesses" ON businesses FOR ALL USING (true);
CREATE POLICY "Acesso Total products" ON products FOR ALL USING (true);
CREATE POLICY "Acesso Total promotions" ON promotions FOR ALL USING (true);
CREATE POLICY "Acesso Total claim_requests" ON claim_requests FOR ALL USING (true);
CREATE POLICY "Acesso Total reviews" ON reviews FOR ALL USING (true);

-- 4. INSERÇÃO DOS DADOS INICIAIS (SEED COMPLETO)

-- Estados & Cidades
INSERT INTO states (id, name, uf) VALUES ('SP', 'São Paulo', 'SP');

INSERT INTO cities (id, state_id, name, slug, active, is_featured, image_url, description) VALUES
('city-sp', 'SP', 'São Paulo', 'sao-paulo', true, true, 'https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=800&auto=format&fit=crop&q=80', 'A maior metrópole do país com milhares de bairros e comércios vibrantes.'),
('city-suzano', 'SP', 'Suzano', 'suzano', true, false, 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80', 'Comércio ativo e empreendedores locais na região metropolitana.'),
('city-atibaia', 'SP', 'Atibaia', 'atibaia', true, false, 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80', 'Polo gastronômico, turismo e serviços locais acolhedores.');

-- Bairros
INSERT INTO neighborhoods (id, city_id, name, slug, active, is_featured, order_index) VALUES
('neigh-guaianases', 'city-sp', 'Guaianases', 'guaianases', true, true, 1),
('neigh-itaquera', 'city-sp', 'Itaquera', 'itaquera', true, true, 2),
('neigh-sao-mateus', 'city-sp', 'São Mateus', 'sao-mateus', true, false, 3),
('neigh-centro-suzano', 'city-suzano', 'Centro', 'centro', true, false, 4),
('neigh-alvinopolis', 'city-atibaia', 'Alvinópolis', 'alvinopolis', true, false, 5);

-- Categorias
INSERT INTO categories (id, name, slug, icon, description, image_url, order_index, active) VALUES
('cat-alimentacao', 'Alimentação', 'alimentacao', 'Utensils', 'Pizzarias, lanchonetes, restaurantes, marmitas e delivery', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', 1, true),
('cat-imoveis', 'Imóveis & Corretores', 'imoveis-corretores', 'Home', 'Casas, apartamentos, aluguel, compra, venda e salões comerciais', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80', 2, true),
('cat-planos-saude', 'Planos de Saúde & Seguros', 'planos-saude-seguros', 'HeartPulse', 'Cotação de convênios médicos individuais, familiares, MEI e seguros', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80', 3, true),
('cat-servicos', 'Serviços & Reformas', 'servicos-reformas', 'Wrench', 'Eletricistas, encanadores, pintores, marcenarias e chaveiros 24h', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&auto=format&fit=crop&q=80', 4, true),
('cat-servicos-domesticos', 'Serviços Domésticos & Diaristas', 'servicos-domesticos', 'Sparkles', 'Diaristas de confiança, faxinas, passadeiras e cuidadores', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80', 5, true),
('cat-beleza', 'Beleza & Estética', 'beleza-estetica', 'Scissors', 'Salões de beleza, barbearias, manicures e estética', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80', 6, true),
('cat-lojas', 'Lojas & Comércio', 'lojas-comercio', 'ShoppingBag', 'Variedades, papelarias, utilidades e presentes', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80', 7, true),
('cat-pet', 'Pet Shop & Vet', 'pet-shop', 'Dog', 'Banho e tosa, rações, clínicas veterinárias e acessórios', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80', 8, true),
('cat-festas', 'Festas & Doces', 'festas-doces', 'Cake', 'Bolos decorados, salgados, buffets e artigos para festa', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', 9, true),
('cat-casa', 'Casa & Construção', 'casa-construcao', 'Home', 'Materiais de construção, tintas, marmorarias e móveis', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80', 10, true),
('cat-moda', 'Moda & Vestuário', 'moda-vestuario', 'Shirt', 'Roupas femininas, masculinas, infantis e calçados', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80', 11, true),
('cat-saude', 'Saúde & Bem-Estar', 'saude-bem-estar', 'HeartPulse', 'Farmácias, consultórios, dentistas e academias', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80', 12, true),
('cat-auto', 'Automotivo', 'automotivo', 'Car', 'Oficinas mecânicas, auto elétricas, lava-rápidos e autopeças', 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80', 13, true);

-- Configurações da Plataforma
INSERT INTO platform_settings (id, platform_name, contact_whatsapp, plan_semanal_price, plan_mensal_price)
VALUES ('main', 'Vitriniza', '11999999999', 19.90, 49.90);

-- Empresas
INSERT INTO businesses (id, name, slug, description, short_description, category_id, neighborhood_id, city_id, state_id, address, number, complement, postal_code, phone, whatsapp, logo_url, cover_url, plan_id, is_featured, is_verified, is_active, rating, reviews_count) VALUES
('biz-1', 'Pizzaria Bella Villa', 'pizzaria-bella-villa', 'Pizzaria artesanal tradicional com forno a lenha, massa de fermentação lenta de 48h e ingredientes importados selecionados. Entregamos quentinho no seu bairro!', 'Pizzas artesanais no forno a lenha e delivery rápido em Guaianases.', 'cat-alimentacao', 'neigh-guaianases', 'city-sp', 'SP', 'Rua Salvador Gianetti', '450', 'Próximo à estação', '08410-000', '(11) 2555-1020', '11987651020', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&auto=format&fit=crop&q=80', 'mensal', true, true, true, 4.9, 48),
('biz-2', 'Barbearia Dom Navalha', 'barbearia-dom-navalha', 'Ambiente vintage com atendimento de primeira qualidade. Corte degradê, barba com toalha quente, corte infantil e cerveja gelada.', 'Cortes modernos, barba alinhada com toalha quente e estilo.', 'cat-beleza', 'neigh-guaianases', 'city-sp', 'SP', 'Estrada de Poá', '1120', 'Sala 2', '08420-000', '(11) 2555-2230', '11977112233', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80', 'mensal', true, true, true, 4.8, 35),
('biz-16', 'Carlos Imóveis & Assessoria Imobiliária', 'carlos-imoveis-assessoria', 'Corretor credenciado CRECI especializado na Zona Leste e Alto Tietê. Compra, venda, locação residencial e comercial, administração e avaliação mercadológica de imóveis com segurança jurídica.', 'Corretor de imóveis credenciado. Casas, apartamentos e salões comerciais.', 'cat-imoveis', 'neigh-guaianases', 'city-sp', 'SP', 'Rua Hipólito de Camargo', '310', 'Sala 4', '08410-030', '(11) 2555-7660', '11998877665', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&auto=format&fit=crop&q=80', 'mensal', true, true, true, 5.0, 24),
('biz-17', 'Juliana Saúde & Benefícios - Consultoria de Planos', 'juliana-saude-beneficios', 'Consultoria independente e especializada em planos de saúde individuais, familiares, por adesão e empresariais (inclusive MEI a partir de 1 vida).', 'Consultoria e cotação dos melhores planos de saúde e convênios para você.', 'cat-planos-saude', 'neigh-guaianases', 'city-sp', 'SP', 'Av. Nordestina', '1420', 'Conj. 12', '08420-100', '(11) 2555-4300', '11988443322', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80', 'mensal', true, true, true, 4.9, 31),
('biz-18', 'Marcos Eletricista 24h & Reparos Residenciais', 'marcos-eletricista-24h', 'Eletricista profissional com certificado NR10. Atendimento de emergência 24 horas para queda de disjuntores, curto-circuito, instalação de chuveiros e reformas elétricas.', 'Eletricista 24h certificado. Instalações, reparos e emergências residenciais.', 'cat-servicos', 'neigh-guaianases', 'city-sp', 'SP', 'Rua Otelo Augusto Ribeiro', '580', 'Casa 1', '08412-000', '(11) 2555-2100', '11965432105', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop&q=80', 'mensal', true, true, true, 4.9, 42),
('biz-19', 'Dona Maria & Equipe - Diaristas de Confiança', 'dona-maria-diaristas', 'Equipe de diaristas e passadeiras profissionais com referências checadas. Faxina padrão, faxina pesada pós-obra e pré-mudança.', 'Diaristas de confiança, faxina completa e passadeira com referências.', 'cat-servicos-domesticos', 'neigh-guaianases', 'city-sp', 'SP', 'Rua Central de Guaianases', '190', 'Apto 32', '08410-210', '(11) 2555-3200', '11974321098', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200&auto=format&fit=crop&q=80', 'mensal', true, true, true, 5.0, 56);

-- Produtos
INSERT INTO products (id, business_id, name, description, price, promo_price, category, image_url, is_available) VALUES
('prod-1', 'biz-1', 'Pizza Calabresa Especial', 'Molho de tomate artesanal, calabresa fatiada crocante, cebola roxa, azeitonas pretas e orégano.', 49.90, 39.90, 'Pizzas Salgadas', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80', true),
('prod-2', 'biz-1', 'Pizza Quatro Queijos Premium', 'Mussarela especial, catupiry original, provolone defumado e gorgonzola cremoso.', 59.90, NULL, 'Pizzas Salgadas', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', true),
('prod-16-1', 'biz-16', 'Sobrado 3 Dormitórios com Suíte', 'Excelente sobrado em Guaianases com 3 dorms (1 suíte), 2 vagas de garagem, churrasqueira e acabamento em porcelanato.', 420000.00, NULL, 'Venda', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80', true),
('prod-17-1', 'biz-17', 'Cotação Plano Saúde Individual / Familiar', 'Comparativo completo entre as operadoras Notredame, Amil, SulAmérica, Bradesco e Hapvida com melhor custo-benefício.', 0.00, NULL, 'Planos de Saúde', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80', true),
('prod-18-1', 'biz-18', 'Visita Técnica & Diagnóstico Elétrico', 'Avaliação minuciosa do quadro de disjuntores, fiação, tomadas e dimensionamento de carga com orçamento na hora.', 80.00, 60.00, 'Serviços Elétricos', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80', true),
('prod-19-1', 'biz-19', 'Diária de Faxina Residencial Completa (8h)', 'Limpeza detalhada de todos os cômodos, banheiros, cozinha, vidros e aspiração de pisos com equipe de confiança.', 190.00, 170.00, 'Faxina Residencial', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80', true);

-- Promoções
INSERT INTO promotions (id, business_id, title, description, original_price, promo_price, image_url, rules, starts_at, expires_at, is_active) VALUES
('promo-1', 'biz-1', 'Terça e Quarta da Pizza em Dobro!', 'Na compra de qualquer pizza grande tradicional, ganhe uma pizza doce brotinho de Nutella com morango!', 85.00, 49.90, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', 'Válido para pedidos feitos pelo WhatsApp às terças e quartas.', now(), now() + interval '30 days', true),
('promo-17-1', 'biz-17', 'Isenção de Carência em Consultas e Exames Simples', 'Feche seu plano de saúde empresarial (MEI incluso) este mês e tenha carência zero para consultas e exames básicos.', 250.00, 169.00, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80', 'Válido para novos contratos fechados via WhatsApp.', now(), now() + interval '30 days', true),
('promo-18-1', 'biz-18', '20% OFF na Troca de Fiação ou Instalação de Chuveiro', 'Agende a revisão elétrica da sua casa e ganhe 20% de desconto no valor da mão de obra.', 150.00, 120.00, 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&auto=format&fit=crop&q=80', 'Válido para Guaianases e bairros vizinhos.', now(), now() + interval '30 days', true);

-- Avaliações
INSERT INTO reviews (id, business_id, author_name, rating, comment, status) VALUES
('rev-1', 'biz-1', 'Camila Fernandes', 5, 'A melhor pizza de Guaianases sem dúvidas! Massa levinha, ingredientes de ótima qualidade e a entrega pelo WhatsApp foi super rápida.', 'approved'),
('rev-16-1', 'biz-16', 'Marcelo Pires', 5, 'O Carlos foi impecável na locação do meu salão comercial. Negociação transparente, rápida e sem burocracia desnecessária!', 'approved'),
('rev-17-1', 'biz-17', 'Julio Cesar Martins', 5, 'A Juliana encontrou um plano de saúde pelo meu MEI que reduziu minha mensalidade em mais de 35% com atendimento nos melhores hospitais.', 'approved'),
('rev-18-1', 'biz-18', 'Renata Guimarães', 5, 'Chamei o Marcos numa emergência de curto-circuito em pleno sábado à noite. Chegou em 25 minutos e resolveu tudo com total segurança.', 'approved'),
('rev-19-1', 'biz-19', 'Luciana Mello', 5, 'A equipe da Dona Maria fez a faxina pós-obra do meu apartamento e deixou impecável, brilhando e cheiroso. Super recomendo!', 'approved');
