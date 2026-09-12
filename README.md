# Vitriniza

Plataforma Next.js para descoberta de comércios e serviços locais, com painel do lojista, administração, avaliações e páginas públicas indexáveis.

## Requisitos

- Node.js 20+
- Um projeto Supabase

## Configuração local

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Preencha as variáveis do Supabase em `.env.local`. A `SUPABASE_SERVICE_ROLE_KEY` é usada somente nas rotas de servidor e nunca deve usar o prefixo `NEXT_PUBLIC_`.

## Banco de dados

As migrações canônicas ficam em `supabase/migrations` e usam IDs textuais compatíveis com os dados da aplicação.

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

A migração `002_security_hardening.sql` remove políticas permissivas antigas, aplica RLS multi-tenant e cria o bucket `business-media`. Os arquivos SQL soltos na raiz são mantidos apenas como referência para instalações legadas; não os execute depois das migrações canônicas.

Para criar o primeiro administrador:

1. Crie o usuário em Authentication no painel do Supabase.
2. Insira ou atualize a linha correspondente em `public.profiles` com `role = 'admin'`.
3. Acesse `/master` usando o e-mail e a senha desse usuário.

Contas de lojista são convidadas pelo administrador. O acesso a cada negócio depende de `business_members` e de uma assinatura Pro ativa.

## Variáveis

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada das rotas de servidor |
| `NEXT_PUBLIC_SITE_URL` | URL canônica do site, sem barra final |
| `NEXT_PUBLIC_ENABLE_DEMO_DATA` | Use `true` apenas em desenvolvimento para carregar dados fictícios |

## Validação

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

O workflow de CI executa essas verificações em pushes e pull requests.
