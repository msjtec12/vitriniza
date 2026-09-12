import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const businessId = text(body.business_id, 128);
    const authorName = text(body.author_name, 120);
    const comment = text(body.comment, 2_000);
    const rating = Number(body.rating);
    const ip = getRequestIp(req.headers);

    if (!checkRateLimit(`review:${businessId}:${ip}`, 3, 60 * 60_000)) {
      return NextResponse.json({ success: false, error: 'Limite de avaliações atingido. Tente mais tarde.' }, { status: 429 });
    }
    if (!businessId || authorName.length < 2 || comment.length < 3 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Preencha nome, nota e comentário válidos.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Avaliações temporariamente indisponíveis.' }, { status: 503 });
    }

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('is_active', true)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) {
      return NextResponse.json({ success: false, error: 'Estabelecimento não encontrado.' }, { status: 404 });
    }

    const { error } = await admin.from('reviews').insert({
      id: `review_${crypto.randomUUID()}`,
      business_id: businessId,
      author_name: authorName,
      rating,
      comment,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Avaliação enviada para moderação.' }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API Review Error]', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ success: false, error: 'Não foi possível enviar a avaliação.' }, { status: 500 });
  }
}
