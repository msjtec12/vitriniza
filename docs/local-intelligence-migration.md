# Vitriniza → Konnexy Local Intelligence (integração no mesmo sistema)

## Auditoria inicial (2026-11-11)
Arquivos inspecionados: package.json, README.md, app/page.tsx, app/layout.tsx, app/HomePageClient.tsx (trecho), app/master/page.tsx (trecho), lib/site.ts e supabase/migrations/002_security_hardening.sql (trecho).

### Confirmado
- Next.js 16.3.5, React 19.2.8, TypeScript, Tailwind 4.
- Leaflet para mapas, Recharts para gráficos, Framer Motion para animações.
- Supabase como banco e autenticação, com migrations e RLS documentadas.
- Painel master, planos, assinaturas, membros de negócios, eventos de analytics e horários presentes no código/migrations.
- A homepage já tem descoberta de comércios, categorias, promoções, locais e busca por raio, com store em lib/data/store.
- SEO inicial em app/page.tsx e app/layout.tsx.
- app/intelligence/page.tsx é o primeiro módulo aditivo criado nesta branch.

### Não verificado
- Estado real do banco, volume de registros, permissões efetivas, deploy, testes e variáveis de produção.
- Implementação completa de produtos, integrações Google, eventos, sincronização, sitemap e schema.org.
- Integridade de dados e compatibilidade de migração Neon.

## Arquitetura alvo: monólito modular
Manter a aplicação Next.js e suas rotas existentes. Adicionar /intelligence e módulos sob lib/intelligence, sem segunda aplicação e sem banco duplicado.

Módulos:
1. Business catalog: reutilizar businesses, categorias e produtos existentes.
2. Local search: estender busca atual por raio e termos; evitar substituir Leaflet.
3. SEO audits: verificações de metadados, canonical, sitemap, schema e indexação.
4. Google connectors: OAuth server-side, Search Console primeiro, Business Profile mediante aprovação, Merchant Center somente para lojas elegíveis.
5. Measurement: fonte, período, dimensão, métricas e provenance; distinguir cliques de conversões confirmadas.
6. Master / merchant dashboards: RBAC e isolamento tenant no servidor.

## Ordem de implementação
1. Mapear integralmente lib/data/store, lib/supabase, types, rotas do lojista, schemas SQL e testes.
2. Adicionar testes de regressão de acesso, busca, catálogo, master e RLS.
3. Evoluir /intelligence para área autenticada, sem expor dados privados em página pública.
4. Criar migrations aditivas e versionadas para integration_connections, seo_audits, metric_snapshots, optimization_actions e sync_jobs.
5. Criar captura de eventos idempotente (WhatsApp, telefone, rotas) com consentimento e política de retenção.
6. Integrar Search Console OAuth com tokens criptografados, estado de conexão e sync incremental.
7. Integrar painel com métricas verificadas e períodos comparáveis; nenhuma métrica fictícia em produção.
8. Expandir busca pública para produtos e serviços com SEO técnico.
9. Rodar piloto de 90 dias e registrar baseline, intervenções, sazonalidade e controles.

## Regras de segurança e migração
- NÃO remover Supabase ou trocar Auth sem inventário e plano de migração.
- NÃO alterar migrations já aplicadas; criar migrations novas.
- NÃO criar contas admin fictícias nem credenciais hardcoded.
- NÃO mover dados de clientes sem backup, contagens, checagens e rollback.
- NÃO publicar métricas como 'comprovadas' sem fonte verificável.
- NÃO mudar identidade visual, navegação existente ou URLs indexadas sem testes.
- Não executar deploy de produção antes de CI, testes e aprovação.

## Critérios de aceite do MVP
- Catálogo e busca existentes sem regressões.
- Dados privados isolados por empresa.
- Página pública de estabelecimento indexável, com dados reais.
- Eventos de clique auditáveis e deduplicados.
- Conector Search Console autorizado e funcional.
- Painel com fonte, período e dados verificáveis, estados vazios honestos.
- Testes de segurança, acessibilidade, build e restauração concluídos.
