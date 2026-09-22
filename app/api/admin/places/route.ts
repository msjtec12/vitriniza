import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';
import { normalizeExternalUrl } from '@/lib/public-utility.mjs';
import type { Place, PlaceCategoryGroup, PlaceVerificationStatus } from '@/types';

export const dynamic = 'force-dynamic';

const PLACE_CATEGORIES = new Set<PlaceCategoryGroup>([
  'saude',
  'educacao',
  'lazer',
  'esporte',
  'turismo',
  'religiao',
  'transporte',
  'servicos_publicos',
  'cultura',
  'outros',
]);

const VERIFICATION_STATUSES = new Set<PlaceVerificationStatus>([
  'verified',
  'public_info',
  'community_submitted',
]);

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

type PlaceInput = Partial<Place>;

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function finiteCoordinate(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function uniqueSlug(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  requested: string,
  currentId?: string
): Promise<string> {
  const base = slugify(requested) || `local-${Date.now()}`;
  let candidate = base;

  for (let suffix = 1; suffix <= 100; suffix += 1) {
    let query = admin.from('places').select('id').eq('slug', candidate).limit(1);
    if (currentId) query = query.neq('id', currentId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Não foi possível validar a URL pública: ${error.message}`);
    if (!data) return candidate;
    candidate = `${base}-${suffix + 1}`;
  }

  throw new Error('Não foi possível criar uma URL pública única para este local.');
}

async function ensureLocation(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: PlaceInput
) {
  const stateId = cleanText(input.state_id || 'SP', 2).toUpperCase();
  if (!STATE_NAMES[stateId]) throw new Error('Estado inválido.');

  const cityName = cleanText(input.city_name || 'São Paulo', 120);
  const citySlug = slugify(cityName);
  const cityId = cleanText(input.city_id, 128) || `city-${citySlug}`;
  const neighborhoodName = cleanText(input.neighborhood_name || 'Centro', 120);
  const neighborhoodSlug = slugify(neighborhoodName);
  const neighborhoodId = cleanText(input.neighborhood_id, 128) || `neigh-${neighborhoodSlug}`;

  const { error: stateError } = await admin.from('states').upsert(
    { id: stateId, uf: stateId, name: STATE_NAMES[stateId] },
    { onConflict: 'id' }
  );
  if (stateError) throw new Error(`Não foi possível salvar o estado: ${stateError.message}`);

  const { error: cityError } = await admin.from('cities').upsert(
    { id: cityId, state_id: stateId, name: cityName, slug: citySlug, active: true },
    { onConflict: 'id' }
  );
  if (cityError) throw new Error(`Não foi possível salvar a cidade: ${cityError.message}`);

  const { error: neighborhoodError } = await admin.from('neighborhoods').upsert(
    {
      id: neighborhoodId,
      city_id: cityId,
      name: neighborhoodName,
      slug: neighborhoodSlug,
      active: true,
      is_featured: false,
    },
    { onConflict: 'id' }
  );
  if (neighborhoodError) {
    throw new Error(`Não foi possível salvar o bairro: ${neighborhoodError.message}`);
  }

  return { stateId, cityId, cityName, neighborhoodId, neighborhoodName };
}

function sanitizeUrl(value: unknown): string | null {
  return normalizeExternalUrl(cleanText(value, 2_000));
}

async function buildRecord(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: PlaceInput,
  currentId?: string
) {
  const name = cleanText(input.name, 160);
  const address = cleanText(input.address, 250);
  if (!name || !address) throw new Error('Nome do local e endereço são obrigatórios.');

  const category = PLACE_CATEGORIES.has(input.category_group as PlaceCategoryGroup)
    ? (input.category_group as PlaceCategoryGroup)
    : 'outros';
  const verificationStatus = VERIFICATION_STATUSES.has(
    input.verification_status as PlaceVerificationStatus
  )
    ? (input.verification_status as PlaceVerificationStatus)
    : 'public_info';
  const location = await ensureLocation(admin, input);
  const slug = await uniqueSlug(admin, cleanText(input.slug, 140) || name, currentId);
  const photoUrl = sanitizeUrl(input.photo_url || input.cover_url || input.image_url);
  const sourceName = cleanText(input.source_name || input.source, 180) || 'Informação Pública';

  return {
    name,
    slug,
    description: cleanText(input.description, 5_000),
    short_description: cleanText(input.short_description, 320),
    category_group: category,
    subcategory: cleanText(input.subcategory, 160) || 'Ponto de Interesse',
    icon: cleanText(input.icon, 80) || 'MapPin',
    address,
    number: cleanText(input.number, 40) || 'S/N',
    complement: cleanText(input.complement, 160) || null,
    neighborhood_id: location.neighborhoodId,
    neighborhood_name: location.neighborhoodName,
    city_id: location.cityId,
    city_name: location.cityName,
    state_id: location.stateId,
    postal_code: cleanText(input.postal_code, 12) || null,
    latitude: finiteCoordinate(input.latitude, 0),
    longitude: finiteCoordinate(input.longitude, 0),
    phone: cleanText(input.phone, 40) || null,
    email: cleanText(input.email, 180).toLowerCase() || null,
    website: sanitizeUrl(input.website),
    instagram: cleanText(input.instagram, 120) || null,
    opening_hours: cleanText(input.opening_hours, 500) || null,
    image_url: photoUrl,
    photo_url: photoUrl,
    cover_url: photoUrl,
    source: sourceName,
    source_name: sourceName,
    source_url: sanitizeUrl(input.source_url),
    verification_status: verificationStatus,
    is_active: input.is_active !== false,
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => cleanText(tag, 50)).filter(Boolean).slice(0, 20)
      : [],
    updated_at: new Date().toISOString(),
  };
}

async function prepare(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return { response: NextResponse.json({ success: false, error: auth.error }, { status: auth.status }) };

  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`admin-places:${auth.user.id}:${ip}`, 120, 60_000)) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Muitas alterações em sequência. Aguarde um instante.' },
        { status: 429 }
      ),
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Serviço administrativo do Supabase indisponível.' },
        { status: 503 }
      ),
    };
  }

  return { admin };
}

export async function POST(req: NextRequest) {
  const prepared = await prepare(req);
  if ('response' in prepared) return prepared.response;

  try {
    const input = (await req.json()) as PlaceInput;
    const record = await buildRecord(prepared.admin, input);
    const id = `place_${crypto.randomUUID()}`;
    const { data, error } = await prepared.admin
      .from('places')
      .insert({ id, ...record })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, place: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Não foi possível cadastrar o local.';
    console.error('[Admin Places POST]', message);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const prepared = await prepare(req);
  if ('response' in prepared) return prepared.response;

  try {
    const input = (await req.json()) as PlaceInput;
    const id = cleanText(input.id, 128);
    if (!id) throw new Error('Identificador do local ausente.');
    const record = await buildRecord(prepared.admin, input, id);
    const { data, error } = await prepared.admin
      .from('places')
      .update(record)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ success: false, error: 'Local não encontrado.' }, { status: 404 });
    return NextResponse.json({ success: true, place: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Não foi possível atualizar o local.';
    console.error('[Admin Places PATCH]', message);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const prepared = await prepare(req);
  if ('response' in prepared) return prepared.response;

  try {
    const input = (await req.json()) as { id?: string };
    const id = cleanText(input.id, 128);
    if (!id) throw new Error('Identificador do local ausente.');
    const { data, error } = await prepared.admin
      .from('places')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ success: false, error: 'Local não encontrado.' }, { status: 404 });
    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Não foi possível excluir o local.';
    console.error('[Admin Places DELETE]', message);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
