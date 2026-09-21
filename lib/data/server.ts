import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import type { Business, Category, City, Neighborhood, Place, Product, Promotion, Review } from '@/types';
import { mockPlaces, mockNeighborhoods, mockCities } from '@/lib/data/mockData';

const BUSINESS_PUBLIC_FIELDS = [
  'id', 'name', 'slug', 'description', 'short_description', 'category_id',
  'neighborhood_id', 'city_id', 'state_id', 'address', 'number', 'complement',
  'postal_code', 'latitude', 'longitude', 'phone', 'whatsapp', 'instagram',
  'website', 'logo_url', 'cover_url', 'listing_type', 'plan_id', 'plan_status',
  'is_featured', 'is_verified', 'is_founder', 'is_active', 'payment_methods',
  'delivery_available', 'takeaway_available', 'dine_in_available',
  'is_online_only', 'rating', 'reviews_count', 'hours', 'created_at', 'updated_at',
].join(',');

const PLACE_PUBLIC_FIELDS = [
  'id', 'name', 'slug', 'description', 'short_description', 'category_group',
  'subcategory', 'neighborhood_id', 'city_id', 'state_id', 'address', 'number',
  'complement', 'postal_code', 'latitude', 'longitude', 'phone', 'email',
  'website', 'opening_hours', 'photo_url', 'cover_url', 'source_name',
  'source_url', 'verification_status', 'is_active', 'tags', 'created_at', 'updated_at',
].join(',');

const getSupabaseReader = () => {
  const admin = getSupabaseAdmin();
  if (admin) return admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && anonKey) {
    return createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return null;
};

export async function getPublicPlaceBySlug(slug: string): Promise<Place | null> {
  const client = getSupabaseReader();
  if (client) {
    try {
      const { data: place, error } = await client
        .from('places')
        .select(PLACE_PUBLIC_FIELDS)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && place) {
        const publicPlace = place as unknown as Place;
        const [neighborhoodResult, cityResult] = await Promise.all([
          publicPlace.neighborhood_id ? client.from('neighborhoods').select('*').eq('id', publicPlace.neighborhood_id).maybeSingle() : Promise.resolve({ data: null }),
          publicPlace.city_id ? client.from('cities').select('*').eq('id', publicPlace.city_id).maybeSingle() : Promise.resolve({ data: null }),
        ]);

        const fallbackNeigh = mockNeighborhoods.find((n) => n.id === publicPlace.neighborhood_id);
        const fallbackCity = mockCities.find((c) => c.id === publicPlace.city_id);

        return {
          ...publicPlace,
          neighborhood: (neighborhoodResult.data as Neighborhood | null) ?? fallbackNeigh ?? undefined,
          city: (cityResult.data as City | null) ?? fallbackCity ?? undefined,
        };
      }
    } catch {
      // Gracefully fall through to mockPlaces
    }
  }

  const fallback = mockPlaces.find((p) => p.slug === slug && p.is_active);
  if (!fallback) return null;

  const neigh = fallback.neighborhood || mockNeighborhoods.find((n) => n.id === fallback.neighborhood_id);
  const city = fallback.city || mockCities.find((c) => c.id === fallback.city_id);

  return {
    ...fallback,
    neighborhood: neigh,
    city,
  };
}

export async function getPlacesByNeighborhood(neighborhoodId: string): Promise<Place[]> {
  const client = getSupabaseReader();
  if (client) {
    try {
      const { data, error } = await client
        .from('places')
        .select(PLACE_PUBLIC_FIELDS)
        .eq('neighborhood_id', neighborhoodId)
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        return data as unknown as Place[];
      }
    } catch {
      // Fallback
    }
  }

  return mockPlaces.filter((p) => p.neighborhood_id === neighborhoodId && p.is_active);
}

export async function getPublicPlaces(): Promise<Place[]> {
  const client = getSupabaseReader();
  if (client) {
    try {
      const { data, error } = await client
        .from('places')
        .select(PLACE_PUBLIC_FIELDS)
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        return data as unknown as Place[];
      }
    } catch {
      // Fallback
    }
  }

  return mockPlaces.filter((p) => p.is_active);
}

export async function getPublicBusinessBySlug(slug: string): Promise<Business | null> {
  const client = getSupabaseReader();
  if (!client) return null;

  const { data: business, error } = await client
    .from('businesses')
    .select(BUSINESS_PUBLIC_FIELDS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !business) return null;

  const publicBusiness = business as unknown as Business;

  const [categoryResult, neighborhoodResult, cityResult, productsResult, promotionsResult] =
    await Promise.all([
      client.from('categories').select('*').eq('id', publicBusiness.category_id).maybeSingle(),
      client.from('neighborhoods').select('*').eq('id', publicBusiness.neighborhood_id).maybeSingle(),
      client.from('cities').select('*').eq('id', publicBusiness.city_id).maybeSingle(),
      client.from('products').select('*').eq('business_id', publicBusiness.id).eq('is_available', true),
      client
        .from('promotions')
        .select('*')
        .eq('business_id', publicBusiness.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString()),
    ]);

  return {
    ...publicBusiness,
    category: (categoryResult.data as Category | null) ?? undefined,
    neighborhood: (neighborhoodResult.data as Neighborhood | null) ?? undefined,
    city: (cityResult.data as City | null) ?? undefined,
    products: (productsResult.data as Product[] | null) ?? [],
    promotions: (promotionsResult.data as Promotion[] | null) ?? [],
  };
}

export async function getApprovedReviews(businessId: string): Promise<Review[]> {
  const client = getSupabaseReader();
  if (!client) return [];

  const { data, error } = await client
    .from('reviews')
    .select('id,business_id,author_name,rating,comment,status,created_at')
    .eq('business_id', businessId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  return error ? [] : ((data as Review[] | null) ?? []);
}

export async function getSitemapRecords() {
  const client = getSupabaseReader();
  if (!client) {
    return {
      businesses: [],
      neighborhoods: [],
      categories: [],
      articles: [],
      cities: [],
      places: mockPlaces.filter((p) => p.is_active).map((p) => ({ slug: p.slug, updated_at: p.updated_at })),
    };
  }

  const [businesses, neighborhoods, categories, articles, placesResult] = await Promise.all([
    client.from('businesses').select('slug,state_id,city_id,neighborhood_id,updated_at').eq('is_active', true),
    client.from('neighborhoods').select('id,slug,city_id').eq('active', true),
    client.from('categories').select('slug').eq('active', true),
    client.from('articles').select('slug,created_at').eq('is_published', true),
    client
      .from('places')
      .select('slug,updated_at')
      .eq('is_active', true)
      .then(
        (res) => res,
        () => ({ data: null, error: true })
      ),
  ]);

  const cityIds = [...new Set((businesses.data ?? []).map((business) => business.city_id))];
  const { data: cities } = cityIds.length
    ? await client.from('cities').select('id,slug,state_id').in('id', cityIds)
    : { data: [] };

  const places = (placesResult.data && placesResult.data.length > 0)
    ? placesResult.data
    : mockPlaces.filter((p) => p.is_active).map((p) => ({ slug: p.slug, updated_at: p.updated_at }));

  return {
    businesses: businesses.data ?? [],
    neighborhoods: neighborhoods.data ?? [],
    categories: categories.data ?? [],
    articles: articles.data ?? [],
    cities: cities ?? [],
    places,
  };
}
