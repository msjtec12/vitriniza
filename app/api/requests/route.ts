import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      owner_name,
      business_name,
      whatsapp,
      email,
      instagram,
      category_name,
      neighborhood_name,
      address,
      interest_type = 'pro',
      message,
    } = body;

    if (!owner_name || !business_name || !whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Nome do responsável, nome do negócio e WhatsApp são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanReq = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      owner_name: String(owner_name).trim(),
      business_name: String(business_name).trim(),
      whatsapp: String(whatsapp).trim(),
      email: email ? String(email).trim() : undefined,
      instagram: instagram ? String(instagram).trim().replace(/^@/, '') : undefined,
      category_name: category_name ? String(category_name).trim() : 'Comércio Local',
      neighborhood_name: neighborhood_name ? String(neighborhood_name).trim() : 'Guaianases',
      address: address ? String(address).trim() : undefined,
      interest_type: interest_type === 'local_free' ? 'local_free' : 'pro',
      message: message ? String(message).trim() : undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from('business_requests').insert(cleanReq);
      if (error) {
        console.warn('[Supabase Insert Request Warning]', error.message);
      }
    }

    return NextResponse.json({
      success: true,
      request: cleanReq,
      message: 'Recebemos sua solicitação. Entraremos em contato para confirmar as informações.',
    });
  } catch (err: any) {
    console.error('[API Business Request Error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
}
