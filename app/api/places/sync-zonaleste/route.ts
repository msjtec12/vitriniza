import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SAO_PAULO_EXPANDED_PLACES } from '@/lib/data/saopaulo-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Catálogo de Transporte, Parques e Turismo de São Paulo pronto para sincronização.',
    total: SAO_PAULO_EXPANDED_PLACES.length,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Supabase administrativo não configurado.' },
        { status: 503 }
      );
    }

    const formattedPlaces = SAO_PAULO_EXPANDED_PLACES.map((place) => ({
      id: place.id,
      name: place.name,
      slug: place.slug,
      description: place.description,
      short_description: place.short_description,
      category_group: place.category_group,
      subcategory: place.subcategory,
      icon: place.icon,
      address: place.address,
      number: place.number,
      neighborhood_id: place.neighborhood_id,
      neighborhood_name: place.neighborhood_name,
      city_id: place.city_id,
      city_name: place.city_name,
      state_id: place.state_id,
      postal_code: place.postal_code,
      latitude: place.latitude,
      longitude: place.longitude,
      phone: place.phone,
      email: place.email,
      website: place.website,
      instagram: place.instagram,
      opening_hours: place.opening_hours,
      image_url: place.image_url,
      photo_url: place.photo_url || place.image_url,
      cover_url: place.cover_url || place.photo_url || place.image_url,
      source: place.source || 'Dados Públicos Oficiais',
      source_name: place.source_name || place.source || 'Dados Públicos Oficiais',
      source_url: place.source_url,
      tags: place.tags || [],
      verification_status: place.verification_status,
      is_active: place.is_active,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin
      .from('places')
      .upsert(formattedPlaces, { onConflict: 'id' });

    if (error) {
      console.warn('[sync-zonaleste] Supabase upsert error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Não foi possível sincronizar o catálogo.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      database_synced: true,
      total_catalog: formattedPlaces.length,
      message: `Sucesso! ${formattedPlaces.length} locais (Metrô, CPTM, Parques e Turismo de SP) sincronizados no banco Supabase.`,
    });
  } catch (error: unknown) {
    console.error('[sync-zonaleste] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao sincronizar locais',
      },
      { status: 500 }
    );
  }
}
