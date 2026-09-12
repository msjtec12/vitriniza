import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

type CreateProUserBody = {
  email?: unknown;
  name?: unknown;
  whatsapp?: unknown;
  businessId?: unknown;
  price?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string): boolean {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`create-pro:${auth.user.id}:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Muitas tentativas. Aguarde um minuto.' },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as CreateProUserBody;
    const email = cleanText(body.email, 254).toLowerCase();
    const name = cleanText(body.name, 120);
    const whatsapp = cleanText(body.whatsapp, 30).replace(/[^\d+]/g, '');
    const businessId = cleanText(body.businessId, 128);
    const price = Number(body.price ?? 49.9);
    const startsAt = cleanText(body.startsAt, 40) || new Date().toISOString();
    const expiresAt =
      cleanText(body.expiresAt, 40) ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!isValidEmail(email) || name.length < 2 || !businessId) {
      return NextResponse.json(
        { success: false, error: 'E-mail, nome e estabelecimento válidos são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0 || price > 10_000) {
      return NextResponse.json({ success: false, error: 'Preço inválido.' }, { status: 400 });
    }

    if (!isValidDate(startsAt) || !isValidDate(expiresAt) || Date.parse(expiresAt) <= Date.parse(startsAt)) {
      return NextResponse.json({ success: false, error: 'Período da assinatura inválido.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Supabase administrativo não configurado.' },
        { status: 503 }
      );
    }

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('id,name')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) throw businessError;
    if (!business) {
      return NextResponse.json({ success: false, error: 'Estabelecimento não encontrado.' }, { status: 404 });
    }

    const { data: existingProfile, error: profileLookupError } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;

    let userId = existingProfile?.id as string | undefined;
    let inviteSent = false;

    if (!userId) {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, phone: whatsapp, business_id: businessId },
      });

      if (inviteError || !inviteData.user) {
        return NextResponse.json(
          { success: false, error: inviteError?.message || 'Não foi possível criar o acesso do comerciante.' },
          { status: 409 }
        );
      }

      userId = inviteData.user.id;
      inviteSent = true;
    }

    const now = new Date().toISOString();
    const subscriptionId = `sub_${crypto.randomUUID()}`;

    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      email,
      full_name: name,
      phone: whatsapp,
      role: 'merchant',
      updated_at: now,
    });
    if (profileError) throw profileError;

    const { error: memberError } = await admin.from('business_members').upsert(
      { user_id: userId, business_id: businessId, role: 'owner', created_at: now },
      { onConflict: 'user_id,business_id' }
    );
    if (memberError) throw memberError;

    const { error: subscriptionError } = await admin.from('subscriptions').insert({
      id: subscriptionId,
      business_id: businessId,
      plan_id: 'pro',
      plan_name: 'Vitriniza Pro',
      price,
      interval: 'monthly',
      status: 'active',
      starts_at: new Date(startsAt).toISOString(),
      expires_at: new Date(expiresAt).toISOString(),
      payment_confirmed_at: now,
      created_at: now,
      updated_at: now,
    });
    if (subscriptionError) throw subscriptionError;

    const { data: updatedBusiness, error: updateError } = await admin
      .from('businesses')
      .update({
        listing_type: 'paid',
        ownership_status: 'claimed',
        owner_user_id: userId,
        plan_id: 'pro',
        plan_status: 'active',
        subscription_status: 'active',
        is_active: true,
        updated_at: now,
      })
      .eq('id', businessId)
      .select('id')
      .single();

    if (updateError || !updatedBusiness) {
      throw updateError || new Error('Falha ao atualizar estabelecimento.');
    }

    const { error: auditError } = await admin.from('audit_logs').insert({
      id: `log_${crypto.randomUUID()}`,
      admin_user_id: auth.user.id,
      business_id: businessId,
      business_name: business.name,
      action: 'business_converted_to_pro',
      metadata: { email, name, price, inviteSent, subscriptionId },
      created_at: now,
    });
    if (auditError) throw auditError;

    return NextResponse.json({
      success: true,
      userId,
      businessId,
      inviteSent,
      message: 'Conta Vitriniza Pro criada e vinculada com sucesso.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao criar conta Pro.';
    console.error('[API Create Pro User Error]', message);
    return NextResponse.json(
      { success: false, error: 'Não foi possível concluir a criação da conta Pro.' },
      { status: 500 }
    );
  }
}
