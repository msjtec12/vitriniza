import 'server-only';

import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type AuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403 | 503; error: string };

function readBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7).trim() || null;
}

export async function requireAuthenticatedUser(req: NextRequest): Promise<AuthResult> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, status: 503, error: 'Serviço de autenticação indisponível.' };
  }

  const token = readBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'Autenticação obrigatória.' };
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, error: 'Sessão inválida ou expirada.' };
  }

  return { ok: true, user: data.user };
}

export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, status: 503, error: 'Serviço de autenticação indisponível.' };
  }

  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || profile?.role !== 'admin') {
    return { ok: false, status: 403, error: 'Acesso permitido somente a administradores.' };
  }

  return auth;
}
