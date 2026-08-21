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
  PlanTier,
  PlanLimits,
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
import { supabase } from '@/lib/supabase/client';

// STORAGE KEYS FOR PERSISTENCE
const STORAGE_KEYS = {
  BUSINESSES: 'vitriniza_businesses_v1',
  PRODUCTS: 'vitriniza_products_v1',
  PROMOTIONS: 'vitriniza_promotions_v1',
  REVIEWS: 'vitriniza_reviews_v1',
  CLAIMS: 'vitriniza_claims_v1',
  SETTINGS: 'vitriniza_settings_v1',
};

// HYBRID STORE WITH INSTANT LOCAL PERSISTENCE + REAL-TIME SUPABASE CLOUD SYNC
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
    {
      id: 'rev-16-1',
      business_id: 'biz-16',
      author_name: 'Marcelo Pires',
      rating: 5,
      comment: 'O Carlos foi impecável na locação do meu salão comercial. Negociação transparente, rápida e sem burocracia desnecessária!',
      status: 'approved',
      created_at: '2026-02-14T11:00:00Z',
    },
    {
      id: 'rev-17-1',
      business_id: 'biz-17',
      author_name: 'Julio Cesar Martins',
      rating: 5,
      comment: 'A Juliana encontrou um plano de saúde pelo meu MEI que reduziu minha mensalidade em mais de 35% com atendimento nos melhores hospitais.',
      status: 'approved',
      created_at: '2026-02-15T14:30:00Z',
    },
    {
      id: 'rev-18-1',
      business_id: 'biz-18',
      author_name: 'Renata Guimarães',
      rating: 5,
      comment: 'Chamei o Marcos numa emergência de curto-circuito em pleno sábado à noite. Chegou em 25 minutos e resolveu tudo com total segurança.',
      status: 'approved',
      created_at: '2026-02-16T22:15:00Z',
    },
    {
      id: 'rev-19-1',
      business_id: 'biz-19',
      author_name: 'Luciana Mello',
      rating: 5,
      comment: 'A equipe da Dona Maria fez a faxina pós-obra do meu apartamento e deixou impecável, brilhando e cheiroso. Super recomendo!',
      status: 'approved',
      created_at: '2026-02-17T17:00:00Z',
    },
  ];
  private claimRequests: ClaimRequest[] = [];
  private banners: Banner[] = [...mockBanners];
  private articles: Article[] = [...mockArticles];
  private events: LocalEvent[] = [...mockEvents];
  private settings: PlatformSettings = { ...mockPlatformSettings };
  private analyticsEvents: AnalyticsEvent[] = [];
  private isHydrated: boolean = false;
  private isCloudSynced: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.attachRelationships();
    if (this.isBrowser()) {
      this.initCloudSync();
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // --- CLOUD SYNC WITH SUPABASE ---
  public async initCloudSync() {
    if (!supabase || this.isCloudSynced) return;

    try {
      // 1. Fetch Cloud Settings
      const { data: cloudSettings, error: errSettings } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'main')
        .single();

      if (!errSettings && cloudSettings) {
        this.settings = {
          ...this.settings,
          platform_name: cloudSettings.platform_name || this.settings.platform_name,
          contact_whatsapp: cloudSettings.contact_whatsapp || this.settings.contact_whatsapp,
          plan_prices: {
            semanal: Number(cloudSettings.plan_semanal_price) || 19.90,
            mensal: Number(cloudSettings.plan_mensal_price) || 49.90,
            destaque: Number(cloudSettings.plan_semanal_price) || 19.90,
            pro: Number(cloudSettings.plan_mensal_price) || 49.90,
            premium: Number(cloudSettings.plan_mensal_price) || 49.90,
          },
        };
      }

      // 2. Fetch Cloud Businesses
      const { data: cloudBusinesses, error: errBiz } = await supabase
        .from('businesses')
        .select('*');

      if (!errBiz && Array.isArray(cloudBusinesses) && cloudBusinesses.length > 0) {
        const cloudMap = new Map(cloudBusinesses.map((b: any) => [b.id, b]));
        const merged = this.businesses.map((local) => {
          if (cloudMap.has(local.id)) {
            const cloudItem = cloudMap.get(local.id);
            cloudMap.delete(local.id);
            return { ...local, ...cloudItem };
          }
          return local;
        });
        // Add new businesses from cloud that were created on other devices
        cloudMap.forEach((cloudItem) => {
          merged.unshift(cloudItem as Business);
        });

        this.businesses = merged;
      }

      // 3. Fetch Cloud Products
      const { data: cloudProducts, error: errProd } = await supabase
        .from('products')
        .select('*');

      if (!errProd && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        const prodMap = new Map(cloudProducts.map((p: any) => [p.id, p]));
        const mergedProds = this.products.map((local) => {
          if (prodMap.has(local.id)) {
            const p = prodMap.get(local.id);
            prodMap.delete(local.id);
            return { ...local, ...p };
          }
          return local;
        });
        prodMap.forEach((p) => mergedProds.push(p as Product));
        this.products = mergedProds;
      }

      // 4. Fetch Cloud Promotions
      const { data: cloudPromos, error: errPromo } = await supabase
        .from('promotions')
        .select('*');

      if (!errPromo && Array.isArray(cloudPromos) && cloudPromos.length > 0) {
        const promoMap = new Map(cloudPromos.map((pr: any) => [pr.id, pr]));
        const mergedPromos = this.promotions.map((local) => {
          if (promoMap.has(local.id)) {
            const pr = promoMap.get(local.id);
            promoMap.delete(local.id);
            return { ...local, ...pr };
          }
          return local;
        });
        promoMap.forEach((pr) => mergedPromos.push(pr as Promotion));
        this.promotions = mergedPromos;
      }

      // 5. Fetch Cloud Claims
      const { data: cloudClaims, error: errClaims } = await supabase
        .from('claim_requests')
        .select('*');

      if (!errClaims && Array.isArray(cloudClaims) && cloudClaims.length > 0) {
        this.claimRequests = cloudClaims as ClaimRequest[];
      }

      this.isCloudSynced = true;
      this.attachRelationships();
      this.saveToStorage();
    } catch (err) {
      console.warn('[VitrinizaStore] Supabase sync completed with local cache.');
    }
  }

  // --- ASYNC CLOUD DISPATCH HELPERS ---
  private syncBusinessToCloud(biz: Business) {
    if (!supabase) return;
    try {
      const { category, neighborhood, city, products, promotions, ...clean } = biz;
      supabase
        .from('businesses')
        .upsert(clean)
        .then(({ error }) => {
          if (error) console.warn('[Supabase Biz Sync]', error.message);
        });
    } catch {
      // safe failover
    }
  }

  private syncDeleteBusinessFromCloud(id: string) {
    if (!supabase) return;
    try {
      supabase.from('businesses').delete().eq('id', id).then();
    } catch {
      // safe failover
    }
  }

  private syncSettingsToCloud(settings: PlatformSettings) {
    if (!supabase) return;
    try {
      supabase
        .from('platform_settings')
        .upsert({
          id: 'main',
          platform_name: settings.platform_name,
          contact_whatsapp: settings.contact_whatsapp,
          plan_semanal_price: settings.plan_prices.semanal,
          plan_mensal_price: settings.plan_prices.mensal,
          updated_at: new Date().toISOString(),
        })
        .then();
    } catch {
      // safe failover
    }
  }

  private syncProductToCloud(prod: Product) {
    if (!supabase) return;
    try {
      supabase.from('products').upsert(prod).then();
    } catch {
      // safe failover
    }
  }

  private syncPromotionToCloud(promo: Promotion) {
    if (!supabase) return;
    try {
      supabase.from('promotions').upsert(promo).then();
    } catch {
      // safe failover
    }
  }

  private syncClaimToCloud(claim: ClaimRequest) {
    if (!supabase) return;
    try {
      supabase.from('claim_requests').upsert(claim).then();
    } catch {
      // safe failover
    }
  }

  private loadFromStorage() {
    if (!this.isBrowser()) return;

    try {
      const storedBiz = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
      if (storedBiz) {
        const parsed = JSON.parse(storedBiz);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((b: Business) => b.id));
          const missingMocks = mockBusinesses.filter((b) => !storedIds.has(b.id));
          this.businesses = [...parsed, ...missingMocks];
        }
      }

      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((p: Product) => p.id));
          const missingMocks = mockProducts.filter((p) => !storedIds.has(p.id));
          this.products = [...parsed, ...missingMocks];
        }
      }

      const storedPromos = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      if (storedPromos) {
        const parsed = JSON.parse(storedPromos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((pr: Promotion) => pr.id));
          const missingMocks = mockPromotions.filter((pr) => !storedIds.has(pr.id));
          this.promotions = [...parsed, ...missingMocks];
        }
      }

      const storedClaims = localStorage.getItem(STORAGE_KEYS.CLAIMS);
      if (storedClaims) {
        const parsed = JSON.parse(storedClaims);
        if (Array.isArray(parsed)) {
          this.claimRequests = parsed;
        }
      }

      const storedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (storedReviews) {
        const parsed = JSON.parse(storedReviews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((r: Review) => r.id));
          const missingReviews = this.reviews.filter((r) => !storedIds.has(r.id));
          this.reviews = [...parsed, ...missingReviews];
        }
      }

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed && typeof parsed === 'object') {
          this.settings = { ...this.settings, ...parsed };
        }
      }

      this.isHydrated = true;
    } catch (err) {
      console.warn('[VitrinizaStore] Error loading storage:', err);
    }
  }

  private saveToStorage() {
    if (!this.isBrowser()) return;

    try {
      const cleanBusinesses = this.businesses.map(({ category, neighborhood, city, products, promotions, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(cleanBusinesses));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(this.promotions));
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(this.claimRequests));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (err) {
      console.warn('[VitrinizaStore] Error saving storage:', err);
    }
  }

  private ensureHydrated() {
    if (this.isBrowser() && !this.isHydrated) {
      this.loadFromStorage();
      this.attachRelationships();
    }
  }

  private attachRelationships() {
    this.businesses = this.businesses.map((biz) => {
      const category = this.categories.find((c) => c.id === biz.category_id || c.slug === biz.category_id);
      const neighborhood = this.neighborhoods.find((n) => n.id === biz.neighborhood_id || n.slug === biz.neighborhood_id);
      const city = this.cities.find((c) => c.id === biz.city_id || c.slug === biz.city_id);
      const bizProducts = this.products.filter((p) => p.business_id === biz.id);
      const bizPromotions = this.promotions.filter((p) => p.business_id === biz.id);

      return {
        ...biz,
        category: category || this.categories[0],
        neighborhood: neighborhood || this.neighborhoods[0],
        city: city || this.cities[0],
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
    const currentDay = now.getDay();
    const todayHour = hours.find((h) => h.day_of_week === currentDay);

    if (!todayHour || todayHour.is_closed) {
      return { isOpen: false, text: 'Fechado hoje' };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todayHour.open_time.split(':').map(Number);
    const [closeH, closeM] = todayHour.close_time.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    if (closeMinutes < openMinutes) {
      closeMinutes += 24 * 60;
    }

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return { isOpen: true, text: `Aberto até ${todayHour.close_time}`, closeTime: todayHour.close_time };
    }

    if (currentMinutes < openMinutes) {
      return { isOpen: false, text: `Abre às ${todayHour.open_time}` };
    }

    return { isOpen: false, text: 'Fechado agora' };
  }

  // --- QUERY BUSINESSES ---
  public getBusinesses(filters?: SearchFilters): Business[] {
    this.ensureHydrated();
    let result = [...this.businesses];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.short_description?.toLowerCase().includes(q) ||
          b.category?.name.toLowerCase().includes(q) ||
          b.products?.some((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      );
    }

    if (filters.category_id) {
      result = result.filter((b) => b.category_id === filters.category_id || b.category?.slug === filters.category_id);
    }

    if (filters.neighborhood_id) {
      result = result.filter(
        (b) => b.neighborhood_id === filters.neighborhood_id || b.neighborhood?.slug === filters.neighborhood_id
      );
    }

    if (filters.city_id) {
      result = result.filter((b) => b.city_id === filters.city_id || b.city?.slug === filters.city_id);
    }

    if (filters.promotions_only) {
      result = result.filter((b) => (b.promotions?.length || 0) > 0);
    }

    if (filters.featured_only) {
      result = result.filter((b) => b.is_featured || b.plan_id === 'mensal' || b.plan_id === 'pro' || b.plan_id === 'premium');
    }

    if (filters.min_rating) {
      result = result.filter((b) => b.rating >= (filters.min_rating || 0));
    }

    if (filters.open_now) {
      result = result.filter((b) => this.isBusinessOpenNow(b.hours).isOpen);
    }

    if (filters.user_lat && filters.user_lng) {
      result = result.map((b) => {
        const distance = this.calculateDistance(filters.user_lat!, filters.user_lng!, b.latitude, b.longitude);
        return { ...b, distance_km: distance };
      });

      if (filters.max_distance_km) {
        result = result.filter((b) => (b.distance_km || 999) <= (filters.max_distance_km || 10));
      }

      if (filters.sort_by === 'distance') {
        result.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
      }
    }

    if (filters.sort_by === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }

  public getBusinessBySlug(slug: string): Business | undefined {
    this.ensureHydrated();
    return this.businesses.find((b) => b.slug === slug);
  }

  public getBusinessById(id: string): Business | undefined {
    this.ensureHydrated();
    return this.businesses.find((b) => b.id === id);
  }

  public getCategories(): Category[] {
    return this.categories.filter((c) => c.active).sort((a, b) => a.order_index - b.order_index);
  }

  public getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find((c) => c.slug === slug && c.active);
  }

  public getPlanLimits(planTier: PlanTier | string): PlanLimits {
    if (planTier === 'semanal' || planTier === 'destaque') {
      return {
        max_products: 20,
        max_photos: 10,
        can_post_promotions: true,
        has_featured_badge: true,
        analytics_level: 'standard',
      };
    }
    if (planTier === 'mensal' || planTier === 'pro' || planTier === 'premium') {
      return {
        max_products: -1,
        max_photos: 50,
        can_post_promotions: true,
        has_featured_badge: true,
        analytics_level: 'full',
      };
    }
    // free / default
    return {
      max_products: 0,
      max_photos: 3,
      can_post_promotions: false,
      has_featured_badge: false,
      analytics_level: 'basic',
    };
  }

  public getFeaturedBusinesses(): Business[] {
    this.ensureHydrated();
    return this.businesses
      .filter((b) => b.is_active && (b.is_featured || b.plan_id === 'mensal' || b.plan_id === 'pro' || b.plan_id === 'premium'))
      .slice(0, 6);
  }

  public getPromotions(): Promotion[] {
    this.ensureHydrated();
    return this.promotions.filter((p) => p.is_active);
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
    this.ensureHydrated();
    return { ...this.settings };
  }

  public updatePlatformSettings(newSettings: Partial<PlatformSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.syncSettingsToCloud(this.settings);
  }

  // --- CRUD BUSINESSES (Merchant & Master) ---
  public createBusiness(data: Partial<Business>): Business {
    this.ensureHydrated();
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
    this.saveToStorage();
    this.syncBusinessToCloud(newBiz);
    return newBiz;
  }

  public updateBusiness(id: string, updates: Partial<Business>): Business | undefined {
    this.ensureHydrated();
    const index = this.businesses.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    this.businesses[index] = {
      ...this.businesses[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.attachRelationships();
    this.saveToStorage();
    this.syncBusinessToCloud(this.businesses[index]);
    return this.businesses[index];
  }

  public deleteBusiness(id: string): boolean {
    this.ensureHydrated();
    const initialLen = this.businesses.length;
    this.businesses = this.businesses.filter((b) => b.id !== id);
    this.attachRelationships();
    this.saveToStorage();
    this.syncDeleteBusinessFromCloud(id);
    return this.businesses.length < initialLen;
  }

  // --- CRUD PRODUCTS ---
  public createProduct(data: Partial<Product>): Product {
    this.ensureHydrated();
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
    this.saveToStorage();
    this.syncProductToCloud(newProduct);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    this.ensureHydrated();
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.products[index] = { ...this.products[index], ...updates };
    this.attachRelationships();
    this.saveToStorage();
    this.syncProductToCloud(this.products[index]);
    return this.products[index];
  }

  public deleteProduct(id: string): boolean {
    this.ensureHydrated();
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    this.attachRelationships();
    this.saveToStorage();
    if (supabase) {
      supabase.from('products').delete().eq('id', id).then();
    }
    return this.products.length < initialLen;
  }

  // --- CRUD PROMOTIONS ---
  public createPromotion(data: Partial<Promotion>): Promotion {
    this.ensureHydrated();
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
    this.saveToStorage();
    this.syncPromotionToCloud(newPromo);
    return newPromo;
  }

  public updatePromotion(id: string, updates: Partial<Promotion>): Promotion | undefined {
    this.ensureHydrated();
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.promotions[index] = { ...this.promotions[index], ...updates };
    this.attachRelationships();
    this.saveToStorage();
    this.syncPromotionToCloud(this.promotions[index]);
    return this.promotions[index];
  }

  public deletePromotion(id: string): boolean {
    this.ensureHydrated();
    const initialLen = this.promotions.length;
    this.promotions = this.promotions.filter((p) => p.id !== id);
    this.attachRelationships();
    this.saveToStorage();
    if (supabase) {
      supabase.from('promotions').delete().eq('id', id).then();
    }
    return this.promotions.length < initialLen;
  }

  // --- REVIEWS ---
  public getReviews(businessId?: string): Review[] {
    this.ensureHydrated();
    if (businessId) {
      return this.reviews.filter((r) => r.business_id === businessId && r.status === 'approved');
    }
    return this.reviews;
  }

  public submitReview(data: { business_id: string; author_name: string; rating: number; comment: string }): Review {
    this.ensureHydrated();
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

    const bizReviews = this.reviews.filter((r) => r.business_id === data.business_id && r.status === 'approved');
    const avgRating = bizReviews.reduce((acc, r) => acc + r.rating, 0) / bizReviews.length;
    this.updateBusiness(data.business_id, {
      rating: Number(avgRating.toFixed(1)),
      reviews_count: bizReviews.length,
    });

    this.saveToStorage();
    if (supabase) {
      supabase.from('reviews').upsert(newReview).then();
    }
    return newReview;
  }

  // --- CLAIM PROFILE ---
  public submitClaimRequest(data: {
    business_id: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string;
    document?: string;
    proof_notes: string;
  }): ClaimRequest {
    this.ensureHydrated();
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
    this.saveToStorage();
    this.syncClaimToCloud(newClaim);
    return newClaim;
  }

  public createClaimRequest(data: Parameters<VitrinizaStore['submitClaimRequest']>[0]): ClaimRequest {
    return this.submitClaimRequest(data);
  }

  public getClaimRequests(): ClaimRequest[] {
    this.ensureHydrated();
    return this.claimRequests;
  }

  public reviewClaimRequest(id: string, status: 'approved' | 'rejected', adminNotes?: string): ClaimRequest | undefined {
    this.ensureHydrated();
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
      this.updateBusiness(bizId, { is_verified: true, is_active: true });
    }

    this.saveToStorage();
    this.syncClaimToCloud(this.claimRequests[index]);
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
    const biz = this.getBusinessById(businessId);
    return {
      productsCount: biz?.products?.length || 0,
      promotionsCount: biz?.promotions?.length || 0,
      viewsCount: 1240,
      whatsappClicks: 185,
      rating: biz?.rating || 5.0,
      reviewsCount: biz?.reviews_count || 0,
    };
  }

  // --- ANALYTICS & LOGGING ---
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
    const days = 30;
    const dailyStats = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

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
    this.ensureHydrated();
    const total = this.businesses.length;
    const active = this.businesses.filter((b) => b.is_active).length;
    const freeCount = this.businesses.filter((b) => b.plan_id === 'free').length;
    const paidCount = total - freeCount;

    const prices = this.settings.plan_prices;
    let estimatedMRR = 0;
    this.businesses.forEach((b) => {
      if (b.plan_id === 'semanal' || b.plan_id === 'destaque') estimatedMRR += (prices.semanal || 19.90) * 4;
      if (b.plan_id === 'mensal' || b.plan_id === 'pro' || b.plan_id === 'premium') estimatedMRR += (prices.mensal || 49.90);
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
