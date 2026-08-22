'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  MapPin,
  ArrowRight,
  Crosshair,
  Store,
  Calendar,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Promotion, Category, Article, LocalEvent } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { BusinessFeaturedCard } from '@/components/ui/BusinessFeaturedCard';
import { PromotionCard } from '@/components/ui/PromotionCard';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { cn, formatDate } from '@/lib/utils';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);

  // Carousel Refs & States
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const promoScrollRef = useRef<HTMLDivElement>(null);
  const [isPromoHovered, setIsPromoHovered] = useState(false);

  // Mouse Drag states for Categories
  const [isCatDragging, setIsCatDragging] = useState(false);
  const [catStartX, setCatStartX] = useState(0);
  const [catScrollLeft, setCatScrollLeft] = useState(0);

  // Mouse Drag states for Promotions
  const [isPromoDragging, setIsPromoDragging] = useState(false);
  const [promoStartX, setPromoStartX] = useState(0);
  const [promoScrollLeft, setPromoScrollLeft] = useState(0);

  // "Perto de Mim" State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<Business[]>([]);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationStatusText, setLocationStatusText] = useState<string>(
    'Localização padrão: Centro de Guaianases (SP)'
  );

  const [platformSettings, setPlatformSettings] = useState(() => store.getPlatformSettings());

  const refreshPageData = () => {
    setCategories(store.getCategories());
    setFeaturedBusinesses(store.getFeaturedBusinesses());
    setPromotions(store.getPromotions());
    setArticles(store.getArticles().slice(0, 3));
    setEvents(store.getEvents());
    setPlatformSettings(store.getPlatformSettings());

    const defaultLat = -23.5424;
    const defaultLng = -46.4178;
    const lat = userLocation?.lat || defaultLat;
    const lng = userLocation?.lng || defaultLng;

    const nearby = store.getBusinesses({
      user_lat: lat,
      user_lng: lng,
      max_distance_km: radiusKm,
      sort_by: 'distance',
    });
    setNearbyBusinesses(nearby);
  };

  useEffect(() => {
    refreshPageData();
    setUserLocation({ lat: -23.5424, lng: -46.4178 });
    store.ensureCloudSynced().then(() => refreshPageData());
    const unsubscribe = store.subscribe(() => refreshPageData());
    return () => unsubscribe();
  }, []);

  // Subtle and Smooth Automatic Movement (Autoplay) for Promotions Carousel
  useEffect(() => {
    if (promotions.length === 0) return;

    const interval = setInterval(() => {
      if (isPromoHovered || isPromoDragging || !promoScrollRef.current) return;

      const container = promoScrollRef.current;
      const cardWidth = 340; // Card width + gap
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScroll - 30) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 4500); // More gentle, subtle 4.5s pace

    return () => clearInterval(interval);
  }, [promotions.length, isPromoHovered, isPromoDragging]);

  // Categories Horizontal Scroll Handlers
  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleCatMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsCatDragging(true);
    setCatStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setCatScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleCatMouseMove = (e: React.MouseEvent) => {
    if (!isCatDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - catStartX) * 1.3;
    categoryScrollRef.current.scrollLeft = catScrollLeft - walk;
  };

  const handleCatMouseUpOrLeave = () => {
    setIsCatDragging(false);
  };

  // Promotions Horizontal Scroll Handlers
  const scrollPromotions = (direction: 'left' | 'right') => {
    if (!promoScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    promoScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePromoMouseDown = (e: React.MouseEvent) => {
    if (!promoScrollRef.current) return;
    setIsPromoDragging(true);
    setPromoStartX(e.pageX - promoScrollRef.current.offsetLeft);
    setPromoScrollLeft(promoScrollRef.current.scrollLeft);
  };

  const handlePromoMouseMove = (e: React.MouseEvent) => {
    if (!isPromoDragging || !promoScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - promoScrollRef.current.offsetLeft;
    const walk = (x - promoStartX) * 1.3;
    promoScrollRef.current.scrollLeft = promoScrollLeft - walk;
  };

  const handlePromoMouseUpOrLeave = () => {
    setIsPromoDragging(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo seu navegador.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setLocationStatusText('Localização GPS detectada');

        const filtered = store.getBusinesses({
          user_lat: lat,
          user_lng: lng,
          max_distance_km: radiusKm,
          sort_by: 'distance',
        });
        setNearbyBusinesses(filtered);
      },
      () => {
        setLocating(false);
        alert('Não foi possível obter sua localização. Exibindo região de Guaianases.');
      }
    );
  };

  const handleRadiusChange = (radius: number) => {
    setRadiusKm(radius);
    if (userLocation) {
      const filtered = store.getBusinesses({
        user_lat: userLocation.lat,
        user_lng: userLocation.lng,
        max_distance_km: radius,
        sort_by: 'distance',
      });
      setNearbyBusinesses(filtered);
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-16 bg-[#F8F6F0]">
      {/* 1. HERO SECTION WITH THEMATIC LOCAL COMMERCE BACKGROUND IMAGE */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-16 overflow-hidden border-b border-[#E8E4DA]">
        {/* Background Image of Local Neighborhood Commerce */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={platformSettings.hero_bg_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1800&auto=format&fit=crop&q=80'}
            alt="Comércio local do bairro"
            className="w-full h-full object-cover object-center opacity-30 saturate-120"
          />
          {/* Warm Off-White Gradient Overlays to preserve contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8F6F0]/92 via-[#F8F6F0]/88 to-[#F8F6F0]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-[#F8F6F0]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Proximity / Community Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 shadow-2xs mb-5 animate-in fade-in backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#E36845] animate-pulse" />
            <span className="text-xs font-black text-[#0E3B43] uppercase tracking-wider">
              Vitrine digital inteligente do seu bairro
            </span>
          </div>

          {/* Main Headline in Azul-Petróleo with Coral highlight */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0E3B43] tracking-tight max-w-3xl mx-auto leading-tight mb-4 drop-shadow-2xs">
            {platformSettings.hero_title ? (
              platformSettings.hero_title
            ) : (
              <>Descubra o melhor <span className="text-[#E36845]">perto de você.</span></>
            )}
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-lg text-[#0E3B43]/80 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
            {platformSettings.hero_subtitle || 'Encontre comércios, profissionais, serviços e promoções no seu bairro e fale diretamente pelo WhatsApp.'}
          </p>

          {/* Dual Search Bar */}
          <SearchBar />
        </div>
      </section>

      {/* 2. CATEGORIAS POPULARES (CARROSSEL EM UMA ÚNICA FILEIRA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
              Categorias Populares
            </h2>
            <p className="text-xs sm:text-sm text-[#537379]">
              O que você precisa hoje no seu bairro?
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                aria-label="Rolar categorias para esquerda"
                className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#E36845] transition-all shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories('right')}
                aria-label="Rolar categorias para direita"
                className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#E36845] transition-all shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/buscar"
              className="hidden sm:flex text-xs sm:text-sm font-bold text-[#E36845] hover:text-[#F49C6B] items-center gap-1 shrink-0 transition-colors ml-2"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Single Row Category Carousel Container */}
        <div
          ref={categoryScrollRef}
          onMouseDown={handleCatMouseDown}
          onMouseMove={handleCatMouseMove}
          onMouseUp={handleCatMouseUpOrLeave}
          onMouseLeave={handleCatMouseUpOrLeave}
          className={cn(
            'flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-3 pt-1 cursor-grab',
            isCatDragging && 'cursor-grabbing select-none'
          )}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="carousel"
            />
          ))}
        </div>
      </section>

      {/* 3. 🔥 OFERTAS PERTO DE VOCÊ (CARROSSEL EM UMA LINHA COM MOVIMENTO SUTIL E ARRASTE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E36845]/15 text-[#E36845] flex items-center justify-center">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight flex items-center gap-2">
                <span>Ofertas perto de você</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E36845] text-white">
                  HOJE
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#537379]">
                Economize comprando com descontos exclusivos dos comércios locais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollPromotions('left')}
                aria-label="Rolar ofertas para esquerda"
                className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#E36845] transition-all shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollPromotions('right')}
                aria-label="Rolar ofertas para direita"
                className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#E36845] transition-all shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/buscar?promocoes=true"
              className="hidden sm:flex text-xs sm:text-sm font-bold text-[#E36845] hover:text-[#F49C6B] items-center gap-1 shrink-0 transition-colors ml-2"
            >
              <span>Todas as ofertas</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Single Row Offers Carousel Container */}
        {promotions.length > 0 ? (
          <div
            ref={promoScrollRef}
            onMouseEnter={() => setIsPromoHovered(true)}
            onMouseLeave={() => {
              setIsPromoHovered(false);
              handlePromoMouseUpOrLeave();
            }}
            onMouseDown={handlePromoMouseDown}
            onMouseMove={handlePromoMouseMove}
            onMouseUp={handlePromoMouseUpOrLeave}
            className={cn(
              'flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 pt-1 cursor-grab transition-all',
              isPromoDragging && 'cursor-grabbing select-none'
            )}
          >
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start select-none"
              >
                <PromotionCard promotion={promo} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 text-center space-y-3 card-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#E36845]/15 text-[#E36845] mx-auto flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#0E3B43]">Nenhuma Oferta Publicada no Momento</h3>
              <p className="text-xs text-[#537379] max-w-md mx-auto mt-1">
                Comerciantes: publiquem ofertas e cupons promocionais para destacar seus produtos para os clientes da região!
              </p>
            </div>
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-xs transition-all active:scale-95"
            >
              <span>Publicar Oferta no Painel do Lojista</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* 4. NEGÓCIOS EM DESTAQUE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E36845]" />
              <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
                Negócios em Destaque
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#537379]">
              Empresas recomendadas e bem avaliadas pelos moradores da região
            </p>
          </div>

          <Link
            href="/buscar?destaque=true"
            className="text-xs sm:text-sm font-bold text-[#0E3B43] hover:text-[#E36845] flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>Ver mais</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {featuredBusinesses.slice(0, 4).map((biz) => (
            <BusinessFeaturedCard key={biz.id} business={biz} />
          ))}
        </div>
      </section>

      {/* 5. DESCOBRIR PERTO DE MIM (GEOLOCALIZAÇÃO + MAPA + RAIO) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-[#E36845]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
                  Perto de Mim
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#537379]">
                {locationStatusText}
              </p>
            </div>

            {/* GPS Trigger */}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] border border-[#4FA6A6]/30 text-xs font-bold transition-all active:scale-95"
            >
              <Crosshair className={cn('w-4 h-4 text-[#E36845]', locating && 'animate-spin')} />
              <span>{locating ? 'Obtendo GPS...' : 'Usar minha localização atual'}</span>
            </button>
          </div>

          {/* Radius Filter Pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-[#537379] shrink-0 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#4FA6A6]" /> Raio:
            </span>
            {[1, 3, 5, 10].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => handleRadiusChange(km)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0',
                  radiusKm === km
                    ? 'bg-[#0E3B43] text-white shadow-xs'
                    : 'bg-[#F8F6F0] text-[#0E3B43] border border-[#E8E4DA] hover:border-[#4FA6A6]'
                )}
              >
                até {km} km
              </button>
            ))}
          </div>

          {/* Map & Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Map */}
            <div className="lg:col-span-6 h-[320px] sm:h-[400px]">
              <LeafletMap
                businesses={nearbyBusinesses}
                center={userLocation ? [userLocation.lat, userLocation.lng] : [-23.5424, -46.4178]}
                radiusKm={radiusKm}
                zoom={radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : 13}
                height="100%"
              />
            </div>

            {/* Business Cards List */}
            <div className="lg:col-span-6 space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {nearbyBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearbyBusinesses.slice(0, 4).map((biz) => {
                    const dist = userLocation
                      ? store.calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          biz.latitude,
                          biz.longitude
                        )
                      : undefined;
                    return (
                      <BusinessCard
                        key={biz.id}
                        business={biz}
                        userDistance={dist}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA]">
                  <Store className="w-10 h-10 text-[#537379] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#0E3B43]">
                    Nenhum estabelecimento encontrado neste raio de {radiusKm} km.
                  </p>
                  <p className="text-[11px] text-[#537379] mt-1">
                    Experimente aumentar o raio para 5 km ou 10 km.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. EVENTOS LOCAIS */}
      {events.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#E36845]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
                  Eventos no Bairro
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#537379]">
                Feiras gastronômicas, bazares comunitários e encontros culturais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col sm:flex-row bg-white rounded-3xl border border-[#4FA6A6]/20 overflow-hidden card-shadow p-4 sm:p-5 gap-4"
              >
                <div className="relative sm:w-2/5 aspect-[16/10] sm:aspect-auto rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={evt.image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#4FA6A6]/15 text-[#0E3B43] text-[11px] font-bold mb-2">
                      <Calendar className="w-3 h-3 text-[#E36845]" />
                      <span>{formatDate(evt.event_date)} • {evt.event_time}</span>
                    </div>
                    <h3 className="font-black text-base text-[#0E3B43] mb-1.5 leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#537379] line-clamp-2 mb-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-[#0E3B43] font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#E36845]" />
                    <span>{evt.location_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. MERCHANT CALL TO ACTION BANNER (Solid Azul-Petroleo com CTA Laranja Coral) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0E3B43] to-[#08262C] text-[#F8F6F0] p-8 sm:p-12 overflow-hidden shadow-2xl border border-[#1a5560]">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <Store className="w-96 h-96" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#4FA6A6]/20 border border-[#4FA6A6]/40 text-[#4FA6A6]">
              <Sparkles className="w-3.5 h-3.5 text-[#F49C6B]" />
              Vitriniza seu negócio
            </span>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-[#F8F6F0]">
              Faça seu negócio ser encontrado por quem mora perto de você.
            </h2>

            <p className="text-xs sm:text-base text-[#F8F6F0]/85 leading-relaxed">
              Crie sua vitrine digital, receba pedidos direto no WhatsApp, divulgue promoções e conquiste novos clientes fiéis no seu bairro.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/para-empresas"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-bold shadow-lg transition-all active:scale-95 text-center"
              >
                <span>Cadastrar meu negócio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/painel"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#F8F6F0] text-sm font-semibold border border-white/20 transition-all text-center"
              >
                <span>Já sou cadastrado (Entrar)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
