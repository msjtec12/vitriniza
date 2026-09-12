import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

type ClaimBody = Record<string, unknown>;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`claim-request:${ip}`, 3, 30 * 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Muitas solicitações. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as ClaimBody;
    const businessId = cleanText(body.business_id, 128);
    const requesterName = cleanText(body.requester_name, 120);
    const requesterEmail = cleanText(body.requester_email, 254).toLowerCase();
    const requesterPhone = cleanText(body.requester_phone, 30).replace(/[^\d+]/g, '');
    const proofNotes = cleanText(body.proof_notes, 1_500);

    if (
      !businessId ||
      requesterName.length < 2 ||
      requesterPhone.length < 10 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)
    ) {
      return NextResponse.json(
        { success: false, error: 'Preencha negócio, nome, e-mail e WhatsApp válidos.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Reivindicação temporariamente indisponível.' },
        { status: 503 }
      );
    }

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('id,name,ownership_status')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) throw businessError;
    if (!business) {
      return NextResponse.json({ success: false, error: 'Estabelecimento não encontrado.' }, { status: 404 });
    }
    if (business.ownership_status === 'claimed') {
      return NextResponse.json(
        { success: false, error: 'Este estabelecimento já possui um responsável. Fale com o suporte.' },
        { status: 409 }
      );
    }

    const { error } = await admin.from('claim_requests').insert({
      id: `claim_${crypto.randomUUID()}`,
      business_id: businessId,
      business_name: business.name,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_phone: requesterPhone,
      proof_notes: proofNotes || 'Solicitação enviada pelo formulário público.',
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Solicitação recebida e enviada para verificação manual.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[API Claim Request Error]', message);
    return NextResponse.json(
      { success: false, error: 'Não foi possível enviar a reivindicação.' },
      { status: 500 }
    );
  }
}
