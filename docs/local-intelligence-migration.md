# Konnexy Local Intelligence — Plano de Evolução e Migração Técnica

## 1. Visão Geral da Arquitetura

O **Vitriniza** evolui para incorporar a suíte **Konnexy Local Intelligence** como um monólito modular em Next.js (App Router), atendendo simultaneamente a:
- **Consumidores:** Descoberta local por geolocalização, busca semântica e paramétrica de produtos, marcas, serviços e horários em tempo real.
- **Comerciantes:** Painel de gestão unificado com auditoria automatizada de SEO Local (NAP, Schema.org, metadados), métricas comparativas (GSC, GA4, GBP), palavras-chave de intenção local e correções seguras em um clique.
- **Administrador Konnexy (Master):** Gestão multiempresa, auditoria de integridade, status de sincronização de conectores Google e inteligência agregada de rede.

---

## 2. Inventário Técnico (Auditoria Fase Zero)

| Módulo / Camada | Estado Atual | Plano de Evolução para Konnexy Local Intelligence |
| :--- | :--- | :--- |
| **Framework & Runtime** | Next.js 16.3.5, React 19, TypeScript 5, Tailwind CSS 4 | Manter monólito modular, componentes com tipagem estrita e SSR/Client boundary bem definidos. |
| **Banco de Dados** | Supabase PostgreSQL com migrações `001` a `005` | Criar migração `006_local_intelligence.sql` com tabelas de integrações Google, auditorias SEO, otimizações e métricas unificadas. Preparar compatibilidade com Neon PostgreSQL. |
| **Segurança & RLS** | Funções `is_admin()`, `can_manage_business()`, `is_business_member()` | Aplicar RLS estrito em todas as novas tabelas de métricas e conexões, garantindo isolamento total multiempresa. |
| **Mecanismo de Busca** | Filtro em memória / client-store e endpoints simples | Implementar Full-Text Search avançado e ranqueamento ponderado (texto + proximidade + disponibilidade + qualidade de dados). |
| **Painel do Lojista (`/painel`)** | Tabs de catálogo, produtos, promoções, avaliações, QR code | Integrar atalho direto e navegação fluida para `/intelligence` respeitando a identidade visual. |
| **Painel de Inteligência (`/intelligence`)** | Inexistente / Não criado | Criar módulo completo com 9 visões: Visão Geral, Diagnóstico SEO, Visibilidade Google, Palavras-chave, Produtos & Oportunidades, Conversões, Relatórios, Integrações e Histórico. |
| **Conectores Google** | Inexistentes | Estruturar serviços de backend para Google Search Console, Google Analytics 4, Google Business Profile e Merchant Center com gestão segura de tokens. |
| **Analytics & Atribuição** | Eventos básicos em `analytics_events` | Granularidade com deduplicação para WhatsApp, rotas, ligações, visualizações de produto e comparação em 7, 30 e 90 dias. |

---

## 3. Modelo de Dados — Migração `006_local_intelligence.sql`

1. `google_integrations`: Conexões por estabelecimento com status (`connected`, `disconnected`, `error`, `pending_approval`), credenciais criptografadas e timestamps de sync.
2. `seo_audits`: Histórico de diagnósticos com pontuação 0–100, lista de problemas com prioridade, severidade e correções sugeridas.
3. `seo_optimizations`: Registro de intervenções antes/depois para permitir comprovação de impacto e reversão rápida.
4. `local_intelligence_metrics`: Séries temporais de métricas locais diárias (impressões, cliques, CTR, chamadas, rotas, WhatsApp, termos de busca).
5. `local_intelligence_reports`: Relatórios periódicos e sob demanda consolidados para os comerciantes e master.

---

## 4. Roteiro de Execução

- **Fase 0:** Auditoria completa e inventário técnico. *(Concluída)*
- **Fase 1:** Criação da rota `/intelligence` e suas 9 subseções com autenticação e autorização por empresa.
- **Fase 2:** Motor de Busca Inteligente com ordenação ponderada e busca por produtos/marcas.
- **Fase 3:** Motor de Auditoria de SEO Local automatizado com recomendações de correção.
- **Fase 4:** Conectores e APIs de integração com Google (GSC, GA4, GBP, Merchant Center).
- **Fase 5:** Sistema de Analytics e atribuição de eventos locais com comparativos de períodos.
- **Fase 6:** Migração SQL no Supabase, RLS e isolamento multiempresa.
- **Fase 7:** Refinamento UI/UX preservando a identidade visual existente.
- **Fase 8:** Suíte de testes automatizados e validação de qualidade (build, lint, segurança).
- **Fase 9:** Validação de deploy e documentação contínua.
