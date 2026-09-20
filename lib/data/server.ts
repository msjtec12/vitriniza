import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import type { Business, Category, City, Neighborhood, Product, Promotion, Review } from '@/types';

const BUSINESS_PUBLIC_FIELDS = [
  'id', 'name', 'slug', 'description', 'short_description', 'category_id',
  'neighborhood_id', 'city_id', 'state_id', 'address', 'number', 'complement',
  'postal_code', 'latitude', 'longitude', 'phone', 'whatsapp', 'instagram',
  'website', 'logo_url', 'cover_url', 'listing_type', 'plan_id', 'plan_status',
  'is_featured', 'is_verified', 'is_founder', 'is_active', 'payment_methods',
  'delivery_available', 'takeaway_available', 'dine_in_available',
  'is_online_only', 'rating', 'reviews_count', 'hours', 'created_at', 'updated_at',
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
  if (!client) return { businesses: [], neighborhoods: [], categories: [], articles: [], cities: [] };

  const [businesses, neighborhoods, categories, articles] = await Promise.all([
    client.from('businesses').select('slug,state_id,city_id,neighborhood_id,updated_at').eq('is_active', true),
    client.from('neighborhoods').select('id,slug,city_id').eq('active', true),
    client.from('categories').select('slug').eq('active', true),
    client.from('articles').select('slug,created_at').eq('is_published', true),
  ]);

  const cityIds = [...new Set((businesses.data ?? []).map((business) => business.city_id))];
  const { data: cities } = cityIds.length
    ? await client.from('cities').select('id,slug,state_id').in('id', cityIds)
    : { data: [] };

  return {
    businesses: businesses.data ?? [],
    neighborhoods: neighborhoods.data ?? [],
    categories: categories.data ?? [],
    articles: articles.data ?? [],
    cities: cities ?? [],
  };
}
