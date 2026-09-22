import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SAO_PAULO_EXPANDED_PLACES } from '@/lib/data/saopaulo-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Catálogo de Transporte, Parques e Turismo de São Paulo pronto para sincronização.',
    total: SAO_PAULO_EXPANDED_PLACES.length,
    places: SAO_PAULO_EXPANDED_PLACES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();

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
      website: place.website,
      opening_hours: place.opening_hours,
      image_url: place.image_url,
      source: place.source || 'Dados Públicos Oficiais',
      source_url: place.source_url,
      verification_status: place.verification_status,
      is_active: place.is_active,
      updated_at: new Date().toISOString(),
    }));

    let databaseSynced = false;
    let databaseError = null;

    if (admin) {
      const { error } = await admin
        .from('places')
        .upsert(formattedPlaces, { onConflict: 'id' });

      if (error) {
        databaseError = error.message;
        console.warn('[sync-zonaleste] Supabase upsert error:', error.message);
      } else {
        databaseSynced = true;
      }
    } else {
      console.info('[sync-zonaleste] Supabase Admin not configured. Returning catalog for frontend store synchronization.');
    }

    return NextResponse.json({
      success: true,
      database_synced: databaseSynced,
      database_error: databaseError,
      total_catalog: formattedPlaces.length,
      places: SAO_PAULO_EXPANDED_PLACES,
      message: databaseSynced
        ? `Sucesso! ${formattedPlaces.length} locais (Metrô, CPTM, Parques e Turismo de SP) sincronizados no banco Supabase.`
        : `Catálogo com ${formattedPlaces.length} locais de São Paulo pronto para ser sincronizado no armazenamento local do aplicativo.`,
    });
  } catch (error: any) {
    console.error('[sync-zonaleste] Exception:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sincronizar locais' },
      { status: 500 }
    );
  }
}
