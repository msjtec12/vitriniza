import {
  Business,
  Category,
  City,
  Neighborhood,
  Product,
  Promotion,
  Review,
  ClaimRequest,
  Banner,
  Article,
  LocalEvent,
  PlatformSettings,
  SearchFilters,
  MerchantAnalytics,
  AnalyticsEvent,
  BusinessHour,
} from '@/types';
import {
  mockBusinesses,
  mockCategories,
  mockCities,
  mockNeighborhoods,
  mockProducts,
  mockPromotions,
  mockArticles,
  mockEvents,
  mockBanners,
  mockPlatformSettings,
  mockPlans,
} from './mockData';

// LOCAL PERSISTENCE / RUNTIME STATE
class VitrinizaStore {
  private businesses: Business[] = [...mockBusinesses];
  private categories: Category[] = [...mockCategories];
  private cities: City[] = [...mockCities];
  private neighborhoods: Neighborhood[] = [...mockNeighborhoods];
  private products: Product[] = [...mockProducts];
  private promotions: Promotion[] = [...mockPromotions];
  private reviews: Review[] = [
    {
      id: 'rev-1',
      business_id: 'biz-1',
      author_name: 'Camila Fernandes',
      rating: 5,
      comment: 'A melhor pizza de Guaianases sem dúvidas! Massa levinha, ingredientes de ótima qualidade e a entrega pelo WhatsApp foi super rápida.',
      status: 'approved',
      created_at: '2026-02-10T19:30:00Z',
    },
    {
      id: 'rev-2',
      business_id: 'biz-1',
      author_name: 'Rodrigo Santos',
      rating: 5,
      comment: 'Atendimento nota 10 no salão. O ambiente é muito familiar e a pizza doce de Nutella com morango é sensacional.',
      status: 'approved',
      created_at: '2026-02-12T21:00:00Z',
    },
    {
      id: 'rev-3',
      business_id: 'biz-2',
      author_name: 'Felipe Alcantara',
      rating: 5,
      comment: 'Barbearia de primeira! Toalha quente e barba alinhada no capricho. Virei cliente fiel.',
      status: 'approved',
      created_at: '2026-02-08T15:20:00Z',
    },
  ];
  private claimRequests: ClaimRequest[] = [];
  private banners: Banner[] = [...mockBanners];
  private articles: Article[] = [...mockArticles];
  private events: LocalEvent[] = [...mockEvents];
  private settings: PlatformSettings = { ...mockPlatformSettings };
  private analyticsEvents: AnalyticsEvent[] = [];

  constructor() {
    this.attachRelationships();
  }

  private attachRelationships() {
    this.businesses = this.businesses.map((biz) => {
      const category = this.categories.find((c) => c.id === biz.category_id);
      const neighborhood = this.neighborhoods.find((n) => n.id === biz.neighborhood_id);
      const city = this.cities.find((c) => c.id === biz.city_id);
      const bizProducts = this.products.filter((p) => p.business_id === biz.id);
      const bizPromotions = this.promotions.filter((p) => p.business_id === biz.id);

      return {
        ...biz,
        category,
        neighborhood,
        city,
        products: bizProducts,
        promotions: bizPromotions,
      };
    });
  }

  // --- DISTANCE & TIME UTILS ---
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  public isBusinessOpenNow(hours?: BusinessHour[]): { isOpen: boolean; text: string; closeTime?: string } {
    if (!hours || hours.length === 0) {
      return { isOpen: true, text: 'Aberto' };
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo ... 6 = Sábado
    const todayHour = hours.find((h) => h.day_of_week === currentDay);

    if (!todayHour || todayHour.is_closed) {
      return { isOpen: false, text: 'Fechado hoje' };
    }

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

    const [openH, openM] = todayHour.open_time.split(':').map(Number);
    const [closeH, closeM] = todayHour.close_time.split(':').map(Number);

    const currentTotalMin = currentHours * 60 + currentMinutes;
    const openTotalMin = openH * 60 + openM;
    let closeTotalMin = closeH * 60 + closeM;

    // Handles cases where closing time is after midnight (e.g. 00:30)
    if (closeTotalMin < openTotalMin) {
      closeTotalMin += 24 * 60;
    }

    if (currentTotalMin >= openTotalMin && currentTotalMin <= closeTotalMin) {
      return { isOpen: true, text: `Aberto até às ${todayHour.close_time}`, closeTime: todayHour.close_time };
    }

    return { isOpen: false, text: `Fechado • Abre às ${todayHour.open_time}` };
  }

  // --- QUERY BUSINESSES ---
  public getBusinesses(filters: SearchFilters = {}): Business[] {
    let result = [...this.businesses].filter((b) => b.is_active);

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.short_description.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.category?.name.toLowerCase().includes(q) ||
          b.products?.some((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      );
    }

    if (filters.category_id) {
      result = result.filter(
        (b) => b.category_id === filters.category_id || b.category?.slug === filters.category_id
      );
    }

    if (filters.neighborhood_id) {
      result = result.filter(
        (b) => b.neighborhood_id === filters.neighborhood_id || b.neighborhood?.slug === filters.neighborhood_id
      );
    }

    if (filters.city_id) {
      result = result.filter((b) => b.city_id === filters.city_id || b.city?.slug === filters.city_id);
    }

    if (filters.min_rating) {
      result = result.filter((b) => b.rating >= (filters.min_rating || 0));
    }

    if (filters.promotions_only) {
      result = result.filter((b) => (b.promotions && b.promotions.length > 0) || this.promotions.some((p) => p.business_id === b.id && p.is_active));
    }

    if (filters.featured_only) {
      result = result.filter((b) => b.is_featured || b.plan_id === 'premium' || b.plan_id === 'pro');
    }

    if (filters.open_now) {
      result = result.filter((b) => this.isBusinessOpenNow(b.hours).isOpen);
    }

    // Distance calculation and filter
    if (filters.user_lat && filters.user_lng) {
      result = result.map((b) => ({
        ...b,
        _distance: this.calculateDistance(filters.user_lat!, filters.user_lng!, b.latitude, b.longitude),
      }));

      if (filters.max_distance_km) {
        result = result.filter((b: any) => b._distance <= filters.max_distance_km!);
      }
    }

    // Sorting
    if (filters.sort_by === 'distance' && filters.user_lat && filters.user_lng) {
      result.sort((a: any, b: any) => (a._distance || 0) - (b._distance || 0));
    } else if (filters.sort_by === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (filters.sort_by === 'visits') {
      result.sort((a, b) => b.reviews_count - a.reviews_count);
    } else if (filters.sort_by === 'recent') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Default: Recommended (Featured first, then plan priority, then rating)
      result.sort((a, b) => {
        const priorityOrder: Record<string, number> = { premium: 4, pro: 3, destaque: 2, free: 1 };
        const scoreA = (priorityOrder[a.plan_id] || 0) * 10 + (a.is_featured ? 5 : 0) + a.rating;
        const scoreB = (priorityOrder[b.plan_id] || 0) * 10 + (b.is_featured ? 5 : 0) + b.rating;
        return scoreB - scoreA;
      });
    }

    return result;
  }

  public getBusinessBySlug(slug: string): Business | undefined {
    const biz = this.businesses.find((b) => b.slug === slug);
    if (!biz) return undefined;

    const category = this.categories.find((c) => c.id === biz.category_id);
    const neighborhood = this.neighborhoods.find((n) => n.id === biz.neighborhood_id);
    const city = this.cities.find((c) => c.id === biz.city_id);
    const bizProducts = this.products.filter((p) => p.business_id === biz.id && p.is_available);
    const bizPromotions = this.promotions.filter((p) => p.business_id === biz.id && p.is_active);

    return {
      ...biz,
      category,
      neighborhood,
      city,
      products: bizProducts,
      promotions: bizPromotions,
    };
  }

  public getBusinessById(id: string): Business | undefined {
    const biz = this.businesses.find((b) => b.id === id);
    if (!biz) return undefined;

    const category = this.categories.find((c) => c.id === biz.category_id);
    const neighborhood = this.neighborhoods.find((n) => n.id === biz.neighborhood_id);
    const city = this.cities.find((c) => c.id === biz.city_id);
    const bizProducts = this.products.filter((p) => p.business_id === biz.id && p.is_available);
    const bizPromotions = this.promotions.filter((p) => p.business_id === biz.id && p.is_active);

    return {
      ...biz,
      category,
      neighborhood,
      city,
      products: bizProducts,
      promotions: bizPromotions,
    };
  }

  public getPlanLimits(planTier: string): {
    max_products: number;
    max_photos: number;
    can_post_promotions: boolean;
    has_featured_badge: boolean;
    analytics_level: 'basic' | 'standard' | 'full' | 'maximum';
  } {
    if (planTier === 'destaque') {
      return {
        max_products: 20,
        max_photos: 10,
        can_post_promotions: false,
        has_featured_badge: true,
        analytics_level: 'standard',
      };
    }
    if (planTier === 'pro') {
      return {
        max_products: -1,
        max_photos: 25,
        can_post_promotions: true,
        has_featured_badge: true,
        analytics_level: 'full',
      };
    }
    if (planTier === 'premium') {
      return {
        max_products: -1,
        max_photos: -1,
        can_post_promotions: true,
        has_featured_badge: true,
        analytics_level: 'maximum',
      };
    }
    return {
      max_products: 5,
      max_photos: 3,
      can_post_promotions: false,
      has_featured_badge: false,
      analytics_level: 'basic',
    };
  }

  public getFeaturedBusinesses(): Business[] {
    return this.businesses
      .filter((b) => b.is_active && (b.is_featured || b.plan_id === 'premium'))
      .slice(0, 6);
  }

  public getPromotions(): Promotion[] {
    return this.promotions.filter((p) => p.is_active);
  }

  public getProducts(businessId?: string): Product[] {
    if (businessId) {
      return this.products.filter((p) => p.business_id === businessId);
    }
    return this.products;
  }

  public getCategories(): Category[] {
    return this.categories.filter((c) => c.active).sort((a, b) => a.order_index - b.order_index);
  }

  public getCities(): City[] {
    return this.cities.filter((c) => c.active);
  }

  public getNeighborhoods(cityId?: string): Neighborhood[] {
    if (cityId) {
      return this.neighborhoods.filter((n) => n.active && (n.city_id === cityId || n.city?.slug === cityId));
    }
    return this.neighborhoods.filter((n) => n.active);
  }

  public getArticles(): Article[] {
    return this.articles.filter((a) => a.is_published);
  }

  public getArticleBySlug(slug: string): Article | undefined {
    return this.articles.find((a) => a.slug === slug && a.is_published);
  }

  public getEvents(): LocalEvent[] {
    return this.events.filter((e) => e.is_active);
  }

  public getBanners(placement: string = 'homepage'): Banner[] {
    return this.banners.filter((b) => b.is_active && (b.placement === placement || b.placement === 'homepage'));
  }

  public getPlatformSettings(): PlatformSettings {
    return { ...this.settings };
  }

  public updatePlatformSettings(newSettings: Partial<PlatformSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // --- CRUD BUSINESSES (Merchant & Master) ---
  public createBusiness(data: Partial<Business>): Business {
    const slug =
      data.slug ||
      data.name
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') ||
      `empresa-${Date.now()}`;

    const newBiz: Business = {
      id: `biz-${Date.now()}`,
      name: data.name || 'Nova Empresa',
      slug,
      description: data.description || '',
      short_description: data.short_description || '',
      category_id: data.category_id || this.categories[0].id,
      neighborhood_id: data.neighborhood_id || this.neighborhoods[0].id,
      city_id: data.city_id || this.cities[0].id,
      state_id: 'SP',
      address: data.address || 'Rua Principal',
      number: data.number || '100',
      complement: data.complement,
      postal_code: data.postal_code || '08400-000',
      latitude: data.latitude || -23.5424,
      longitude: data.longitude || -46.4178,
      phone: data.phone || '(11) 99999-9999',
      whatsapp: data.whatsapp || '11999999999',
      instagram: data.instagram,
      website: data.website,
      logo_url: data.logo_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80',
      cover_url: data.cover_url || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&auto=format&fit=crop&q=80',
      plan_id: data.plan_id || 'free',
      plan_status: data.plan_status || 'active',
      is_featured: data.is_featured || false,
      is_verified: data.is_verified || false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      payment_methods: data.payment_methods || ['Pix', 'Cartão de Crédito', 'Dinheiro'],
      delivery_available: data.delivery_available || false,
      takeaway_available: data.takeaway_available || true,
      dine_in_available: data.dine_in_available || true,
      rating: 5.0,
      reviews_count: 0,
      hours: data.hours || [
        { day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: true },
        { day_of_week: 1, open_time: '09:00', close_time: '19:00', is_closed: false },
        { day_of_week: 2, open_time: '09:00', close_time: '19:00', is_closed: false },
        { day_of_week: 3, open_time: '09:00', close_time: '19:00', is_closed: false },
        { day_of_week: 4, open_time: '09:00', close_time: '19:00', is_closed: false },
        { day_of_week: 5, open_time: '09:00', close_time: '19:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '17:00', is_closed: false },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.businesses.unshift(newBiz);
    this.attachRelationships();
    return newBiz;
  }

  public updateBusiness(id: string, updates: Partial<Business>): Business | undefined {
    const index = this.businesses.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    this.businesses[index] = {
      ...this.businesses[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.attachRelationships();
    return this.businesses[index];
  }

  public deleteBusiness(id: string): boolean {
    const initialLen = this.businesses.length;
    this.businesses = this.businesses.filter((b) => b.id !== id);
    return this.businesses.length < initialLen;
  }

  // --- CRUD PRODUCTS ---
  public createProduct(data: Partial<Product>): Product {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      business_id: data.business_id || 'biz-1',
      name: data.name || 'Novo Produto',
      description: data.description || '',
      price: data.price || 0,
      promo_price: data.promo_price,
      category: data.category || 'Geral',
      image_url: data.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      is_available: data.is_available !== undefined ? data.is_available : true,
      order_index: this.products.length + 1,
      created_at: new Date().toISOString(),
    };

    this.products.push(newProduct);
    this.attachRelationships();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.products[index] = { ...this.products[index], ...updates };
    this.attachRelationships();
    return this.products[index];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    this.attachRelationships();
    return this.products.length < initialLen;
  }

  // --- CRUD PROMOTIONS ---
  public createPromotion(data: Partial<Promotion>): Promotion {
    const biz = this.businesses.find((b) => b.id === data.business_id);
    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      business_id: data.business_id || 'biz-1',
      business_name: biz?.name || 'Comércio Local',
      neighborhood_name: biz?.neighborhood?.name || 'Guaianases',
      whatsapp: biz?.whatsapp || '11999999999',
      title: data.title || 'Oferta Especial',
      description: data.description || '',
      original_price: data.original_price || 0,
      promo_price: data.promo_price || 0,
      image_url: data.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      starts_at: data.starts_at || new Date().toISOString(),
      expires_at: data.expires_at || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      max_quantity: data.max_quantity,
      rules: data.rules || 'Consulte regras pelo WhatsApp',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.promotions.unshift(newPromo);
    this.attachRelationships();
    return newPromo;
  }

  public updatePromotion(id: string, updates: Partial<Promotion>): Promotion | undefined {
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.promotions[index] = { ...this.promotions[index], ...updates };
    this.attachRelationships();
    return this.promotions[index];
  }

  public deletePromotion(id: string): boolean {
    const initialLen = this.promotions.length;
    this.promotions = this.promotions.filter((p) => p.id !== id);
    this.attachRelationships();
    return this.promotions.length < initialLen;
  }

  // --- REVIEWS ---
  public getReviews(businessId?: string): Review[] {
    if (businessId) {
      return this.reviews.filter((r) => r.business_id === businessId && r.status === 'approved');
    }
    return this.reviews;
  }

  public submitReview(data: { business_id: string; author_name: string; rating: number; comment: string }): Review {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      business_id: data.business_id,
      author_name: data.author_name,
      rating: data.rating,
      comment: data.comment,
      status: 'approved',
      created_at: new Date().toISOString(),
    };

    this.reviews.unshift(newReview);

    // Recalculate business rating
    const bizReviews = this.reviews.filter((r) => r.business_id === data.business_id && r.status === 'approved');
    const avgRating = bizReviews.reduce((acc, r) => acc + r.rating, 0) / bizReviews.length;
    this.updateBusiness(data.business_id, {
      rating: Number(avgRating.toFixed(1)),
      reviews_count: bizReviews.length,
    });

    return newReview;
  }

  // --- CLAIM PROFILE (Esta empresa é sua?) ---
  public submitClaimRequest(data: {
    business_id: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string;
    document?: string;
    proof_notes: string;
  }): ClaimRequest {
    const biz = this.businesses.find((b) => b.id === data.business_id);
    const newClaim: ClaimRequest = {
      id: `claim-${Date.now()}`,
      business_id: data.business_id,
      business_name: biz?.name,
      requester_name: data.requester_name,
      requester_email: data.requester_email,
      requester_phone: data.requester_phone,
      document: data.document,
      proof_notes: data.proof_notes,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.claimRequests.unshift(newClaim);
    return newClaim;
  }

  public getClaimRequests(): ClaimRequest[] {
    return this.claimRequests;
  }

  public reviewClaimRequest(id: string, status: 'approved' | 'rejected', adminNotes?: string): ClaimRequest | undefined {
    const index = this.claimRequests.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    this.claimRequests[index] = {
      ...this.claimRequests[index],
      status,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      const bizId = this.claimRequests[index].business_id;
      this.updateBusiness(bizId, { is_verified: true });
    }

    return this.claimRequests[index];
  }

  public resolveClaimRequest(id: string, status: 'approved' | 'rejected', adminNotes?: string): ClaimRequest | undefined {
    return this.reviewClaimRequest(id, status, adminNotes);
  }

  public addProduct(businessId: string, data: Partial<Product>): Product {
    return this.createProduct({ ...data, business_id: businessId });
  }

  public addPromotion(businessId: string, data: Partial<Promotion>): Promotion {
    return this.createPromotion({ ...data, business_id: businessId });
  }

  public getBusinessStats(businessId: string) {
    const analytics = this.getMerchantAnalytics(businessId);
    return {
      views: analytics.views_total,
      whatsappClicks: analytics.whatsapp_clicks,
      phoneClicks: analytics.phone_clicks,
      mapClicks: analytics.map_clicks,
    };
  }

  // --- ANALYTICS TRACKING ---
  public logAnalyticsEvent(businessId: string, eventType: AnalyticsEvent['event_type'], metadata?: Record<string, unknown>) {
    this.analyticsEvents.push({
      id: `evt-${Date.now()}`,
      business_id: businessId,
      event_type: eventType,
      metadata,
      created_at: new Date().toISOString(),
    });
  }

  public getMerchantAnalytics(businessId: string): MerchantAnalytics {
    // Generate realistic analytics chart for 30 days
    const days = 30;
    const dailyStats = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      // Daily simulated traffic
      const baseFactor = Math.sin(i * 0.5) * 10 + 25;
      const views = Math.floor(baseFactor + Math.random() * 15);
      const whatsappClicks = Math.floor(views * 0.22 + Math.random() * 4);
      const phoneClicks = Math.floor(views * 0.08 + Math.random() * 2);

      dailyStats.push({
        date: dateStr,
        views,
        whatsapp_clicks: whatsappClicks,
        phone_clicks: phoneClicks,
      });
    }

    const viewsTotal = dailyStats.reduce((acc, curr) => acc + curr.views, 0);
    const whatsappClicks = dailyStats.reduce((acc, curr) => acc + curr.whatsapp_clicks, 0);
    const phoneClicks = dailyStats.reduce((acc, curr) => acc + curr.phone_clicks, 0);

    return {
      business_id: businessId,
      views_total: viewsTotal,
      whatsapp_clicks: whatsappClicks,
      phone_clicks: phoneClicks,
      instagram_clicks: Math.floor(viewsTotal * 0.15),
      map_clicks: Math.floor(viewsTotal * 0.12),
      products_views: Math.floor(viewsTotal * 0.75),
      promo_views: Math.floor(viewsTotal * 0.65),
      daily_stats: dailyStats,
    };
  }

  // --- MASTER DASHBOARD METRICS ---
  public getMasterStats() {
    const total = this.businesses.length;
    const active = this.businesses.filter((b) => b.is_active).length;
    const freeCount = this.businesses.filter((b) => b.plan_id === 'free').length;
    const paidCount = total - freeCount;

    const prices = this.settings.plan_prices;
    let estimatedMRR = 0;
    this.businesses.forEach((b) => {
      if (b.plan_id === 'destaque') estimatedMRR += prices.destaque;
      if (b.plan_id === 'pro') estimatedMRR += prices.pro;
      if (b.plan_id === 'premium') estimatedMRR += prices.premium;
    });

    return {
      totalBusinesses: total,
      activeBusinesses: active,
      freeCount,
      paidCount,
      estimatedMRR: Number(estimatedMRR.toFixed(2)),
      totalVisits: 14850,
      totalWhatsappClicks: 3240,
      pendingClaims: this.claimRequests.filter((c) => c.status === 'pending').length,
      citiesCount: this.cities.length,
      neighborhoodsCount: this.neighborhoods.length,
      categoriesCount: this.categories.length,
      promotionsCount: this.promotions.length,
    };
  }
}

// Global singleton instance
export const store = new VitrinizaStore();
