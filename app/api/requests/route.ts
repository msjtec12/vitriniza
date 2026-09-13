import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

type RequestBody = Record<string, unknown>;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`business-request:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Muitas solicitações. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as RequestBody;
    const ownerName = cleanText(body.owner_name, 120) || 'A confirmar';
    const businessName = cleanText(body.business_name, 160);
    const whatsapp = cleanText(body.whatsapp, 30).replace(/[^\d+]/g, '');
    const email = cleanText(body.email, 254).toLowerCase();
    const instagram = cleanText(body.instagram, 80).replace(/^@/, '');
    const categoryName = cleanText(body.category_name, 100) || 'Comércio Local';
    const neighborhoodName = cleanText(body.neighborhood_name, 120);
    const cityName = cleanText(body.city_name, 120);
    const stateCode = cleanText(body.state_code, 2).toUpperCase();
    const address = cleanText(body.address, 300);
    const message = cleanText(body.message, 1_000);
    const interestType = body.interest_type === 'local_free' ? 'local_free' : 'pro';

    if (businessName.length < 2 || whatsapp.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { success: false, error: 'Negócio e WhatsApp válido são obrigatórios.' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'E-mail inválido.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Cadastro temporariamente indisponível.' },
        { status: 503 }
      );
    }

    const requestRecord = {
      id: `req_${crypto.randomUUID()}`,
      owner_name: ownerName,
      business_name: businessName,
      whatsapp,
      email: email || null,
      instagram: instagram || null,
      category_name: categoryName,
      neighborhood_name: neighborhoodName || null,
      city_name: cityName || null,
      state_code: stateCode || null,
      address: address || null,
      interest_type: interestType,
      message: message || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { error } = await admin.from('business_requests').insert(requestRecord);
    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        requestId: requestRecord.id,
        message:
          interestType === 'pro'
            ? 'Recebemos seu pedido de prévia. Entraremos em contato pelo WhatsApp.'
            : 'Recebemos sua solicitação de cadastro local.',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[API Business Request Error]', message);
    return NextResponse.json(
      { success: false, error: 'Não foi possível registrar a solicitação.' },
      { status: 500 }
    );
  }
}
