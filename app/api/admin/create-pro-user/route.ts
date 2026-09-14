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
  password?: unknown;
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
    const password = cleanText(body.password, 128);

    if (!isValidEmail(email) || name.length < 2 || !businessId || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'E-mail, nome, estabelecimento e senha com pelo menos 8 caracteres são obrigatórios.' },
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
    let accountCreated = false;

    if (!userId) {
      const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1_000,
      });
      if (usersError) throw usersError;
      userId = authUsers.users.find((user) => user.email?.toLowerCase() === email)?.id;
    }

    if (!userId) {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone: whatsapp, business_id: businessId },
      });

      if (createError || !createData.user) {
        return NextResponse.json(
          { success: false, error: createError?.message || 'Não foi possível criar o acesso do comerciante.' },
          { status: 409 }
        );
      }

      userId = createData.user.id;
      accountCreated = true;
    } else {
      const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone: whatsapp, business_id: businessId },
      });
      if (passwordError) throw passwordError;
    }

    const now = new Date().toISOString();

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

    const { data: existingSubscription, error: subscriptionLookupError } = await admin
      .from('subscriptions')
      .select('id')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subscriptionLookupError) throw subscriptionLookupError;

    const subscriptionId = existingSubscription?.id || `sub_${crypto.randomUUID()}`;
    const subscriptionRecord = {
      business_id: businessId,
      plan_id: 'pro',
      plan_name: 'Vitriniza Pro',
      price,
      interval: 'monthly',
      status: 'active',
      starts_at: new Date(startsAt).toISOString(),
      expires_at: new Date(expiresAt).toISOString(),
      payment_confirmed_at: now,
      updated_at: now,
    };

    const subscriptionResult = existingSubscription
      ? await admin.from('subscriptions').update(subscriptionRecord).eq('id', subscriptionId)
      : await admin.from('subscriptions').insert({
          id: subscriptionId,
          ...subscriptionRecord,
          created_at: now,
        });
    if (subscriptionResult.error) throw subscriptionResult.error;

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
      metadata: { email, name, price, accountCreated, subscriptionId },
      created_at: now,
    });
    if (auditError) throw auditError;

    return NextResponse.json({
      success: true,
      userId,
      businessId,
      accountCreated,
      message: accountCreated
        ? 'Conta criada e vinculada. O proprietário já pode entrar com a senha definida.'
        : 'Conta existente vinculada e senha atualizada.',
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
