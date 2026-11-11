export type PlanTier = 'free' | 'semanal' | 'mensal' | 'destaque' | 'pro' | 'premium';

export type ListingType = 'local_free' | 'paid';
export type OwnershipStatus = 'unclaimed' | 'claimed';
export type SubscriptionStatus = 'active' | 'pending' | 'overdue' | 'cancelled' | 'expired';
export type BusinessRole = 'owner' | 'manager' | 'editor';

export interface PlanLimits {
  max_products: number; // -1 for unlimited
  max_photos: number;
  can_post_promotions: boolean;
  has_featured_badge: boolean;
  analytics_level?: 'basic' | 'standard' | 'full' | 'maximum';
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  monthly_price: number;
  products_limit: number; // -1 for unlimited
  photos_limit: number;
  has_promotions: boolean;
  analytics_level: 'basic' | 'standard' | 'full' | 'maximum';
  is_featured: boolean;
  homepage_featured: boolean;
  priority_level: number;
  description: string;
  features: string[];
}

export interface State {
  id: string;
  name: string;
  uf: string;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  active: boolean;
  image_url?: string;
  description?: string;
  is_featured: boolean;
  state?: State;
}

export interface Neighborhood {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  active: boolean;
  is_featured: boolean;
  order_index: number;
  city?: City;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Lucide icon name or emoji
  description?: string;
  image_url?: string;
  order_index: number;
  active: boolean;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface BusinessHour {
  day_of_week: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  open_time: string; // "09:00"
  close_time: string; // "19:00"
  is_closed: boolean;
}

export interface BusinessImage {
  id: string;
  business_id: string;
  image_url: string;
  caption?: string;
  image_type: 'gallery' | 'facade' | 'product' | 'team';
  order_index: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  promo_price?: number;
  category?: string;
  image_url: string;
  is_available: boolean;
  order_index: number;
  created_at: string;
}

export interface Promotion {
  id: string;
  business_id: string;
  business_name?: string;
  neighborhood_name?: string;
  whatsapp?: string;
  title: string;
  description: string;
  original_price: number;
  promo_price: number;
  image_url: string;
  starts_at: string;
  expires_at: string;
  max_quantity?: number;
  rules?: string;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  profile_id?: string;
  author_name: string;
  author_avatar?: string;
  rating: number; // 1 to 5
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface BusinessMember {
  id: string;
  user_id: string;
  business_id: string;
  role: BusinessRole;
  user_email?: string;
  user_name?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string;
  payment_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessRequest {
  id: string;
  owner_name: string;
  business_name: string;
  whatsapp: string;
  email?: string;
  instagram?: string;
  category_id?: string;
  category_name?: string;
  neighborhood_id?: string;
  neighborhood_name?: string;
  city_name?: string;
  state_code?: string;
  address?: string;
  interest_type: 'local_free' | 'pro';
  message?: string;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface AuditLog {
  id: string;
  admin_user_id: string;
  business_id?: string;
  business_name?: string;
  action:
    | 'business_created'
    | 'business_updated'
    | 'business_converted_to_pro'
    | 'user_invited'
    | 'owner_changed'
    | 'subscription_created'
    | 'payment_confirmed'
    | 'subscription_expired'
    | 'subscription_renewed'
    | 'business_suspended'
    | 'business_reactivated'
    | 'request_approved'
    | 'request_rejected';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string;
  category?: Category;
  subcategory_id?: string;
  neighborhood_id: string;
  neighborhood?: Neighborhood;
  city_id: string;
  city?: City;
  state_id: string;
  address: string;
  number: string;
  complement?: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string;
  instagram?: string;
  website?: string;
  logo_url: string;
  cover_url: string;
  listing_type?: ListingType; // 'local_free' | 'paid'
  ownership_status?: OwnershipStatus; // 'unclaimed' | 'claimed'
  owner_user_id?: string | null;
  subscription_id?: string;
  subscription_status?: SubscriptionStatus;
  plan_id: PlanTier;
  plan_status: 'active' | 'suspended' | 'canceled' | 'trial';
  plan_starts_at?: string;
  plan_expires_at?: string;
  is_featured: boolean;
  is_verified: boolean;
  is_founder?: boolean;
  founded_at?: string;
  is_active: boolean;
  status?: 'pending' | 'active' | 'paused' | 'rejected' | 'suspended';
  payment_methods: string[];
  delivery_available: boolean;
  takeaway_available: boolean;
  dine_in_available: boolean;
  is_online_only?: boolean;
  rating: number;
  reviews_count: number;
  hours?: BusinessHour[];
  gallery?: BusinessImage[];
  images?: BusinessImage[];
  products?: Product[];
  promotions?: Promotion[];
  distance_km?: number;
  meta_title?: string;
  meta_description?: string;
  visits_count?: number;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessRecommendation {
  id: string;
  business_name: string;
  category?: string;
  contact_info?: string;
  recommended_by?: string;
  neighborhood_name?: string;
  status: 'pending' | 'contacted' | 'approved' | 'dismissed';
  created_at: string;
}

export interface ClaimRequest {
  id: string;
  business_id: string;
  business_name?: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  document?: string;
  proof_notes: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Banner {
  id: string;
  advertiser_name: string;
  image_url: string;
  target_url: string;
  placement: 'homepage' | 'search' | 'category';
  city_id?: string;
  starts_at: string;
  expires_at: string;
  impressions_count: number;
  clicks_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  author_name: string;
  author_avatar?: string;
  neighborhood_name?: string;
  city_name?: string;
  category: string;
  read_time: string;
  is_published: boolean;
  created_at: string;
}

export interface LocalEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  location_name: string;
  address: string;
  neighborhood_name: string;
  city_name: string;
  event_date: string;
  event_time: string;
  image_url: string;
  whatsapp_contact?: string;
  organizer_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  business_id: string;
  event_type:
    | 'business_view'
    | 'product_view'
    | 'promotion_view'
    | 'whatsapp_click'
    | 'phone_click'
    | 'instagram_click'
    | 'map_click'
    | 'share_click'
    | 'favorite'
    | 'search';
  metadata?: Record<string, unknown>;
  ip_hash?: string;
  created_at: string;
}

export interface PlatformSettings {
  plan_prices: {
    semanal: number;
    mensal: number;
    destaque: number;
    pro: number;
    premium: number;
  };
  pro_plan?: {
    name: string;
    price: number;
    interval: string;
    features: string[];
    status: 'active' | 'inactive';
  };
  platform_name: string;
  contact_whatsapp: string;
  contact_email: string;
  default_city_id: string;
  default_neighborhood_id: string;
  logo_url?: string;
  hero_bg_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
}

export interface SearchFilters {
  query?: string;
  category_id?: string;
  neighborhood_id?: string;
  city_id?: string;
  max_distance_km?: number;
  min_rating?: number;
  open_now?: boolean;
  promotions_only?: boolean;
  featured_only?: boolean;
  sort_by?: 'recommended' | 'distance' | 'rating' | 'visits' | 'recent' | 'price_asc' | 'price_desc';
  user_lat?: number;
  user_lng?: number;
  min_price?: number;
  max_price?: number;
  available_only?: boolean;
  brand?: string;
}

export interface MerchantAnalytics {
  business_id: string;
  views_total: number;
  whatsapp_clicks: number;
  phone_clicks: number;
  instagram_clicks: number;
  map_clicks: number;
  products_views: number;
  promo_views: number;
  daily_stats: {
    date: string;
    views: number;
    whatsapp_clicks: number;
    phone_clicks: number;
  }[];
}

// ==========================================
// PONTOS DE INTERESSE & DESCOBERTA LOCAL
// ==========================================

export type PlaceCategoryGroup =
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'esporte'
  | 'turismo'
  | 'religiao'
  | 'transporte'
  | 'servicos_publicos'
  | 'cultura'
  | 'outros';

export type PlaceVerificationStatus =
  | 'verified'              // Verificado pela equipe Vitriniza
  | 'public_info'           // Informação pública catalogada
  | 'community_submitted';  // Enviado pela comunidade / moradores

export interface Place {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  category_group: PlaceCategoryGroup;
  subcategory: string; // Ex: 'UBS', 'Hospital', 'Parque', 'Estação CPTM', 'Delegacia', 'Igreja'
  icon?: string;
  address: string;
  number?: string;
  complement?: string;
  neighborhood_id?: string;
  neighborhood_name?: string;
  neighborhood?: Neighborhood;
  city_id?: string;
  city_name?: string;
  city?: City;
  state_id: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  opening_hours?: string;
  image_url?: string;
  photo_url?: string;
  cover_url?: string;
  source?: string;          // Ex: "Prefeitura Municipal", "Dados Abertos SP"
  source_name?: string;
  source_url?: string;
  verification_status: PlaceVerificationStatus;
  is_active: boolean;
  tags?: string[];
  distance_km?: number;
  created_at: string;
  updated_at?: string;
}

export interface PlaceFilters {
  query?: string;
  category_group?: PlaceCategoryGroup;
  subcategory?: string;
  neighborhood_id?: string;
  city_id?: string;
  user_lat?: number;
  user_lng?: number;
  max_distance_km?: number;
  sort_by?: 'recommended' | 'distance' | 'name';
  active_only?: boolean;
}

export interface UnifiedSearchResult {
  type: 'business' | 'place';
  business?: Business;
  place?: Place;
  distance_km?: number;
}

// ==========================================
// KONNEXY LOCAL INTELLIGENCE MODULE TYPES
// ==========================================

export type GoogleIntegrationProvider =
  | 'google_search_console'
  | 'google_analytics_4'
  | 'google_business_profile'
  | 'google_merchant_center';

export type GoogleIntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending_approval';

export interface GoogleIntegration {
  id: string;
  business_id: string;
  provider: GoogleIntegrationProvider;
  provider_name?: string;
  status: GoogleIntegrationStatus;
  account_id?: string;
  property_id?: string;
  property_name?: string;
  scopes?: string[];
  last_sync_at?: string;
  error_message?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type SeoIssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type SeoIssueCategory = 'technical' | 'nap' | 'content' | 'schema' | 'products' | 'google';

export interface SeoAuditIssue {
  id: string;
  code: string;
  category: SeoIssueCategory;
  severity: SeoIssueSeverity;
  title: string;
  description: string;
  why_it_matters: string;
  recommendation: string;
  auto_fixable: boolean;
  action_label?: string;
  before_value?: string | number | boolean | null;
  after_preview?: string | number | boolean | null;
  status: 'open' | 'resolved' | 'ignored';
}

export interface SeoAudit {
  id: string;
  business_id: string;
  score: number; // 0 - 100
  status: 'pending' | 'running' | 'completed' | 'failed';
  issues: SeoAuditIssue[];
  metrics: {
    meta_title_present: boolean;
    meta_title_length: number;
    meta_description_present: boolean;
    meta_description_length: number;
    h1_count: number;
    canonical_valid: boolean;
    schema_org_valid: boolean;
    nap_consistent: boolean;
    whatsapp_verified: boolean;
    phone_verified: boolean;
    address_complete: boolean;
    hours_complete: boolean;
    photos_count: number;
    products_count: number;
    products_with_price_count: number;
  };
  summary: string;
  created_at: string;
}

export interface SeoOptimization {
  id: string;
  business_id: string;
  issue_code: string;
  action_type: string;
  title: string;
  description?: string;
  changes_summary?: string;
  status: 'applied' | 'reverted' | 'suggested';
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  applied_by?: string;
  applied_at: string;
  reverted_at?: string;
  notes?: string;
}

export interface KeywordOpportunity {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  intent: 'commercial' | 'informational' | 'navigational' | 'transactional';
  opportunity_score: number; // 0 - 100
  suggested_action: string;
}

export interface LocalIntelligenceMetric {
  id: string;
  business_id: string;
  period_date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  average_position: number;
  profile_views: number;
  whatsapp_clicks: number;
  phone_clicks: number;
  route_requests: number;
  product_views: number;
  top_queries?: KeywordOpportunity[];
  top_products?: Array<{
    product_id: string;
    name: string;
    views: number;
    clicks: number;
    conversions: number;
  }>;
  source: 'internal' | 'google_search_console' | 'google_analytics_4' | 'google_business_profile' | 'blended';
  created_at: string;
}

export interface LocalIntelligenceReport {
  id: string;
  business_id: string;
  title: string;
  report_type: 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  period_start: string;
  period_end: string;
  data: {
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    whatsapp_contacts: number;
    phone_calls: number;
    directions_requested: number;
    seo_score: number;
    resolved_issues_count: number;
    highlights: string[];
    recommendations: string[];
  };
  summary: string;
  generated_by?: string;
  created_at: string;
}

export type IntelligenceTabId =
  | 'overview'
  | 'seo_audit'
  | 'visibility'
  | 'keywords'
  | 'products'
  | 'conversions'
  | 'reports'
  | 'integrations'
  | 'history';


