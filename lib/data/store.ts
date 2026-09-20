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
  BusinessRecommendation,
  BusinessRequest,
  Subscription,
  AuditLog,
  BusinessMember,
  ListingType,
  OwnershipStatus,
  SubscriptionStatus,
} from '@/types';
import {
  mockStates,
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
  mockBusinessRequests,
  mockSubscriptions,
  mockAuditLogs,
  mockBusinessMembers,
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
  ANALYTICS: 'vitriniza_analytics_v1',
  EVENTS: 'vitriniza_events_v1',
  REQUESTS: 'vitriniza_requests_v1',
  SUBSCRIPTIONS: 'vitriniza_subscriptions_v1',
  AUDIT_LOGS: 'vitriniza_audit_logs_v1',
  MEMBERS: 'vitriniza_members_v1',
};

const USE_DEMO_DATA =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true';

// HYBRID STORE WITH INSTANT LOCAL PERSISTENCE + REAL-TIME SUPABASE CLOUD SYNC & REACTION
class VitrinizaStore {
  private businesses: Business[] = USE_DEMO_DATA ? [...mockBusinesses] : [];
  private categories: Category[] = [...mockCategories];
  private cities: City[] = [...mockCities];
  private neighborhoods: Neighborhood[] = [...mockNeighborhoods];
  private products: Product[] = USE_DEMO_DATA ? [...mockProducts] : [];
  private promotions: Promotion[] = USE_DEMO_DATA ? [...mockPromotions] : [];
  private reviews: Review[] = USE_DEMO_DATA ? [
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
  ] : [];
  private claimRequests: ClaimRequest[] = [];
  private businessRequests: BusinessRequest[] = USE_DEMO_DATA ? [...mockBusinessRequests] : [];
  private subscriptions: Subscription[] = USE_DEMO_DATA ? [...mockSubscriptions] : [];
  private auditLogs: AuditLog[] = USE_DEMO_DATA ? [...mockAuditLogs] : [];
  private businessMembers: BusinessMember[] = USE_DEMO_DATA ? [...mockBusinessMembers] : [];
  private banners: Banner[] = USE_DEMO_DATA ? [...mockBanners] : [];
  private articles: Article[] = USE_DEMO_DATA ? [...mockArticles] : [];
  private events: LocalEvent[] = USE_DEMO_DATA ? [...mockEvents] : [];
  private settings: PlatformSettings = { ...mockPlatformSettings };
  private analyticsEvents: AnalyticsEvent[] = [];
  private isHydrated: boolean = false;
  private isCloudSynced: boolean = false;
  private syncPromise: Promise<void> | null = null;
  private realtimeSubscribed: boolean = false;

  // EVENT LISTENERS FOR REACT REACTIVITY
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.attachRelationships();
    if (this.isBrowser()) {
      window.addEventListener('storage', (event) => {
        if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
          this.loadFromStorage();
          this.attachRelationships();
          this.notifyListeners();
        }
      });
      this.ensureCloudSynced();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('[VitrinizaStore Listener Error]', err);
      }
    });
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  public async ensureCloudSynced(forceRefresh = false): Promise<void> {
    if (!supabase) return;
    if (forceRefresh || !this.isCloudSynced) {
      if (!this.syncPromise || forceRefresh) {
        this.syncPromise = this.initCloudSync(forceRefresh);
      }
      await this.syncPromise;
    }
  }

  // --- CLOUD SYNC WITH SUPABASE ---
  public async initCloudSync(forceRefresh = false) {
    if (!supabase) return;
    if (this.isCloudSynced && !forceRefresh) return;

    try {
      // 1. Fetch Cloud Settings
      const { data: cloudSettings } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();

      if (cloudSettings) {
        this.settings = {
          ...this.settings,
          platform_name: cloudSettings.platform_name || this.settings.platform_name,
          contact_whatsapp: cloudSettings.contact_whatsapp || this.settings.contact_whatsapp,
          logo_url: cloudSettings.logo_url || this.settings.logo_url,
          hero_bg_url: cloudSettings.hero_bg_url || this.settings.hero_bg_url,
          hero_title: cloudSettings.hero_title || this.settings.hero_title,
          hero_subtitle: cloudSettings.hero_subtitle || this.settings.hero_subtitle,
          plan_prices: {
            semanal: Number(cloudSettings.plan_semanal_price) || 19.90,
            mensal: Number(cloudSettings.plan_mensal_price) || 49.90,
            destaque: Number(cloudSettings.plan_semanal_price) || 19.90,
            pro: Number(cloudSettings.plan_mensal_price) || 49.90,
            premium: Number(cloudSettings.plan_mensal_price) || 49.90,
          },
        };
      }

      // 2. Fetch public reference data from the database.
      const [categoriesResult, citiesResult, neighborhoodsResult] = await Promise.all([
        supabase.from('categories').select('*').eq('active', true).order('order_index'),
        supabase.from('cities').select('*').eq('active', true),
        supabase.from('neighborhoods').select('*').eq('active', true).order('order_index'),
      ]);

      if (!categoriesResult.error && categoriesResult.data) {
        this.categories = categoriesResult.data as Category[];
      }
      if (!citiesResult.error && citiesResult.data) {
        this.cities = citiesResult.data as City[];
      }
      if (!neighborhoodsResult.error && neighborhoodsResult.data) {
        this.neighborhoods = neighborhoodsResult.data as Neighborhood[];
      }

      // 3. Fetch Cloud Businesses
      const { data: cloudBusinesses, error: errBiz } = await supabase
        .from('businesses')
        .select('*');

      if (!errBiz && Array.isArray(cloudBusinesses) && cloudBusinesses.length > 0) {
        if (!USE_DEMO_DATA) {
          this.businesses = cloudBusinesses as Business[];
        } else {
          const cloudMap = new Map(cloudBusinesses.map((b) => [b.id, b]));

          this.businesses = this.businesses.map((localBiz) => {
            const cloudBiz = cloudMap.get(localBiz.id);
            if (cloudBiz) {
              return {
                ...localBiz,
                ...cloudBiz,
                category: localBiz.category,
                neighborhood: localBiz.neighborhood,
                city: localBiz.city,
              };
            }
            return localBiz;
          });

          const localIds = new Set(this.businesses.map((b) => b.id));
          for (const cloudBiz of cloudBusinesses) {
            if (!localIds.has(cloudBiz.id)) {
              this.businesses.push(cloudBiz as Business);
            }
          }
        }
      } else if (!errBiz && !USE_DEMO_DATA) {
        this.businesses = [];
      }

      // 3. Fetch Cloud Products
      const { data: cloudProducts, error: errProd } = await supabase
        .from('products')
        .select('*');
      if (!errProd && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        if (!USE_DEMO_DATA) {
          this.products = cloudProducts as Product[];
        } else {
          const cloudProdMap = new Map(cloudProducts.map((p) => [p.id, p]));
          this.products = this.products.map((localProd) => {
            const cloudProd = cloudProdMap.get(localProd.id);
            return cloudProd ? { ...localProd, ...cloudProd } : localProd;
          });
          const localProdIds = new Set(this.products.map((p) => p.id));
          for (const cloudProd of cloudProducts) {
            if (!localProdIds.has(cloudProd.id)) {
              this.products.push(cloudProd as Product);
            }
          }
        }
      } else if (!errProd && !USE_DEMO_DATA) {
        this.products = [];
      }

      // 4. Fetch Cloud Promotions
      const { data: cloudPromos, error: errPromo } = await supabase
        .from('promotions')
        .select('*');
      if (!errPromo && Array.isArray(cloudPromos) && cloudPromos.length > 0) {
        if (!USE_DEMO_DATA) {
          this.promotions = cloudPromos as Promotion[];
        } else {
          const cloudPromoMap = new Map(cloudPromos.map((p) => [p.id, p]));
          this.promotions = this.promotions.map((localPromo) => {
            const cloudPromo = cloudPromoMap.get(localPromo.id);
            return cloudPromo ? { ...localPromo, ...cloudPromo } : localPromo;
          });
          const localPromoIds = new Set(this.promotions.map((p) => p.id));
          for (const cloudPromo of cloudPromos) {
            if (!localPromoIds.has(cloudPromo.id)) {
              this.promotions.push(cloudPromo as Promotion);
            }
          }
        }
      } else if (!errPromo && !USE_DEMO_DATA) {
        this.promotions = [];
      }

      // 5. Fetch Cloud Claims
      const { data: cloudClaims, error: errClaims } = await supabase
        .from('claim_requests')
        .select('*');
      if (!errClaims && Array.isArray(cloudClaims)) {
        this.claimRequests = cloudClaims as ClaimRequest[];
      }

      // 6. Fetch Cloud Events
      try {
        const { data: cloudEvents, error: errEvents } = await supabase
          .from('events')
          .select('*');
        if (!errEvents && Array.isArray(cloudEvents) && !USE_DEMO_DATA) {
          this.events = cloudEvents as LocalEvent[];
        } else if (!errEvents && Array.isArray(cloudEvents) && cloudEvents.length > 0) {
          const cloudEventMap = new Map(cloudEvents.map((e) => [e.id, e]));
          this.events = this.events.map((localEvt) => {
            const cloudEvt = cloudEventMap.get(localEvt.id);
            return cloudEvt ? { ...localEvt, ...cloudEvt } : localEvt;
          });
          const localEvtIds = new Set(this.events.map((e) => e.id));
          for (const cloudEvt of cloudEvents) {
            if (!localEvtIds.has(cloudEvt.id)) {
              this.events.push(cloudEvt as LocalEvent);
            }
          }
        }
      } catch (evtErr) {
        console.warn('[VitrinizaStore] Events cloud sync warning:', evtErr);
      }

      // RLS returns only the collections the current authenticated user may access.
      const [requestsResult, subscriptionsResult, logsResult, membersResult, analyticsResult, reviewsResult] =
        await Promise.all([
          supabase.from('business_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('business_members').select('*'),
          supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(10_000),
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        ]);

      if (!requestsResult.error && requestsResult.data) {
        this.businessRequests = requestsResult.data as BusinessRequest[];
      }
      if (!subscriptionsResult.error && subscriptionsResult.data) {
        this.subscriptions = subscriptionsResult.data as Subscription[];
      }
      if (!logsResult.error && logsResult.data) {
        this.auditLogs = logsResult.data as AuditLog[];
      }
      if (!membersResult.error && membersResult.data) {
        this.businessMembers = membersResult.data as BusinessMember[];
      }
      if (!analyticsResult.error && analyticsResult.data) {
        this.analyticsEvents = analyticsResult.data as AnalyticsEvent[];
      }
      if (!reviewsResult.error && reviewsResult.data) {
        this.reviews = reviewsResult.data as Review[];
      }

      this.isCloudSynced = true;
      this.attachRelationships();
      this.saveToStorage();
      this.notifyListeners();

      // 6. Setup Supabase Realtime Listener (once)
      if (!this.realtimeSubscribed) {
        this.realtimeSubscribed = true;
        try {
          supabase
            .channel('vitriniza-realtime-db')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public' },
              (payload) => {
                console.log('[VitrinizaStore] Realtime update from Supabase:', payload.table);
                this.initCloudSync(true);
              }
            )
            .subscribe();
        } catch (subErr) {
          console.warn('[Vitriniza Realtime Sub Error]', subErr);
        }
      }
    } catch (err) {
      console.warn('[VitrinizaStore Sync Warning]', err);
    }
  }

  // --- MANUAL / ON-DEMAND FULL CLOUD SEED ---
  public async pushAllToSupabase(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase não está configurado. Verifique as credenciais.' };
    }

    try {
      // 1. Settings
      try {
        await supabase.from('platform_settings').upsert(
          {
            id: 'main',
            platform_name: this.settings.platform_name,
            contact_whatsapp: this.settings.contact_whatsapp,
            plan_semanal_price: this.settings.plan_prices.semanal,
            plan_mensal_price: this.settings.plan_prices.mensal,
            logo_url: this.settings.logo_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.warn('[Supabase Settings Push Warning]', e);
      }

      // 2. States, Cities, Neighborhoods, Categories
      try {
        const statesClean = mockStates.map((s) => ({ id: s.id, name: s.name, uf: s.uf }));
        await supabase.from('states').upsert(statesClean, { onConflict: 'id' });
      } catch (e) { console.warn('[States Push Warning]', e); }

      try {
        const citiesClean = this.cities.map((c) => ({
          id: c.id,
          state_id: c.state_id,
          name: c.name,
          slug: c.slug,
          active: c.active,
          is_featured: c.is_featured,
          image_url: c.image_url,
          description: c.description,
        }));
        await supabase.from('cities').upsert(citiesClean, { onConflict: 'id' });
      } catch (e) { console.warn('[Cities Push Warning]', e); }

      try {
        const neighsClean = this.neighborhoods.map((n) => ({
          id: n.id,
          city_id: n.city_id || 'city-sp',
          name: n.name,
          slug: n.slug,
          active: n.active,
          is_featured: n.is_featured,
          order_index: n.order_index,
        }));
        await supabase.from('neighborhoods').upsert(neighsClean, { onConflict: 'id' });
      } catch (e) { console.warn('[Neighs Push Warning]', e); }

      try {
        const catsClean = this.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
          image_url: cat.image_url,
          order_index: cat.order_index,
          active: cat.active,
        }));
        await supabase.from('categories').upsert(catsClean, { onConflict: 'id' });
      } catch (e) { console.warn('[Cats Push Warning]', e); }

      // 3. Businesses
      try {
        const bizClean = this.businesses.map(({ category, neighborhood, city, products, promotions, is_online_only, ...rest }) => rest);
        await supabase.from('businesses').upsert(bizClean, { onConflict: 'id' });
      } catch (e) { console.warn('[Businesses Push Warning]', e); }

      this.isCloudSynced = true;
      this.notifyListeners();

      return {
        success: true,
        message: `Sincronização concluída! ${this.businesses.length} empresas e ${this.categories.length} categorias atualizadas na nuvem.`,
      };
    } catch (err: any) {
      console.error('[VitrinizaStore] Error pushing to Supabase:', err);
      return { success: false, message: `Erro ao enviar dados para a nuvem: ${err.message || String(err)}` };
    }
  }

  // --- ASYNC CLOUD DISPATCH HELPERS ---
  private async syncBusinessToCloud(biz: Business): Promise<boolean> {
    if (!supabase) return false;
    try {
      // 1. Ensure Category exists in Supabase categories table first!
      const cat = biz.category || this.categories.find((c) => c.id === biz.category_id);
      if (cat) {
        try {
          await supabase.from('categories').upsert(
            {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              icon: cat.icon,
              description: cat.description,
              image_url: cat.image_url,
              order_index: cat.order_index,
              active: cat.active,
            },
            { onConflict: 'id' }
          );
        } catch (catErr) {
          console.warn('[Supabase Cat Upsert Warning]', catErr);
        }
      }

      // 2. Ensure City and Neighborhood exist in Supabase tables first!
      const city = biz.city || this.cities.find((c) => c.id === biz.city_id);
      if (city) {
        try {
          await supabase.from('cities').upsert(
            {
              id: city.id,
              state_id: city.state_id || biz.state_id || 'SP',
              name: city.name,
              slug: city.slug,
              active: city.active ?? true,
            },
            { onConflict: 'id' }
          );
        } catch (cityErr) {
          console.warn('[Supabase City Upsert Warning]', cityErr);
        }
      }

      const neigh = biz.neighborhood || this.neighborhoods.find((n) => n.id === biz.neighborhood_id);
      if (neigh) {
        try {
          await supabase.from('neighborhoods').upsert(
            {
              id: neigh.id,
              city_id: neigh.city_id || city?.id || 'city-sp',
              name: neigh.name,
              slug: neigh.slug,
              active: neigh.active,
              is_featured: neigh.is_featured,
              order_index: neigh.order_index,
            },
            { onConflict: 'id' }
          );
        } catch (neighErr) {
          console.warn('[Supabase Neigh Upsert Warning]', neighErr);
        }
      }

      const { category, neighborhood, city: _c, products, promotions, is_online_only, ...clean } = biz;
      const cleanBiz = {
        ...clean,
        category_id: clean.category_id || 'cat-alimentacao',
        neighborhood_id: clean.neighborhood_id || neigh?.id || 'neigh-centro',
        city_id: clean.city_id || city?.id || 'city-sp',
        state_id: clean.state_id || city?.state_id || 'SP',
      };

      const { error } = await supabase.from('businesses').upsert(cleanBiz, { onConflict: 'id' });
      if (error) {
        console.warn('[Supabase Biz Sync Error]', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase Biz Sync Failed]', err);
      return false;
    }
  }

  public async persistBusinessToCloud(id: string): Promise<boolean> {
    this.ensureHydrated();
    const business = this.businesses.find((item) => item.id === id);
    if (!business) return false;
    return this.syncBusinessToCloud(business);
  }

  private async syncDeleteBusinessFromCloud(id: string) {
    if (!supabase) return;
    try {
      await supabase.from('businesses').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Delete Biz Error]', err);
    }
  }

  private async syncSettingsToCloud(settings: PlatformSettings) {
    if (!supabase) return;
    try {
      await supabase
        .from('platform_settings')
        .upsert({
          id: 'main',
          platform_name: settings.platform_name,
          contact_whatsapp: settings.contact_whatsapp,
          plan_semanal_price: settings.plan_prices.semanal,
          plan_mensal_price: settings.plan_prices.mensal,
          logo_url: settings.logo_url,
          hero_bg_url: settings.hero_bg_url,
          hero_title: settings.hero_title,
          hero_subtitle: settings.hero_subtitle,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('[Supabase Settings Sync Error]', err);
    }
  }

  private async syncProductToCloud(prod: Product) {
    if (!supabase) return;
    try {
      await supabase.from('products').upsert(prod);
    } catch (err) {
      console.warn('[Supabase Product Sync Error]', err);
    }
  }

  private async syncPromotionToCloud(promo: Promotion) {
    if (!supabase) return;
    try {
      await supabase.from('promotions').upsert(promo);
    } catch (err) {
      console.warn('[Supabase Promotion Sync Error]', err);
    }
  }

  private async syncClaimToCloud(claim: ClaimRequest) {
    if (!supabase) return;
    try {
      await supabase.from('claim_requests').upsert(claim);
    } catch (err) {
      console.warn('[Supabase Claim Sync Error]', err);
    }
  }

  private loadFromStorage() {
    if (!this.isBrowser() || !USE_DEMO_DATA) return;

    try {
      const storedBiz = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
      if (storedBiz !== null) {
        const parsed = JSON.parse(storedBiz);
        if (Array.isArray(parsed)) {
          this.businesses = parsed;
        }
      }

      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProds !== null) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed)) {
          this.products = parsed;
        }
      }

      const storedPromos = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      if (storedPromos !== null) {
        const parsed = JSON.parse(storedPromos);
        if (Array.isArray(parsed)) {
          const fakePromoIds = new Set(['promo-1', 'promo-2', 'promo-3', 'promo-4', 'promo-5', 'promo-6', 'promo-7', 'promo-8', 'promo-9']);
          this.promotions = parsed.filter((p: any) => p && !fakePromoIds.has(p.id));
        }
      } else {
        this.promotions = [];
      }

      const storedClaims = localStorage.getItem(STORAGE_KEYS.CLAIMS);
      if (storedClaims !== null) {
        const parsed = JSON.parse(storedClaims);
        if (Array.isArray(parsed)) {
          this.claimRequests = parsed;
        }
      }

      const storedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (storedReviews !== null) {
        const parsed = JSON.parse(storedReviews);
        if (Array.isArray(parsed)) {
          this.reviews = parsed;
        }
      }

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings !== null) {
        const parsed = JSON.parse(storedSettings);
        if (parsed && typeof parsed === 'object') {
          this.settings = { ...this.settings, ...parsed };
        }
      }

      const storedAnalytics = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (storedAnalytics !== null) {
        const parsed = JSON.parse(storedAnalytics);
        if (Array.isArray(parsed)) {
          this.analyticsEvents = parsed;
        }
      }

      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (storedEvents !== null) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          this.events = parsed;
        }
      }

      const storedRequests = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (storedRequests !== null) {
        const parsed = JSON.parse(storedRequests);
        if (Array.isArray(parsed)) {
          this.businessRequests = parsed;
        }
      }

      const storedSubs = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (storedSubs !== null) {
        const parsed = JSON.parse(storedSubs);
        if (Array.isArray(parsed)) {
          this.subscriptions = parsed;
        }
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (storedLogs !== null) {
        const parsed = JSON.parse(storedLogs);
        if (Array.isArray(parsed)) {
          this.auditLogs = parsed;
        }
      }

      const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (storedMembers !== null) {
        const parsed = JSON.parse(storedMembers);
        if (Array.isArray(parsed)) {
          this.businessMembers = parsed;
        }
      }

      this.isHydrated = true;
    } catch (err) {
      console.warn('[VitrinizaStore] Error loading storage:', err);
    }
  }

  private saveToStorage() {
    if (!this.isBrowser() || !USE_DEMO_DATA) return;

    try {
      const cleanBusinesses = this.businesses.map(({ category, neighborhood, city, products, promotions, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(cleanBusinesses));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(this.promotions));
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(this.claimRequests));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(this.analyticsEvents));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(this.businessRequests));
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(this.subscriptions));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.businessMembers));
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
      
      let neighborhood = this.neighborhoods.find(
        (n) => n.id === biz.neighborhood_id || n.slug === biz.neighborhood_id || n.name.toLowerCase() === biz.neighborhood_id?.toLowerCase()
      );

      if (!neighborhood && biz.neighborhood_id) {
        const cleanName = biz.neighborhood_id.replace(/^neigh-/, '').replace(/-/g, ' ');
        const capName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        neighborhood = {
          id: biz.neighborhood_id,
          city_id: 'city-sp',
          name: capName,
          slug: biz.neighborhood_id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          active: true,
          is_featured: true,
          order_index: 99,
        };
      }

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
    const fakePromoIds = new Set(['promo-1', 'promo-2', 'promo-3', 'promo-4', 'promo-5', 'promo-6', 'promo-7', 'promo-8', 'promo-9']);
    return this.promotions.filter((p) => p.is_active && !fakePromoIds.has(p.id));
  }

  public getCities(): City[] {
    return this.cities.filter((c) => c.active);
  }

  public getNeighborhoods(cityId?: string, includeEmpty: boolean = false): Neighborhood[] {
    this.ensureHydrated();
    let result = this.neighborhoods.filter((n) => n.active);

    if (cityId) {
      result = result.filter((n) => n.city_id === cityId || n.city?.slug === cityId);
    }

    if (!includeEmpty) {
      const activeBizNeighs = new Set<string>();
      this.businesses.forEach((b) => {
        if (b.is_active) {
          if (b.neighborhood_id) activeBizNeighs.add(b.neighborhood_id);
          if (b.neighborhood?.id) activeBizNeighs.add(b.neighborhood.id);
          if (b.neighborhood?.slug) activeBizNeighs.add(b.neighborhood.slug);
          if (b.neighborhood?.name) activeBizNeighs.add(b.neighborhood.name.toLowerCase().trim());
        }
      });
      const filtered = result.filter((n) =>
        activeBizNeighs.has(n.id) ||
        activeBizNeighs.has(n.slug) ||
        activeBizNeighs.has(n.name.toLowerCase().trim())
      );
      if (filtered.length > 0) return filtered;
    }

    return result;
  }

  public ensureLocation(
    bairroName: string,
    cityName: string = 'São Paulo',
    stateUf: string = 'SP'
  ): {
    neighborhood: Neighborhood;
    city: City;
    stateId: string;
  } {
    this.ensureHydrated();

    const cleanUf = (stateUf || 'SP').trim().toUpperCase().slice(0, 2);
    const cleanCityName = (cityName || 'São Paulo').trim();
    const citySlug =
      cleanCityName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'sao-paulo';
    const cityId = `city-${citySlug}`;

    const existingCity = this.cities.find(
      (c) => c.slug === citySlug || c.id === cityId || c.name.toLowerCase().trim() === cleanCityName.toLowerCase()
    );

    const finalCity: City = existingCity || {
      id: cityId,
      state_id: cleanUf,
      name: cleanCityName,
      slug: citySlug,
      active: true,
      is_featured: false,
    };

    if (!existingCity) {
      this.cities.push(finalCity);
      this.saveToStorage();
    }

    const cleanBairroName = (bairroName || 'Centro').trim();
    const neighSlug =
      cleanBairroName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'centro';
    const neighId = `neigh-${neighSlug}`;

    let neighborhood = this.neighborhoods.find(
      (n) =>
        (n.slug === neighSlug || n.id === neighId || n.name.toLowerCase().trim() === cleanBairroName.toLowerCase()) &&
        (n.city_id === finalCity.id || !n.city_id)
    );

    if (!neighborhood) {
      neighborhood = {
        id: neighId,
        city_id: finalCity.id,
        name: cleanBairroName,
        slug: neighSlug,
        active: true,
        is_featured: true,
        order_index: this.neighborhoods.length + 1,
      };
      this.neighborhoods.push(neighborhood);
      this.saveToStorage();
    }

    return {
      neighborhood,
      city: finalCity,
      stateId: cleanUf,
    };
  }

  public ensureNeighborhood(bairroName: string, cityId: string = 'city-sp'): Neighborhood {
    this.ensureHydrated();
    if (!bairroName) return this.neighborhoods[0];

    const cleanName = bairroName.trim();
    const slug = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let found = this.neighborhoods.find(
      (n) => n.slug === slug || n.id === `neigh-${slug}` || n.name.toLowerCase().trim() === cleanName.toLowerCase()
    );

    if (!found) {
      found = {
        id: `neigh-${slug}`,
        city_id: cityId,
        name: cleanName,
        slug,
        active: true,
        is_featured: true,
        order_index: this.neighborhoods.length + 1,
      };
      this.neighborhoods.push(found);
      this.saveToStorage();
    }
    return found;
  }

  public getArticles(): Article[] {
    return this.articles.filter((a) => a.is_published);
  }

  public getArticleBySlug(slug: string): Article | undefined {
    return this.articles.find((a) => a.slug === slug && a.is_published);
  }

  public getAllEvents(): LocalEvent[] {
    this.ensureHydrated();
    return this.events;
  }

  public recommendBusiness(data: Omit<BusinessRecommendation, 'id' | 'created_at' | 'status'>): BusinessRecommendation {
    this.ensureHydrated();
    const rec: BusinessRecommendation = {
      id: `rec-${Date.now()}`,
      business_name: data.business_name,
      category: data.category,
      contact_info: data.contact_info,
      recommended_by: data.recommended_by,
      neighborhood_name: data.neighborhood_name || 'Guaianases',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    let recs: BusinessRecommendation[] = [];
    try {
      recs = JSON.parse(localStorage.getItem('vitriniza_recommendations') || '[]');
    } catch {}
    recs.unshift(rec);
    try {
      localStorage.setItem('vitriniza_recommendations', JSON.stringify(recs));
    } catch {}
    return rec;
  }

  public getRecommendations(): BusinessRecommendation[] {
    this.ensureHydrated();
    try {
      return JSON.parse(localStorage.getItem('vitriniza_recommendations') || '[]');
    } catch {
      return [];
    }
  }

  public getFounderBusinesses(): Business[] {
    this.ensureHydrated();
    return this.businesses.filter((b) => b.is_active && (b.is_founder || b.plan_id === 'mensal' || b.plan_id === 'premium'));
  }

  public getEvents(): LocalEvent[] {
    this.ensureHydrated();
    return this.events.filter((e) => e.is_active);
  }

  public createEvent(data: Partial<LocalEvent>): LocalEvent {
    this.ensureHydrated();
    const slug =
      data.slug ||
      data.title
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') ||
      `evento-${Date.now()}`;

    const newEvt: LocalEvent = {
      id: `evt-${Date.now()}`,
      title: data.title || 'Novo Evento no Bairro',
      slug,
      description: data.description || '',
      location_name: data.location_name || 'Praça Principal',
      address: data.address || '',
      neighborhood_name: data.neighborhood_name || 'Guaianases',
      city_name: data.city_name || 'São Paulo',
      event_date: data.event_date || new Date().toISOString().split('T')[0],
      event_time: data.event_time || '14:00',
      image_url: data.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      whatsapp_contact: data.whatsapp_contact || '',
      organizer_name: data.organizer_name || 'Organização Local',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
    };

    this.events.unshift(newEvt);
    this.saveToStorage();
    this.notifyListeners();
    if (supabase) {
      void supabase.from('events').upsert(newEvt);
    }
    return newEvt;
  }

  public updateEvent(id: string, updates: Partial<LocalEvent>): LocalEvent | undefined {
    this.ensureHydrated();
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;

    this.events[idx] = { ...this.events[idx], ...updates };
    this.saveToStorage();
    this.notifyListeners();
    if (supabase) {
      void supabase.from('events').update(updates).eq('id', id);
    }
    return this.events[idx];
  }

  public deleteEvent(id: string) {
    this.ensureHydrated();
    this.events = this.events.filter((e) => e.id !== id);
    this.saveToStorage();
    this.notifyListeners();
    if (supabase) {
      void supabase.from('events').delete().eq('id', id);
    }
  }

  public toggleEventStatus(id: string): LocalEvent | undefined {
    const evt = this.events.find((e) => e.id === id);
    if (evt) {
      return this.updateEvent(id, { is_active: !evt.is_active });
    }
    return undefined;
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
    this.notifyListeners();
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
      logo_url: data.logo_url || '/logo.png',
      cover_url: data.cover_url || '/logo.png',
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
    this.notifyListeners();
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
    this.notifyListeners();
    this.syncBusinessToCloud(this.businesses[index]);
    return this.businesses[index];
  }

  public deleteBusiness(id: string): boolean {
    this.ensureHydrated();
    const initialLen = this.businesses.length;
    this.businesses = this.businesses.filter((b) => b.id !== id);
    this.attachRelationships();
    this.saveToStorage();
    this.notifyListeners();
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
    this.notifyListeners();
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
    this.notifyListeners();
    this.syncProductToCloud(this.products[index]);
    return this.products[index];
  }

  public deleteProduct(id: string): boolean {
    this.ensureHydrated();
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    this.attachRelationships();
    this.saveToStorage();
    this.notifyListeners();
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
    this.notifyListeners();
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
    this.notifyListeners();
    this.syncPromotionToCloud(this.promotions[index]);
    return this.promotions[index];
  }

  public deletePromotion(id: string): boolean {
    this.ensureHydrated();
    const initialLen = this.promotions.length;
    this.promotions = this.promotions.filter((p) => p.id !== id);
    this.attachRelationships();
    this.saveToStorage();
    this.notifyListeners();
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
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.reviews.unshift(newReview);

    this.saveToStorage();
    this.notifyListeners();
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
    this.notifyListeners();
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
    this.notifyListeners();
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
    this.ensureHydrated();
    const biz = this.getBusinessById(businessId);
    const bizEvents = this.analyticsEvents.filter((e) => e.business_id === businessId);
    const viewsCount = bizEvents.filter((e) => e.event_type === 'business_view').length;
    const whatsappClicks = bizEvents.filter((e) => e.event_type === 'whatsapp_click').length;
    const mapClicks = bizEvents.filter((e) => e.event_type === 'map_click').length;
    const shareClicks = bizEvents.filter((e) => e.event_type === 'share_click').length;
    const offerViews = bizEvents.filter((e) => e.event_type === 'promotion_view').length;

    return {
      productsCount: biz?.products?.length || 0,
      promotionsCount: biz?.promotions?.length || 0,
      viewsCount,
      whatsappClicks,
      mapClicks,
      shareClicks,
      offerViews,
      rating: biz?.rating || 5.0,
      reviewsCount: biz?.reviews_count || 0,
    };
  }

  // --- ANALYTICS & LOGGING ---
  public logAnalyticsEvent(businessId: string, eventType: AnalyticsEvent['event_type'], metadata?: Record<string, unknown>) {
    this.ensureHydrated();
    const newEvt: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      business_id: businessId,
      event_type: eventType,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.analyticsEvents.push(newEvt);
    this.saveToStorage();
    this.notifyListeners();
    if (supabase) {
      supabase.from('analytics_events').upsert(newEvt).then();
    }
  }

  public getMerchantAnalytics(businessId: string): MerchantAnalytics {
    this.ensureHydrated();
    const dailyStats = [];
    const now = new Date();
    const bizEvents = this.analyticsEvents.filter((e) => e.business_id === businessId);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const dayEvts = bizEvents.filter((e) => e.created_at.startsWith(dateKey));
      const views = dayEvts.filter((e) => e.event_type === 'business_view').length;
      const whatsappClicks = dayEvts.filter((e) => e.event_type === 'whatsapp_click').length;
      const phoneClicks = dayEvts.filter((e) => e.event_type === 'phone_click').length;

      dailyStats.push({
        date: dayName,
        views,
        whatsapp_clicks: whatsappClicks,
        phone_clicks: phoneClicks,
      });
    }

    const viewsTotal = bizEvents.filter((e) => e.event_type === 'business_view').length;
    const whatsappClicks = bizEvents.filter((e) => e.event_type === 'whatsapp_click').length;
    const phoneClicks = bizEvents.filter((e) => e.event_type === 'phone_click').length;

    return {
      business_id: businessId,
      views_total: viewsTotal,
      whatsapp_clicks: whatsappClicks,
      phone_clicks: phoneClicks,
      instagram_clicks: bizEvents.filter((e) => e.event_type === 'instagram_click').length,
      map_clicks: bizEvents.filter((e) => e.event_type === 'map_click').length,
      products_views: bizEvents.filter((e) => e.event_type === 'product_view').length,
      promo_views: bizEvents.filter((e) => e.event_type === 'promotion_view').length,
      daily_stats: dailyStats,
    };
  }

  // --- MASTER DASHBOARD METRICS ---
  public getMasterStats() {
    this.ensureHydrated();
    const total = this.businesses.length;
    const active = this.businesses.filter((b) => b.is_active).length;
    const localFreeCount = this.businesses.filter((b) => b.listing_type === 'local_free' || b.plan_id === 'free').length;
    const proPaidCount = this.businesses.filter((b) => b.listing_type === 'paid' || (b.plan_id !== 'free' && b.listing_type !== 'local_free')).length;

    const proPrice = this.settings.pro_plan?.price || this.settings.plan_prices.pro || 49.90;
    const activeSubs = this.subscriptions.filter((s) => s.status === 'active');
    const estimatedMRR = activeSubs.length * proPrice;

    const totalVisits = this.analyticsEvents.filter((e) => e.event_type === 'business_view').length;
    const totalWhatsappClicks = this.analyticsEvents.filter((e) => e.event_type === 'whatsapp_click').length;

    return {
      totalBusinesses: total,
      activeBusinesses: active,
      localFreeCount,
      proPaidCount,
      freeCount: localFreeCount,
      paidCount: proPaidCount,
      estimatedMRR: Number(estimatedMRR.toFixed(2)),
      totalVisits,
      totalWhatsappClicks,
      pendingRequests: this.businessRequests.filter((r) => r.status === 'pending').length,
      pendingClaims: this.claimRequests.filter((c) => c.status === 'pending').length,
      citiesCount: this.cities.length,
      neighborhoodsCount: this.neighborhoods.length,
      categoriesCount: this.categories.length,
      promotionsCount: this.promotions.length,
      activeSubscriptions: activeSubs.length,
    };
  }

  // ==============================================================================
  // --- SAAS MODEL MANAGEMENT: REQUESTS, CONVERSIONS, SUBSCRIPTIONS, AUDIT ---
  // ==============================================================================

  public getBusinessRequests(filterStatus?: string, filterType?: string): BusinessRequest[] {
    this.ensureHydrated();
    return this.businessRequests.filter((req) => {
      if (filterStatus && filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterType && filterType !== 'all' && req.interest_type !== filterType) return false;
      return true;
    });
  }

  public async addBusinessRequest(data: Omit<BusinessRequest, 'id' | 'created_at' | 'status'>): Promise<BusinessRequest> {
    this.ensureHydrated();
    const newReq: BusinessRequest = {
      ...data,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.businessRequests.unshift(newReq);
    this.saveToStorage();
    this.notifyListeners();

    if (supabase) {
      try {
        await supabase.from('business_requests').upsert(newReq);
      } catch (err) {
        console.warn('[Supabase Insert Business Request Error]', err);
      }
    }

    return newReq;
  }

  public async updateBusinessRequestStatus(id: string, status: BusinessRequest['status'], adminNotes?: string): Promise<boolean> {
    this.ensureHydrated();
    const index = this.businessRequests.findIndex((r) => r.id === id);
    if (index === -1) return false;

    this.businessRequests[index] = {
      ...this.businessRequests[index],
      status,
      admin_notes: adminNotes || this.businessRequests[index].admin_notes,
      reviewed_at: new Date().toISOString(),
    };

    this.saveToStorage();
    this.notifyListeners();

    if (supabase) {
      try {
        await supabase.from('business_requests').update({
          status,
          admin_notes: this.businessRequests[index].admin_notes,
          reviewed_at: this.businessRequests[index].reviewed_at,
        }).eq('id', id);
      } catch (err) {
        console.warn('[Supabase Update Business Request Error]', err);
      }
    }

    return true;
  }

  /**
   * FLUXO DO CADASTRO LOCAL:
   * Cria ou ativa negócio com listing_type = 'local_free', sem criar usuário e sem painel.
   */
  public async approveLocalFreeRequest(requestId: string, adminUserId = 'master_admin'): Promise<{ success: boolean; business?: Business; error?: string }> {
    this.ensureHydrated();
    const request = this.businessRequests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Solicitação não encontrada.' };

    const matchingCategory = this.categories.find(
      (c) => c.name.toLowerCase() === request.category_name?.toLowerCase()
    ) || this.categories[0];

    const matchingNeighborhood = this.neighborhoods.find(
      (n) => n.name.toLowerCase() === request.neighborhood_name?.toLowerCase()
    ) || this.neighborhoods[0];

    const slug = request.business_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newBusiness: Business = {
      id: `biz-${Date.now()}`,
      name: request.business_name,
      slug: slug || `comercio-${Date.now()}`,
      description: request.message || `${request.business_name} em ${matchingNeighborhood.name}. Entre em contato direto pelo WhatsApp.`,
      short_description: `${matchingCategory.name} em ${matchingNeighborhood.name}`,
      category_id: matchingCategory.id,
      category: matchingCategory,
      neighborhood_id: matchingNeighborhood.id,
      neighborhood: matchingNeighborhood,
      city_id: matchingNeighborhood.city_id || 'city-sp',
      state_id: 'SP',
      address: request.address || 'Guaianases',
      number: 'S/N',
      postal_code: '08410-000',
      latitude: -23.5424,
      longitude: -46.4178,
      phone: request.whatsapp,
      whatsapp: request.whatsapp,
      instagram: request.instagram,
      logo_url: '/logo.png',
      cover_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      listing_type: 'local_free',
      ownership_status: 'unclaimed',
      owner_user_id: null,
      plan_id: 'free',
      plan_status: 'active',
      is_featured: false,
      is_verified: true,
      is_founder: false,
      is_active: true,
      payment_methods: ['Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito'],
      delivery_available: false,
      takeaway_available: true,
      dine_in_available: false,
      rating: 5.0,
      reviews_count: 0,
      products: [],
      promotions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.businesses.unshift(newBusiness);
    await this.updateBusinessRequestStatus(requestId, 'approved', 'Cadastro Local Gratuito aprovado e publicado.');
    this.logAudit('business_created', newBusiness.id, newBusiness.name, { listing_type: 'local_free', requestId }, adminUserId);

    this.saveToStorage();
    this.notifyListeners();
    this.syncBusinessToCloud(newBusiness);

    return { success: true, business: newBusiness };
  }

  public getSubscriptions(): Subscription[] {
    this.ensureHydrated();
    return this.subscriptions;
  }

  public getSubscription(businessId: string): Subscription | undefined {
    this.ensureHydrated();
    return this.subscriptions.find((s) => s.business_id === businessId);
  }

  public async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    adminUserId = 'master_admin'
  ): Promise<boolean> {
    this.ensureHydrated();
    const index = this.subscriptions.findIndex((s) => s.id === subscriptionId);
    if (index === -1) return false;

    this.subscriptions[index] = {
      ...this.subscriptions[index],
      status,
      updated_at: new Date().toISOString(),
      payment_confirmed_at: status === 'active' ? new Date().toISOString() : this.subscriptions[index].payment_confirmed_at,
    };

    const bizId = this.subscriptions[index].business_id;
    this.updateBusiness(bizId, {
      subscription_status: status,
      plan_status: status === 'active' ? 'active' : 'suspended',
    });

    this.logAudit(
      status === 'active' ? 'payment_confirmed' : 'subscription_expired',
      bizId,
      undefined,
      { subscriptionId, status },
      adminUserId
    );

    this.saveToStorage();
    this.notifyListeners();

    if (supabase) {
      try {
        await supabase.from('subscriptions').update({
          status,
          updated_at: new Date().toISOString(),
          payment_confirmed_at: this.subscriptions[index].payment_confirmed_at,
        }).eq('id', subscriptionId);
      } catch (err) {
        console.warn('[Supabase Update Subscription Error]', err);
      }
    }

    return true;
  }

  public async renewSubscription(
    subscriptionId: string,
    days = 30,
    adminUserId = 'master_admin'
  ): Promise<boolean> {
    this.ensureHydrated();
    const index = this.subscriptions.findIndex((s) => s.id === subscriptionId);
    if (index === -1) return false;

    const currentExpires = new Date(this.subscriptions[index].expires_at || Date.now());
    const baseDate = currentExpires.getTime() > Date.now() ? currentExpires : new Date();
    const newExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    this.subscriptions[index] = {
      ...this.subscriptions[index],
      status: 'active',
      expires_at: newExpiresAt,
      payment_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const bizId = this.subscriptions[index].business_id;
    this.updateBusiness(bizId, {
      subscription_status: 'active',
      plan_status: 'active',
    });

    this.logAudit(
      'subscription_renewed',
      bizId,
      undefined,
      { subscriptionId, renewedDays: days, newExpiresAt },
      adminUserId
    );

    this.saveToStorage();
    this.notifyListeners();

    if (supabase) {
      try {
        await supabase.from('subscriptions').update({
          status: 'active',
          expires_at: newExpiresAt,
          payment_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', subscriptionId);
      } catch (err) {
        console.warn('[Supabase Renew Subscription Error]', err);
      }
    }

    return true;
  }

  public getAuditLogs(): AuditLog[] {
    this.ensureHydrated();
    return this.auditLogs;
  }

  public logAudit(
    action: AuditLog['action'],
    businessId?: string,
    businessName?: string,
    metadata?: Record<string, unknown>,
    adminUserId = 'master_admin'
  ) {
    this.ensureHydrated();
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      admin_user_id: adminUserId,
      business_id: businessId,
      business_name: businessName,
      action,
      metadata,
      created_at: new Date().toISOString(),
    };

    this.auditLogs.unshift(log);
    this.saveToStorage();
    this.notifyListeners();

    if (supabase) {
      supabase.from('audit_logs').insert(log).then();
    }
  }

  /**
   * PITCH COMERCIAL PARA CONVERSÃO EM PRO:
   * Gera o resumo de acessos reais do Cadastro Local para prospecção via WhatsApp.
   */
  public getProPitchSummary(businessId: string) {
    this.ensureHydrated();
    const biz = this.getBusinessById(businessId);
    const bizEvents = this.analyticsEvents.filter((e) => e.business_id === businessId);
    const viewsCount = bizEvents.filter((e) => e.event_type === 'business_view').length;
    const whatsappClicks = bizEvents.filter((e) => e.event_type === 'whatsapp_click').length;
    const mapClicks = bizEvents.filter((e) => e.event_type === 'map_click').length;
    const shareClicks = bizEvents.filter((e) => e.event_type === 'share_click').length;

    const pitchText =
      `Olá, tudo bem? Aqui é da equipe Vitriniza Guaianases!\n\n` +
      `Sua empresa *${biz?.name || 'seu comércio'}* já está cadastrada no nosso portal e tem chamado a atenção dos moradores.\n\n` +
      `📊 *Desempenho nos últimos 30 dias:*\n` +
      `• *${viewsCount}* visualizações da sua vitrine\n` +
      `• *${whatsappClicks}* clientes clicaram para falar no seu WhatsApp\n` +
      `• *${mapClicks}* pedidos de rota para o seu endereço\n\n` +
      `Com o *Vitriniza Pro*, você libera o painel próprio para adicionar seu catálogo completo, publicar promoções e receber o display de acrílico com QR Code para o seu balcão.\n\n` +
      `Gostaria de ativar sua Vitrine Pro hoje?`;

    return {
      viewsCount,
      whatsappClicks,
      mapClicks,
      shareClicks,
      pitchText,
    };
  }

  /**
   * VALIDAÇÃO DE ACESSO AO PAINEL DO LOJISTA:
   */
  public canAccessMerchantPanel(businessId: string): {
    allowed: boolean;
    isExpired?: boolean;
    isLocalFree?: boolean;
    message?: string;
  } {
    this.ensureHydrated();
    const biz = this.getBusinessById(businessId);
    if (!biz) return { allowed: false, message: 'Estabelecimento não encontrado.' };

    if (biz.listing_type === 'local_free' || (biz.plan_id === 'free' && biz.listing_type !== 'paid')) {
      return {
        allowed: false,
        isLocalFree: true,
        message: 'Este comércio é um Cadastro Local Gratuito e não possui acesso ao painel de lojista.',
      };
    }

    const sub = this.getSubscription(businessId);
    if (sub && sub.status === 'expired') {
      return {
        allowed: true,
        isExpired: true,
        message: 'Seu Plano Vitriniza Pro está vencido. Renove para continuar administrando sua vitrine.',
      };
    }

    return { allowed: true };
  }
}

// Global singleton instance
export const store = new VitrinizaStore();
