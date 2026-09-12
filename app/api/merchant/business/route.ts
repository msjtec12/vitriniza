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
  if (value.startsWith('/')) return true;
  if (value.startsWith('data:')) return false;
  try {
    return new URL(value).protocol === 'https:';
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

    const { data: membership, error: membershipError } = await admin
      .from('business_members')
      .select('business_id')
      .eq('user_id', auth.user.id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) {
      return NextResponse.json({ success: false, error: 'Você não administra este estabelecimento.' }, { status: 403 });
    }

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('listing_type,plan_status,subscription_status')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) throw businessError;
    if (
      !business ||
      business.listing_type !== 'paid' ||
      business.plan_status !== 'active' ||
      business.subscription_status !== 'active'
    ) {
      return NextResponse.json({ success: false, error: 'A assinatura Pro não está ativa.' }, { status: 403 });
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('id')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (subscriptionError) throw subscriptionError;
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'A assinatura Pro expirou.' }, { status: 403 });
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
