import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

const ALLOWED_TEXT_FIELDS = [
  'name',
  'short_description',
  'description',
  'whatsapp',
  'phone',
  'instagram',
  'website',
  'address',
  'number',
  'postal_code',
  'neighborhood_id',
  'logo_url',
  'cover_url',
] as const;

const ALLOWED_BOOLEAN_FIELDS = [
  'delivery_available',
  'takeaway_available',
  'dine_in_available',
  'is_online_only',
] as const;

type Body = Record<string, unknown>;

function safeMediaUrl(value: string): boolean {
  if (!value) return true;
  if (value.startsWith('/')) return true;
  if (value.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`merchant-business:${auth.user.id}:${ip}`, 30, 60_000)) {
    return NextResponse.json({ success: false, error: 'Muitas alterações em sequência.' }, { status: 429 });
  }

  try {
    const body = (await req.json()) as Body;
    const businessId = typeof body.businessId === 'string' ? body.businessId.trim().slice(0, 128) : '';
    const rawUpdates =
      body.updates && typeof body.updates === 'object' ? (body.updates as Record<string, unknown>) : {};

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Estabelecimento inválido.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível.' }, { status: 503 });
    }

    // Verificar se o usuário é administrador geral
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle();
    const isAdmin = profile?.role === 'admin';

    // Verificar se é membro registrado
    const { data: membership } = await admin
      .from('business_members')
      .select('business_id')
      .eq('user_id', auth.user.id)
      .eq('business_id', businessId)
      .maybeSingle();

    // Obter dados do estabelecimento
    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('id,owner_user_id,listing_type,plan_status,subscription_status')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json({ success: false, error: 'Estabelecimento não encontrado.' }, { status: 404 });
    }

    const isOwner = business.owner_user_id === auth.user.id;
    if (!isAdmin && !membership && !isOwner) {
      return NextResponse.json({ success: false, error: 'Você não administra este estabelecimento.' }, { status: 403 });
    }

    // Se é o proprietário mas ainda não tem vínculo formal em business_members, vincular automaticamente
    if (isOwner && !membership) {
      try {
        await admin.from('business_members').upsert(
          { user_id: auth.user.id, business_id: businessId, role: 'owner' },
          { onConflict: 'user_id,business_id' }
        );
      } catch (err) {
        console.warn('[Auto-link business_member warning]', err);
      }
    }

    // Checagem de assinatura Pro (não bloquear contas em período de testes ou recém-criadas)
    if (!isAdmin) {
      const { data: subscription } = await admin
        .from('subscriptions')
        .select('id, status, expires_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (
        subscription &&
        (subscription.status === 'expired' || subscription.status === 'canceled') &&
        subscription.expires_at &&
        new Date(subscription.expires_at).getTime() < Date.now()
      ) {
        return NextResponse.json({ success: false, error: 'A assinatura Pro expirou.' }, { status: 403 });
      }
    }

    const updates: Record<string, string | boolean> = {};
    for (const field of ALLOWED_TEXT_FIELDS) {
      const value = rawUpdates[field];
      if (typeof value === 'string') {
        updates[field] = value.trim().slice(0, field === 'description' ? 5_000 : 500);
      }
    }
    for (const field of ALLOWED_BOOLEAN_FIELDS) {
      if (typeof rawUpdates[field] === 'boolean') updates[field] = rawUpdates[field];
    }

    for (const field of ['logo_url', 'cover_url'] as const) {
      const value = updates[field];
      if (typeof value === 'string' && value && !safeMediaUrl(value)) {
        return NextResponse.json({ success: false, error: 'URL de imagem inválida.' }, { status: 400 });
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ success: false, error: 'Nenhuma alteração válida.' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await admin
      .from('businesses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .select('id')
      .single();

    if (updateError || !updated) throw updateError || new Error('Estabelecimento não atualizado.');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[API Merchant Business Error]', message);
    return NextResponse.json({ success: false, error: 'Não foi possível salvar as alterações.' }, { status: 500 });
  }
}
