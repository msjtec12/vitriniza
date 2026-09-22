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
  Landmark,
  HeartPulse,
  Trees,
  Train,
  GraduationCap,
  Compass,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Promotion, Category, Article, LocalEvent, Place } from '@/types';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { PlaceCard } from '@/components/ui/PlaceCard';
import { BusinessFeaturedCard } from '@/components/ui/BusinessFeaturedCard';
import { PromotionCard } from '@/components/ui/PromotionCard';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { PwaAppDownloadCard } from '@/components/ui/PwaAppDownloadCard';
import { RecommendBusinessModal } from '@/components/ui/RecommendBusinessModal';
import { cn, formatDate } from '@/lib/utils';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [founderBusinesses, setFounderBusinesses] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);

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

  // Mouse Drag states for Places (Utilidade Pública)
  const placeScrollRef = useRef<HTMLDivElement>(null);
  const [isPlaceDragging, setIsPlaceDragging] = useState(false);
  const [placeStartX, setPlaceStartX] = useState(0);
  const [placeScrollLeft, setPlaceScrollLeft] = useState(0);

  // "Perto de Mim" State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<Business[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [nearbyTab, setNearbyTab] = useState<'all' | 'businesses' | 'places'>('all');
  const [locating, setLocating] = useState<boolean>(false);
  const [locationStatusText, setLocationStatusText] = useState<string>(
    'Mostrando estabelecimentos e locais da região. Ative o GPS para filtrar por raio preciso.'
  );

  const [platformSettings, setPlatformSettings] = useState(() => store.getPlatformSettings());

  const refreshPageData = () => {
    setCategories(store.getCategories());
    setFeaturedBusinesses(store.getFeaturedBusinesses());
    setFounderBusinesses(store.getFounderBusinesses());
    setAllBusinesses(store.getBusinesses());
    setPromotions(store.getPromotions());
    setArticles(store.getArticles().slice(0, 3));
    setEvents(store.getEvents());
    setPlatformSettings(store.getPlatformSettings());

    const allP = store.getPlaces();
    setPlaces(allP);

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

    const nearbyP = allP
      .filter((p) => {
        if (!p.latitude || !p.longitude) return false;
        const d = store.calculateDistance(lat, lng, p.latitude, p.longitude);
        return d <= radiusKm;
      })
      .sort((a, b) => {
        const da = store.calculateDistance(lat, lng, a.latitude, a.longitude);
        const db = store.calculateDistance(lat, lng, b.latitude, b.longitude);
        return da - db;
      });
    setNearbyPlaces(nearbyP);
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

  // Places Horizontal Scroll Handlers
  const scrollPlaces = (direction: 'left' | 'right') => {
    if (!placeScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -360 : 360;
    placeScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePlaceMouseDown = (e: React.MouseEvent) => {
    if (!placeScrollRef.current) return;
    setIsPlaceDragging(true);
    setPlaceStartX(e.pageX - placeScrollRef.current.offsetLeft);
    setPlaceScrollLeft(placeScrollRef.current.scrollLeft);
  };

  const handlePlaceMouseMove = (e: React.MouseEvent) => {
    if (!isPlaceDragging || !placeScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - placeScrollRef.current.offsetLeft;
    const walk = (x - placeStartX) * 1.3;
    placeScrollRef.current.scrollLeft = placeScrollLeft - walk;
  };

  const handlePlaceMouseUpOrLeave = () => {
    setIsPlaceDragging(false);
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

        const filteredBiz = store.getBusinesses({
          user_lat: lat,
          user_lng: lng,
          max_distance_km: radiusKm,
          sort_by: 'distance',
        });
        setNearbyBusinesses(filteredBiz);

        const filteredPlaces = store.getPlaces().filter((p) => {
          if (!p.latitude || !p.longitude) return false;
          return store.calculateDistance(lat, lng, p.latitude, p.longitude) <= radiusKm;
        }).sort((a, b) => {
          const da = store.calculateDistance(lat, lng, a.latitude, a.longitude);
          const db = store.calculateDistance(lat, lng, b.latitude, b.longitude);
          return da - db;
        });
        setNearbyPlaces(filteredPlaces);
      },
      () => {
        setLocating(false);
        alert('Não foi possível obter sua localização. Exibindo locais e estabelecimentos cadastrados.');
      }
    );
  };

  const handleRadiusChange = (radius: number) => {
    setRadiusKm(radius);
    const lat = userLocation?.lat || -23.5424;
    const lng = userLocation?.lng || -46.4178;

    const filteredBiz = store.getBusinesses({
      user_lat: lat,
      user_lng: lng,
      max_distance_km: radius,
      sort_by: 'distance',
    });
    setNearbyBusinesses(filteredBiz);

    const filteredPlaces = store.getPlaces().filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      return store.calculateDistance(lat, lng, p.latitude, p.longitude) <= radius;
    }).sort((a, b) => {
      const da = store.calculateDistance(lat, lng, a.latitude, a.longitude);
      const db = store.calculateDistance(lat, lng, b.latitude, b.longitude);
      return da - db;
    });
    setNearbyPlaces(filteredPlaces);
  };

  const filteredAllBusinesses = allBusinesses.filter((b) => {
    if (!b.is_active) return false;
    if (selectedCategoryFilter === 'all') return true;
    return b.category_id === selectedCategoryFilter || b.category?.slug === selectedCategoryFilter;
  });

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-16 bg-[#F8F6F0]">
      {/* 1. HERO SECTION WITH FULL-WIDTH THEMATIC BACKGROUND IMAGE */}
      <section className="relative pt-12 sm:pt-20 pb-14 sm:pb-20 overflow-hidden border-b border-[#E8E4DA]">
        {/* Full-Width Background Image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={platformSettings.hero_bg_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1800&auto=format&fit=crop&q=80'}
            alt="Comércio local do bairro"
            className="w-full h-full object-cover object-center opacity-80 saturate-125"
          />
          {/* Subtle Off-White Ambient Gradient Overlay preserving full image visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-[#F8F6F0]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Proximity / Community Badge */}
          <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-[#0E3B43] text-white border border-[#4FA6A6]/40 shadow-lg mb-5 animate-in fade-in backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E36845] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">
              Vitriniza • Descoberta Local
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0E3B43] tracking-tight max-w-4xl mx-auto leading-tight mb-4 drop-shadow-md">
            O guia completo da sua região em uma <span className="text-[#E36845] drop-shadow-sm">nova vitrine digital.</span>
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-lg text-[#0E3B43] font-bold max-w-2xl mx-auto mb-8 leading-relaxed drop-shadow-xs bg-white/70 backdrop-blur-xs py-2 px-5 rounded-2xl border border-white/50 inline-block shadow-sm">
            Descubra comércios, prestadores de serviço, saúde, lazer e pontos de utilidade pública perto de você.
          </p>

          {/* Dual Search Bar */}
          <SearchBar />

          {/* Quick Category discovery pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <Link
              href="/buscar?tipo=businesses"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#0E3B43] text-xs font-bold border border-[#E8E4DA] shadow-2xs transition-all"
            >
              <span>🏪 Comércios</span>
            </Link>
            <Link
              href="/buscar?categoria=alimentacao"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#0E3B43] text-xs font-bold border border-[#E8E4DA] shadow-2xs transition-all"
            >
              <span>🍕 Gastronomia</span>
            </Link>
            <Link
              href="/buscar?tipo=places&grupo=saude"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50/90 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 shadow-2xs transition-all"
            >
              <span>🏥 Saúde & UBS</span>
            </Link>
            <Link
              href="/buscar?tipo=places&grupo=lazer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs transition-all"
            >
              <span>🌳 Parques & Lazer</span>
            </Link>
            <Link
              href="/buscar?tipo=places&grupo=transporte"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50/90 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 shadow-2xs transition-all"
            >
              <span>🚉 Transporte</span>
            </Link>
            <Link
              href="/buscar?tipo=places&grupo=educacao"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/90 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 shadow-2xs transition-all"
            >
              <span>🏫 Educação</span>
            </Link>
            <Link
              href="/buscar?tipo=places&grupo=servicos_publicos"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50/90 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs transition-all"
            >
              <span>🏛️ Serviços Públicos</span>
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              href="/buscar"
              className="px-6 py-3 rounded-2xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Explorar o Guia Local</span>
              <ArrowRight className="w-4 h-4 text-[#E36845]" />
            </Link>

            <Link
              href="/para-empresas"
              className="px-6 py-3 rounded-2xl bg-white hover:bg-stone-50 text-[#0E3B43] border border-[#4FA6A6]/40 text-xs font-bold shadow-sm transition-all"
            >
              Receba uma prévia grátis
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIAS (O QUE VOCÊ ESTÁ PROCURANDO?) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
              O que você está procurando?
            </h2>
            <p className="text-xs sm:text-sm text-[#537379]">
              Encontre lojas, prestadores de serviço e profissionais perto de você
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
          {categories.map((category) => {
            const count = allBusinesses.filter(
              (b) => b.is_active && (b.category_id === category.id || b.category?.slug === category.slug)
            ).length;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                count={count}
                variant="carousel"
              />
            );
          })}
        </div>
      </section>

      {/* 2.5. UTILIDADE PÚBLICA & PONTOS DE REFERÊNCIA (CARROSSEL EM UMA LINHA COM ARRASTE) */}
      {places.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight flex items-center gap-2">
                  <span>Utilidade Pública & Referências</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0D9488] text-white">
                    GUIA LOCAL
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-[#537379]">
                  Hospitais, UBS, parques, estações, escolas e serviços públicos essenciais
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Arrows */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollPlaces('left')}
                  aria-label="Rolar locais para esquerda"
                  className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#0D9488] transition-all shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPlaces('right')}
                  aria-label="Rolar locais para direita"
                  className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#0D9488] transition-all shadow-2xs cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Link
                href="/buscar?tipo=places"
                className="hidden sm:flex text-xs sm:text-sm font-bold text-[#0D9488] hover:text-[#0E3B43] items-center gap-1 shrink-0 transition-colors ml-2"
              >
                <span>Ver todos os locais</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Carrossel de Fileira Única com Arraste */}
          <div
            ref={placeScrollRef}
            onMouseDown={handlePlaceMouseDown}
            onMouseMove={handlePlaceMouseMove}
            onMouseUp={handlePlaceMouseUpOrLeave}
            onMouseLeave={handlePlaceMouseUpOrLeave}
            className={cn(
              'flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 pt-1 cursor-grab transition-all',
              isPlaceDragging && 'cursor-grabbing select-none'
            )}
          >
            {places.map((place) => (
              <div key={place.id} className="shrink-0 w-[300px] sm:w-[350px] md:w-[380px] snap-start">
                <PlaceCard place={place} />
              </div>
            ))}
          </div>
        </section>
      )}

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
              <h3 className="font-black text-sm text-[#0E3B43]">Novas ofertas da sua região estão chegando.</h3>
              <p className="text-xs text-[#537379] max-w-md mx-auto mt-1">
                Conhece um comércio perto de você que tem ótimas ofertas? Indique para a Vitriniza ou publique sua loja!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRecommendOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Indicar um Negócio
              </button>
              <Link
                href="/painel"
                className="px-4 py-2 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold transition-all shadow-xs"
              >
                Publicar Oferta no Painel
              </Link>
            </div>
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

      {/* 4.5. TODOS OS COMÉRCIOS & PROFISSIONAIS CADASTRADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#4FA6A6]" />
              <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
                Comércios & Profissionais Cadastrados
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#537379]">
              Conheça os estabelecimentos e profissionais que já atendem no seu bairro
            </p>
          </div>

          {/* Filter Pills by Category */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer',
                selectedCategoryFilter === 'all'
                  ? 'bg-[#0E3B43] text-white shadow-xs'
                  : 'bg-white text-[#0E3B43] border border-[#E8E4DA] hover:border-[#4FA6A6]'
              )}
            >
              Todos ({allBusinesses.filter((b) => b.is_active).length})
            </button>
            {categories.map((cat) => {
              const count = allBusinesses.filter((b) => b.is_active && (b.category_id === cat.id || b.category?.slug === cat.slug)).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.slug)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer',
                    selectedCategoryFilter === cat.slug
                      ? 'bg-[#0E3B43] text-white shadow-xs'
                      : 'bg-white text-[#0E3B43] border border-[#E8E4DA] hover:border-[#4FA6A6]'
                  )}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Business Grid */}
        {filteredAllBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAllBusinesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-3">
            <Store className="w-10 h-10 text-[#537379] mx-auto opacity-50" />
            <h3 className="font-black text-sm text-[#0E3B43]">Nenhum comércio cadastrado nesta categoria ainda</h3>
            <p className="text-xs text-[#537379] max-w-md mx-auto">
              Seja o primeiro comércio ou profissional desta categoria a se divulgar no bairro!
            </p>
          </div>
        )}
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

          {/* Radius Filter Pills & Discovery Mode Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-[#E8E4DA]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-[#537379] shrink-0 mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#4FA6A6]" /> Raio:
              </span>
              {[
                { val: 0.5, label: '500m' },
                { val: 1, label: '1 km' },
                { val: 2, label: '2 km' },
                { val: 5, label: '5 km' },
                { val: 10, label: '10 km' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleRadiusChange(val)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer',
                    radiusKm === val
                      ? 'bg-[#0E3B43] text-white shadow-xs'
                      : 'bg-[#F8F6F0] text-[#0E3B43] border border-[#E8E4DA] hover:border-[#4FA6A6]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sub-tab switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setNearbyTab('all')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  nearbyTab === 'all'
                    ? 'bg-[#0E3B43] text-white shadow-xs'
                    : 'bg-stone-100 text-[#0E3B43] hover:bg-stone-200'
                )}
              >
                Todos ({nearbyBusinesses.length + nearbyPlaces.length})
              </button>
              <button
                type="button"
                onClick={() => setNearbyTab('businesses')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  nearbyTab === 'businesses'
                    ? 'bg-[#E36845] text-white shadow-xs'
                    : 'bg-stone-100 text-[#0E3B43] hover:bg-stone-200'
                )}
              >
                Comércios ({nearbyBusinesses.length})
              </button>
              <button
                type="button"
                onClick={() => setNearbyTab('places')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  nearbyTab === 'places'
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'bg-stone-100 text-[#0E3B43] hover:bg-stone-200'
                )}
              >
                Locais Públicos ({nearbyPlaces.length})
              </button>
            </div>
          </div>

          {/* Map & Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Map */}
            <div className="lg:col-span-6 h-[340px] sm:h-[420px]">
              <LeafletMap
                businesses={nearbyTab === 'places' ? [] : nearbyBusinesses}
                places={nearbyTab === 'businesses' ? [] : nearbyPlaces}
                center={userLocation ? [userLocation.lat, userLocation.lng] : [-23.5424, -46.4178]}
                radiusKm={radiusKm}
                zoom={radiusKm <= 0.5 ? 16 : radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : 13}
                height="100%"
              />
            </div>

            {/* Cards List */}
            <div className="lg:col-span-6 space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {/* If tab is places or all, show nearby places */}
              {nearbyTab !== 'businesses' && nearbyPlaces.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#0D9488] uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Locais de Utilidade Próximos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {nearbyPlaces.slice(0, 4).map((place) => {
                      const dist = userLocation
                        ? store.calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            place.latitude,
                            place.longitude
                          )
                        : undefined;
                      return (
                        <PlaceCard
                          key={place.id}
                          place={place}
                          userDistance={dist}
                          showNearbyPrompt={false}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If tab is businesses or all, show nearby businesses */}
              {nearbyTab !== 'places' && nearbyBusinesses.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#E36845] uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    <span>Comércios & Serviços Próximos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                </div>
              )}

              {nearbyBusinesses.length === 0 && nearbyPlaces.length === 0 && (
                <div className="p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA]">
                  <Compass className="w-10 h-10 text-[#537379] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#0E3B43]">
                    Nenhum estabelecimento ou local encontrado no raio de {radiusKm >= 1 ? `${radiusKm} km` : `${radiusKm * 1000} m`}.
                  </p>
                  <p className="text-[11px] text-[#537379] mt-1">
                    Experimente aumentar o raio para 2 km, 5 km ou 10 km.
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

      {/* 7.5 PWA APP DOWNLOAD SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PwaAppDownloadCard />
      </section>

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
                <span>Ver meu negócio na Vitriniza</span>
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

      <RecommendBusinessModal
        isOpen={isRecommendOpen}
        onClose={() => setIsRecommendOpen(false)}
        defaultNeighborhood=""
      />
    </div>
  );
}
